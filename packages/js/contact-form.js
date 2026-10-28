import { getContent } from "./site.js";
import { getVisitorId } from "./visit-counter.js";

const ENDPOINT_PREFIX = "https://script.google.com/macros/s/";
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{5,18}[0-9]$/;
const MIN_SECONDS_BETWEEN_SENDS = 30;
const LAST_SENT_KEY = "contact-form-last-sent";
const OTHER_REASON = "other";
const RESUME_REASONS = /referral|looking for|job seeker/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const $ = (id) => document.getElementById(id);

// Only the site owner's Google Apps Script may receive form data.
const endpointOf = (contact) => (contact.formEndpoint?.trim().startsWith(ENDPOINT_PREFIX) ? contact.formEndpoint.trim() : "");

export function initContactForm() {
  const dialog = $("contact-dialog");
  const form = $("contact-form");
  const success = $("contact-success");
  const status = $("contact-status");
  const submit = $("contact-submit");
  const reason = $("cf-reason");
  const otherWrap = $("cf-other-wrap");
  const other = $("cf-other");
  const phone = $("cf-phone");
  const resumeWrap = $("cf-resume-wrap");
  const resumeInput = $("cf-resume");

  const setStatus = (text, kind = "") => {
    status.textContent = text;
    status.dataset.kind = kind;
  };

  const fillFromContent = () => {
    const { contact, labels } = getContent();
    $("contact-dialog-title").textContent = contact.formTitle;
    $("contact-intro").textContent = contact.formIntro;
    $("contact-thanks").textContent = contact.formThanks;
    reason.replaceChildren(
      Object.assign(document.createElement("option"), { value: "", textContent: labels.selectReason, disabled: true }),
      ...contact.formReasons.map((text) => Object.assign(document.createElement("option"), { value: text, textContent: text }))
    );
    reason.selectedIndex = 0;
  };

  const open = () => {
    form.reset();
    fillFromContent();
    form.classList.remove("was-validated");
    otherWrap.hidden = true;
    other.required = false;
    resumeWrap.hidden = true;
    setStatus("");
    submit.disabled = false;
    form.hidden = false;
    success.hidden = true;
    dialog.showModal();
    $("cf-first").focus();
  };

  const close = () => dialog.close();

  reason.addEventListener("change", () => {
    const val = reason.value.trim();
    const isOther = val.toLowerCase() === OTHER_REASON;
    otherWrap.hidden = !isOther;
    other.required = isOther;
    if (isOther) other.focus();
    resumeWrap.hidden = !RESUME_REASONS.test(val);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-open-contact]")) return;
    event.preventDefault();
    open();
  });
  $("contact-close").addEventListener("click", close);
  $("contact-cancel").addEventListener("click", close);
  $("contact-done").addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  let overlay = null;
  const showSendingOverlay = (show) => {
    if (show && !overlay) {
      overlay = document.createElement("div");
      overlay.className = "contact-sending-overlay";
      overlay.innerHTML =
        '<div class="contact-sending-overlay__box">' +
        '<span class="contact-sending-overlay__spinner"></span>' +
        '<span>Sending your message…</span>' +
        "</div>";
      form.style.position = "relative";
      form.append(overlay);
    } else if (!show && overlay) {
      overlay.remove();
      overlay = null;
    }
  };

  const mailtoFallback = (contact, fields) => {
    const lines = [
      `Name: ${fields.firstName} ${fields.lastName}`,
      `Email: ${fields.email}`,
      `Phone: ${fields.phone}`,
      `Reason: ${fields.otherReason || fields.reason}`,
      "",
      fields.message,
    ];
    const subject = `Website enquiry: ${fields.otherReason || fields.reason}`;
    location.href = `mailto:${contact.email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    form.classList.add("was-validated");
    phone.setCustomValidity(PHONE_PATTERN.test(phone.value.trim()) ? "" : "Enter a valid phone number, for example +91 98765 43210.");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    if (data.get("website")) return; // filled only by bots

    const lastSent = Number(localStorage.getItem(LAST_SENT_KEY) ?? 0);
    if (Date.now() - lastSent < MIN_SECONDS_BETWEEN_SENDS * 1000) {
      setStatus("Please wait a moment before sending another message.", "error");
      return;
    }

    const file = resumeInput.files[0];
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setStatus("Please upload a PDF or Word document.", "error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setStatus("File is too large. Maximum size is 5 MB.", "error");
        return;
      }
    }

    const { contact } = getContent();
    const fields = Object.fromEntries([...data].map(([key, value]) => [key, String(value).trim()]));
    const endpoint = endpointOf(contact);

    if (!endpoint) {
      setStatus("Opening your email app…");
      mailtoFallback(contact, fields);
      return;
    }

    submit.disabled = true;
    let serverMessage = "";
    setStatus("Sending… this can take a few seconds.");
    showSendingOverlay(true);
    try {
      const payload = { ...fields, page: location.href, visitor: getVisitorId() };
      if (file) {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        payload.resumeData = btoa(binary);
        payload.resumeName = file.name;
        payload.resumeType = file.type;
      }
      const response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams(payload),
      });
      const result = await response.json();
      if (!result.ok) {
        serverMessage = result.error || "";
        throw new Error(serverMessage || "The message could not be sent.");
      }

      localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      form.hidden = true;
      success.hidden = false;
      $("contact-done").focus();
    } catch (error) {
      submit.disabled = false;
      showSendingOverlay(false);
      setStatus(serverMessage || `Sorry, that did not go through. Please try again or email ${contact.email}.`, "error");
      console.error(error);
    }
  });
}
