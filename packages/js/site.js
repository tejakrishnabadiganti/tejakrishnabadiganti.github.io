import { renderPage } from "./render.js";
import { applyTheme, rememberTheme } from "./theme.js";
import { initPreview, isPreview } from "./theme-preview.js";
import { observeReveal } from "./reveal.js";
import { withDefaults } from "./defaults.js";

let content = null;

export const getContent = () => content;

export function refreshSite({ animate = false } = {}) {
  renderPage(content);
  applyTheme(content.theme, { ignoreSaved: isPreview() });
  if (animate) observeReveal();
}

export async function loadSite() {
  const request = window.contentRequest ?? fetch(`data/content.json?t=${Date.now()}`, { cache: "no-store" });
  window.contentRequest = null;
  const response = await request;
  if (!response.ok) throw new Error(`Could not load content (${response.status})`);
  content = withDefaults(await response.json());
  if (isPreview()) initPreview(content);
  else rememberTheme(content.theme);
  refreshSite({ animate: true });
}
