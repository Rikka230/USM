const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth: getAdminAuth } = require("firebase-admin/auth");

const BREVO_API_KEY = defineSecret("BREVO_API_KEY");
const YOUTUBE_API_KEY = defineSecret("YOUTUBE_API_KEY");
const BREVO_CONTACT_LIST_ID = defineString("BREVO_CONTACT_LIST_ID", { default: "" });

const CONTACT_RECIPIENT_EMAIL = "contact@usmfootball.com";
const CONTACT_RECIPIENT_NAME = "USM Football";
const CONTACT_SENDER_EMAIL = "contact@usmfootball.com";
const CONTACT_SENDER_NAME = "USM Football";
const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";

const ALLOWED_ORIGINS = new Set([
  "https://usmfootball.com",
  "https://www.usmfootball.com",
  "https://usm-football-b56ba.web.app",
  "https://usm-football-b56ba.firebaseapp.com"
]);

const PROFILE_LABELS = {
  joueur: "Je suis un joueur",
  club: "Je représente un club",
  coach: "Je suis coach",
  staff: "Je suis membre du staff",
  autre: "Autre demande"
};

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const CONTACT_SYNC_TIMEOUT_MS = 7000;
const SOCIAL_SYNC_TIMEOUT_MS = 12000;
const SOCIAL_SETTINGS_COLLECTION = "settings";
const SOCIAL_SETTINGS_DOC = "social";
const SOCIAL_SYNC_TARGETS = ["usm", "christophe"];

if (!getApps().length) {
  initializeApp();
}

const adminDb = getFirestore();
const adminAuth = getAdminAuth();

function isAllowedFirebasePreviewOrigin(origin) {
  return /^https:\/\/usm-football-b56ba--[a-z0-9-]+\.web\.app$/i.test(origin);
}

function setCorsHeaders(req, res) {
  const origin = req.get("origin") || "";
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  if (ALLOWED_ORIGINS.has(origin) || isAllowedFirebasePreviewOrigin(origin) || isLocalhost) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }

  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");
}

function isAllowedOrigin(req) {
  const origin = req.get("origin") || "";
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (isAllowedFirebasePreviewOrigin(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function getClientIp(req) {
  const forwardedFor = req.get("x-forwarded-for") || "";
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim();
  return firstForwardedIp || req.ip || "unknown";
}

function checkRateLimit(key) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || now - current.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { startedAt: now, count: 1 });
    return true;
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return current.count <= RATE_LIMIT_MAX_REQUESTS;
}

function normalizeString(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeMessage(value) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, 3000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  const compact = phone.replace(/[\s().-]/g, "");
  return /^\+?\d{6,18}$/.test(compact);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatParisDate(date = new Date()) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "medium"
  }).format(date);
}

function formatPhoneForBrevo(phone) {
  const raw = normalizeString(phone, 40);
  const compact = raw.replace(/[\s().-]/g, "");

  if (/^\+\d{6,18}$/.test(compact)) return compact;
  if (/^00\d{6,18}$/.test(compact)) return `+${compact.slice(2)}`;
  if (/^0\d{9}$/.test(compact)) return `+33${compact.slice(1)}`;

  return "";
}

function getBrevoContactListIds() {
  const raw = normalizeString(BREVO_CONTACT_LIST_ID.value(), 120);
  if (!raw) return [];

  return raw
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function createTextEmail({ firstName, lastName, profession, email, phone, smsConsent, profileLabel, message, requestMeta }) {
  return [
    "Nouvelle demande de contact depuis le site USM Football.",
    "",
    `Date d’envoi : ${requestMeta.submittedAt}`,
    `Prénom : ${firstName}`,
    `Nom : ${lastName}`,
    `Profession : ${profession}`,
    `Email : ${email}`,
    `Téléphone : ${phone}`,
    `Consentement téléphone/SMS : ${smsConsent ? "Oui" : "Non"}`,
    `Profil : ${profileLabel}`,
    "",
    "Message :",
    message,
    "",
    "---",
    `Source : ${requestMeta.source || requestMeta.referer || "Non précisée"}`,
    `Titre page : ${requestMeta.pageTitle || "Non précisé"}`,
    `Langue : ${requestMeta.language || "Non précisée"}`,
    `IP : ${requestMeta.ip || "Non précisée"}`,
    `User-Agent : ${requestMeta.userAgent || "Non précisé"}`
  ].join("\n");
}

function createHtmlEmail({ firstName, lastName, profession, email, phone, smsConsent, profileLabel, message, requestMeta }) {
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const safeSource = requestMeta.source || requestMeta.referer || "Non précisée";

  const rows = [
    ["Date d’envoi", escapeHtml(requestMeta.submittedAt)],
    ["Prénom", escapeHtml(firstName)],
    ["Nom", escapeHtml(lastName)],
    ["Profession", escapeHtml(profession)],
    ["Email", `<a href=\"mailto:${escapeHtml(email)}\" style=\"color:#ffffff;text-decoration:none;\">${escapeHtml(email)}</a>`],
    ["Téléphone", `<a href=\"tel:${escapeHtml(phone)}\" style=\"color:#ffffff;text-decoration:none;\">${escapeHtml(phone)}</a>`],
    ["Consentement téléphone/SMS", smsConsent ? "Oui" : "Non"],
    ["Profil", escapeHtml(profileLabel)]
  ]
    .map(([label, value]) => `
      <tr>
        <td style="padding:11px 0;border-bottom:1px solid #25252d;color:#a7a7b1;font-size:13px;vertical-align:top;width:150px;">${escapeHtml(label)}</td>
        <td style="padding:11px 0;border-bottom:1px solid #25252d;color:#ffffff;font-size:15px;font-weight:700;vertical-align:top;">${String(value)}</td>
      </tr>
    `)
    .join("");

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Nouvelle demande de contact USM Football</title>
      </head>
      <body style="margin:0;padding:0;background:#050507;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%;background:#050507;margin:0;padding:0;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%;max-width:700px;border-collapse:separate;background:#101015;border:1px solid #2b2b34;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="background:#d80056;padding:4px 0;line-height:4px;font-size:4px;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:30px 28px 24px;">
                    <p style="margin:0 0 8px;color:#d80056;font-weight:700;text-transform:uppercase;letter-spacing:1.6px;font-size:12px;">USM Football</p>
                    <h1 style="margin:0;color:#ffffff;font-size:27px;line-height:1.22;font-weight:800;">Nouvelle demande de contact</h1>
                    <p style="margin:12px 0 0;color:#b9b9c4;font-size:14px;line-height:1.6;">Une personne a envoyé un message depuis le formulaire officiel du site.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 28px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#15151c;border:1px solid #25252d;border-radius:14px;">
                      <tr>
                        <td style="padding:8px 22px 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">
                            ${rows}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 28px 26px;">
                    <p style="margin:0 0 10px;color:#d80056;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;">Message</p>
                    <div style="background:#07070a;border-left:4px solid #d80056;border-radius:12px;padding:20px;color:#eeeeee;font-size:15px;line-height:1.65;">${safeMessage}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px 28px;background:#0b0b10;border-top:1px solid #25252d;">
                    <p style="margin:0 0 6px;color:#8f8f9a;font-size:12px;line-height:1.5;">Source : ${escapeHtml(safeSource)}</p>
                    <p style="margin:0 0 6px;color:#8f8f9a;font-size:12px;line-height:1.5;">Titre page : ${escapeHtml(requestMeta.pageTitle || "Non précisé")}</p>
                    <p style="margin:0 0 6px;color:#8f8f9a;font-size:12px;line-height:1.5;">Langue : ${escapeHtml(requestMeta.language || "Non précisée")}</p>
                    <p style="margin:0;color:#6f6f78;font-size:11px;line-height:1.5;">IP : ${escapeHtml(requestMeta.ip || "Non précisée")} · User-Agent : ${escapeHtml(requestMeta.userAgent || "Non précisé")}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

async function readBrevoResponse(response) {
  const responseText = await response.text();
  try {
    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    return { raw: responseText.slice(0, 500) };
  }
}

async function sendBrevoContactRequest({ method, url, body, signal }) {
  const response = await fetch(url, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": BREVO_API_KEY.value()
    },
    body: JSON.stringify(body),
    signal
  });

  const responseBody = await readBrevoResponse(response);
  return { response, responseBody };
}

async function syncContactToBrevo({ firstName, lastName, profession, email, phone, profile, privacyConsent, smsConsent, requestMeta }) {
  const listIds = getBrevoContactListIds();

  if (!listIds.length) {
    logger.info("Brevo contact sync skipped because BREVO_CONTACT_LIST_ID is not configured", { email });
    return;
  }

  const profileLabel = PROFILE_LABELS[profile] || "Autre demande";

  const baseAttributes = {
    FIRSTNAME: firstName,
    LASTNAME: lastName
  };

  const enrichmentAttributes = {
    PROFESSION: profession,
    PROFILE_TYPE: profile,
    PROFILE_LABEL: profileLabel,
    PHONE_SMS_OPTIN: Boolean(smsConsent),
    CONTACT_SOURCE: "Site USM Football"
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONTACT_SYNC_TIMEOUT_MS);

  try {
    const { response, responseBody } = await sendBrevoContactRequest({
      method: "POST",
      url: BREVO_CONTACTS_URL,
      body: {
        email,
        attributes: baseAttributes,
        listIds,
        updateEnabled: true
      },
      signal: controller.signal
    });

    if (!response.ok) {
      logger.error("Brevo contact sync failed", {
        status: response.status,
        body: responseBody,
        email,
        profile,
        privacyConsent: Boolean(privacyConsent),
        smsConsent: Boolean(smsConsent),
        submittedAt: requestMeta.submittedAt
      });
      return;
    }

    logger.info("Brevo contact synced", {
      contactId: responseBody?.id || "updated-or-unknown",
      listIds,
      profile,
      profileLabel,
      smsConsent: Boolean(smsConsent),
      submittedAt: requestMeta.submittedAt
    });

    const enrichmentUpdateUrl = BREVO_CONTACTS_URL + "/" + encodeURIComponent(email);
    const { response: enrichmentResponse, responseBody: enrichmentResponseBody } = await sendBrevoContactRequest({
      method: "PUT",
      url: enrichmentUpdateUrl,
      body: {
        attributes: enrichmentAttributes
      },
      signal: controller.signal
    });

    if (!enrichmentResponse.ok) {
      logger.error("Brevo contact enrichment failed", {
        status: enrichmentResponse.status,
        body: enrichmentResponseBody,
        email,
        profile,
        profileLabel,
        submittedAt: requestMeta.submittedAt
      });
    } else {
      logger.info("Brevo contact enrichment synced", {
        email,
        profile,
        profileLabel,
        submittedAt: requestMeta.submittedAt
      });
    }

    if (!smsConsent) {
      logger.info("Brevo SMS attribute sync skipped because consent is not granted", { email, profile });
      return;
    }

    const smsPhone = formatPhoneForBrevo(phone);
    if (!smsPhone) {
      logger.warn("Brevo SMS attribute sync skipped because phone cannot be normalized", { email, phone });
      return;
    }

    const smsUpdateUrl = BREVO_CONTACTS_URL + "/" + encodeURIComponent(email);
    const { response: smsResponse, responseBody: smsResponseBody } = await sendBrevoContactRequest({
      method: "PUT",
      url: smsUpdateUrl,
      body: {
        attributes: {
          SMS: smsPhone
        }
      },
      signal: controller.signal
    });

    if (!smsResponse.ok) {
      logger.error("Brevo SMS attribute sync failed", {
        status: smsResponse.status,
        body: smsResponseBody,
        email,
        profile,
        submittedAt: requestMeta.submittedAt
      });
      return;
    }

    logger.info("Brevo SMS attribute synced", {
      email,
      profile,
      submittedAt: requestMeta.submittedAt
    });
  } catch (error) {
    logger.error("Unexpected Brevo contact sync error", {
      message: error.message,
      email,
      profile,
      submittedAt: requestMeta.submittedAt
    });
  } finally {
    clearTimeout(timeoutId);
  }
}


function safeReadSocialRoot(data) {
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

function readSocialSetting(data, platform, target) {
  const root = safeReadSocialRoot(data);
  const directKey = `${platform}_${target}`;
  const platformData = safeReadSocialRoot(root[platform]);
  const nestedValue = platformData[target];
  const legacyValue = target === "usm" && typeof root[platform] === "string" ? root[platform] : "";
  return normalizeString(nestedValue || root[directKey] || legacyValue || "", 500);
}

function extractYouTubeLookup(value) {
  const raw = normalizeString(value, 500);
  if (!raw) return null;

  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(raw)) {
    return { type: "id", value: raw };
  }

  if (/^@[a-zA-Z0-9._-]+$/.test(raw)) {
    return { type: "forHandle", value: raw };
  }

  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (!host.includes("youtube.com") && host !== "youtu.be") return null;

    const parts = parsed.pathname.split("/").map(part => part.trim()).filter(Boolean);
    if (!parts.length) return null;

    if (parts[0] === "channel" && parts[1]) {
      return { type: "id", value: parts[1] };
    }

    if (parts[0].startsWith("@")) {
      return { type: "forHandle", value: parts[0] };
    }

    if (parts[0] === "user" && parts[1]) {
      return { type: "forUsername", value: parts[1] };
    }
  } catch (error) {
    logger.warn("Unable to parse YouTube URL", { value: raw, message: error.message });
  }

  return null;
}

function createAbortSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

async function fetchYouTubeChannelStats(lookup) {
  const apiKey = normalizeString(YOUTUBE_API_KEY.value(), 300);
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    part: "snippet,statistics",
    key: apiKey,
    maxResults: "1"
  });
  params.set(lookup.type, lookup.value);

  const { controller, timeoutId } = createAbortSignal(SOCIAL_SYNC_TIMEOUT_MS);

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params.toString()}`, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal
    });

    const responseText = await response.text();
    let body = null;
    try {
      body = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      body = { raw: responseText.slice(0, 500) };
    }

    if (!response.ok) {
      const message = body?.error?.message || `YouTube API HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.body = body;
      throw error;
    }

    const item = Array.isArray(body?.items) ? body.items[0] : null;
    if (!item) return null;

    const subscriberCount = Number.parseInt(item?.statistics?.subscriberCount || "", 10);
    if (!Number.isFinite(subscriberCount) || subscriberCount < 0) {
      return {
        channelId: item.id || "",
        title: item?.snippet?.title || "",
        hiddenSubscriberCount: Boolean(item?.statistics?.hiddenSubscriberCount),
        subscriberCount: null
      };
    }

    return {
      channelId: item.id || "",
      title: item?.snippet?.title || "",
      hiddenSubscriberCount: Boolean(item?.statistics?.hiddenSubscriberCount),
      subscriberCount
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function refreshSocialStatsFromApis(source = "manual") {
  const docRef = adminDb.collection(SOCIAL_SETTINGS_COLLECTION).doc(SOCIAL_SETTINGS_DOC);
  const snapshot = await docRef.get();
  const socialData = snapshot.exists ? safeReadSocialRoot(snapshot.data()) : {};
  const updatePayload = {
    apiSync: {
      updatedAt: FieldValue.serverTimestamp(),
      source,
      status: "ok",
      providers: {},
      errors: []
    },
    last_api_sync_at: FieldValue.serverTimestamp(),
    last_api_sync_status: "ok",
    last_api_sync_errors: [],
    stats_source: "api+manual",
    followers: {
      youtube: {}
    },
    api: {
      youtube: {}
    }
  };

  const results = [];
  const errors = [];
  let successfulUpdates = 0;

  for (const target of SOCIAL_SYNC_TARGETS) {
    const url = readSocialSetting(socialData, "youtube", target);
    const lookup = extractYouTubeLookup(url);

    if (!url) {
      results.push({ platform: "youtube", target, status: "skipped", reason: "empty_url" });
      continue;
    }

    if (!lookup) {
      const message = `Lien YouTube ${target} non compatible avec l’API`;
      errors.push({ platform: "youtube", target, message });
      results.push({ platform: "youtube", target, status: "error", message });
      continue;
    }

    try {
      const stats = await fetchYouTubeChannelStats(lookup);
      if (!stats || stats.subscriberCount === null) {
        const message = stats?.hiddenSubscriberCount
          ? `Abonnés YouTube masqués pour ${target}`
          : `Chaîne YouTube introuvable pour ${target}`;
        errors.push({ platform: "youtube", target, message });
        results.push({ platform: "youtube", target, status: "error", message });
        continue;
      }

      const followers = stats.subscriberCount;
      updatePayload[`youtube_${target}_followers`] = followers;
      updatePayload[`youtube_${target}_api_followers`] = followers;
      updatePayload[`youtube_${target}_api_channel_id`] = stats.channelId;
      updatePayload[`youtube_${target}_api_title`] = stats.title;
      updatePayload[`youtube_${target}_api_synced_at`] = FieldValue.serverTimestamp();
      updatePayload.followers.youtube[target] = followers;
      updatePayload.api.youtube[target] = {
        followers,
        channelId: stats.channelId,
        title: stats.title,
        lookupType: lookup.type,
        syncedAt: FieldValue.serverTimestamp(),
        source: "youtube-data-api-v3"
      };

      successfulUpdates += 1;
      results.push({
        platform: "youtube",
        target,
        status: "ok",
        followers,
        channelId: stats.channelId,
        title: stats.title
      });
    } catch (error) {
      const message = error.message || String(error);
      errors.push({ platform: "youtube", target, message, status: error.status || null });
      results.push({ platform: "youtube", target, status: "error", message });
      logger.error("YouTube social stats refresh failed", { target, message, status: error.status || null });
    }
  }

  const youtubeStatus = errors.length && successfulUpdates ? "partial" : errors.length ? "error" : "ok";
  updatePayload.apiSync.status = youtubeStatus;
  updatePayload.apiSync.providers.youtube = {
    status: youtubeStatus,
    updatedAt: FieldValue.serverTimestamp(),
    updatedTargets: successfulUpdates,
    totalTargets: SOCIAL_SYNC_TARGETS.length
  };
  updatePayload.apiSync.errors = errors.slice(0, 10);
  updatePayload.last_api_sync_status = youtubeStatus;
  updatePayload.last_api_sync_errors = errors.slice(0, 10);

  await docRef.set(updatePayload, { merge: true });

  logger.info("Social stats refresh complete", {
    source,
    status: youtubeStatus,
    successfulUpdates,
    errors: errors.length
  });

  return {
    ok: !errors.length || successfulUpdates > 0,
    status: youtubeStatus,
    successfulUpdates,
    results,
    errors: errors.slice(0, 10)
  };
}

async function verifyAdminRequest(req) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    const error = new Error("Token Firebase manquant.");
    error.status = 401;
    throw error;
  }

  try {
    return await adminAuth.verifyIdToken(match[1]);
  } catch (error) {
    const authError = new Error("Token Firebase invalide ou expiré.");
    authError.status = 401;
    throw authError;
  }
}

exports.refreshSocialStats = onSchedule(
  {
    region: "europe-west1",
    schedule: "every 12 hours",
    timeZone: "Europe/Paris",
    secrets: [YOUTUBE_API_KEY],
    timeoutSeconds: 60,
    memory: "256MiB"
  },
  async () => {
    await refreshSocialStatsFromApis("scheduled");
  }
);

exports.refreshSocialStatsNow = onRequest(
  {
    region: "europe-west1",
    secrets: [YOUTUBE_API_KEY],
    timeoutSeconds: 60,
    memory: "256MiB"
  },
  async (req, res) => {
    setCorsHeaders(req, res);
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ ok: false, message: "Méthode non autorisée." });
      return;
    }

    if (!isAllowedOrigin(req)) {
      logger.warn("Blocked social stats refresh from unauthorized origin", { origin: req.get("origin") || "unknown" });
      res.status(403).json({ ok: false, message: "Origine non autorisée." });
      return;
    }

    try {
      const decodedToken = await verifyAdminRequest(req);
      const result = await refreshSocialStatsFromApis("manual-admin");
      res.status(200).json({
        ok: true,
        message: result.status === "ok" ? "Synchronisation YouTube terminée." : "Synchronisation YouTube terminée avec avertissements.",
        requestedBy: decodedToken.email || decodedToken.uid,
        ...result
      });
    } catch (error) {
      const status = error.status || 500;
      logger.error("Manual social stats refresh failed", { message: error.message, status });
      res.status(status).json({ ok: false, message: error.message || "Erreur synchronisation réseaux sociaux." });
    }
  }
);

exports.sendContactEmail = onRequest(
  {
    region: "europe-west1",
    secrets: [BREVO_API_KEY],
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (req, res) => {
    setCorsHeaders(req, res);
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ ok: false, message: "Méthode non autorisée." });
      return;
    }

    if (!isAllowedOrigin(req)) {
      logger.warn("Blocked contact request from unauthorized origin", { origin: req.get("origin") || "unknown" });
      res.status(403).json({ ok: false, message: "Origine non autorisée." });
      return;
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      logger.warn("Contact form rate limit reached", { ip });
      res.status(429).json({ ok: false, message: "Trop de demandes. Merci de réessayer dans quelques minutes." });
      return;
    }

    const payload = req.body && typeof req.body === "object" ? req.body : {};

    const firstName = normalizeString(payload.firstName, 100);
    const lastName = normalizeString(payload.name || payload.lastName, 100);
    const profession = normalizeString(payload.profession, 140);
    const email = normalizeString(payload.email, 160).toLowerCase();
    const phone = normalizeString(payload.phone, 40);
    const profile = normalizeString(payload.profile, 30);
    const message = normalizeMessage(payload.message);
    const privacyConsent = payload.privacyConsent === true || payload.privacyConsent === "true" || payload.privacyConsent === "on";
    const smsConsent = payload.smsConsent === true || payload.smsConsent === "true" || payload.smsConsent === "on";
    const honeypot = normalizeString(payload.company, 120);
    const startedAt = Number(payload.formStartedAt || 0);

    if (honeypot) {
      logger.info("Contact form honeypot triggered", { ip });
      res.status(200).json({ ok: true, message: "Votre message a bien été envoyé." });
      return;
    }

    if (startedAt && Date.now() - startedAt < 1500) {
      logger.info("Contact form submitted too quickly", { ip });
      res.status(200).json({ ok: true, message: "Votre message a bien été envoyé." });
      return;
    }

    if (!firstName || !lastName || !profession || !email || !phone || !profile || !message) {
      res.status(400).json({ ok: false, message: "Merci de remplir tous les champs obligatoires." });
      return;
    }

    if (!privacyConsent) {
      res.status(400).json({ ok: false, message: "Merci de confirmer l’utilisation de vos informations pour traiter votre demande." });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ ok: false, message: "Merci d’indiquer une adresse email valide." });
      return;
    }

    if (!isValidPhone(phone)) {
      res.status(400).json({ ok: false, message: "Merci d’indiquer un numéro de téléphone valide." });
      return;
    }

    if (message.length < 10) {
      res.status(400).json({ ok: false, message: "Merci d’ajouter un message un peu plus détaillé." });
      return;
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const profileLabel = PROFILE_LABELS[profile] || "Autre demande";
    const requestMeta = {
      submittedAt: formatParisDate(),
      source: normalizeString(payload.source, 300),
      pageTitle: normalizeString(payload.pageTitle, 160),
      referer: normalizeString(req.get("referer"), 250),
      language: normalizeString(req.get("accept-language"), 120),
      userAgent: normalizeString(req.get("user-agent"), 250),
      ip
    };

    const emailData = {
      firstName,
      lastName,
      profession,
      email,
      phone,
      smsConsent,
      profileLabel,
      message,
      requestMeta
    };

    const emailPayload = {
      sender: {
        email: CONTACT_SENDER_EMAIL,
        name: CONTACT_SENDER_NAME
      },
      to: [
        {
          email: CONTACT_RECIPIENT_EMAIL,
          name: CONTACT_RECIPIENT_NAME
        }
      ],
      replyTo: {
        email,
        name: fullName
      },
      subject: `Demande de contact USM Football - ${fullName}`,
      htmlContent: createHtmlEmail(emailData),
      textContent: createTextEmail(emailData),
      tags: ["site-contact", "usm-football"]
    };

    try {
      const brevoResponse = await fetch(BREVO_SEND_EMAIL_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": BREVO_API_KEY.value()
        },
        body: JSON.stringify(emailPayload)
      });

      const responseBody = await readBrevoResponse(brevoResponse);

      if (!brevoResponse.ok) {
        logger.error("Brevo contact email failed", {
          status: brevoResponse.status,
          body: responseBody
        });
        res.status(502).json({ ok: false, message: "L’envoi est momentanément indisponible. Merci de réessayer dans quelques minutes." });
        return;
      }

      logger.info("Brevo contact email sent", {
        messageId: responseBody?.messageId || responseBody?.messageIds?.[0] || "unknown",
        profile
      });

      await syncContactToBrevo({
        firstName,
        lastName,
        profession,
        email,
        phone,
        profile,
        privacyConsent,
        smsConsent,
        requestMeta
      });

      res.status(200).json({ ok: true, message: "Votre message a bien été envoyé. L’équipe USM Football vous répondra rapidement." });
    } catch (error) {
      logger.error("Unexpected contact email error", { message: error.message });
      res.status(500).json({ ok: false, message: "Erreur technique temporaire. Merci de réessayer dans quelques minutes." });
    }
  }
);
