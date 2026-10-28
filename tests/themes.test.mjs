import assert from "node:assert/strict";
import test from "node:test";
import { PRESETS, contrastChecks, normalizeTheme, presetModes, presetTheme } from "../packages/js/themes.js";

const byId = (id) => PRESETS.find((preset) => preset.id === id);

test("ten distinct presets are available", () => {
  assert.equal(PRESETS.length, 10);
  assert.equal(new Set(PRESETS.map((preset) => preset.id)).size, 10);
  assert.equal(new Set(PRESETS.map((preset) => preset.name)).size, 10);
});

test("presets keep the requested base colors (lavender accent nudged darker for AA button text)", () => {
  const expected = {
    "midnight-gold": { bg: "#171923", accent: "#e5bc4b", surface: "#242735" },
    "swiss-minimal": { bg: "#ffffff", accent: "#315efb", surface: "#f0f3f8" },
    "cyber-neon": { bg: "#090d12", accent: "#39d9f5", surface: "#17212b" },
    "warm-editorial": { bg: "#f6f0e7", accent: "#c86f52", surface: "#e9decf" },
    "emerald-executive": { bg: "#171c1a", accent: "#c6a75e", surface: "#24352d" },
    "lavender-studio": { bg: "#f4f0ff", accent: "#7c60d6", surface: "#ffffff" },
    "cloud-blue": { bg: "#eaf4ff", accent: "#4285e8", surface: "#ffffff" },
    "graphite-orange": { bg: "#20252b", accent: "#ff8a3d", surface: "#303841" },
    "sage-cream": { bg: "#f8f5ed", accent: "#425343", surface: "#e8ede3" },
    "aurora-ai": { bg: "#111329", accent: "#d66bf5", surface: "#242447" },
  };
  for (const [id, colors] of Object.entries(expected)) {
    const [native] = presetModes(byId(id));
    for (const [key, value] of Object.entries(colors)) assert.equal(byId(id).palettes[native][key], value, `${id} ${key}`);
  }
});

test("every palette reaches WCAG AA for text and buttons", () => {
  for (const preset of PRESETS) {
    for (const [mode, palette] of Object.entries(preset.palettes)) {
      for (const check of contrastChecks(palette)) {
        assert.ok(check.pass, `${preset.id} ${mode}: ${check.label} is ${check.ratio.toFixed(2)}:1`);
      }
    }
  }
});

test("a preset theme is an independent copy", () => {
  const first = presetTheme("midnight-gold");
  first.colors.dark.bg = "#000000";
  assert.equal(presetTheme("midnight-gold").colors.dark.bg, "#171923");
  assert.equal(byId("midnight-gold").palettes.dark.bg, "#171923");
});

test("unknown or missing themes fall back to the original look", () => {
  const original = { preset: "", appearance: "system", fontHeading: "", fontBody: "" };
  assert.deepEqual(normalizeTheme({ preset: "does-not-exist" }), original);
  assert.deepEqual(normalizeTheme(undefined), original);
  assert.deepEqual(normalizeTheme({ default: "dark", accent: "#0b78d0" }), { ...original, appearance: "dark" });
});

test("fonts can be chosen without a theme, and unknown fonts are dropped", () => {
  const theme = normalizeTheme({ preset: "", fontHeading: "Lora", fontBody: "Comic Sans" });
  assert.equal(theme.fontHeading, "Lora");
  assert.equal(theme.fontBody, "");
});

test("invalid saved values are replaced by the preset's own", () => {
  const theme = normalizeTheme({
    preset: "cyber-neon",
    appearance: "neon",
    colors: { dark: { bg: "url(x)", accent: "#abcdef" } },
    fontHeading: "Comic Sans",
    width: "huge",
    card: "elevated",
  });
  const base = presetTheme("cyber-neon");
  assert.equal(theme.colors.dark.bg, base.colors.dark.bg);
  assert.equal(theme.colors.dark.accent, "#abcdef");
  assert.equal(theme.fontHeading, base.fontHeading);
  assert.equal(theme.width, base.width);
  assert.equal(theme.card, "elevated");
  assert.equal(theme.appearance, "default");
});

test("only the modes a preset supports are kept", () => {
  assert.deepEqual(Object.keys(normalizeTheme({ preset: "cyber-neon", colors: { light: { bg: "#ffffff" } } }).colors), ["dark"]);
  assert.deepEqual(Object.keys(presetTheme("cloud-blue").colors).sort(), ["dark", "light"]);
});
