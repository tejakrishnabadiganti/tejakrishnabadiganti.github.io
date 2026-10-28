import { applyTheme } from "./theme.js";
import { normalizeTheme, presetById, presetTheme } from "./themes.js";

const params = new URLSearchParams(location.search);

export const PREVIEW_KEY = "theme-preview-draft";
export const isPreview = () => params.has("preview");

function storedDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(PREVIEW_KEY));
  } catch {
    return null;
  }
}

export function initPreview(content) {
  const initial = params.get("preview");
  if (presetById(initial)) content.theme = presetTheme(initial);
  const draft = storedDraft();
  if (draft) content.theme = normalizeTheme(draft);

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    if (event.data?.type !== "theme-preview") return;
    content.theme = normalizeTheme(event.data.theme);
    applyTheme(content.theme, { ignoreSaved: true });
  });

  window.parent.postMessage({ type: "theme-preview-ready" }, location.origin);
}
