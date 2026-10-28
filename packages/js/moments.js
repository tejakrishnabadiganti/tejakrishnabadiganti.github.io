import { el, safeAsset } from "./dom.js";
import { assetUrl } from "./store.js";

const ALL = "All";
let activeCategory = ALL;
let viewerPhotos = [];
let viewerIndex = 0;
let viewerBound = false;

const photoSrc = (item) => safeAsset(assetUrl(item.photo));
const photoLabel = (item) => item.title || item.caption || "Photo";
const $ = (id) => document.getElementById(id);

function momentCard(item, index) {
  const src = photoSrc(item);
  const label = photoLabel(item);
  return el(
    "figure",
    { class: "moment", "data-category": item.category ?? "", style: `--i:${index % 6}` },
    el(
      "button",
      { type: "button", class: "moment__open", "aria-label": `View photo: ${label}` },
      el(
        "span",
        { class: "moment__frame" },
        el("img", { class: "moment__backdrop", src, alt: "", "aria-hidden": "true", loading: "lazy", decoding: "async", width: "600", height: "400" }),
        el("img", { class: "moment__photo", src, alt: label, loading: "lazy", decoding: "async", width: "600", height: "400" }),
        el("span", { class: "moment__zoom", "aria-hidden": "true" }, "+")
      )
    ),
    (item.title || item.caption) &&
      el(
        "figcaption",
        { class: "moment__caption" },
        item.title && el("strong", {}, item.title),
        item.caption && el("span", {}, item.caption)
      )
  );
}

function paintViewer() {
  const item = viewerPhotos[viewerIndex];
  const image = $("moment-image");
  image.src = photoSrc(item);
  image.alt = photoLabel(item);
  $("moment-title").textContent = item.title ?? "";
  const caption = $("moment-caption");
  caption.textContent = item.caption ?? "";
  caption.hidden = !item.caption;
  const single = viewerPhotos.length < 2;
  $("moment-prev").hidden = single;
  $("moment-next").hidden = single;
}

function stepViewer(direction) {
  viewerIndex = (viewerIndex + direction + viewerPhotos.length) % viewerPhotos.length;
  paintViewer();
}

function bindViewer() {
  if (viewerBound) return;
  viewerBound = true;
  const dialog = $("moment-dialog");
  $("moment-close").addEventListener("click", () => dialog.close());
  $("moment-prev").addEventListener("click", () => stepViewer(-1));
  $("moment-next").addEventListener("click", () => stepViewer(1));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (viewerPhotos.length < 2) return;
    if (event.key === "ArrowLeft") stepViewer(-1);
    if (event.key === "ArrowRight") stepViewer(1);
  });
}

export function renderMoments({ moments }) {
  const photos = moments.filter((item) => item.photo && item.visible !== false);
  $("moments").hidden ||= photos.length === 0;
  bindViewer();

  const inActiveGroup = (item) => activeCategory === ALL || item.category === activeCategory;
  const categories = [...new Set(photos.map((item) => item.category).filter(Boolean))];
  if (!categories.includes(activeCategory)) activeCategory = ALL;

  const cards = photos.map(momentCard);
  const buttons = (categories.length > 1 ? [ALL, ...categories] : []).map((label) =>
    el("button", { type: "button", class: "moments__filter" }, label)
  );

  const apply = (animate) => {
    let shown = 0;
    cards.forEach((card, index) => {
      const visible = inActiveGroup(photos[index]);
      card.hidden = !visible;
      if (!visible || !animate) return;
      card.style.setProperty("--n", shown++);
      card.classList.remove("is-entering");
      void card.offsetWidth;
      card.classList.add("is-entering");
    });
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.textContent === activeCategory)));
  };

  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      activeCategory = button.textContent;
      apply(true);
    })
  );
  cards.forEach((card, index) =>
    card.querySelector(".moment__open").addEventListener("click", () => {
      viewerPhotos = photos.filter(inActiveGroup);
      viewerIndex = viewerPhotos.indexOf(photos[index]);
      paintViewer();
      $("moment-dialog").showModal();
    })
  );

  const filters = $("moments-filters");
  filters.replaceChildren(...buttons);
  filters.hidden = buttons.length === 0;
  $("moments-grid").replaceChildren(...cards);
  apply(false);
}
