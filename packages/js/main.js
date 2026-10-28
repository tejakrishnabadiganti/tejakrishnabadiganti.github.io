import { el } from "./dom.js";
import { loadSite, getContent } from "./site.js";
import { initUi } from "./ui.js";
import { initMotion } from "./motion.js";
import { initContactForm } from "./contact-form.js";
import { initVisitCounter } from "./visit-counter.js";
import { initChat } from "./chat.js";
import { isPreview } from "./theme-preview.js";

document.documentElement.classList.add("js");

try {
  await loadSite();
} catch (error) {
  console.error(error);
  document
    .getElementById("main")
    .prepend(el("p", { class: "container load-error" }, "The page content could not be loaded. Please refresh."));
}

// Reveal the page only after fonts are applied, so text does not reflow (and the portrait jump) when they arrive.
void document.body.offsetHeight;
await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
document.documentElement.classList.add("is-ready");

initUi();
initMotion();
initContactForm();
if (!isPreview()) initVisitCounter();

const chatKey = document.documentElement.dataset.chatKey || "";
if (chatKey && !isPreview()) {
  const content = getContent();
  initChat({
    apiKey: chatKey,
    content,
    photoUrl: content?.profile?.logoImage || content?.profile?.photo || "",
  });
}
