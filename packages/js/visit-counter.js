import { getContent } from "./site.js";
import { OWNER_KEY } from "./store.js";

const VISITOR_KEY = "portfolio-visitor";
const COUNTED_KEY = "portfolio-visit-counted";
const ENDPOINT_PREFIX = "https://script.google.com/macros/s/";
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
const BOT_PATTERN = /bot|crawl|spider|headless|preview/i;
const GEO_API = "https://ipapi.co/json/";

let endpoint = "";
let sessionStart = Date.now();
let scrollMilestones = new Set();
let active = false;

export function getVisitorId() {
  return localStorage.getItem(VISITOR_KEY) || "";
}

function visitor() {
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) return { id: existing, returning: true };
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_KEY, id);
  return { id, returning: false };
}

function deviceType() {
  if (/iPad|Tablet/i.test(navigator.userAgent)) return "Tablet";
  return /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
}

function browserName() {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera/")) return "Opera";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return "Other";
}

function osName() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "Other";
}

function utmParams() {
  const p = new URLSearchParams(location.search);
  return {
    source: p.get("utm_source") || "",
    medium: p.get("utm_medium") || "",
    campaign: p.get("utm_campaign") || "",
  };
}

function referrerSource() {
  if (!document.referrer) return { host: "", channel: "Direct" };
  const host = new URL(document.referrer).hostname;
  if (/google\./i.test(host)) return { host, channel: "Google Search" };
  if (/bing\./i.test(host)) return { host, channel: "Bing Search" };
  if (/linkedin/i.test(host)) return { host, channel: "LinkedIn" };
  if (/facebook|fb\./i.test(host)) return { host, channel: "Facebook" };
  if (/instagram/i.test(host)) return { host, channel: "Instagram" };
  if (/twitter|x\.com/i.test(host)) return { host, channel: "Twitter/X" };
  if (/github/i.test(host)) return { host, channel: "GitHub" };
  if (/t\.co/i.test(host)) return { host, channel: "Twitter/X" };
  if (/whatsapp/i.test(host)) return { host, channel: "WhatsApp" };
  if (/telegram/i.test(host)) return { host, channel: "Telegram" };
  return { host, channel: "Other" };
}

async function fetchLocation() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(GEO_API, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return {};
    const d = await res.json();
    return { country: d.country_name || "", city: d.city || "", region: d.region || "" };
  } catch {
    return {};
  }
}

function shouldCount() {
  return !(
    LOCAL_HOSTS.includes(location.hostname) ||
    BOT_PATTERN.test(navigator.userAgent) ||
    navigator.doNotTrack === "1" ||
    localStorage.getItem(OWNER_KEY) ||
    sessionStorage.getItem(COUNTED_KEY)
  );
}

function sendBeacon(params) {
  if (!endpoint) return;
  const body = new URLSearchParams(params);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body);
  } else {
    fetch(endpoint, { method: "POST", body, mode: "no-cors", keepalive: true }).catch(() => {});
  }
}

// ─── Public: track any interaction ───

export function trackEvent(action, label) {
  if (!active) return;
  sendBeacon({
    type: "event",
    visitor: getVisitorId(),
    action,
    label: label || "",
    page: location.pathname,
  });
}

// ─── Session duration: fire on page hide/unload ───

function trackSessionEnd() {
  const seconds = Math.round((Date.now() - sessionStart) / 1000);
  if (seconds < 2) return;
  sendBeacon({
    type: "event",
    visitor: getVisitorId(),
    action: "session_end",
    label: seconds + "s",
    page: location.pathname,
  });
}

// ─── Scroll depth: fires once at each 25% milestone ───

function initScrollTracking() {
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const depth = Math.round(
        ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
      );
      [25, 50, 75, 100].forEach((m) => {
        if (depth >= m && !scrollMilestones.has(m)) {
          scrollMilestones.add(m);
          trackEvent("scroll_depth", m + "%");
        }
      });
      ticking = false;
    });
  }, { passive: true });
}

// ─── Auto-track clicks on key elements ───

function initClickTracking() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href], button");
    if (!link) return;

    if (link.hasAttribute("download") || link.closest("[data-download]")) {
      trackEvent("resume_download", link.getAttribute("download") || "resume");
      return;
    }
    if (link.closest("[data-open-contact]") || link.id === "contact-form-open") {
      trackEvent("contact_form_open", "");
      return;
    }
    if (link.classList.contains("chat-launcher")) {
      trackEvent("chat_open", "");
      return;
    }
    if (link.classList.contains("card__link")) {
      trackEvent("project_click", link.textContent.trim());
      return;
    }
    if (link.classList.contains("cert__link")) {
      trackEvent("certificate_click", link.querySelector(".cert__name")?.textContent || "");
      return;
    }
    const href = link.getAttribute("href") || "";
    if (href.startsWith("mailto:")) {
      trackEvent("email_click", "");
    } else if (href.startsWith("tel:")) {
      trackEvent("phone_click", "");
    } else if (href.includes("linkedin.com")) {
      trackEvent("linkedin_click", "");
    } else if (href.includes("github.com")) {
      trackEvent("github_click", "");
    }
  });
}

// ─── Section visibility tracking ───

function initSectionTracking() {
  const sections = document.querySelectorAll("section[id]");
  if (!sections.length || !window.IntersectionObserver) return;
  const seen = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !seen.has(entry.target.id)) {
          seen.add(entry.target.id);
          trackEvent("section_view", entry.target.id);
        }
      });
    },
    { threshold: 0.3 }
  );
  sections.forEach((s) => observer.observe(s));
}

// ─── Init ───

export async function initVisitCounter() {
  const content = getContent();
  endpoint = content?.contact?.formEndpoint ?? "";
  if (!endpoint.startsWith(ENDPOINT_PREFIX) || !shouldCount()) return;

  active = true;
  sessionStorage.setItem(COUNTED_KEY, "1");
  const { id, returning } = visitor();
  const geo = await fetchLocation();
  const utm = utmParams();
  const ref = referrerSource();

  const body = new URLSearchParams({
    type: "visit",
    visitor: id,
    returning: returning ? "yes" : "no",
    referrer: ref.host,
    channel: ref.channel,
    device: deviceType(),
    browser: browserName(),
    os: osName(),
    screen: `${screen.width}x${screen.height}`,
    country: geo.country || "",
    city: geo.city || "",
    region: geo.region || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    language: navigator.language ?? "",
    page: location.pathname,
    utmSource: utm.source,
    utmMedium: utm.medium,
    utmCampaign: utm.campaign,
  });
  fetch(endpoint, { method: "POST", body, mode: "no-cors", keepalive: true }).catch(() => {});

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") trackSessionEnd();
  });
  window.addEventListener("pagehide", trackSessionEnd);

  initScrollTracking();
  initClickTracking();
  initSectionTracking();
}
