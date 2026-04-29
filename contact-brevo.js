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
