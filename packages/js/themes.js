const HEX = /^#[0-9a-f]{6}$/i;
const WHITE = "#ffffff";
const DARK = "#14171f";
const AA = 4.5;

export const HEADING_FONTS = {
  Inter: "Inter:wght@500;600;700;800",
  "Plus Jakarta Sans": "Plus+Jakarta+Sans:wght@500;600;700;800",
  "Space Grotesk": "Space+Grotesk:wght@500;600;700",
  "Playfair Display": "Playfair+Display:ital,wght@0,500;0,600;0,700;1,500",
  "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500",
  Fraunces: "Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500",
  "Libre Baskerville": "Libre+Baskerville:ital,wght@0,400;0,700;1,400",
  Lora: "Lora:ital,wght@0,500;0,600;0,700;1,500",
  Merriweather: "Merriweather:ital,wght@0,400;0,700;1,400",
};

export const BODY_FONTS = {
  Inter: "Inter:wght@400;500;600",
  "Source Sans 3": "Source+Sans+3:wght@400;500;600",
  Lato: "Lato:wght@400;700",
  "Nunito Sans": "Nunito+Sans:wght@400;600;700",
  "Open Sans": "Open+Sans:wght@400;500;600",
};

export const LOCAL_FONTS = new Set(["Inter", "Playfair Display"]);

export const OPTIONS = {
  appearance: ["default", "light", "dark", "system"],
  headingScale: { compact: 0.9, standard: 1, large: 1.12 },
  bodySize: { small: "0.95rem", medium: "1rem", large: "1.0625rem" },
  lineHeight: { tight: 1.55, normal: 1.7, relaxed: 1.9 },
  width: { compact: "960px", standard: "1120px", wide: "1280px" },
  card: { flat: 0, bordered: 1, elevated: 2 },
  radius: { sharp: "4px", medium: "14px", rounded: "26px" },
  density: { compact: 0.7, comfortable: 1, spacious: 1.3 },
};

export const COLOR_KEYS = ["bg", "ink", "accent", "secondary", "surface", "line"];

const layout = (width, card, radius, density) => ({ width, card, radius, density });

export const PRESETS = [
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    description: "Premium, minimal and dark, with a warm gold accent.",
    bestFor: "Main portfolio and professional branding",
    palettes: {
      dark: { bg: "#171923", ink: "#f7f7fb", accent: "#e5bc4b", secondary: "#c9962b", surface: "#242735", line: "#3b4057" },
      light: { bg: "#fbf8f0", ink: "#1d1f2b", accent: "#d4a72c", secondary: "#b8860b", surface: "#ffffff", line: "#e7dfc9" },
    },
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    ...layout("standard", "bordered", "medium", "comfortable"),
  },
  {
    id: "swiss-minimal",
    name: "Swiss Minimal",
    description: "Clean spacing, crisp typography and an understated blue accent.",
    bestFor: "Recruiters and professional experience",
    palettes: {
      light: { bg: "#ffffff", ink: "#202124", accent: "#315efb", secondary: "#2447d6", surface: "#f0f3f8", line: "#dde2ec" },
      dark: { bg: "#0f1115", ink: "#f1f3f7", accent: "#6d8dff", secondary: "#8fa8ff", surface: "#1a1d24", line: "#2d323d" },
    },
    fontHeading: "Inter",
    fontBody: "Inter",
    ...layout("standard", "flat", "sharp", "spacious"),
  },
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    description: "Futuristic and technical, with electric cyan and lime.",
    bestFor: "AI agents, experiments and interactive projects",
    palettes: {
      dark: { bg: "#090d12", ink: "#e8f1f8", accent: "#39d9f5", secondary: "#b7f34a", surface: "#17212b", line: "#294055" },
    },
    fontHeading: "Space Grotesk",
    fontBody: "Inter",
    ...layout("wide", "bordered", "sharp", "comfortable"),
  },
  {
    id: "warm-editorial",
    name: "Warm Editorial",
    description: "Editorial typography, warm colors and generous whitespace.",
    bestFor: "Personal blog and long-form writing",
    palettes: {
      light: { bg: "#f6f0e7", ink: "#382a25", accent: "#c86f52", secondary: "#e0946f", surface: "#e9decf", line: "#d6c6b0" },
    },
    fontHeading: "Fraunces",
    fontBody: "Source Sans 3",
    ...layout("compact", "flat", "medium", "spacious"),
  },
  {
    id: "emerald-executive",
    name: "Emerald Executive",
    description: "Elegant and restrained, in deep green with brass details.",
    bestFor: "Career history, achievements and case studies",
    palettes: {
      dark: { bg: "#171c1a", ink: "#f4f0e5", accent: "#c6a75e", secondary: "#a68a45", surface: "#24352d", line: "#3e5648" },
    },
    fontHeading: "Cormorant Garamond",
    fontBody: "Source Sans 3",
    ...layout("standard", "bordered", "sharp", "comfortable"),
  },
  {
    id: "lavender-studio",
    name: "Lavender Studio",
    description: "Creative and friendly, with soft purple and modern cards.",
    bestFor: "Creative projects and personal branding",
    palettes: {
      light: { bg: "#f4f0ff", ink: "#29263a", accent: "#7c60d6", secondary: "#8f4cc4", surface: "#ffffff", line: "#ddd5f5" },
    },
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Nunito Sans",
    ...layout("standard", "elevated", "rounded", "comfortable"),
  },
  {
    id: "cloud-blue",
    name: "Cloud Blue",
    description: "Clean, approachable and professional, in sky blues.",
    bestFor: "Cloud engineering and technical documentation",
    palettes: {
      light: { bg: "#eaf4ff", ink: "#142b4a", accent: "#4285e8", secondary: "#3cb4e8", surface: "#ffffff", line: "#cfe1f5" },
      dark: { bg: "#0b1626", ink: "#e6f0ff", accent: "#6ea8ff", secondary: "#4cc2f0", surface: "#14263d", line: "#27425f" },
    },
    fontHeading: "Inter",
    fontBody: "Open Sans",
    ...layout("standard", "elevated", "medium", "comfortable"),
  },
  {
    id: "graphite-orange",
    name: "Graphite Orange",
    description: "Technical, bold and structured, with a vivid orange accent.",
    bestFor: "System architecture, metrics and engineering projects",
    palettes: {
      dark: { bg: "#20252b", ink: "#f5f5f2", accent: "#ff8a3d", secondary: "#f0602a", surface: "#303841", line: "#47515c" },
    },
    fontHeading: "Inter",
    fontBody: "Inter",
    ...layout("wide", "bordered", "sharp", "compact"),
  },
  {
    id: "sage-cream",
    name: "Sage & Cream",
    description: "Calm, natural and easy to read, in soft greens and cream.",
    bestFor: "Personal journal, learning notes and reflections",
    palettes: {
      light: { bg: "#f8f5ed", ink: "#26332a", accent: "#425343", secondary: "#55705a", surface: "#e8ede3", line: "#d1d9c8" },
    },
    fontHeading: "Lora",
    fontBody: "Lato",
    ...layout("compact", "flat", "rounded", "spacious"),
  },
  {
    id: "aurora-ai",
    name: "Aurora AI",
    description: "Futuristic, with gradient accents and soft glowing effects.",
    bestFor: "AI projects, LLM applications and experimental work",
    palettes: {
      dark: { bg: "#111329", ink: "#f4f3ff", accent: "#d66bf5", secondary: "#9b8af8", surface: "#242447", line: "#3b3b6e" },
    },
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    ...layout("standard", "elevated", "rounded", "comfortable"),
  },
];

const isHex = (value) => typeof value === "string" && HEX.test(value);
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

/* ---------- Color math ---------- */

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

export const mix = (a, b, amount) => toHex(channels(a).map((v, i) => v * (1 - amount) + channels(b)[i] * amount));

function luminance(hex) {
  const [r, g, b] = channels(hex)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const worstContrast = (color, grounds) => Math.min(...grounds.map((ground) => contrast(color, ground)));

function readable(color, grounds, ink) {
  for (let step = 0; step <= 20; step += 1) {
    const candidate = mix(color, ink, step / 20);
    if (worstContrast(candidate, grounds) >= AA) return candidate;
  }
  return ink;
}

function textOn(grounds) {
  const [best] = [WHITE, DARK].sort((a, b) => worstContrast(b, grounds) - worstContrast(a, grounds));
  return best;
}

export function deriveTokens({ bg, ink, accent, secondary, surface, line }) {
  const onAccent = textOn([accent, secondary]);
  const accentText = readable(accent, [bg, surface], ink);
  return {
    bg,
    bgAlt: mix(bg, surface, 0.5),
    surface,
    ink,
    muted: mix(ink, bg, 0.25),
    line,
    accent: accentText,
    gold: readable(secondary, [bg, surface], ink),
    accentContrast: textOn([accentText]),
    accentFill: accent,
    secondaryFill: secondary,
    blend: mix(accent, secondary, 0.5),
    onAccent,
    onAccentInverse: onAccent === WHITE ? DARK : WHITE,
  };
}

export function contrastChecks(palette) {
  const tokens = deriveTokens(palette);
  const check = (label, ratio) => ({ label, ratio, pass: ratio >= AA });
  return [
    check("Text on background", contrast(tokens.ink, tokens.bg)),
    check("Text on cards", contrast(tokens.ink, tokens.surface)),
    check("Secondary text", Math.min(contrast(tokens.muted, tokens.bg), contrast(tokens.muted, tokens.surface))),
    check("Button text", worstContrast(tokens.onAccent, [tokens.accentFill, tokens.secondaryFill])),
  ];
}

/* ---------- Theme model ---------- */

export const presetById = (id) => PRESETS.find((preset) => preset.id === id);
export const presetModes = (preset) => Object.keys(preset.palettes);

export function presetTheme(id) {
  const preset = presetById(id);
  return {
    preset: preset.id,
    appearance: "default",
    colors: structuredClone(preset.palettes),
    fontHeading: preset.fontHeading,
    fontBody: preset.fontBody,
    headingScale: "standard",
    bodySize: "medium",
    lineHeight: "normal",
    width: preset.width,
    card: preset.card,
    radius: preset.radius,
    density: preset.density,
  };
}

export function normalizeTheme(raw) {
  const preset = presetById(raw?.preset);
  const requested = raw?.appearance ?? raw?.default;
  if (!preset) {
    return {
      preset: "",
      appearance: pick(requested, ["light", "dark", "system"], "system"),
      fontHeading: pick(raw?.fontHeading, Object.keys(HEADING_FONTS), ""),
      fontBody: pick(raw?.fontBody, Object.keys(BODY_FONTS), ""),
    };
  }

  const base = presetTheme(preset.id);
  const colors = {};
  for (const mode of presetModes(preset)) {
    colors[mode] = Object.fromEntries(
      COLOR_KEYS.map((key) => [key, isHex(raw.colors?.[mode]?.[key]) ? raw.colors[mode][key] : base.colors[mode][key]])
    );
  }

  const option = (key) => pick(raw[key], Object.keys(OPTIONS[key]), base[key]);
  return {
    preset: preset.id,
    appearance: pick(requested, OPTIONS.appearance, "default"),
    colors,
    fontHeading: pick(raw.fontHeading, Object.keys(HEADING_FONTS), base.fontHeading),
    fontBody: pick(raw.fontBody, Object.keys(BODY_FONTS), base.fontBody),
    headingScale: option("headingScale"),
    bodySize: option("bodySize"),
    lineHeight: option("lineHeight"),
    width: option("width"),
    card: option("card"),
    radius: option("radius"),
    density: option("density"),
  };
}
