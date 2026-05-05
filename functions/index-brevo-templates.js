const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const BREVO_INTERNAL_TEMPLATE_ID = defineString("BREVO_INTERNAL_TEMPLATE_ID", { default: "118" });
const BREVO_CONFIRMATION_TEMPLATE_ID = defineString("BREVO_CONFIRMATION_TEMPLATE_ID", { default: "117" });
const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const CONTACT_RECIPIENT_EMAIL = "contact@usmfootball.com";
const CONTACT_RECIPIENT_NAME = "USM Football";

const nativeFetch = global.fetch;

function normalizeTemplateId(param, fallback) {
  const parsed = Number.parseInt(String(param.value() || fallback).trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readField(text, label) {
  const pattern = new RegExp(`^${label}\\s*:\\s*(.*)$`, "im");
  const match = String(text || "").match(pattern);
  return match ? match[1].trim() : "";
}

function readMessage(text) {
  const content = String(text || "");
  const start = content.indexOf("Message :");
  if (start === -1) return "";

  const afterStart = content.slice(start + "Message :".length);
  const end = afterStart.indexOf("\n---");
  return (end === -1 ? afterStart : afterStart.slice(0, end)).trim();
}

function buildParams(payload) {
  const textContent = payload.textContent || "";
  const firstName = readField(textContent, "Prénom");
  const lastName = readField(textContent, "Nom");
  const email = readField(textContent, "Email") || payload.replyTo?.email || "";
  const fullName = payload.replyTo?.name || `${firstName} ${lastName}`.trim();

  return {
    firstName,
    lastName,
    fullName,
    profession: readField(textContent, "Profession"),
    email,
    phone: readField(textContent, "Téléphone"),
    profileLabel: readField(textContent, "Profil"),
    smsConsentLabel: readField(textContent, "Consentement téléphone/SMS"),
    message: readMessage(textContent),
    submittedAt: readField(textContent, "Date d’envoi"),
    source: readField(textContent, "Source"),
    pageTitle: readField(textContent, "Titre page"),
    language: readField(textContent, "Langue")
  };
}

function shouldUseContactTemplates(url, options, payload) {
  if (url !== BREVO_SEND_EMAIL_URL) return false;
  if (String(options?.method || "").toUpperCase() !== "POST") return false;
  if (!payload || typeof payload !== "object") return false;
  if (!Array.isArray(payload.tags) || !payload.tags.includes("site-contact")) return false;
  if (!payload.replyTo?.email) return false;

  return Array.isArray(payload.to)
    && payload.to.some((recipient) => String(recipient?.email || "").toLowerCase() === CONTACT_RECIPIENT_EMAIL);
}

function toTemplatePayload(payload, templateId, params, extra = {}) {
  const nextPayload = {
    sender: payload.sender,
    to: payload.to,
    replyTo: payload.replyTo,
    templateId,
    params,
    tags: payload.tags,
    ...extra
  };

  Object.keys(nextPayload).forEach((key) => {
    if (nextPayload[key] === undefined || nextPayload[key] === null) delete nextPayload[key];
  });

  return nextPayload;
}

async function sendConfirmationEmail(url, options, originalPayload, params) {
  const confirmationTemplateId = normalizeTemplateId(BREVO_CONFIRMATION_TEMPLATE_ID, 117);
  const prospectEmail = originalPayload.replyTo?.email;
  if (!prospectEmail) return;

  const confirmationPayload = toTemplatePayload(originalPayload, confirmationTemplateId, params, {
    to: [
      {
        email: prospectEmail,
        name: originalPayload.replyTo?.name || params.fullName || prospectEmail
      }
    ],
    replyTo: {
      email: CONTACT_RECIPIENT_EMAIL,
      name: CONTACT_RECIPIENT_NAME
    },
    tags: ["site-contact", "usm-football", "prospect-confirmation"]
  });

  try {
    const response = await nativeFetch(url, {
      ...options,
      body: JSON.stringify(confirmationPayload)
    });

    if (!response.ok) {
      logger.error("Brevo confirmation template failed", {
        status: response.status,
        templateId: confirmationTemplateId,
        email: prospectEmail
      });
      return;
    }

    logger.info("Brevo confirmation template sent", {
      templateId: confirmationTemplateId,
      email: prospectEmail
    });
  } catch (error) {
    logger.error("Brevo confirmation template error", {
      message: error.message,
      templateId: confirmationTemplateId,
      email: prospectEmail
    });
  }
}

global.fetch = async function patchedFetch(url, options = {}) {
  if (url !== BREVO_SEND_EMAIL_URL || !options?.body) {
    return nativeFetch(url, options);
  }

  let originalPayload = null;
  try {
    originalPayload = JSON.parse(options.body);
  } catch (error) {
    return nativeFetch(url, options);
  }

  if (!shouldUseContactTemplates(url, options, originalPayload)) {
    return nativeFetch(url, options);
  }

  const internalTemplateId = normalizeTemplateId(BREVO_INTERNAL_TEMPLATE_ID, 118);
  const params = buildParams(originalPayload);
  const internalPayload = toTemplatePayload(originalPayload, internalTemplateId, params, {
    tags: ["site-contact", "usm-football", "internal-notification"]
  });

  const response = await nativeFetch(url, {
    ...options,
    body: JSON.stringify(internalPayload)
  });

  if (response.ok) {
    await sendConfirmationEmail(url, options, originalPayload, params);
  }

  return response;
};

module.exports = require("./index.js");
