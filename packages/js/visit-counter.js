import { getContent } from "./site.js";
import { OWNER_KEY } from "./store.js";

const VISITOR_KEY = "portfolio-visitor";
const COUNTED_KEY = "portfolio-visit-counted";
const ENDPOINT_PREFIX = "https://script.google.com/macros/s/";
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
const BOT_PATTERN = /bot|crawl|spider|headless|preview/i;
const GEO_API = "https://ipapi.co/json/";

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

export async function initVisitCounter() {
  const endpoint = getContent()?.contact?.formEndpoint ?? "";
  if (!endpoint.startsWith(ENDPOINT_PREFIX) || !shouldCount()) return;

  sessionStorage.setItem(COUNTED_KEY, "1");
  const { id, returning } = visitor();
  const geo = await fetchLocation();
  const utm = utmParams();

  const body = new URLSearchParams({
    type: "visit",
    visitor: id,
    returning: returning ? "yes" : "no",
    referrer: document.referrer ? new URL(document.referrer).hostname : "",
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
}
