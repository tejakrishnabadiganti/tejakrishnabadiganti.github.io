// "Visitors" tab of the editor: anonymous totals read from the Google Apps Script.
import { el } from "./dom.js";

const TILES = [
  ["total", "Total visits"],
  ["unique", "Unique visitors"],
  ["returning", "Returning visits"],
  ["today", "Today"],
  ["last7Days", "Last 7 days"],
  ["messages", "Contact messages"],
  ["chatQuestions", "Chat questions"],
  ["knownVisitors", "Known visitors"],
];

const tile = ([key, label], stats) =>
  el("div", { class: "admin-stat" }, el("span", { class: "admin-stat__value" }, String(stats[key])), el("span", { class: "admin-stat__label" }, label));

function dailyChart(daily) {
  const peak = Math.max(1, ...daily.map((day) => day.visits));
  return el(
    "div",
    { class: "admin-bars", role: "img", "aria-label": "Visits per day for the last 14 days" },
    daily.map((day) =>
      el(
        "div",
        { class: "admin-bars__col", title: `${day.date}: ${day.visits}` },
        el("span", { class: "admin-bars__count" }, String(day.visits)),
        el("span", { class: "admin-bars__bar", style: `height:${Math.round((day.visits / peak) * 100)}%` }),
        el("span", { class: "admin-bars__day" }, day.date.slice(8))
      )
    )
  );
}

const ranking = (title, entries, empty) =>
  el(
    "div",
    { class: "admin-rank" },
    el("h3", { class: "admin-rank__title" }, title),
    entries.length
      ? el("ul", {}, entries.map((entry) => el("li", {}, el("span", {}, entry.name), el("strong", {}, String(entry.visits)))))
      : el("p", { class: "admin-help" }, empty)
  );

function renderStats(stats) {
  return [
    el("div", { class: "admin-stats" }, TILES.map((definition) => tile(definition, stats))),
    el("h3", { class: "admin-rank__title" }, "Visits per day (last 14 days)"),
    dailyChart(stats.daily),
    el("div", { class: "admin-ranks" },
      ranking("Top countries", stats.countries || [], "No location data yet."),
      ranking("Top browsers", stats.browsers || [], "No data yet."),
    ),
    el("div", { class: "admin-ranks" },
      ranking("Where visitors came from", stats.referrers, "No referring websites yet."),
      ranking("Devices", stats.devices, "No data yet."),
    ),
    el("div", { class: "admin-ranks" },
      ranking("Operating systems", stats.oses || [], "No data yet."),
      ranking("Top cities", stats.cities || [], "No city data yet."),
    ),
  ];
}

async function loadStats(endpoint) {
  const response = await fetch(`${endpoint}?action=stats`);
  const payload = await response.json();
  if (!payload.stats) throw new Error("The Google script does not have the visitor counter yet. Paste the latest Code.gs and deploy a new version.");
  return payload.stats;
}

export function visitorsView(endpoint) {
  const output = el("div", { class: "admin-visitors__output", "aria-live": "polite" });
  const refresh = el("button", { class: "button button--ghost admin-small", type: "button" }, "Refresh");

  const load = async () => {
    refresh.disabled = true;
    output.replaceChildren(el("p", { class: "admin-help" }, "Loading…"));
    try {
      output.replaceChildren(...renderStats(await loadStats(endpoint)));
    } catch (error) {
      output.replaceChildren(el("p", { class: "admin-error" }, error.message || "Could not load the numbers."));
    } finally {
      refresh.disabled = false;
    }
  };
  refresh.addEventListener("click", load);
  if (endpoint) load();
  else output.replaceChildren(el("p", { class: "admin-error" }, "Set the contact form Google Apps Script URL first (Contact & social links)."));

  return el(
    "div",
    { class: "admin-section" },
    el("p", { class: "admin-hint" }, "Website analytics dashboard. Visitor names and emails are in the Google Sheet (Contact requests, Known Visitors)."),
    refresh,
    output
  );
}
