const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const BREVO_API_KEY = defineSecret("BREVO_API_KEY");

const CONTACT_RECIPIENT_EMAIL = "contact@usmfootball.com";
const CONTACT_RECIPIENT_NAME = "USM Football";
const CONTACT_SENDER_EMAIL = "contact@usmfootball.com";
const CONTACT_SENDER_NAME = "USM Football";
const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

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

function setCorsHeaders(req, res) {
  const origin = req.get("origin") || "";
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  if (ALLOWED_ORIGINS.has(origin) || isLocalhost) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }

  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
}

function isAllowedOrigin(req) {
  const origin = req.get("origin") || "";
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
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

function createTextEmail({ name, email, phone, profileLabel, message, requestMeta }) {
  return [
    "Nouvelle demande de contact depuis le site USM Football.",
    "",
    `Nom : ${name}`,
    `Email : ${email}`,
    `Téléphone : ${phone}`,
    `Profil : ${profileLabel}`,
    "",
    "Message :",
    message,
    "",
    "---",
    `Page : ${requestMeta.referer || "Non précisée"}`,
    `Langue : ${requestMeta.language || "Non précisée"}`,
    `IP : ${requestMeta.ip || "Non précisée"}`,
    `User-Agent : ${requestMeta.userAgent || "Non précisé"}`
  ].join("\n");
}

function createHtmlEmail({ name, email, phone, profileLabel, message, requestMeta }) {
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  return `
    <html>
      <body style="margin:0;padding:0;background:#050507;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:680px;margin:0 auto;padding:32px;background:#111116;border:1px solid rgba(216,0,86,0.35);border-radius:18px;">
          <p style="margin:0 0 8px;color:#d80056;font-weight:700;text-transform:uppercase;letter-spacing:1px;">USM Football</p>
          <h1 style="margin:0 0 24px;font-size:26px;line-height:1.2;color:#ffffff;">Nouvelle demande de contact</h1>

          <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:#aaaaaa;width:130px;">Nom</td><td style="padding:8px 0;color:#ffffff;font-weight:700;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#aaaaaa;">Email</td><td style="padding:8px 0;color:#ffffff;"><a href="mailto:${escapeHtml(email)}" style="color:#ffffff;">${escapeHtml(email)}</a></td></tr>
            <tr><td style="padding:8px 0;color:#aaaaaa;">Téléphone</td><td style="padding:8px 0;color:#ffffff;"><a href="tel:${escapeHtml(phone)}" style="color:#ffffff;">${escapeHtml(phone)}</a></td></tr>
            <tr><td style="padding:8px 0;color:#aaaaaa;">Profil</td><td style="padding:8px 0;color:#ffffff;">${escapeHtml(profileLabel)}</td></tr>
          </table>

          <div style="padding:20px;background:#050507;border-left:4px solid #d80056;border-radius:12px;color:#eeeeee;line-height:1.6;">
            ${safeMessage}
          </div>

          <div style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.12);font-size:12px;line-height:1.5;color:#888888;">
            <p style="margin:0;">Page : ${escapeHtml(requestMeta.referer || "Non précisée")}</p>
            <p style="margin:0;">Langue : ${escapeHtml(requestMeta.language || "Non précisée")}</p>
            <p style="margin:0;">IP : ${escapeHtml(requestMeta.ip || "Non précisée")}</p>
            <p style="margin:0;">User-Agent : ${escapeHtml(requestMeta.userAgent || "Non précisé")}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

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

    const name = normalizeString(payload.name, 100);
    const email = normalizeString(payload.email, 160).toLowerCase();
    const phone = normalizeString(payload.phone, 40);
    const profile = normalizeString(payload.profile, 30);
    const message = normalizeMessage(payload.message);
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

    if (!name || !email || !phone || !profile || !message) {
      res.status(400).json({ ok: false, message: "Merci de remplir tous les champs obligatoires." });
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

    const profileLabel = PROFILE_LABELS[profile] || "Autre demande";
    const requestMeta = {
      referer: normalizeString(req.get("referer"), 250),
      language: normalizeString(req.get("accept-language"), 120),
      userAgent: normalizeString(req.get("user-agent"), 250),
      ip
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
        name
      },
      subject: `Demande de contact USM Football - ${name}`,
      htmlContent: createHtmlEmail({ name, email, phone, profileLabel, message, requestMeta }),
      textContent: createTextEmail({ name, email, phone, profileLabel, message, requestMeta }),
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

      const responseText = await brevoResponse.text();
      let responseBody = null;
      try {
        responseBody = responseText ? JSON.parse(responseText) : null;
      } catch (error) {
        responseBody = { raw: responseText.slice(0, 500) };
      }

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

      res.status(200).json({ ok: true, message: "Votre message a bien été envoyé. L’équipe USM Football vous répondra rapidement." });
    } catch (error) {
      logger.error("Unexpected contact email error", { message: error.message });
      res.status(500).json({ ok: false, message: "Erreur technique temporaire. Merci de réessayer dans quelques minutes." });
    }
  }
);
