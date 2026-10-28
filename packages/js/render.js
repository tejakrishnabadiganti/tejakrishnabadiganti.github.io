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
const shown = (items) => items.filter((item) => item.visible !== false);

export function renderPage(content) {
  document.title = content.site.title;
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", content.site.description);

  renderChrome(content);
  renderLabels(content);
  renderSections(content);
  renderHero(content);
  renderStats(content);
  renderBadges(content);
  renderAbout(content);
  renderValues(content);
  renderExperience(content);
  renderWork(content);
  renderSkills(content);
  renderAwards(content);
  renderMoments(content);
  renderTestimonials(content);
  renderCertifications(content);
  renderEducation(content);
  renderContact(content);
}

function renderChrome({ profile }) {
  $("brand").setAttribute("aria-label", `${profile.initials} ${profile.name}, home`);
  const mark = $("brand-mark");
  mark.classList.toggle("brand__mark--photo", Boolean(profile.logoImage));
  if (profile.logoImage) {
    mark.replaceChildren(el("img", { src: asset(profile.logoImage), alt: "", width: "44", height: "44", decoding: "async" }));
  } else {
    mark.textContent = profile.initials;
  }
  $("brand-name").textContent = profile.name;
  $("footer-name").textContent = profile.name;
  $("year").textContent = new Date().getFullYear();
}

function renderLabels({ labels }) {
  for (const node of document.querySelectorAll("[data-label]")) {
    node.textContent = labels[node.dataset.label] ?? node.textContent;
  }
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
    if (eyebrow) {
      eyebrow.textContent = section.eyebrow;
      node.querySelector("[data-title]").textContent = section.title;
    }

    if (!enabled) continue;
    if (eyebrow) {
      // highlights, the badge strip and the hero have no heading, so they stay out of the alternating backgrounds
      node.classList.toggle("section--alt", alternate);
      alternate = !alternate;
    }
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
  const counts = { certifications: shown(content.certifications.items).length, awards: shown(content.awards).length };
  const resolve = (value) => String(value).replace(/\{(certifications|awards)\}/g, (_, key) => counts[key]);
  $("stats").replaceChildren(
    ...shown(content.stats).map((stat) =>
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
  const badged = shown(certifications.items).filter((item) => item.badge);
  const badge = (item, decorative) =>
    el("img", { loading: "lazy", decoding: "async", src: asset(item.badge), alt: decorative ? "" : item.name, width: "64", height: "64" });

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
    ...shown(values).map((item) =>
      el(
        "article",
        { class: "value" },
        el("h3", { class: "value__title" }, item.title),
        el("p", { class: "value__text" }, item.text)
      )
    )
  );
  $("values").hidden ||= shown(values).length === 0;
}

function renderExperience({ experience }) {
  $("timeline").replaceChildren(
    ...shown(experience).map((job) =>
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

function renderWork({ work, labels }) {
  $("work-cards").replaceChildren(
    ...shown(work).map((card) =>
      el(
        "article",
        { class: "card" },
        el("p", { class: "card__tag" }, card.tag),
        el("h3", { class: "card__title" }, card.title),
        el("p", { class: "card__text" }, card.text),
        card.role && el("p", { class: "card__role" }, el("strong", {}, `${labels.roleLabel}: `), card.role),
        card.stack?.length > 0 && el("ul", { class: "tags card__stack" }, card.stack.map((item) => el("li", {}, item))),
        card.result && el("p", { class: "card__result" }, el("strong", {}, `${labels.impactLabel}: `), card.result),
        card.link &&
          el("a", { class: "card__link", href: safeUrl(card.link), target: "_blank", rel: "noopener noreferrer" }, labels.viewProject)
      )
    )
  );
}

function renderSkills({ skills, skillInfo }) {
  const explained = new Set(shown(skillInfo).map((info) => info.name));
  const tag = (item) =>
    explained.has(item)
      ? el("li", {}, el("button", { class: "tag-button", type: "button", "data-skill": item, "aria-haspopup": "dialog" }, item))
      : el("li", {}, item);

  $("skills-grid").replaceChildren(
    ...shown(skills).map((group) =>
      el(
        "section",
        { class: "skills__group" },
        el("h3", { class: "skills__title" }, group.title),
        el("ul", { class: "tags" }, group.items.map(tag))
      )
    )
  );
}

function renderAwards({ awards }) {
  $("awards-list").replaceChildren(
    ...shown(awards).map((award) =>
      el(
        "li",
        { class: "award" },
        el("h3", { class: "award__title" }, award.title),
        el("p", { class: "award__text" }, award.text)
      )
    )
  );
}

function renderTestimonials({ testimonials }) {
  $("testimonials-list").replaceChildren(
    ...shown(testimonials).map((item) =>
      el(
        "figure",
        { class: "quote" },
        el("blockquote", { class: "quote__text" }, item.quote),
        el("figcaption", { class: "quote__by" }, el("strong", {}, item.name), item.role && ` \u00b7 ${item.role}`)
      )
    )
  );
  $("testimonials").hidden ||= shown(testimonials).length === 0;
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
        el("img", { loading: "lazy", decoding: "async", src: asset(item.certificate), alt: `${item.name} certificate`, width: "600", height: "424" }),
      item.badge &&
        el("img", { class: "cert__badge", loading: "lazy", decoding: "async", src: asset(item.badge), alt: "", width: "64", height: "64" }),
      el("span", { class: "cert__name" }, item.name),
      el("span", { class: "cert__issuer" }, item.issuer)
    )
  );
}

function renderCertifications({ certifications }) {
  const groups = new Map();
  for (const item of shown(certifications.items)) {
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
    ...shown(education).map((entry) =>
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

function renderContact({ contact, labels }) {
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
    el("li", {}, externalLink(contact.linkedin, labels.linkedinLabel)),
    el("li", {}, externalLink(contact.github, labels.githubLabel)),
    el("li", {}, contact.location)
  );
}
