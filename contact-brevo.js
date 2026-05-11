const CONTACT_ENDPOINT = "/api/sendContactEmail";

const CONTACT_MESSAGES = {
  fr: {
    required: "Merci de remplir tous les champs obligatoires avant l’envoi.",
    privacyRequired: "Merci de confirmer l’utilisation de vos informations pour traiter votre demande.",
    invalidEmail: "Merci d’indiquer une adresse email valide.",
    invalidPhone: "Merci d’indiquer un numéro de téléphone valide.",
    shortMessage: "Merci d’ajouter un message un peu plus détaillé.",
    sending: "Envoi en cours...",
    submit: "Envoyer le message",
    success: "Votre message a bien été envoyé. L’équipe USM Football vous répondra rapidement.",
    error: "L’envoi est momentanément indisponible. Merci de réessayer ou d’écrire directement à contact@usmfootball.com."
  },
  en: {
    required: "Please complete all required fields before sending.",
    privacyRequired: "Please confirm that your information may be used to process your request.",
    invalidEmail: "Please enter a valid email address.",
    invalidPhone: "Please enter a valid phone number.",
    shortMessage: "Please add a slightly more detailed message.",
    sending: "Sending...",
    submit: "Send message",
    success: "Your message has been sent. The USM Football team will get back to you shortly.",
    error: "Sending is temporarily unavailable. Please try again or write directly to contact@usmfootball.com."
  },
  es: {
    required: "Por favor, completa todos los campos obligatorios antes de enviar.",
    privacyRequired: "Confirma que tu información puede utilizarse para tratar tu solicitud.",
    invalidEmail: "Por favor, introduce una dirección de email válida.",
    invalidPhone: "Por favor, introduce un número de teléfono válido.",
    shortMessage: "Por favor, añade un mensaje un poco más detallado.",
    sending: "Enviando...",
    submit: "Enviar mensaje",
    success: "Tu mensaje se ha enviado correctamente. El equipo de USM Football te responderá pronto.",
    error: "El envío no está disponible temporalmente. Inténtalo de nuevo o escribe directamente a contact@usmfootball.com."
  },
  pt: {
    required: "Preencha todos os campos obrigatórios antes de enviar.",
    privacyRequired: "Confirme que as suas informações podem ser usadas para tratar o seu pedido.",
    invalidEmail: "Indique um endereço de email válido.",
    invalidPhone: "Indique um número de telefone válido.",
    shortMessage: "Adicione uma mensagem um pouco mais detalhada.",
    sending: "A enviar...",
    submit: "Enviar mensagem",
    success: "A sua mensagem foi enviada. A equipa USM Football responderá em breve.",
    error: "O envio está temporariamente indisponível. Tente novamente ou escreva diretamente para contact@usmfootball.com."
  }
};

function getCurrentLang() {
  const storedLang = localStorage.getItem("usm_lang");
  const htmlLang = document.documentElement.lang;
  const lang = storedLang || htmlLang || "fr";
  return CONTACT_MESSAGES[lang] ? lang : "fr";
}

function getMessages() {
  return CONTACT_MESSAGES[getCurrentLang()] || CONTACT_MESSAGES.fr;
}

function getValue(form, selector) {
  const field = form.querySelector(selector);
  return field && field.value ? field.value.trim() : "";
}

function getChecked(form, selector) {
  const field = form.querySelector(selector);
  return Boolean(field && field.checked);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  const compact = phone.replace(/[\s().-]/g, "");
  return /^\+?\d{6,18}$/.test(compact);
}

function createOrUpdateNotice(form, message, type) {
  let notice = form.querySelector(".contact-mail-notice");
  if (!notice) {
    notice = document.createElement("p");
    notice.className = "contact-mail-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    form.appendChild(notice);
  }

  notice.textContent = message;
  notice.classList.remove("is-error", "is-success", "is-info");
  notice.classList.add(`is-${type || "info"}`);
}

function ensureAntiSpamFields(form) {
  if (!form.querySelector('input[name="company"]')) {
    const honeypot = document.createElement("input");
    honeypot.type = "text";
    honeypot.name = "company";
    honeypot.autocomplete = "off";
    honeypot.tabIndex = -1;
    honeypot.setAttribute("aria-hidden", "true");
    honeypot.style.position = "absolute";
    honeypot.style.left = "-9999px";
    honeypot.style.opacity = "0";
    honeypot.style.pointerEvents = "none";
    form.appendChild(honeypot);
  }

  let startedAt = form.querySelector('input[name="formStartedAt"]');
  if (!startedAt) {
    startedAt = document.createElement("input");
    startedAt.type = "hidden";
    startedAt.name = "formStartedAt";
    form.appendChild(startedAt);
  }
  startedAt.value = String(Date.now());
}

function setSubmitState(button, isSending) {
  if (!button) return;
  const messages = getMessages();
  button.disabled = isSending;
  button.style.opacity = isSending ? "0.72" : "";
  button.style.cursor = isSending ? "wait" : "";
  button.textContent = isSending ? messages.sending : messages.submit;
}

function getPayload(form) {
  return {
    firstName: getValue(form, 'input[name="firstName"]'),
    name: getValue(form, 'input[name="name"], input[name="lastName"]'),
    profession: getValue(form, 'input[name="profession"]'),
    email: getValue(form, 'input[name="email"], input[type="email"]'),
    phone: getValue(form, 'input[name="phone"], input[type="tel"]'),
    profile: getValue(form, 'select[name="profile"], select'),
    message: getValue(form, 'textarea[name="message"], textarea'),
    privacyConsent: getChecked(form, 'input[name="privacyConsent"]'),
    smsConsent: getChecked(form, 'input[name="smsConsent"]'),
    source: window.location.href,
    pageTitle: document.title,
    company: getValue(form, 'input[name="company"]'),
    formStartedAt: Number(getValue(form, 'input[name="formStartedAt"]') || 0)
  };
}

function validatePayload(payload) {
  const messages = getMessages();

  if (!payload.firstName || !payload.name || !payload.profession || !payload.email || !payload.phone || !payload.profile || !payload.message) {
    return messages.required;
  }
  if (!payload.privacyConsent) return messages.privacyRequired;
  if (!isValidEmail(payload.email)) return messages.invalidEmail;
  if (!isValidPhone(payload.phone)) return messages.invalidPhone;
  if (payload.message.length < 10) return messages.shortMessage;
  return "";
}

async function submitContactForm(form, button) {
  const messages = getMessages();
  const payload = getPayload(form);
  const validationError = validatePayload(payload);

  if (validationError) {
    createOrUpdateNotice(form, validationError, "error");
    return;
  }

  setSubmitState(button, true);
  createOrUpdateNotice(form, messages.sending, "info");

  try {
    const endpoint = form.dataset.endpoint || CONTACT_ENDPOINT;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.ok === false) {
      throw new Error(result.message || messages.error);
    }

    createOrUpdateNotice(form, result.message || messages.success, "success");
    form.reset();
    ensureAntiSpamFields(form);
  } catch (error) {
    createOrUpdateNotice(form, messages.error, "error");
  } finally {
    setSubmitState(button, false);
  }
}

function initContactBrevoWorkflow() {
  const form = document.querySelector(".public-form");
  if (!form || form.dataset.brevoReady === "true") return;

  form.dataset.brevoReady = "true";
  form.setAttribute("method", "post");
  form.setAttribute("action", form.dataset.endpoint || CONTACT_ENDPOINT);
  ensureAntiSpamFields(form);

  const button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
    submitContactForm(form, button);
  });

  window.addEventListener("pageshow", () => ensureAntiSpamFields(form));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContactBrevoWorkflow);
} else {
  initContactBrevoWorkflow();
}
document.addEventListener("usm:page-ready", initContactBrevoWorkflow);

/* ==========================================================================
   USM FOOTBALL - PUBLIC MARQUEE FULL RENDER FIX
   --------------------------------------------------------------------------
   Correctif côté public pour la banderole décorative :
   - vide l'ancien cache site_marquee ;
   - relit les images depuis Firestore sans limit(...);
   - affiche toutes les images valides dans #marquee-track ;
   - relance le rendu après main.js et après les transitions PJAX.
   ========================================================================== */
const USM_MARQUEE_FIX_VERSION = "public-marquee-full-2";
const USM_MARQUEE_COLLECTIONS = [
  "marquee",
  "marquees",
  "images_deco",
  "imagesDeco",
  "decorative_images",
  "decorativeImages",
  "decoImages"
];
const USM_MARQUEE_IMAGE_FIELDS = [
  "image_url",
  "imageUrl",
  "image",
  "url",
  "src",
  "downloadURL",
  "downloadUrl",
  "photo",
  "media_url",
  "mediaUrl"
];

function getMarqueeImageUrl(item) {
  for (const field of USM_MARQUEE_IMAGE_FIELDS) {
    if (typeof item[field] === "string" && item[field].trim()) return item[field].trim();
  }
  return "";
}

function getMarqueeSortValue(item, fallbackIndex) {
  const value = item.order ?? item.position ?? item.rank ?? item.sort ?? item.index ?? item.createdAt ?? item.updatedAt;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  if (value && typeof value.toMillis === "function") return value.toMillis();
  return fallbackIndex;
}

function normalizeMarqueeItem(raw, index) {
  const url = getMarqueeImageUrl(raw);
  if (!url) return null;
  if (raw.active === false || raw.visible === false || raw.enabled === false || raw.isActive === false || raw.public === false) return null;

  const crop = raw.crop || raw.marqueeCrop || raw.crop_settings || raw.cropSettings || {};

  return {
    ...raw,
    image_url: url,
    order: getMarqueeSortValue(raw, index),
    crop: {
      x: Number.isFinite(Number(crop.x)) ? Number(crop.x) : 0,
      y: Number.isFinite(Number(crop.y)) ? Number(crop.y) : 0,
      zoom: Number.isFinite(Number(crop.zoom)) ? Math.max(0.4, Number(crop.zoom)) : 1
    }
  };
}

function escapeMarqueeAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderAllPublicMarqueeImages(items) {
  const track = document.getElementById("marquee-track");
  if (!track || !Array.isArray(items) || !items.length) return false;

  const loopItems = items.length > 1 ? [...items, ...items] : items;
  track.dataset.marqueeFix = USM_MARQUEE_FIX_VERSION;
  track.innerHTML = loopItems.map((item, index) => {
    const url = escapeMarqueeAttr(item.image_url);
    const alt = escapeMarqueeAttr(item.alt || item.title || "USM Football");
    const crop = item.crop || {};
    const x = Number.isFinite(Number(crop.x)) ? Number(crop.x) : 0;
    const y = Number.isFinite(Number(crop.y)) ? Number(crop.y) : 0;
    const zoom = Number.isFinite(Number(crop.zoom)) ? Math.max(0.4, Number(crop.zoom)) : 1;

    return `
      <div class="marquee-item usm-marquee-item" data-marquee-index="${index}">
        <img
          src="${url}"
          alt="${alt}"
          loading="lazy"
          decoding="async"
          style="object-position:calc(50% + ${x}%) calc(50% + ${y}%); transform:scale(${zoom});"
        >
      </div>`;
  }).join("");

  return true;
}

async function getExistingFirebaseApp(appModule) {
  for (let i = 0; i < 40; i += 1) {
    if (appModule.getApps().length) return appModule.getApp();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return null;
}

async function fetchCompletePublicMarquee() {
  const [appModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js")
  ]);

  const app = await getExistingFirebaseApp(appModule);
  if (!app) return [];

  const db = firestoreModule.getFirestore(app);

  for (const collectionName of USM_MARQUEE_COLLECTIONS) {
    try {
      const snap = await firestoreModule.getDocs(firestoreModule.collection(db, collectionName));
      const items = snap.docs
        .map((docSnap, index) => normalizeMarqueeItem({ id: docSnap.id, ...docSnap.data() }, index))
        .filter(Boolean)
        .sort((a, b) => a.order - b.order);

      if (items.length) return items;
    } catch (error) {
      console.warn(`Banderole décorative indisponible depuis ${collectionName}:`, error);
    }
  }

  return [];
}

async function initFullPublicMarquee() {
  if (!document.getElementById("marquee-track")) return;

  try {
    localStorage.removeItem("site_marquee");
    const items = await fetchCompletePublicMarquee();
    if (!items.length) return;

    localStorage.setItem("site_marquee_public_full", JSON.stringify({
      timestamp: Date.now(),
      version: USM_MARQUEE_FIX_VERSION,
      data: items
    }));

    renderAllPublicMarqueeImages(items);
  } catch (error) {
    console.warn("Correctif banderole décorative non appliqué:", error);
  }
}

function scheduleFullPublicMarquee() {
  window.setTimeout(initFullPublicMarquee, 700);
  window.setTimeout(initFullPublicMarquee, 2200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleFullPublicMarquee);
} else {
  scheduleFullPublicMarquee();
}
document.addEventListener("usm:page-ready", scheduleFullPublicMarquee);
