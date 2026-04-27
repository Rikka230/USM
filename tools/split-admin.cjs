const fs = require('fs');
const path = require('path');

const root = process.cwd();
const adminPath = path.join(root, 'admin.js');
const original = fs.readFileSync(adminPath, 'utf8');

function section(startMarker, endMarker) {
  const start = original.indexOf(startMarker);
  if (start === -1) throw new Error(`Start marker not found: ${startMarker}`);
  const end = endMarker ? original.indexOf(endMarker, start + startMarker.length) : original.length;
  if (end === -1) throw new Error(`End marker not found after ${startMarker}: ${endMarker}`);
  return original.slice(start, end).trimEnd();
}

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.replace(/\r\n/g, '\n').trimEnd() + '\n', 'utf8');
  console.log(`wrote ${rel}`);
}

function indent(text, spaces = 2) {
  const pad = ' '.repeat(spaces);
  return text.split('\n').map(line => line.trim() ? pad + line : '').join('\n');
}

const markerMedia = '/* ================= 3. LE STUDIO PHOTO (CROPPER) & UPLOADS ================= */';
const markerPlayers = '/* ================= 4. GESTION DU ROSTER (JOUEURS) ================= */';
const markerServices = '/* ================= 5. GESTION DES SERVICES (AVEC SEO) ================= */';
const markerSettings = '/* ================= 6. SAUVEGARDE DES PARAMÈTRES GLOBAUX ================= */';
const markerPresse = '/* ================= 8. GESTION DE LA PRESSE (VIDÉOS & ARTICLES) ================= */';
const markerActive = "/* ==========================================================================";
const markerSocial = '/* ================= 9. GESTION DES RÉSEAUX SOCIAUX ================= */';
const markerMarquee = '/* ================= 10. GESTION BANDEROLE IMAGES ================= */';

const activeStart = original.indexOf(markerActive, original.indexOf(markerPresse));
if (activeStart === -1) throw new Error('Active tab section marker not found');

const media = section(markerMedia, markerPlayers)
  .replace("let cropState = { img: null, zoom: 1, x: 0, y: 0, baseScale: 1 };\n", '')
  .replaceAll('optimizedImages', 'state.optimizedImages')
  .replaceAll('cropState', 'state.cropState');

const players = section(markerPlayers, markerServices)
  .replaceAll('cropState', 'state.cropState');

const services = section(markerServices, markerSettings)
  .replaceAll('optimizedImages', 'state.optimizedImages');

const settings = section(markerSettings, markerPresse)
  .replaceAll('window.currentFounderLang', 'state.currentFounderLang')
  .replaceAll('window.founderDataObj', 'state.founderDataObj')
  .replaceAll('window.currentAgencyLang', 'state.currentAgencyLang')
  .replaceAll('window.agencyDataObj', 'state.agencyDataObj')
  .replaceAll('optimizedImages', 'state.optimizedImages');

let presse = original.slice(original.indexOf(markerPresse), activeStart).trimEnd()
  .replaceAll('optimizedImages', 'state.optimizedImages')
  .replace(`window.loadAdminPresse = async () => {
    loadAdminVideos();
    loadAdminArticles();
}`, `async function loadAdminPresse() {
    loadAdminVideos();
    loadAdminArticles();
}
ctx.loadAdminPresse = loadAdminPresse;
window.loadAdminPresse = loadAdminPresse;`);

let social = section(markerSocial, markerMarquee);
const navBtnPatchIndex = social.indexOf("if (!navBtnIds.includes('nav-social'))");
if (navBtnPatchIndex !== -1) social = social.slice(0, navBtnPatchIndex).trimEnd();

let marquee = section(markerMarquee, null)
  .replaceAll('optimizedImages', 'state.optimizedImages')
  .replace("setupDropZone('drop-zone-marquee', 'marquee-upload', 'marquee');\n\n", '')
  .replace(
    "document.getElementById('drop-zone-marquee').innerHTML = `<p>Glissez une nouvelle image ici</p><input type=\"file\" id=\"marquee-upload\" accept=\"image/*\" hidden>`;",
    "document.getElementById('drop-zone-marquee').innerHTML = `<p>Glissez une nouvelle image ici</p><input type=\"file\" id=\"marquee-upload\" accept=\"image/*\" hidden>`;\n            if (typeof ctx.setupDropZone === 'function') ctx.setupDropZone('drop-zone-marquee', 'marquee-upload', 'marquee');"
  );

write('admin/modules/firebase.js', `
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, query, where, writeBatch, getDoc, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDd7OvBbX35PaQPlm6saccOGTQyvI3UEoU",
  authDomain: "usm-football-b56ba.firebaseapp.com",
  projectId: "usm-football-b56ba",
  storageBucket: "usm-football-b56ba.firebasestorage.app",
  messagingSenderId: "1004955626049",
  appId: "1:1004955626049:web:1982ac82e68599946f74c0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, signInWithEmailAndPassword, onAuthStateChanged, signOut, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, query, where, writeBatch, getDoc, limit, ref, uploadString, getDownloadURL };
`);

write('admin/modules/state.js', `
export function createAdminState() {
  return {
    optimizedImages: { founder: null, nav: null, hero: null, service: null, agency: null, article: null, marquee: null },
    cropState: { img: null, zoom: 1, x: 0, y: 0, baseScale: 1 },
    currentFounderLang: 'fr',
    founderDataObj: { fr: { quote: '', desc: '' }, en: { quote: '', desc: '' }, es: { quote: '', desc: '' }, pt: { quote: '', desc: '' } },
    currentAgencyLang: 'fr',
    agencyDataObj: { fr: { quote: '', desc: '' }, en: { quote: '', desc: '' }, es: { quote: '', desc: '' }, pt: { quote: '', desc: '' } }
  };
}
`);

write('admin/modules/ui.js', `
export function initUI(ctx) {
  ctx.clearPublicCache = function clearPublicCache() { localStorage.clear(); };
  ctx.hideAllSections = function hideAllSections() {
    ['manage-players-section', 'form-player-section', 'settings-section', 'manage-services-section', 'form-service-section', 'manage-presse-section', 'form-video-section', 'form-article-section', 'manage-social-section', 'manage-marquee-section'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  };
  ctx.prefillImageZone = function prefillImageZone(zoneId, inputId, url, defaultText) {
    const input = document.getElementById(inputId);
    if (input) input.value = url || '';
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    const fileInput = zone.querySelector('input[type="file"]');
    zone.innerHTML = url ? `<img src="${url}" style="max-height: 80px; border-radius: 8px;"> <p style="font-size:11px; color:#aaa; margin-top:5px;">(Cliquez pour remplacer)</p>` : `<p style="font-size: 0.9rem;">${defaultText}</p>`;
    if (fileInput) zone.appendChild(fileInput);
  };
  const btnForceCache = document.getElementById('btn-force-cache');
  if (btnForceCache) {
    btnForceCache.addEventListener('click', () => {
      localStorage.clear();
      alert("✅ Cache de votre navigateur vidé avec succès !\n\nAllez sur le site public et actualisez la page (F5) pour voir vos derniers ajouts.");
    });
  }
}
`);

write('admin/modules/media.js', `
export function initMedia(ctx) {
  const { state } = ctx;
${indent(media)}
  ctx.setupDropZone = setupDropZone;
  ctx.processStandardImage = processStandardImage;
  ctx.getCroppedWebP = getCroppedWebP;
  ctx.resetCropState = resetCropState;
  ctx.updateCropUI = updateCropUI;
}
`);

write('admin/modules/players.js', `
export function initPlayers(ctx) {
  const { db, storage, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, writeBatch, ref, uploadString, getDownloadURL, state, clearPublicCache, hideAllSections, prefillImageZone, getCroppedWebP } = ctx;
${indent(players)}
  ctx.loadAdminPlayers = loadAdminPlayers;
  ctx.getAdminCurrentCat = () => adminCurrentCat;
}
`);

write('admin/modules/services.js', `
export function initServices(ctx) {
  const { db, storage, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, writeBatch, ref, uploadString, getDownloadURL, state, clearPublicCache, hideAllSections, prefillImageZone } = ctx;
${indent(services)}
  ctx.loadAdminServices = loadAdminServices;
}
`);

write('admin/modules/settings.js', `
export function initSettings(ctx) {
  const { db, storage, doc, setDoc, ref, uploadString, getDownloadURL, state, clearPublicCache } = ctx;
${indent(settings)}
}
`);

write('admin/modules/presse.js', `
export function initPresse(ctx) {
  const { db, storage, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, writeBatch, ref, uploadString, getDownloadURL, state, clearPublicCache, hideAllSections, prefillImageZone } = ctx;
${indent(presse)}
}
`);

write('admin/modules/social.js', `
export function initSocial(ctx) {
  const { db, doc, getDoc, setDoc, clearPublicCache, hideAllSections } = ctx;
${indent(social)}
}
`);

write('admin/modules/marquee.js', `
export function initMarquee(ctx) {
  const { db, storage, collection, addDoc, getDocs, deleteDoc, doc, ref, uploadString, getDownloadURL, state, hideAllSections } = ctx;
${indent(marquee)}
}
`);

write('admin/modules/navigation.js', `
export function initNavigation(ctx) {
  const { db, doc, getDoc, state, hideAllSections, prefillImageZone } = ctx;
  const activateSidebarButton = (event) => {
    document.querySelectorAll('.sidebar button').forEach(button => button.classList.remove('active'));
    event.target.classList.add('active');
  };
  const navPresse = document.getElementById('nav-presse');
  if (navPresse) navPresse.addEventListener('click', (event) => { activateSidebarButton(event); hideAllSections(); document.getElementById('manage-presse-section')?.classList.remove('hidden'); if (typeof ctx.loadAdminPresse === 'function') ctx.loadAdminPresse(); });
  const navManage = document.getElementById('nav-manage');
  if (navManage) navManage.addEventListener('click', (event) => { activateSidebarButton(event); hideAllSections(); document.getElementById('manage-players-section')?.classList.remove('hidden'); });
  const navServices = document.getElementById('nav-services');
  if (navServices) navServices.addEventListener('click', (event) => { activateSidebarButton(event); hideAllSections(); document.getElementById('manage-services-section')?.classList.remove('hidden'); if (typeof ctx.loadAdminServices === 'function') ctx.loadAdminServices(); });
  const navSettings = document.getElementById('nav-settings');
  if (navSettings) navSettings.addEventListener('click', async (event) => {
    activateSidebarButton(event); hideAllSections(); document.getElementById('settings-section')?.classList.remove('hidden');
    try {
      const docSnap = await getDoc(doc(db, "settings", "general"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        ['1', '2', '3', '4'].forEach(num => { const el = document.getElementById(`stat-${num}`); if (el) el.value = data[`stat${num}`] || ''; });
        ['fr', 'en', 'es', 'pt'].forEach(lang => { state.founderDataObj[lang].quote = data[`founderQuote_${lang}`] || data.founderQuote || ''; state.founderDataObj[lang].desc = data[`founderDesc_${lang}`] || data.founderDesc || ''; });
        const founderQuoteInput = document.getElementById('founder-quote');
        const founderDescInput = document.getElementById('founder-desc');
        if (founderQuoteInput) founderQuoteInput.value = state.founderDataObj[state.currentFounderLang].quote;
        if (founderDescInput) founderDescInput.value = state.founderDataObj[state.currentFounderLang].desc;
        prefillImageZone('drop-zone-nav', 'existing-logo-nav', data.logoNav, 'Glissez le logo header');
        prefillImageZone('drop-zone-hero', 'existing-logo-hero', data.logoHero, 'Glissez le logo central');
        prefillImageZone('drop-zone-founder', 'existing-founder-img', data.founderImg, 'Glissez la photo du fondateur');
        try {
          const agencySnap = await getDoc(doc(db, "settings", "agency"));
          if (agencySnap.exists()) {
            const agencyData = agencySnap.data();
            prefillImageZone('drop-zone-agency', 'existing-agency-img', agencyData.image, 'Glissez la photo de l\'agence');
            ['fr', 'en', 'es', 'pt'].forEach(lang => { state.agencyDataObj[lang].quote = agencyData[`quote_${lang}`] || ''; state.agencyDataObj[lang].desc = agencyData[`desc_${lang}`] || ''; });
            const agencyQuoteInput = document.getElementById('agency-quote');
            const agencyDescInput = document.getElementById('agency-desc');
            if (agencyQuoteInput) agencyQuoteInput.value = state.agencyDataObj[state.currentAgencyLang].quote;
            if (agencyDescInput) agencyDescInput.value = state.agencyDataObj[state.currentAgencyLang].desc;
          }
        } catch (error) { console.error("Erreur agence:", error); }
        Object.assign(state.optimizedImages, { founder: null, nav: null, hero: null, service: null, agency: null, article: null, marquee: null });
      }
    } catch (error) { console.error(error); }
  });
}
`);

write('admin/modules/active-tab.js', `
export function initActiveTab() {
  const navBtnIds = ['nav-manage', 'nav-services', 'nav-settings', 'nav-presse', 'nav-social', 'nav-marquee'];
  navBtnIds.forEach(id => { const btn = document.getElementById(id); if (btn) btn.addEventListener('click', () => localStorage.setItem('admin_active_tab', id)); });
  const dashboardAdmin = document.getElementById('dashboard');
  if (dashboardAdmin) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && !dashboardAdmin.classList.contains('hidden')) {
          const savedTab = localStorage.getItem('admin_active_tab');
          if (savedTab && document.getElementById(savedTab)) document.getElementById(savedTab).click();
          observer.disconnect();
        }
      });
    });
    observer.observe(dashboardAdmin, { attributes: true });
  }
}
`);

write('admin/modules/auth.js', `
export function initAuth(ctx) {
  const { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut } = ctx;
  const showDashboard = () => { const loginScreen = document.getElementById('login-screen'); const dashboard = document.getElementById('dashboard'); if (loginScreen) loginScreen.style.display = 'none'; if (dashboard) { dashboard.classList.remove('hidden'); dashboard.style.display = 'flex'; } };
  const showLogin = () => { const loginScreen = document.getElementById('login-screen'); const dashboard = document.getElementById('dashboard'); if (loginScreen) { loginScreen.classList.remove('hidden'); loginScreen.style.display = 'flex'; } if (dashboard) { dashboard.classList.add('hidden'); dashboard.style.display = 'none'; } };
  const loadDefaultPlayers = () => { if (typeof ctx.loadAdminPlayers === 'function') { const category = typeof ctx.getAdminCurrentCat === 'function' ? ctx.getAdminCurrentCat() : 'gardien'; setTimeout(() => ctx.loadAdminPlayers(category), 50); } };
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  if (loginForm) loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const emailInput = document.getElementById('admin-email'); const pwdInput = document.getElementById('admin-pwd'); const btn = loginForm.querySelector('button');
    if (!emailInput || !pwdInput || !btn) return;
    const email = emailInput.value.trim(); const password = pwdInput.value; const originalText = btn.textContent;
    if (loginError) loginError.style.display = 'none';
    try { btn.textContent = "Ouverture du panel..."; btn.disabled = true; await signInWithEmailAndPassword(auth, email, password); showDashboard(); loadDefaultPlayers(); }
    catch (error) {
      if (loginError) { if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') loginError.textContent = "Accès refusé : Email ou mot de passe incorrect."; else if (error.code === 'auth/too-many-requests') loginError.textContent = "Trop de tentatives. Réessayez dans quelques minutes."; else loginError.textContent = "Erreur : " + (error.message || error.code); loginError.style.display = 'block'; }
      btn.textContent = originalText; btn.disabled = false;
    }
  });
  onAuthStateChanged(auth, (user) => { const authLoader = document.getElementById('auth-loader'); if (authLoader) authLoader.style.display = 'none'; if (user) { showDashboard(); loadDefaultPlayers(); } else { showLogin(); } });
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    const originalContent = logoutBtn.innerHTML;
    try { logoutBtn.disabled = true; logoutBtn.style.opacity = '0.7'; logoutBtn.innerHTML = 'Déconnexion...'; await signOut(auth); localStorage.clear(); showLogin(); window.location.replace('admin.html'); }
    catch (error) { console.error('Erreur de déconnexion:', error); logoutBtn.disabled = false; logoutBtn.style.opacity = '1'; logoutBtn.innerHTML = originalContent; alert('Impossible de vous déconnecter. Rechargez la page puis réessayez.'); }
  });
}
`);

write('admin.js', `
/* ==========================================================================\n   USM FOOTBALL - ADMIN JAVASCRIPT\n   Point d'entrée modulaire\n   ========================================================================== */
import * as firebase from './admin/modules/firebase.js';
import { createAdminState } from './admin/modules/state.js';
import { initUI } from './admin/modules/ui.js';
import { initMedia } from './admin/modules/media.js';
import { initPlayers } from './admin/modules/players.js';
import { initServices } from './admin/modules/services.js';
import { initSettings } from './admin/modules/settings.js';
import { initPresse } from './admin/modules/presse.js';
import { initSocial } from './admin/modules/social.js';
import { initMarquee } from './admin/modules/marquee.js';
import { initNavigation } from './admin/modules/navigation.js';
import { initActiveTab } from './admin/modules/active-tab.js';
import { initAuth } from './admin/modules/auth.js';

const ctx = { ...firebase, state: createAdminState() };

initUI(ctx);
initMedia(ctx);
initPlayers(ctx);
initServices(ctx);
initSettings(ctx);
initPresse(ctx);
initSocial(ctx);
initMarquee(ctx);
initNavigation(ctx);
initActiveTab(ctx);
initAuth(ctx);
`);

console.log('Admin modularization files generated.');
