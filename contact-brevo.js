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
   USM FOOTBALL - PUBLIC MARQUEE FULL RENDER FIX V3
   --------------------------------------------------------------------------
   Correctif côté public pour la banderole décorative.
   Il retire la limite sans casser les règles Firestore : on tente d'abord les
   requêtes filtrées probables, mais sans limit(...), puis seulement ensuite la
   lecture brute si les règles l'autorisent.
   ========================================================================== */
const USM_MARQUEE_FIX_VERSION = "public-marquee-full-3";
const USM_MARQUEE_COLLECTIONS = [
  "marquee",
  "marquees",
  "marqueeImages",
  "marquee_images",
  "images_deco",
  "imagesDeco",
  "decorative_images",
  "decorativeImages",
  "decoImages",
  "deco_images"
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
  "photoUrl",
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
  if (raw.active === false || raw.visible === false || raw.enabled === false || raw.isActive === false || raw.public === false || raw.published === false) return null;

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

function ensureMarqueeFixStyles() {
  if (document.getElementById("usm-marquee-fix-styles")) return;

  const style = document.createElement("style");
  style.id = "usm-marquee-fix-styles";
  style.textContent = `
    #marquee-section { overflow: hidden; }
    #marquee-track[data-marquee-fix="${USM_MARQUEE_FIX_VERSION}"] {
      display: flex !important;
      align-items: center;
      gap: clamp(14px, 2vw, 26px);
      width: max-content;
      min-width: 100%;
      animation: usmMarqueeFullLoop 55s linear infinite;
      will-change: transform;
    }
    #marquee-track[data-marquee-fix="${USM_MARQUEE_FIX_VERSION}"] .usm-marquee-item {
      flex: 0 0 auto;
      width: clamp(180px, 22vw, 330px);
      aspect-ratio: 16 / 10;
      border-radius: 22px;
      overflow: hidden;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 18px 42px rgba(0,0,0,0.35);
    }
    #marquee-track[data-marquee-fix="${USM_MARQUEE_FIX_VERSION}"] .usm-marquee-item img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      transform-origin: center;
    }
    @keyframes usmMarqueeFullLoop {
      from { transform: translate3d(0, 0, 0); }
      to { transform: translate3d(-50%, 0, 0); }
    }
  `;
  document.head.appendChild(style);
}

function renderAllPublicMarqueeImages(items) {
  const track = document.getElementById("marquee-track");
  if (!track || !Array.isArray(items) || !items.length) return false;

  ensureMarqueeFixStyles();

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

function getFirebaseConfigForMarquee() {
  return {
    apiKey: "AIzaSyDd7OvBbX35PaQPlm6saccOGTQyvI3UEoU",
    authDomain: "usm-football-b56ba.firebaseapp.com",
    projectId: "usm-football-b56ba",
    storageBucket: "usm-football-b56ba.firebasestorage.app",
    messagingSenderId: "1004955626049",
    appId: "1:1004955626049:web:1982ac82e68599946f74c0"
  };
}

function isStableFirebaseMarqueeHost() {
  const host = window.location.hostname;
  return [
    "usm-football-b56ba.web.app",
    "usm-football-b56ba.firebaseapp.com",
    "usmfootball.com",
    "www.usmfootball.com",
    "localhost",
    "127.0.0.1"
  ].includes(host);
}

async function getOrCreateMarqueeFirebaseApp(appModule, appCheckModule) {
  let app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(getFirebaseConfigForMarquee());

  if (isStableFirebaseMarqueeHost() && appCheckModule) {
    try {
      appCheckModule.initializeAppCheck(app, {
        provider: new appCheckModule.ReCaptchaV3Provider("6LdF2rUsAAAAAOUCVKJt2DCDKWQIEQXHyBkYETT1"),
        isTokenAutoRefreshEnabled: true
      });
    } catch (error) {
      // App Check est probablement déjà initialisé par main.js.
    }
  }

  return app;
}

function uniqueMarqueeItems(items) {
  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const key = item.id || item.image_url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

async function readMarqueeCollection(firestoreModule, db, collectionName) {
  const col = firestoreModule.collection(db, collectionName);
  const queryAttempts = [
    firestoreModule.query(col, firestoreModule.where("active", "==", true)),
    firestoreModule.query(col, firestoreModule.where("visible", "==", true)),
    firestoreModule.query(col, firestoreModule.where("enabled", "==", true)),
    firestoreModule.query(col, firestoreModule.where("published", "==", true)),
    col
  ];

  let bestItems = [];

  for (const queryAttempt of queryAttempts) {
    try {
      const snap = await firestoreModule.getDocs(queryAttempt);
      const items = snap.docs
        .map((docSnap, index) => normalizeMarqueeItem({ id: docSnap.id, ...docSnap.data() }, index))
        .filter(Boolean);

      if (items.length > bestItems.length) bestItems = items;
    } catch (error) {
      // Les règles Firestore peuvent refuser les requêtes non filtrées. On essaye la suivante.
    }
  }

  return uniqueMarqueeItems(bestItems).sort((a, b) => a.order - b.order);
}

async function fetchCompletePublicMarquee() {
  const [appModule, firestoreModule, appCheckModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js").catch(() => null)
  ]);

  const app = await getOrCreateMarqueeFirebaseApp(appModule, appCheckModule);
  const db = firestoreModule.getFirestore(app);

  for (const collectionName of USM_MARQUEE_COLLECTIONS) {
    const items = await readMarqueeCollection(firestoreModule, db, collectionName);
    if (items.length) {
      console.info(`[USM] Banderole décorative : ${items.length} image(s) chargée(s) depuis ${collectionName}, sans limite.`);
      return items;
    }
  }

  console.warn("[USM] Banderole décorative : aucune image publique trouvée.");
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
      count: items.length,
      data: items
    }));

    renderAllPublicMarqueeImages(items);
  } catch (error) {
    console.warn("[USM] Correctif banderole décorative non appliqué:", error);
  }
}

function scheduleFullPublicMarquee() {
  window.setTimeout(initFullPublicMarquee, 900);
  window.setTimeout(initFullPublicMarquee, 2600);
  window.setTimeout(initFullPublicMarquee, 5200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleFullPublicMarquee);
} else {
  scheduleFullPublicMarquee();
}
document.addEventListener("usm:page-ready", scheduleFullPublicMarquee);

