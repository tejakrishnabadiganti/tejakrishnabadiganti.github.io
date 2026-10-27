/**
 * Contact form receiver for the portfolio site.
 *
 * Saves every message as a row in the Google Sheet this script is attached to
 * (so it lives in your Google Drive), emails you the details, and sends the
 * visitor a friendly confirmation so they know it arrived. It also counts page
 * visits anonymously (no names, emails or IP addresses) in a "Visits" sheet.
 * Setup steps are in the README under "Contact form".
 */

const CONFIG = {
  // Leave empty to send the email to the Google account that owns this script.
  notifyEmail: "",
  sheetName: "Contact requests",
  maxPerEmailPerHour: 3,
  maxTotalPerHour: 30,
  visitsSheetName: "Visits",
  summarySheetName: "Visit summary",
  maxVisitsPerHour: 600,

  // Confirmation email sent to the visitor. Set sendConfirmation to false to turn it off.
  sendConfirmation: true,
  senderName: "Tejakrishna Badiganti",
  signOff: "Tejakrishna",
  role: "Full Stack Software Engineer",
  about:
    "I build cloud-native web applications and AI-powered tools on Azure, AWS and Google Cloud, " +
    "and I enjoy turning complicated problems into simple, reliable software.",
  links: [
    { label: "Portfolio", url: "https://tejakrishnabadiganti.github.io/" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/tejakrishna-badiganti-88924419b/" },
    { label: "GitHub", url: "https://github.com/tejakrishnabadiganti" },
  ],
};

const LIMITS = { firstName: 80, lastName: 80, email: 120, phone: 30, reason: 80, otherReason: 120, message: 1000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{5,18}[0-9]$/;
const HEADERS = ["Received", "First name", "Last name", "Email", "Phone", "Reason", "Message", "Page"];

function doGet(e) {
  if (e && e.parameter && e.parameter.action === "stats") return reply({ ok: true, stats: readStats() });
  return reply({ ok: true, service: "portfolio contact form" });
}

function doPost(e) {
  try {
    const params = e.parameter || {};
    if (params.website) return reply({ ok: true }); // hidden field, only bots fill it
    if (params.type === "visit") return recordVisit(params);

    const data = readFields(params);
    validate(data);
    enforceRateLimit(data.email);
    saveRow(data, clean(params.page, 300));
    notifyOwner(data);
    sendConfirmationOnce(data);
    return reply({ ok: true });
  } catch (error) {
    return reply({ ok: false, error: error.message });
  }
}

function readFields(params) {
  const data = {};
  Object.keys(LIMITS).forEach((key) => {
    data[key] = clean(params[key], LIMITS[key]);
  });
  data.reasonText = data.otherReason || data.reason;
  return data;
}

function clean(value, maxLength) {
  return String(value == null ? "" : value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, maxLength);
}

function validate(data) {
  ["firstName", "lastName", "email", "phone", "reason"].forEach((key) => {
    if (!data[key]) throw new Error("Please fill in all required fields.");
  });
  if (!EMAIL_PATTERN.test(data.email)) throw new Error("Please enter a valid email address.");
  if (!PHONE_PATTERN.test(data.phone)) throw new Error("Please enter a valid phone number.");
  if (data.reason.toLowerCase() === "other" && !data.otherReason) throw new Error("Please tell me the reason.");
}

function enforceRateLimit(email) {
  const cache = CacheService.getScriptCache();
  const bump = (key, max) => {
    const count = Number(cache.get(key) || 0);
    if (count >= max) throw new Error("Too many messages right now. Please try again later.");
    cache.put(key, String(count + 1), 3600);
  };
  bump("rate:all", CONFIG.maxTotalPerHour);
  bump("rate:" + email.toLowerCase(), CONFIG.maxPerEmailPerHour);
}

// A leading = + - @ would make Google Sheets treat the text as a formula.
function safeCell(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.sheetName);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveRow(data, page) {
  const row = [new Date(), data.firstName, data.lastName, data.email, data.phone, data.reasonText, data.message, page];
  getSheet().appendRow(row.map((cell) => (typeof cell === "string" ? safeCell(cell) : cell)));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

const ownerEmail = () => CONFIG.notifyEmail || Session.getEffectiveUser().getEmail();

function notifyOwner(data) {
  const to = ownerEmail();
  const rows = [
    ["Name", data.firstName + " " + data.lastName],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Reason", data.reasonText],
    ["Message", data.message || "(none)"],
  ];
  MailApp.sendEmail({
    to: to,
    replyTo: data.email,
    subject: "New website enquiry: " + data.reasonText + " - " + data.firstName + " " + data.lastName,
    body: rows.map((row) => row[0] + ": " + row[1]).join("\n"),
    htmlBody:
      "<h3>New enquiry from your portfolio website</h3><table cellpadding='6'>" +
      rows.map((row) => "<tr><td><b>" + row[0] + "</b></td><td>" + escapeHtml(row[1]).replace(/\n/g, "<br>") + "</td></tr>").join("") +
      "</table><p>Reply to this email to answer " + escapeHtml(data.firstName) + " directly.</p>",
  });
}

/* ---------- Confirmation email to the visitor ---------- */

const oneLine = (text) => String(text).replace(/\s+/g, " ").trim();

// Only the chosen reason (never free text) is echoed back, so the form cannot be used to send custom messages to other people.
function reasonReply(reason) {
  const key = reason.toLowerCase();
  if (key.indexOf("referral") >= 0 || key.indexOf("looking for") >= 0) {
    return {
      line: "I see you're looking for a job opportunity or a referral at my current company. Thank you for reaching out! I'll go through your details, and if there's a way I can help, I'll let you know.",
      nextStep: "To help me look into it faster, please reply to this email with your updated resume and the role (or job ID) you're interested in.",
    };
  }
  if (key.indexOf("job") >= 0 || key.indexOf("hiring") >= 0) {
    return {
      line: "I see you have a job opportunity for me. Thank you for thinking of me! I'll go through the details and get back to you personally.",
      nextStep: "If you can, please reply to this email with the role, company, location and a job description so I can take a look.",
    };
  }
  if (key.indexOf("career") >= 0) return { line: "I see you'd like some career guidance. Happy to help in any way I can." };
  if (key.indexOf("knowledge") >= 0) {
    return { line: "I see you'd like to share knowledge. I love learning from others, so I'm looking forward to hearing more." };
  }
  if (key.indexOf("collab") >= 0 || key.indexOf("project") >= 0) {
    return { line: "I see you're interested in collaborating on a project. That sounds exciting, and I'd love to hear more." };
  }
  if (key === "other") return { line: "I'll read your message carefully and get back to you." };
  return { line: "Thanks for reaching out about \"" + reason + "\". I'll read your message carefully." };
}

function confirmationContent(data) {
  const first = oneLine(data.firstName);
  const reply = reasonReply(oneLine(data.reason));
  return {
    subject: "Thanks for reaching out, " + first + " - I'll be in touch soon",
    greeting: "Hi " + first + ",",
    paragraphs: [
      "Thank you for getting in touch. Your details have reached me safely.",
      reply.line,
      "I'm a little busy at the moment, but as soon as I'm free I'll reach out to you, as quickly as I can.",
    ].concat(reply.nextStep ? [reply.nextStep] : []),
    aboutHeading: "A little about me",
    about: CONFIG.about,
    linksHeading: "In the meantime, you can find me here",
    signature: ["Warm regards,", CONFIG.signOff, CONFIG.role],
    footer: "This is an automatic confirmation because you used the contact form on my portfolio. You can simply reply to this email to reach me.",
  };
}

function confirmationText(content) {
  return [
    content.greeting,
    content.paragraphs.join("\n\n"),
    content.aboutHeading + "\n" + content.about,
    content.linksHeading + ":\n" + CONFIG.links.map((link) => link.label + ": " + link.url).join("\n"),
    content.signature.join("\n"),
    content.footer,
  ].join("\n\n");
}

function confirmationHtml(content) {
  const paragraph = (text) => "<p style='margin:0 0 16px;font-size:16px;line-height:1.65;color:#2a3342'>" + escapeHtml(text) + "</p>";
  const links = CONFIG.links
    .map((link) => "<a href='" + escapeHtml(link.url) + "' style='color:#14305a;font-weight:600;text-decoration:none;margin-right:18px'>" + escapeHtml(link.label) + "</a>")
    .join("");
  return (
    "<div style='background:#f4f1ea;padding:28px 12px;font-family:Helvetica,Arial,sans-serif'>" +
    "<table role='presentation' align='center' width='100%' style='max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e1dacb;border-radius:6px;border-collapse:separate'>" +
    "<tr><td style='background:#14305a;padding:26px 32px;border-radius:6px 6px 0 0'>" +
    "<div style='font-family:Georgia,\"Times New Roman\",serif;font-size:24px;color:#ffffff'>" + escapeHtml(CONFIG.senderName) + "</div>" +
    "<div style='margin-top:4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#d9c08c'>" + escapeHtml(CONFIG.role) + "</div>" +
    "</td></tr>" +
    "<tr><td style='height:3px;background:#8f6a2a;font-size:0;line-height:0'>&nbsp;</td></tr>" +
    "<tr><td style='padding:32px 32px 8px'>" +
    "<h1 style='margin:0 0 18px;font-family:Georgia,\"Times New Roman\",serif;font-size:22px;font-weight:600;color:#14305a'>" + escapeHtml(content.greeting) + "</h1>" +
    content.paragraphs.map(paragraph).join("") +
    "</td></tr>" +
    "<tr><td style='padding:0 32px 8px'>" +
    "<div style='background:#f9f6ef;border-left:3px solid #8f6a2a;padding:16px 18px'>" +
    "<div style='font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#8f6a2a;margin-bottom:6px'>" + escapeHtml(content.aboutHeading) + "</div>" +
    "<div style='font-size:15px;line-height:1.6;color:#2a3342'>" + escapeHtml(content.about) + "</div>" +
    "</div></td></tr>" +
    "<tr><td style='padding:22px 32px 4px'>" +
    "<div style='font-size:14px;color:#5b6573;margin-bottom:8px'>" + escapeHtml(content.linksHeading) + "</div>" +
    "<div style='font-size:15px'>" + links + "</div></td></tr>" +
    "<tr><td style='padding:26px 32px 30px'>" +
    "<div style='font-size:16px;color:#2a3342'>" + escapeHtml(content.signature[0]) + "</div>" +
    "<div style='font-family:Georgia,\"Times New Roman\",serif;font-size:20px;color:#14305a;margin-top:2px'>" + escapeHtml(content.signature[1]) + "</div>" +
    "<div style='font-size:13px;color:#5b6573'>" + escapeHtml(content.signature[2]) + "</div>" +
    "</td></tr>" +
    "<tr><td style='padding:16px 32px;border-top:1px solid #e1dacb;font-size:12px;line-height:1.5;color:#7a8391'>" + escapeHtml(content.footer) + "</td></tr>" +
    "</table></div>"
  );
}

function sendConfirmation(data) {
  const content = confirmationContent(data);
  MailApp.sendEmail({
    to: data.email,
    replyTo: ownerEmail(),
    name: CONFIG.senderName,
    subject: content.subject,
    body: confirmationText(content),
    htmlBody: confirmationHtml(content),
  });
}

// One confirmation per address every few hours; a failure here never loses the enquiry itself.
function sendConfirmationOnce(data) {
  if (!CONFIG.sendConfirmation) return;
  try {
    const cache = CacheService.getScriptCache();
    const key = "confirmed:" + data.email.toLowerCase();
    if (cache.get(key)) return;
    sendConfirmation(data);
    cache.put(key, "1", 21600);
  } catch (error) {
    console.error("Confirmation email failed: " + error.message);
  }
}

/* ---------- Anonymous visit counter ---------- */

const VISIT_HEADERS = ["Time", "Visitor ID", "Returning visitor", "Came from", "Device", "Timezone", "Language", "Page"];
const VISITOR_ID_PATTERN = /^[0-9a-f-]{36}$/i;

function recordVisit(params) {
  const id = clean(params.visitor, 40);
  if (!VISITOR_ID_PATTERN.test(id)) return reply({ ok: false });

  const cache = CacheService.getScriptCache();
  const count = Number(cache.get("visits:all") || 0);
  if (count >= CONFIG.maxVisitsPerHour) return reply({ ok: true });
  cache.put("visits:all", String(count + 1), 3600);

  const row = [
    new Date(),
    id,
    params.returning === "yes" ? "Yes" : "No",
    clean(params.referrer, 100),
    clean(params.device, 20),
    clean(params.timezone, 60),
    clean(params.language, 20),
    clean(params.page, 200),
  ];
  getVisitsSheet().appendRow(row.map((cell) => (typeof cell === "string" ? safeCell(cell) : cell)));
  return reply({ ok: true });
}

function getVisitsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.visitsSheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.visitsSheetName);
    sheet.appendRow(VISIT_HEADERS);
    sheet.setFrozenRows(1);
    createSummarySheet(spreadsheet);
  }
  return sheet;
}

// Live numbers for the owner: formulas read the Visits sheet, so they update by themselves.
function createSummarySheet(spreadsheet) {
  const visits = "'" + CONFIG.visitsSheetName + "'";
  const summary = spreadsheet.getSheetByName(CONFIG.summarySheetName) || spreadsheet.insertSheet(CONFIG.summarySheetName);
  summary.clear();
  summary.getRange("A1:B6").setFormulas([
    ["Total visits", "=MAX(0,COUNTA(" + visits + "!A:A)-1)"],
    ["Unique visitors", "=IFERROR(COUNTUNIQUE(" + visits + "!B2:B),0)"],
    ["Returning visits", "=COUNTIF(" + visits + "!C2:C,\"Yes\")"],
    ["Visits today", "=COUNTIF(" + visits + "!A2:A,\">=\"&TODAY())"],
    ["Visits in the last 7 days", "=COUNTIF(" + visits + "!A2:A,\">=\"&(TODAY()-6))"],
    ["Contact form messages", "=MAX(0,COUNTA('" + CONFIG.sheetName + "'!A:A)-1)"],
  ]);
  summary.getRange("A8").setValue("Top places visitors came from");
  summary.getRange("A9").setFormula(
    "=IFERROR(QUERY(" + visits + "!D2:D,\"select D, count(D) where D <> '' group by D order by count(D) desc limit 8 label D 'Website', count(D) 'Visits'\",0),\"No data yet\")"
  );
  summary.getRange("A1:A8").setFontWeight("bold");
  summary.setColumnWidth(1, 240);
}

// Totals only, never names, emails or visitor IDs, so the editor can show them.
function summarizeVisits(rows, messages, formatDay, today) {
  const DAY_MS = 86400000;
  const perDay = {};
  const visitors = {};
  const referrers = {};
  const devices = {};
  let returning = 0;
  rows.forEach((row) => {
    const day = formatDay(new Date(row[0]));
    perDay[day] = (perDay[day] || 0) + 1;
    visitors[row[1]] = true;
    if (row[2] === "Yes") returning += 1;
    if (row[3]) referrers[row[3]] = (referrers[row[3]] || 0) + 1;
    if (row[4]) devices[row[4]] = (devices[row[4]] || 0) + 1;
  });

  const daily = [];
  for (let back = 13; back >= 0; back -= 1) {
    const day = formatDay(new Date(today.getTime() - back * DAY_MS));
    daily.push({ date: day, visits: perDay[day] || 0 });
  }
  const sumLast = (days) => daily.slice(-days).reduce((total, entry) => total + entry.visits, 0);
  const top = (totals) =>
    Object.keys(totals)
      .map((name) => ({ name: name, visits: totals[name] }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 8);

  return {
    total: rows.length,
    unique: Object.keys(visitors).length,
    returning: returning,
    today: sumLast(1),
    last7Days: sumLast(7),
    messages: messages,
    daily: daily,
    referrers: top(referrers),
    devices: top(devices),
  };
}

function readStats() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const visits = spreadsheet.getSheetByName(CONFIG.visitsSheetName);
  const contacts = spreadsheet.getSheetByName(CONFIG.sheetName);
  const rowCount = visits ? visits.getLastRow() - 1 : 0;
  const rows = rowCount > 0 ? visits.getRange(2, 1, rowCount, 5).getValues() : [];
  const messages = contacts ? Math.max(0, contacts.getLastRow() - 1) : 0;
  const zone = Session.getScriptTimeZone();
  return summarizeVisits(rows, messages, (date) => Utilities.formatDate(date, zone, "yyyy-MM-dd"), new Date());
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
