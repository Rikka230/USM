import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const categories = ["gardien", "defenseur", "milieu", "attaquant", "feminine", "coach"];
const imageCache = new Map();

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
  try { localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data })); }
  catch (_) {}
}

function stableHue(text = "USM") {
  let hash = 0;
  for (const char of text) hash = ((hash << 5) - hash) + char.charCodeAt(0);
  return Math.abs(hash) % 360;
}

function preloadImage(url) {
  if (!url) return Promise.resolve(false);
  if (imageCache.has(url)) return imageCache.get(url);
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
    setTimeout(() => finish(false), 7000);
    img.src = url;
  });
  imageCache.set(url, promise);
  return promise;
}

async function getCategoryPlayers(category) {
  const key = `players_${category}`;
  const cached = readCache(key);
  if (cached && Array.isArray(cached)) return cached;

  try {
    const q = query(collection(db, "players"), where("category", "==", category));
    const snap = await getDocs(q);
    const players = [];
    snap.forEach((docSnap) => players.push(docSnap.data()));
    players.sort((a, b) => (a.order || 999) - (b.order || 999));
    writeCache(key, players);
    return players;
  } catch (error) {
    console.warn(`Roster preload failed for ${category}`, error);
    return [];
  }
}

async function warmRoster() {
  for (const category of categories) {
    getCategoryPlayers(category).then((players) => {
      players.slice(0, 16).forEach((player) => preloadImage(player.image_url));
    });
  }
}

function injectStyle() {
  if (document.getElementById("roster-runtime-fix-style")) return;
  const style = document.createElement("style");
  style.id = "roster-runtime-fix-style";
  style.textContent = `
    .player-img-container {
      position: relative;
      background: radial-gradient(circle at 30% 20%, rgba(216,0,86,.38), transparent 34%), linear-gradient(135deg, #16161d, #050507 70%);
      overflow: hidden;
      isolation: isolate;
    }
    .player-img-container::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, rgba(255,255,255,.04), rgba(255,255,255,.12), rgba(255,255,255,.04));
      transform: translateX(-100%);
      animation: roster-shimmer 1.4s ease-in-out infinite;
      z-index: 0;
      opacity: .7;
    }
    .player-img-container::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--roster-blur-bg, radial-gradient(circle at 40% 20%, rgba(216,0,86,.28), transparent 38%));
      filter: blur(24px) saturate(1.25);
      transform: scale(1.12);
      opacity: .55;
      z-index: 0;
    }
    .player-img-container img {
      position: relative;
      z-index: 1;
      opacity: 0;
      transform: scale(1.02);
      transition: opacity .34s ease, transform .5s cubic-bezier(.25,1,.5,1);
      will-change: opacity, transform;
    }
    .player-img-container img.roster-img-ready,
    .player-img-container img.is-loaded,
    .player-img-container img.loaded {
      opacity: .86 !important;
      transform: scale(1);
    }
    .player-card:hover .player-img-container img.roster-img-ready,
    .player-card:hover .player-img-container img.is-loaded,
    .player-card:hover .player-img-container img.loaded {
      opacity: 1 !important;
      transform: scale(1.05);
    }
    .roster-preserve #roster-categories-container {
      min-height: var(--roster-current-height, 420px);
    }
    @keyframes roster-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}

function prepareImage(img) {
  if (!img || img.dataset.rosterRuntimeReady === "true") return;
  img.dataset.rosterRuntimeReady = "true";

  const card = img.closest(".player-card");
  const container = img.closest(".player-img-container");
  const name = card?.querySelector("h3")?.textContent?.trim() || img.alt || img.src || "USM";
  const hue = stableHue(name);
  if (container) {
    container.style.setProperty("--roster-blur-bg", `radial-gradient(circle at 30% 18%, hsla(${hue}, 75%, 45%, .42), transparent 38%), radial-gradient(circle at 70% 80%, rgba(216,0,86,.28), transparent 42%), linear-gradient(135deg, #17171f, #050507 74%)`);
  }

  const reveal = () => {
    img.classList.add("roster-img-ready");
    img.closest(".player-img-container")?.classList.add("roster-image-ready");
  };

  if (img.complete && img.naturalWidth > 0) reveal();
  else {
    img.addEventListener("load", reveal, { once: true });
    img.addEventListener("error", reveal, { once: true });
    preloadImage(img.currentSrc || img.src).then(reveal);
  }
}

function prepareCurrentImages() {
  document.querySelectorAll(".player-img-container img, .player-card img").forEach(prepareImage);
}

function protectRosterHeight() {
  const section = document.querySelector(".players-section");
  const container = document.getElementById("roster-categories-container");
  if (!section || !container) return;

  const h = Math.ceil(container.getBoundingClientRect().height);
  if (h > 80) {
    section.classList.add("roster-preserve");
    section.style.setProperty("--roster-current-height", `${h}px`);
  }
}

function hookFilters() {
  document.querySelectorAll("#roster-tabs .filter-btn, .player-filters .filter-btn").forEach((button) => {
    if (button.dataset.rosterRuntimeHooked === "true") return;
    button.dataset.rosterRuntimeHooked = "true";
    const category = button.dataset.tab || button.dataset.cat;
    ["pointerenter", "mouseenter", "focus", "touchstart"].forEach((eventName) => {
      button.addEventListener(eventName, () => {
        if (category) getCategoryPlayers(category).then((players) => players.slice(0, 18).forEach((player) => preloadImage(player.image_url)));
      }, { passive: true });
    });
    button.addEventListener("click", () => {
      protectRosterHeight();
      if (category) getCategoryPlayers(category).then((players) => players.slice(0, 18).forEach((player) => preloadImage(player.image_url)));
      setTimeout(prepareCurrentImages, 40);
      setTimeout(prepareCurrentImages, 180);
      setTimeout(prepareCurrentImages, 420);
    }, true);
  });
}

function observeRoster() {
  const container = document.getElementById("roster-categories-container");
  if (!container) return;
  const observer = new MutationObserver(() => {
    protectRosterHeight();
    prepareCurrentImages();
    hookFilters();
  });
  observer.observe(container, { childList: true, subtree: true });
}

function initRosterRuntimeFix() {
  injectStyle();
  hookFilters();
  observeRoster();
  prepareCurrentImages();
  const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 400));
  idle(warmRoster);
  setTimeout(warmRoster, 1200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRosterRuntimeFix);
} else {
  initRosterRuntimeFix();
}
