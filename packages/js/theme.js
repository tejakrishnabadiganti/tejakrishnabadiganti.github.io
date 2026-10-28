import { BODY_FONTS, HEADING_FONTS, LOCAL_FONTS, OPTIONS, deriveTokens, normalizeTheme } from "./themes.js";

const BOOT_KEY = "theme-boot";
const SERIF_HEADINGS = new Set(["Playfair Display", "Cormorant Garamond", "Fraunces", "Libre Baskerville", "Lora", "Merriweather"]);
const SERIF_FALLBACK = 'Georgia, "Times New Roman", serif';
const SANS_FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function modeBlock(mode, palette) {
  const t = deriveTokens(palette);
  const tint = (color, percent) => `color-mix(in srgb,${color} ${percent}%,transparent)`;
  const declarations = [
    `--bg:${t.bg}`,
    `--bg-alt:${t.bgAlt}`,
    `--surface:${t.surface}`,
    `--ink:${t.ink}`,
    `--muted:${t.muted}`,
    `--line:${t.line}`,
    `--accent:${t.accent}`,
    `--accent-contrast:${t.accentContrast}`,
    `--gold:${t.gold}`,
    `--on-accent:${t.onAccent}`,
    `--on-accent-inv:${t.onAccentInverse}`,
    `--grad-a:${t.accentFill}`,
    `--grad-b:${t.secondaryFill}`,
    `--grad-c:${t.blend}`,
    `--m-grad:linear-gradient(135deg,${t.accentFill},${t.secondaryFill})`,
    `--panel-grad:linear-gradient(135deg,${t.accentFill},${t.secondaryFill})`,
    `--m-grad-text:linear-gradient(100deg,${t.accent},${t.gold})`,
    `--m-ring:${tint(t.secondaryFill, 35)}`,
    `--grad-hero:radial-gradient(900px 480px at 88% -8%,${tint(t.secondaryFill, 22)},transparent 62%),radial-gradient(700px 420px at 0% 6%,${tint(t.accentFill, 18)},transparent 60%),${t.bg}`,
  ];
  return `html[data-theme="${mode}"]:root{${declarations.join(";")}}`;
}

function fontStacks({ fontHeading, fontBody }) {
  const heading = `"${fontHeading}",${SERIF_HEADINGS.has(fontHeading) ? SERIF_FALLBACK : SANS_FALLBACK}`;
  return { heading, body: `"${fontBody}",${SANS_FALLBACK}` };
}

function layoutBlock(theme) {
  const fonts = fontStacks(theme);
  const framed = theme.card === "bordered" ? "1px solid var(--line)" : "1px solid transparent";
  const declarations = [
    `--font-heading:${fonts.heading}`,
    `--font-sans:${fonts.body}`,
    `--content-width:${OPTIONS.width[theme.width]}`,
    `--radius:${OPTIONS.radius[theme.radius]}`,
    `--density:${OPTIONS.density[theme.density]}`,
    `--card-border:${framed}`,
    `--card-shadow:${theme.card === "elevated" ? "var(--shadow)" : "none"}`,
    `--heading-scale:${OPTIONS.headingScale[theme.headingScale]}`,
    `--body-size:${OPTIONS.bodySize[theme.bodySize]}`,
    `--body-leading:${OPTIONS.lineHeight[theme.lineHeight]}`,
  ];
  return `html:root{${declarations.join(";")}}`;
}

function fontOnlyBlock({ fontHeading, fontBody }) {
  const declarations = [];
  if (fontHeading) declarations.push(`--font-heading:${fontStacks({ fontHeading, fontBody }).heading}`);
  if (fontBody) declarations.push(`--font-sans:${fontStacks({ fontHeading, fontBody }).body}`);
  return declarations.length ? `html:root{${declarations.join(";")}}` : "";
}

export function themeSnapshot(raw) {
  const theme = normalizeTheme(raw);
  const modes = Object.keys(theme.colors ?? {});
  const css = theme.preset
    ? modes.map((mode) => modeBlock(mode, theme.colors[mode])).join("") + layoutBlock(theme)
    : fontOnlyBlock(theme);
  return {
    theme,
    css,
    locked: modes.length === 1 ? modes[0] : "",
    preferred: theme.appearance === "default" ? modes[0] : theme.appearance,
  };
}

function loadFonts(theme) {
  const families = [];
  if (theme.fontHeading && !LOCAL_FONTS.has(theme.fontHeading)) families.push(HEADING_FONTS[theme.fontHeading]);
  if (theme.fontBody && !LOCAL_FONTS.has(theme.fontBody)) families.push(BODY_FONTS[theme.fontBody]);

  let link = document.getElementById("theme-fonts");
  if (!families.length) {
    link?.remove();
    return;
  }
  const href = `https://fonts.googleapis.com/css2?${[...new Set(families)].map((family) => `family=${family}`).join("&")}&display=swap`;
  if (!link) {
    link = document.createElement("link");
    link.id = "theme-fonts";
    link.rel = "stylesheet";
    document.head.append(link);
  }
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}

const systemMode = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const isMode = (value) => value === "light" || value === "dark";

export function applyTheme(raw, { ignoreSaved = false } = {}) {
  const { theme, css, locked, preferred } = themeSnapshot(raw);

  let style = document.getElementById("theme-overrides");
  if (!style) {
    style = document.createElement("style");
    style.id = "theme-overrides";
    document.head.append(style);
  }
  style.textContent = css;
  loadFonts(theme);

  const root = document.documentElement;
  root.toggleAttribute("data-mode-locked", Boolean(locked));
  const saved = ignoreSaved ? null : localStorage.getItem("theme");
  root.dataset.theme = locked || (isMode(saved) ? saved : "") || (isMode(preferred) ? preferred : systemMode());
}

export function rememberTheme(raw) {
  const { css, locked, preferred } = themeSnapshot(raw);
  localStorage.setItem(BOOT_KEY, JSON.stringify({ css, forced: locked, pref: isMode(preferred) ? preferred : "" }));
}
