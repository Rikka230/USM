import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDd7OvBbX35PaQPlm6saccOGTQyvI3UEoU",
  authDomain: "usm-football-b56ba.firebaseapp.com",
  projectId: "usm-football-b56ba",
  storageBucket: "usm-football-b56ba.firebasestorage.app",
  messagingSenderId: "1004955626049",
  appId: "1:1004955626049:web:1982ac82e68599946f74c0",
  measurementId: "G-5FCYP7CMQD"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch (_) {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (_) {}
}

function normalizeUrl(url) {
  if (!url) return "";
  try { return new URL(url, window.location.href).href; }
  catch (_) { return url; }
}

const imageCache = new Map();
function preloadImage(url) {
  const src = normalizeUrl(url);
  if (!src) return Promise.resolve(false);
  if (imageCache.has(src)) return imageCache.get(src);

  const promise = new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    img.decoding = "async";
    img.onload = async () => {
      try { if (img.decode) await img.decode(); } catch (_) {}
      finish(true);
    };
    img.onerror = () => finish(false);
    setTimeout(() => finish(false), 6500);
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

async function getAgencyData() {
  const cached = readCache("site_agency");
  if (cached) {
    if (cached.image) preloadImage(cached.image);
    return cached;
  }

  try {
    const snap = await getDoc(doc(db, "settings", "agency"));
    const data = snap.exists() ? snap.data() : { empty: true };
    writeCache("site_agency", data);
    if (data.image) await preloadImage(data.image);
    return data;
  } catch (err) {
    console.error("VIP agency preload failed", err);
    return null;
  }
}

function getLang() {
  return localStorage.getItem("usm_lang") || document.documentElement.lang || "fr";
}

function getFounderData() {
  const settings = readCache("site_settings") || {};
  const lang = getLang();
  const title = document.getElementById("vip-title-display");
  const quote = document.getElementById("vip-quote-display");
  const desc = document.getElementById("vip-desc-display");
  const img = document.getElementById("vip-img-display");

  return {
    titleHTML: "Christophe<br><span>Mongai</span>",
    quote: settings[`founderQuote_${lang}`] || settings.founderQuote || quote?.textContent || "",
    desc: settings[`founderDesc_${lang}`] || settings.founderDesc || desc?.textContent || "",
    image: settings.founderImg || img?.dataset.currentSrc || img?.currentSrc || img?.src || ""
  };
}

function injectStyle() {
  if (document.getElementById("vip-runtime-fix-style")) return;
  const style = document.createElement("style");
  style.id = "vip-runtime-fix-style";
  style.textContent = `
    .founder-vip-section { min-height: clamp(640px, 45vw, 760px); align-items: stretch; contain: paint; }
    .vip-photo-wrapper { min-height: inherit; overflow: hidden; background: #050507; isolation: isolate; }
    .vip-photo-wrapper img { display: block; backface-visibility: hidden; transform: translateZ(0); }
    #vip-img-display { opacity: 1 !important; transition: none !important; position: relative; z-index: 0; }
    .vip-runtime-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; filter: contrast(1.1) brightness(0.9); opacity: 0; z-index: 1; pointer-events: none; transition: opacity .52s cubic-bezier(.25,1,.5,1); will-change: opacity; }
    .vip-runtime-layer.is-active { opacity: 1; }
    .vip-photo-wrapper::after { z-index: 2; pointer-events: none; }
    .vip-content { min-height: 580px; justify-content: center; }
    #vip-title-display, #vip-quote-display, #vip-desc-display, #vip-licenses-display { transition: opacity .24s ease, transform .24s ease; }
    .vip-runtime-hidden { opacity: 0 !important; transform: translateY(8px); }
    #vip-title-display { min-height: 96px; }
    #vip-quote-display { min-height: 76px; }
    #vip-desc-display { min-height: 155px; }
    #vip-licenses-display { display: flex !important; min-height: 54px; opacity: 1; visibility: visible; transition: opacity .24s ease, visibility .24s ease; }
    #vip-licenses-display.vip-licenses-hidden, #vip-licenses-display[aria-hidden="true"] { opacity: 0; visibility: hidden; pointer-events: none; }
    @media (max-width: 768px) { .founder-vip-section { min-height: auto; contain: paint; } .vip-photo-wrapper { min-height: 420px; } .vip-content { min-height: 520px; padding: 42px 28px; } #vip-title-display { min-height: 96px; } #vip-quote-display { min-height: 84px; } #vip-desc-display { min-height: 170px; } }
  `;
  document.head.appendChild(style);
}

function waitFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function lockLayout() {
  const section = document.querySelector(".founder-vip-section");
  const content = document.querySelector(".vip-content");
  const photo = document.querySelector(".vip-photo-wrapper");
  const title = document.getElementById("vip-title-display");
  const quote = document.getElementById("vip-quote-display");
  const desc = document.getElementById("vip-desc-display");
  const licenses = document.getElementById("vip-licenses-display");
  if (!section || !content) return;

  const mobile = matchMedia("(max-width: 768px)").matches;
  const sectionHeight = Math.max(mobile ? 0 : 640, Math.ceil(section.getBoundingClientRect().height));
  const contentHeight = Math.max(mobile ? 520 : 580, Math.ceil(content.getBoundingClientRect().height));

  if (!mobile) {
    section.style.minHeight = `${sectionHeight}px`;
    if (photo) photo.style.minHeight = `${sectionHeight}px`;
  }

  content.style.minHeight = `${contentHeight}px`;
  if (title) title.style.minHeight = `${Math.max(96, Math.ceil(title.getBoundingClientRect().height))}px`;
  if (quote) quote.style.minHeight = `${Math.max(mobile ? 84 : 76, Math.ceil(quote.getBoundingClientRect().height))}px`;
  if (desc) desc.style.minHeight = `${Math.max(mobile ? 170 : 155, Math.ceil(desc.getBoundingClientRect().height))}px`;
  if (licenses) licenses.style.minHeight = `${Math.max(54, Math.ceil(licenses.getBoundingClientRect().height))}px`;
}

function setTextHidden(hidden) {
  ["vip-title-display", "vip-quote-display", "vip-desc-display", "vip-licenses-display"].forEach((id) => {
    document.getElementById(id)?.classList.toggle("vip-runtime-hidden", hidden);
  });
}

function setLicensesVisible(visible) {
  const el = document.getElementById("vip-licenses-display");
  if (!el) return;
  el.style.display = "flex";
  el.classList.toggle("vip-licenses-hidden", !visible);
  el.setAttribute("aria-hidden", String(!visible));
}

function setTabState(mode, founderBtn, agencyBtn) {
  const isFounder = mode === "founder";
  founderBtn.classList.toggle("active", isFounder);
  agencyBtn.classList.toggle("active", !isFounder);
  founderBtn.style.background = isFounder ? "var(--usm-pink)" : "rgba(255,255,255,0.1)";
  founderBtn.style.color = isFounder ? "#fff" : "#aaa";
  agencyBtn.style.background = !isFounder ? "var(--usm-pink)" : "rgba(255,255,255,0.1)";
  agencyBtn.style.color = !isFounder ? "#fff" : "#aaa";
}

async function setImageSmooth(nextUrl) {
  const baseImg = document.getElementById("vip-img-display");
  const wrapper = baseImg?.closest(".vip-photo-wrapper");
  if (!baseImg || !wrapper || !nextUrl) return;

  const next = normalizeUrl(nextUrl);
  const current = normalizeUrl(baseImg.dataset.runtimeSrc || baseImg.currentSrc || baseImg.src);
  if (next === current) return;

  await preloadImage(next);
  wrapper.querySelectorAll(".vip-runtime-layer").forEach((el) => el.remove());

  const layer = new Image();
  layer.className = "vip-runtime-layer";
  layer.alt = baseImg.alt || "";
  layer.decoding = "async";
  layer.src = next;
  wrapper.appendChild(layer);

  await waitFrame();
  layer.classList.add("is-active");

  clearTimeout(baseImg._runtimeSwap);
  baseImg._runtimeSwap = setTimeout(() => {
    baseImg.src = next;
    baseImg.dataset.runtimeSrc = next;
    layer.remove();
  }, 540);
}

async function initVipRuntimeFix() {
  const section = document.querySelector(".founder-vip-section");
  const oldFounder = document.getElementById("tab-founder");
  const oldAgency = document.getElementById("tab-agency");
  if (!section || !oldFounder || !oldAgency || section.dataset.vipRuntimeFixed === "true") return;
  section.dataset.vipRuntimeFixed = "true";

  injectStyle();

  const founderBtn = oldFounder.cloneNode(true);
  const agencyBtn = oldAgency.cloneNode(true);
  oldFounder.replaceWith(founderBtn);
  oldAgency.replaceWith(agencyBtn);

  let switchToken = 0;

  async function showFounder() {
    const token = ++switchToken;
    setTabState("founder", founderBtn, agencyBtn);
    setTextHidden(true);
    await waitFrame();
    if (token !== switchToken) return;

    const founder = getFounderData();
    document.getElementById("vip-title-display").innerHTML = founder.titleHTML;
    document.getElementById("vip-quote-display").textContent = founder.quote || "";
    document.getElementById("vip-desc-display").textContent = founder.desc || "";
    setLicensesVisible(true);
    if (founder.image) await setImageSmooth(founder.image);
    if (token !== switchToken) return;
    lockLayout();
    setTextHidden(false);
  }

  async function showAgency() {
    const token = ++switchToken;
    setTabState("agency", founderBtn, agencyBtn);
    setTextHidden(true);
    await waitFrame();
    if (token !== switchToken) return;

    const title = document.getElementById("vip-title-display");
    const quote = document.getElementById("vip-quote-display");
    const desc = document.getElementById("vip-desc-display");
    title.innerHTML = "L'Agence<br><span>USM Football</span>";
    quote.textContent = "";
    desc.textContent = "";
    setLicensesVisible(false);
    lockLayout();

    const agency = await getAgencyData();
    if (token !== switchToken) return;
    const lang = getLang();
    if (agency && !agency.empty) {
      quote.textContent = agency[`quote_${lang}`] || "";
      desc.textContent = agency[`desc_${lang}`] || "";
      if (agency.image) await setImageSmooth(agency.image);
    } else {
      desc.textContent = "Informations de l'agence à venir.";
    }
    if (token !== switchToken) return;
    lockLayout();
    setTextHidden(false);
  }

  founderBtn.addEventListener("click", () => {
    if (!founderBtn.classList.contains("active")) showFounder();
  });
  agencyBtn.addEventListener("click", () => {
    if (!agencyBtn.classList.contains("active")) showAgency();
  });

  ["pointerenter", "mouseenter", "mouseover", "focus", "touchstart"].forEach((eventName) => {
    agencyBtn.addEventListener(eventName, () => getAgencyData(), { passive: true });
    founderBtn.addEventListener(eventName, () => preloadImage(getFounderData().image), { passive: true });
  });

  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
  idle(() => {
    preloadImage(getFounderData().image);
    getAgencyData();
    lockLayout();
  });

  window.addEventListener("resize", lockLayout);
  setTimeout(lockLayout, 600);
  setTimeout(lockLayout, 1400);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initVipRuntimeFix);
} else {
  initVipRuntimeFix();
}
