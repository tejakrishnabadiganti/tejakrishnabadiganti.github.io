import { el, safeUrl, safeAsset } from "./dom.js";
import { assetUrl, stripVersion } from "./store.js";
import { startRoleRotation } from "./hero-roles.js";
import { renderMoments } from "./moments.js";

const $ = (id) => document.getElementById(id);
const asset = (path) => (path ? safeAsset(assetUrl(path)) : "#");
const baseName = (path) => stripVersion(path).split("/").pop();
const splitLines = (text) =>
  String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
const externalLink = (href, label) =>
  el("a", { href: safeUrl(href), target: "_blank", rel: "noopener noreferrer" }, label);

export function renderPage(content) {
  document.title = content.site.title;
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", content.site.description);

  renderChrome(content);
  renderSections(content);
  renderHero(content);
  renderStats(content);
  renderBadges(content);
  renderAbout(content);
  renderValues(content);
  renderExperience(content);
  renderWork(content);
  renderSkills(content);
  renderJourney(content);
  renderAwards(content);
  renderJournal(content);
  renderMoments(content);
  renderTestimonials(content);
  renderCertifications(content);
  renderEducation(content);
  renderContact(content);
}

function renderChrome({ profile }) {
  $("brand").setAttribute("aria-label", `${profile.initials} ${profile.name}, home`);
  $("brand-mark").textContent = profile.initials;
  $("brand-name").textContent = profile.name;
  $("footer-name").textContent = profile.name;
  $("year").textContent = new Date().getFullYear();
}

function renderSections({ sections }) {
  const main = $("main");
  const menu = [];
  let alternate = false;

  for (const section of sections) {
    const node = document.getElementById(section.id);
    if (!node) continue;

    main.append(node); // moves the section to match the saved order
    const enabled = section.visible !== false;
    node.hidden = !enabled;
    node.classList.toggle("is-disabled", !enabled);

    const eyebrow = node.querySelector("[data-eyebrow]");
    if (!eyebrow) continue; // highlights and badge strip have no heading, menu entry or background
    eyebrow.textContent = section.eyebrow;
    node.querySelector("[data-title]").textContent = section.title;

    if (!enabled) continue;
    node.classList.toggle("section--alt", alternate);
    alternate = !alternate;
    if (section.nav) menu.push(section);
  }

  $("nav-list").replaceChildren(
    ...menu.map((section) => {
      const isContact = section.id === "contact";
      return el(
        "li",
        {},
        el("a", { class: isContact ? "nav__link nav__link--cta" : "nav__link", href: `#${section.id}` }, section.nav)
      );
    })
  );
}

function renderHero({ profile, contact }) {
  const availability = $("hero-availability");
  availability.textContent = profile.availability ?? "";
  availability.hidden = !profile.availability;
  startRoleRotation($("hero-eyebrow"), [profile.role, ...splitLines(profile.otherRoles)]);
  $("hero-title").replaceChildren(
    `${profile.headline} `,
    el("em", {}, profile.headlineEmphasis)
  );
  $("hero-lead").textContent = profile.lead;
  $("hero-cta-primary").textContent = profile.ctaPrimary;

  const resume = $("hero-resume");
  resume.textContent = profile.ctaSecondary;
  resume.setAttribute("href", asset(profile.resume));
  resume.setAttribute("download", baseName(profile.resume));

  $("hero-meta").replaceChildren(
    el("li", {}, contact.locationShort),
    el("li", {}, externalLink(contact.linkedin, "LinkedIn")),
    el("li", {}, externalLink(contact.github, "GitHub"))
  );

  const photo = $("hero-photo");
  photo.setAttribute("src", asset(profile.photo));
  photo.setAttribute("alt", profile.photoAlt);
}

function renderStats(content) {
  const counts = { certifications: content.certifications.items.length, awards: content.awards.length };
  const resolve = (value) => String(value).replace(/\{(certifications|awards)\}/g, (_, key) => counts[key]);
  $("stats").replaceChildren(
    ...content.stats.map((stat) =>
      el(
        "div",
        { class: "stat" },
        el("span", { class: "stat__value" }, resolve(stat.value)),
        el("span", { class: "stat__label" }, stat.label)
      )
    )
  );
}

function renderBadges({ certifications }) {
  const badged = certifications.items.filter((item) => item.badge);
  const badge = (item, decorative) =>
    el("img", { loading: "lazy", decoding: "async", src: asset(item.badge), alt: decorative ? "" : item.name, height: "64" });

  // The list is rendered twice so the strip can scroll in a seamless loop.
  const strip = $("badge-strip");
  strip.replaceChildren(
    ...badged.map((item) => el("li", {}, badge(item, false))),
    ...badged.map((item) => el("li", { "aria-hidden": "true" }, badge(item, true)))
  );
  $("badges").hidden ||= badged.length === 0;
}

function renderAbout({ about }) {
  $("about-body").replaceChildren(...about.paragraphs.map((text) => el("p", {}, text)));
}

function renderValues({ values }) {
  $("values-list").replaceChildren(
    ...values.map((item) =>
      el(
        "article",
        { class: "value" },
        el("h3", { class: "value__title" }, item.title),
        el("p", { class: "value__text" }, item.text)
      )
    )
  );
  $("values").hidden ||= values.length === 0;
}

function renderExperience({ experience }) {
  $("timeline").replaceChildren(
    ...experience.map((job) =>
      el(
        "li",
        { class: "timeline__item" },
        el(
          "div",
          { class: "timeline__meta" },
          el("p", { class: "timeline__date" }, job.period),
          el("p", { class: "timeline__place" }, job.place)
        ),
        el(
          "article",
          { class: "timeline__body" },
          el("h3", { class: "timeline__role" }, job.role),
          el(
            "p",
            { class: "timeline__company" },
            `${job.company} `,
            job.client && el("span", {}, job.client)
          ),
          el("ul", { class: "checklist" }, job.bullets.map((bullet) => el("li", {}, bullet)))
        )
      )
    )
  );
}

function renderWork({ work }) {
  $("work-cards").replaceChildren(
    ...work.map((card) =>
      el(
        "article",
        { class: "card" },
        el("p", { class: "card__tag" }, card.tag),
        el("h3", { class: "card__title" }, card.title),
        el("p", { class: "card__text" }, card.text),
        card.role && el("p", { class: "card__role" }, el("strong", {}, "My role: "), card.role),
        card.stack?.length > 0 && el("ul", { class: "tags card__stack" }, card.stack.map((item) => el("li", {}, item))),
        card.result && el("p", { class: "card__result" }, el("strong", {}, "Impact: "), card.result),
        card.link &&
          el("a", { class: "card__link", href: safeUrl(card.link), target: "_blank", rel: "noopener noreferrer" }, "View project \u2192")
      )
    )
  );
}

function renderSkills({ skills }) {
  $("skills-grid").replaceChildren(
    ...skills.map((group) =>
      el(
        "section",
        { class: "skills__group" },
        el("h3", { class: "skills__title" }, group.title),
        el("ul", { class: "tags" }, group.items.map((item) => el("li", {}, item)))
      )
    )
  );
}

function renderJourney({ journey }) {
  $("journey-list").replaceChildren(
    ...journey.map((step) =>
      el(
        "li",
        { class: "timeline__item" },
        el("div", { class: "timeline__meta" }, el("p", { class: "timeline__date" }, step.period)),
        el(
          "article",
          { class: "timeline__body" },
          el("h3", { class: "timeline__role" }, step.title),
          el("p", { class: "journey__text" }, step.text)
        )
      )
    )
  );
  $("journey").hidden ||= journey.length === 0;
}

function renderAwards({ awards }) {
  $("awards-list").replaceChildren(
    ...awards.map((award) =>
      el(
        "li",
        { class: "award" },
        el("h3", { class: "award__title" }, award.title),
        el("p", { class: "award__text" }, award.text)
      )
    )
  );
}

function renderJournal({ journal }) {
  $("journal-list").replaceChildren(
    ...journal.map((entry) =>
      el(
        "details",
        { class: "entry" },
        el(
          "summary",
          { class: "entry__summary" },
          el(
            "span",
            { class: "entry__head" },
            entry.date && el("span", { class: "entry__date" }, entry.date),
            el("h3", { class: "entry__title" }, entry.title)
          )
        ),
        el(
          "div",
          { class: "entry__body" },
          entry.paragraphs.map((text) => el("p", { class: "entry__text" }, text)),
          entry.tags?.length > 0 && el("ul", { class: "tags" }, entry.tags.map((tag) => el("li", {}, tag)))
        )
      )
    )
  );
  $("journal").hidden ||= journal.length === 0;
}

function renderTestimonials({ testimonials }) {
  $("testimonials-list").replaceChildren(
    ...testimonials.map((item) =>
      el(
        "figure",
        { class: "quote" },
        el("blockquote", { class: "quote__text" }, item.quote),
        el("figcaption", { class: "quote__by" }, el("strong", {}, item.name), item.role && ` \u00b7 ${item.role}`)
      )
    )
  );
  $("testimonials").hidden ||= testimonials.length === 0;
}

function certificateCard(item) {
  const href = item.verifyUrl ? safeUrl(item.verifyUrl) : asset(item.certificate);
  return el(
    "li",
    { class: "cert" },
    el(
      "a",
      {
        class: "cert__link",
        href,
        target: "_blank",
        rel: "noopener noreferrer",
        "data-file": item.certificate ? baseName(item.certificate) : null,
      },
      item.certificate &&
        el("img", { loading: "lazy", decoding: "async", src: asset(item.certificate), alt: `${item.name} certificate` }),
      item.badge &&
        el("img", { class: "cert__badge", loading: "lazy", decoding: "async", src: asset(item.badge), alt: "" }),
      el("span", { class: "cert__name" }, item.name),
      el("span", { class: "cert__issuer" }, item.issuer)
    )
  );
}

function renderCertifications({ certifications }) {
  const groups = new Map();
  for (const item of certifications.items) {
    const name = item.group || "Other";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  }

  $("cert-groups").replaceChildren(
    ...[...groups].map(([name, items]) =>
      el(
        "div",
        { class: "certs__section" },
        el("h3", { class: "certs__group" }, name),
        el("ul", { class: "certs" }, items.map(certificateCard))
      )
    )
  );
  $("cert-note").textContent = certifications.note;
  const credly = $("cert-credly");
  credly.textContent = certifications.credlyLabel;
  credly.setAttribute("href", safeUrl(certifications.credly));
}

function renderEducation({ education }) {
  $("education-list").replaceChildren(
    ...education.map((entry) =>
      el(
        "li",
        { class: "education__item" },
        el(
          "div",
          {},
          el("h3", { class: "education__title" }, entry.title),
          el("p", { class: "education__place" }, entry.place)
        ),
        el("p", { class: "education__meta" }, entry.period, entry.score && [el("br"), entry.score])
      )
    )
  );
}

function renderContact({ contact }) {
  $("contact-lead").textContent = contact.lead;
  $("contact-form-open").textContent = contact.formButton;

  const email = $("contact-email");
  email.setAttribute("href", safeUrl(`mailto:${contact.email.trim()}`));
  email.textContent = contact.email;

  const book = $("contact-book");
  book.hidden = !contact.bookingUrl;
  if (contact.bookingUrl) book.setAttribute("href", safeUrl(contact.bookingUrl));

  $("contact-links").replaceChildren(
    el(
      "li",
      {},
      el("a", { href: safeUrl(`tel:${contact.phone.replace(/[^+\d]/g, "")}`) }, contact.phone)
    ),
    el("li", {}, externalLink(contact.linkedin, "LinkedIn")),
    el("li", {}, externalLink(contact.github, "GitHub")),
    el("li", {}, contact.location)
  );
}
