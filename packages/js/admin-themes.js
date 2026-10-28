import { el } from "./dom.js";
import { applyTheme } from "./theme.js";
import { PREVIEW_KEY } from "./theme-preview.js";
import {
  BODY_FONTS,
  HEADING_FONTS,
  OPTIONS,
  PRESETS,
  contrastChecks,
  normalizeTheme,
  presetById,
  presetModes,
  presetTheme,
} from "./themes.js";

const COLOR_FIELDS = [
  ["bg", "Background color"],
  ["ink", "Text color"],
  ["accent", "Primary accent color"],
  ["secondary", "Secondary accent color"],
  ["surface", "Card and surface color"],
  ["line", "Border color"],
];
const HEX = /^#[0-9a-f]{6}$/i;
const DEVICES = [
  ["desktop", "Desktop"],
  ["tablet", "Tablet"],
  ["mobile", "Mobile"],
];
const ORIGINAL_LOOK = { preset: "", appearance: "system" };

let draft = null;
let editMode = "";
let host = null;

const titleCase = (text) => text[0].toUpperCase() + text.slice(1);
const optionsOf = (keys, labels = {}) => keys.map((value) => ({ value, label: labels[value] ?? titleCase(value) }));
const selectField = (key, label, keys, labels) => ({ key, label, type: "select", options: optionsOf(keys, labels) });
const modesLabel = (preset) => (presetModes(preset).length > 1 ? "Light and dark" : `${titleCase(presetModes(preset)[0])} only`);

function loadStyles() {
  if (document.getElementById("admin-themes-css")) return;
  document.head.append(
    el("link", {
      id: "admin-themes-css",
      rel: "stylesheet",
      href: new URL("../css/admin-themes.css", import.meta.url).href,
    })
  );
}

export function discardDraft() {
  if (!draft) return;
  draft = null;
  applyTheme(host.content.theme);
}

/* ---------- Gallery ---------- */

function miniPreview(preset) {
  const palette = preset.palettes[presetModes(preset)[0]];
  const mini = el(
    "div",
    { class: "theme-mini", "data-card": preset.card, "aria-hidden": "true" },
    el("div", { class: "theme-mini__bar" }, el("span", { class: "theme-mini__dot" }), el("span", { class: "theme-mini__line" })),
    el(
      "div",
      { class: "theme-mini__hero" },
      el("span", { class: "theme-mini__title" }),
      el("span", { class: "theme-mini__title theme-mini__title--short" }),
      el("span", { class: "theme-mini__button" })
    ),
    el("div", { class: "theme-mini__cards" }, el("span", { class: "theme-mini__card" }), el("span", { class: "theme-mini__card" }))
  );
  const vars = {
    "--mini-bg": palette.bg,
    "--mini-ink": palette.ink,
    "--mini-accent": palette.accent,
    "--mini-secondary": palette.secondary,
    "--mini-surface": palette.surface,
    "--mini-line": palette.line,
    "--mini-radius": OPTIONS.radius[preset.radius],
  };
  for (const [name, value] of Object.entries(vars)) mini.style.setProperty(name, value);
  return mini;
}

function actionButton(text, label, handler, { primary = false, disabled = false } = {}) {
  const button = el(
    "button",
    { class: `button ${primary ? "button--primary" : "button--ghost"} admin-small`, type: "button", "aria-label": label, disabled },
    text
  );
  button.addEventListener("click", handler);
  return button;
}

function themeCard(preset, applied) {
  const isApplied = applied.preset === preset.id;
  const startCustomizing = () => {
    draft = isApplied ? structuredClone(applied) : presetTheme(preset.id);
    editMode = presetModes(preset)[0];
    applyTheme(draft, { ignoreSaved: true });
    host.rerender();
  };

  return el(
    "article",
    { class: "theme-card", "data-applied": isApplied ? "true" : null },
    miniPreview(preset),
    el("h4", { class: "theme-card__name" }, preset.name, isApplied ? el("span", { class: "theme-card__badge" }, "Applied") : ""),
    el("p", { class: "theme-card__text" }, preset.description),
    el("p", { class: "theme-card__meta" }, `Best for: ${preset.bestFor}`),
    el("p", { class: "theme-card__meta" }, `Appearance: ${modesLabel(preset)}`),
    el(
      "div",
      { class: "theme-card__actions" },
      actionButton("Preview", `Preview ${preset.name}`, () => openPreview(isApplied ? applied : presetTheme(preset.id))),
      actionButton("Customize", `Customize ${preset.name}`, startCustomizing),
      actionButton(isApplied ? "Applied" : "Apply Theme", isApplied ? `${preset.name} is applied` : `Apply ${preset.name}`, () => applyPreset(presetTheme(preset.id)), {
        primary: !isApplied,
        disabled: isApplied,
      })
    )
  );
}

function applyPreset(theme) {
  draft = null;
  host.content.theme = normalizeTheme(theme);
  host.changed();
  host.rerender();
}

function fontsGroup(applied) {
  const base = applied.preset ? [] : [{ value: "", label: "Site default" }];
  const field = (key, label, fonts) => ({
    key,
    label,
    type: "select",
    options: [...base, ...optionsOf(Object.keys(fonts))],
  });
  return el(
    "fieldset",
    { class: "theme-group" },
    el("legend", {}, "Font style"),
    el("p", { class: "admin-help" }, "Choose the fonts for headings and body text. This works with any theme, or without one."),
    [field("fontHeading", "Heading font", HEADING_FONTS), field("fontBody", "Body text font", BODY_FONTS)].map((entry) =>
      host.fieldControl(entry, host.content.theme, host.changed)
    )
  );
}

function galleryView() {
  const applied = normalizeTheme(host.content.theme);
  const current = presetById(applied.preset);

  return el(
    "div",
    { class: "admin-section theme-gallery" },
    el("h3", { class: "theme-gallery__title" }, "Choose Your Experience"),
    el(
      "p",
      { class: "admin-hint" },
      "Themes change how the site looks, not what it says. Your text, links and contact details stay exactly the same. Preview a theme, apply it, then use Publish to make it live."
    ),
    el(
      "div",
      { class: "theme-gallery__status" },
      el("p", { role: "status" }, `Applied theme: ${current ? current.name : "Original look"}`),
      actionButton("Reset to original look", "Reset to the original site look", () => applyPreset(ORIGINAL_LOOK), {
        disabled: !current,
      })
    ),
    fontsGroup(applied),
    el("div", { class: "theme-grid" }, PRESETS.map((preset) => themeCard(preset, applied)))
  );
}

/* ---------- Customizer ---------- */

function colorRow(key, label, palette, onChange) {
  const id = `theme-color-${key}`;
  const picker = el("input", { type: "color", id });
  const hex = el("input", { type: "text", class: "theme-hex", "aria-label": `${label} hex value`, maxlength: "7", spellcheck: "false", autocomplete: "off" });
  picker.value = palette[key];
  hex.value = palette[key];

  picker.addEventListener("input", () => {
    palette[key] = picker.value;
    hex.value = picker.value;
    hex.removeAttribute("aria-invalid");
    onChange();
  });
  hex.addEventListener("input", () => {
    const value = hex.value.trim();
    if (!HEX.test(value)) {
      hex.setAttribute("aria-invalid", "true");
      return;
    }
    hex.removeAttribute("aria-invalid");
    palette[key] = value.toLowerCase();
    picker.value = palette[key];
    onChange();
  });

  return el("div", { class: "admin-field" }, el("label", { class: "admin-label", for: id }, label), el("div", { class: "theme-color" }, picker, hex));
}

function contrastList(palette) {
  return contrastChecks(palette).map((check) =>
    el(
      "li",
      { "data-pass": String(check.pass) },
      `${check.label}: ${check.ratio.toFixed(1)}:1 `,
      el("strong", {}, check.pass ? "Good" : "Low (aim for 4.5:1)")
    )
  );
}

function customizerView() {
  const preset = presetById(draft.preset);
  const modes = presetModes(preset);
  const onChange = () => {
    applyTheme(draft, { ignoreSaved: true });
    checks.replaceChildren(...contrastList(draft.colors[editMode]));
  };

  const checks = el("ul", { class: "theme-checks", "aria-live": "polite" }, contrastList(draft.colors[editMode]));
  const palette = draft.colors[editMode];
  const colors = el(
    "fieldset",
    { class: "theme-group" },
    el("legend", {}, "Colors"),
    modes.length > 1 ? modePicker(modes) : "",
    COLOR_FIELDS.map(([key, label]) => colorRow(key, label, palette, onChange)),
    checks,
    el("p", { class: "admin-help" }, "Accent colors used for small text are darkened or lightened automatically when they would be hard to read.")
  );

  const group = (legend, fields) =>
    el("fieldset", { class: "theme-group" }, el("legend", {}, legend), fields.map((field) => host.fieldControl(field, draft, onChange)));

  const appearance =
    modes.length > 1
      ? group("Appearance", [
          selectField("appearance", "Light or dark", OPTIONS.appearance, {
            default: `Theme default (${modes[0]})`,
            system: "Follow the visitor's device",
          }),
        ])
      : el("fieldset", { class: "theme-group" }, el("legend", {}, "Appearance"), el("p", { class: "admin-help" }, `${preset.name} is designed for ${modes[0]} mode only.`));

  const finish = () => {
    draft = null;
    host.rerender();
  };

  return el(
    "div",
    { class: "admin-section theme-customizer" },
    el("h3", { class: "theme-gallery__title" }, `Customize ${preset.name}`),
    el("p", { class: "admin-hint" }, "Changes show on the page right away. They are only kept when you press Apply changes."),
    colors,
    group("Typography", [
      selectField("fontHeading", "Heading font", Object.keys(HEADING_FONTS)),
      selectField("fontBody", "Body font", Object.keys(BODY_FONTS)),
      selectField("headingScale", "Heading size", Object.keys(OPTIONS.headingScale)),
      selectField("bodySize", "Body text size", Object.keys(OPTIONS.bodySize)),
      selectField("lineHeight", "Line height", Object.keys(OPTIONS.lineHeight)),
    ]),
    group("Layout", [
      selectField("width", "Content width", Object.keys(OPTIONS.width)),
      selectField("card", "Card style", Object.keys(OPTIONS.card)),
      selectField("radius", "Corner radius", Object.keys(OPTIONS.radius)),
      selectField("density", "Spacing", Object.keys(OPTIONS.density)),
    ]),
    appearance,
    el(
      "div",
      { class: "admin-actions theme-customizer__actions" },
      actionButton("Apply changes", "Apply changes", () => {
        host.content.theme = normalizeTheme(draft);
        host.changed();
        finish();
      }, { primary: true }),
      actionButton("Cancel", "Cancel and discard changes", () => {
        applyTheme(host.content.theme);
        finish();
      }),
      actionButton("Reset to theme defaults", `Reset to the original ${preset.name} settings`, () => {
        draft = presetTheme(preset.id);
        applyTheme(draft, { ignoreSaved: true });
        host.rerender();
      }),
      actionButton("Preview", "Preview these changes", () => openPreview(draft))
    )
  );
}

function modePicker(modes) {
  const select = el("select", { id: "theme-edit-mode" }, modes.map((mode) => el("option", { value: mode }, titleCase(mode))));
  select.value = editMode;
  select.addEventListener("change", () => {
    editMode = select.value;
    host.rerender();
  });
  return el("div", { class: "admin-field" }, el("label", { class: "admin-label", for: "theme-edit-mode" }, "Edit colors for"), select);
}

/* ---------- Preview ---------- */

function previewUrl() {
  const url = new URL(location.href);
  url.search = "?preview";
  url.hash = "";
  return url.toString();
}

function openPreview(startTheme) {
  loadStyles();
  let theme = structuredClone(startTheme);
  let device = "desktop";
  let appearance = "";

  const frame = el("iframe", { class: "theme-preview__frame", title: "Site preview", src: previewUrl(), sandbox: "allow-same-origin allow-scripts" });
  const stage = el("div", { class: "theme-preview__stage", "data-device": device }, frame);
  const heading = el("h3", { id: "theme-preview-title", class: "theme-preview__title" });
  const modeGroup = el("div", { class: "theme-preview__group", role: "group", "aria-label": "Light or dark preview" });
  const deviceGroup = el("div", { class: "theme-preview__group", role: "group", "aria-label": "Device size" });

  const send = () => {
    const payload = appearance ? { ...theme, appearance } : theme;
    sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(payload));
    frame.contentWindow?.postMessage({ type: "theme-preview", theme: payload }, location.origin);
  };

  const toggleButton = (text, pressed, handler) => {
    const button = el("button", { class: "theme-preview__toggle", type: "button", "aria-pressed": String(pressed) }, text);
    button.addEventListener("click", handler);
    return button;
  };
  const renderControls = () => {
    heading.textContent = `Preview: ${presetById(theme.preset).name}`;
    deviceGroup.replaceChildren(
      ...DEVICES.map(([id, label]) =>
        toggleButton(label, device === id, () => {
          device = id;
          stage.dataset.device = id;
          renderControls();
        })
      )
    );
    const dual = presetModes(presetById(theme.preset)).length > 1;
    modeGroup.hidden = !dual;
    modeGroup.replaceChildren(
      ...(dual
        ? [["", "Theme default"], ["light", "Light"], ["dark", "Dark"]].map(([id, label]) =>
            toggleButton(label, appearance === id, () => {
              appearance = id;
              renderControls();
              send();
            })
          )
        : [])
    );
  };

  const picker = el("select", { id: "theme-preview-select" }, PRESETS.map((preset) => el("option", { value: preset.id }, preset.name)));
  picker.value = theme.preset;
  picker.addEventListener("change", () => {
    theme = presetTheme(picker.value);
    appearance = "";
    renderControls();
    send();
  });

  const close = el("button", { class: "button button--ghost admin-small", type: "button" }, "Close");
  const apply = el("button", { class: "button button--primary admin-small", type: "button" }, "Apply Theme");
  const dialog = el(
    "dialog",
    { class: "theme-preview", "aria-labelledby": "theme-preview-title" },
    el(
      "header",
      { class: "theme-preview__bar" },
      heading,
      el("label", { class: "theme-preview__field", for: "theme-preview-select" }, "Theme", picker),
      deviceGroup,
      modeGroup,
      el("div", { class: "theme-preview__actions" }, apply, close)
    ),
    stage,
    el("p", { class: "theme-preview__note" }, "Preview only. The live site does not change until you apply the theme and publish.")
  );

  const onMessage = (event) => {
    if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (event.data?.type !== "theme-preview-ready") return;
    send();
  };
  window.addEventListener("message", onMessage);

  const dismiss = () => {
    dialog.close();
    window.removeEventListener("message", onMessage);
    sessionStorage.removeItem(PREVIEW_KEY);
    dialog.remove();
  };

  close.addEventListener("click", dismiss);
  apply.addEventListener("click", () => {
    const chosen = normalizeTheme(theme);
    dismiss();
    applyPreset(chosen);
  });
  dialog.addEventListener("close", dismiss);

  renderControls();
  send();
  document.body.append(dialog);
  dialog.showModal();
}

export function themesView(context) {
  host = context;
  loadStyles();
  return draft ? customizerView() : galleryView();
}
