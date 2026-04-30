/* ==========================================================================
   USM FOOTBALL - ADMIN JAVASCRIPT (CORRIGÉ & SÉCURISÉ)
   ========================================================================== */

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

/* ================= 1. INITIALISATION FIREBASE ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let optimizedImages = { founder: null, nav: null, hero: null, service: null, agency: null };

function clearPublicCache() { localStorage.clear(); }

/* ================= 2. GESTION DE LA CONNEXION (CORRECTION UI) ================= */
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const email = document.getElementById('admin-email').value.trim();
        const pwd = document.getElementById('admin-pwd').value;
        const btn = loginForm.querySelector('button');
        const originalText = btn.textContent; 
        
        if (loginError) loginError.style.display = 'none';
        
        try {
            btn.textContent = "Ouverture du panel...";
            btn.disabled = true;
            
            // Validation Firebase
            await signInWithEmailAndPassword(auth, email, pwd);
            
            // FORCAGE ABSOLU DE L'INTERFACE (Écrase les conflits CSS potentiels)
            document.getElementById('login-screen').style.display = 'none';
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                dashboard.classList.remove('hidden');
                dashboard.style.display = 'flex'; // <-- CORRECTION : Respecte ta mise en page
            }
            
            if(typeof loadAdminPlayers === 'function') {
                setTimeout(() => loadAdminPlayers(typeof adminCurrentCat !== 'undefined' ? adminCurrentCat : 'gardien'), 50);
            }
            
        } catch (error) {
            if (loginError) {
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    loginError.textContent = "Accès refusé : Email ou mot de passe incorrect.";
                } else if (error.code === 'auth/too-many-requests') {
                    loginError.textContent = "Trop de tentatives. Réessayez dans quelques minutes.";
                } else {
                    loginError.textContent = "Erreur : " + (error.message || error.code);
                }
                loginError.style.display = 'block';
            }
            
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

onAuthStateChanged(auth, (user) => {
    const authLoader = document.getElementById('auth-loader');
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');

    if (authLoader) authLoader.style.display = 'none';

    if (user) {
        // L'utilisateur est reconnu : on masque de force le formulaire
        if (loginScreen) loginScreen.style.display = 'none';
        
        if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.display = 'flex'; // <-- CORRECTION : Respecte ta mise en page
        }
        
        if(typeof loadAdminPlayers === 'function') {
            setTimeout(() => loadAdminPlayers(typeof adminCurrentCat !== 'undefined' ? adminCurrentCat : 'gardien'), 50);
        }
    } else {
        // L'utilisateur est déconnecté : on affiche le formulaire
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
            loginScreen.style.display = 'flex'; 
        }
        if (dashboard) dashboard.style.display = 'none';
    }
});


/* ================= 2B. DÉCONNEXION ADMIN ================= */
const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const originalContent = logoutBtn.innerHTML;

        try {
            logoutBtn.disabled = true;
            logoutBtn.style.opacity = '0.7';
            logoutBtn.innerHTML = 'Déconnexion...';

            await signOut(auth);
            localStorage.clear();

            const dashboard = document.getElementById('dashboard');
            const loginScreen = document.getElementById('login-screen');

            if (dashboard) {
                dashboard.classList.add('hidden');
                dashboard.style.display = 'none';
            }

            if (loginScreen) {
                loginScreen.classList.remove('hidden');
                loginScreen.style.display = 'flex';
            }

            window.location.replace('admin.html');
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            logoutBtn.disabled = false;
            logoutBtn.style.opacity = '1';
            logoutBtn.innerHTML = originalContent;
            alert('Impossible de vous déconnecter. Rechargez la page puis réessayez.');
        }
    });
}

/* ================= 3. NAVIGATION ET CHARGEMENT SETTINGS ================= */
function hideAllSections() {
    ['manage-players-section', 'form-player-section', 'settings-section', 'manage-services-section', 'form-service-section', 'manage-presse-section', 'form-video-section', 'form-article-section', 'manage-social-section', 'manage-marquee-section'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
}

const btnForceCache = document.getElementById('btn-force-cache');
if(btnForceCache) {
    btnForceCache.addEventListener('click', () => {
        localStorage.clear();
        alert("✅ Cache de votre navigateur vidé avec succès !\n\nAllez sur le site public et actualisez la page (F5) pour voir vos derniers ajouts.");
    });
}

const navPresse = document.getElementById('nav-presse');
if(navPresse) {
    navPresse.addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        hideAllSections();
        document.getElementById('manage-presse-section').classList.remove('hidden');
        if (typeof loadAdminPresse === 'function') loadAdminPresse(); // Lance le téléchargement de la presse
    });
}

const navManage = document.getElementById('nav-manage');
if(navManage) {
    navManage.addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        hideAllSections();
        document.getElementById('manage-players-section').classList.remove('hidden');
    });
}

const navServices = document.getElementById('nav-services');
if(navServices) {
    navServices.addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        hideAllSections();
        document.getElementById('manage-services-section').classList.remove('hidden');
        if (typeof loadAdminServices === 'function') loadAdminServices(); // <-- CORRECTION : Force le téléchargement des données
    });
}

const navSettings = document.getElementById('nav-settings');
if(navSettings) {
    navSettings.addEventListener('click', async (e) => {
        document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        hideAllSections();
        document.getElementById('settings-section').classList.remove('hidden');
        
        try {
            const docSnap = await getDoc(doc(db, "settings", "general"));
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // --- CHARGEMENT DES STATS (Nouveaux IDs) ---
                ['1', '2', '3', '4'].forEach(num => {
                    const el = document.getElementById(`stat-${num}`);
                    if(el) el.value = data[`stat${num}`] || '';
                });
                
                // --- CHARGEMENT DU FONDATEUR (Avec logique onglets) ---
                ['fr', 'en', 'es', 'pt'].forEach(lang => {
                    founderDataObj[lang].quote = data[`founderQuote_${lang}`] || data.founderQuote || '';
                    founderDataObj[lang].desc = data[`founderDesc_${lang}`] || data.founderDesc || '';
                });
                const founderQuoteInput = document.getElementById('founder-quote');
                const founderDescInput = document.getElementById('founder-desc');
                if(founderQuoteInput) founderQuoteInput.value = founderDataObj[currentFounderLang].quote;
                if(founderDescInput) founderDescInput.value = founderDataObj[currentFounderLang].desc;

                prefillImageZone('drop-zone-nav', 'existing-logo-nav', data.logoNav, 'Glissez le logo header');
                prefillImageZone('drop-zone-hero', 'existing-logo-hero', data.logoHero, 'Glissez le logo central');
                prefillImageZone('drop-zone-founder', 'existing-founder-img', data.founderImg, 'Glissez la photo du fondateur');
                
                // --- CHARGEMENT DE L'AGENCE ---
                try {
                    const dAgency = await getDoc(doc(db, "settings", "agency"));
                    if (dAgency.exists()) {
                        const aData = dAgency.data();
                        prefillImageZone('drop-zone-agency', 'existing-agency-img', aData.image, 'Glissez la photo de l\'agence');
                        ['fr', 'en', 'es', 'pt'].forEach(lang => {
                            agencyDataObj[lang].quote = aData[`quote_${lang}`] || '';
                            agencyDataObj[lang].desc = aData[`desc_${lang}`] || '';
                        });
                        const agencyQuoteInput = document.getElementById('agency-quote');
                        const agencyDescInput = document.getElementById('agency-desc');
                        if(agencyQuoteInput) agencyQuoteInput.value = agencyDataObj[currentAgencyLang].quote;
                        if(agencyDescInput) agencyDescInput.value = agencyDataObj[currentAgencyLang].desc;
                    }
                } catch(e) { console.error("Erreur agence:", e); }
                
                optimizedImages = { founder: null, nav: null, hero: null, service: null, agency: null };
            }
        } catch (error) { console.error(error); }
    });
}

function prefillImageZone(zoneId, inputId, url, defaultText) {
    const input = document.getElementById(inputId);
    if(input) input.value = url || '';
    const zone = document.getElementById(zoneId);
    if(!zone) return;
    const fileInput = zone.querySelector('input[type="file"]'); 
    
    if(url) {
        zone.innerHTML = `<img src="${url}" style="max-height: 80px; border-radius: 8px;"> <p style="font-size:11px; color:#aaa; margin-top:5px;">(Cliquez pour remplacer)</p>`;
    } else {
        zone.innerHTML = `<p style="font-size: 0.9rem;">${defaultText}</p>`;
    }
    if (fileInput) zone.appendChild(fileInput);
}

/* ================= 3. LE STUDIO PHOTO (CROPPER) & UPLOADS ================= */

function setupDropZone(zoneId, inputId, targetKey) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if(!zone || !input) return;
    
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => { 
        e.preventDefault(); zone.classList.remove('dragover');
        processStandardImage(e.dataTransfer.files[0], zone, targetKey); 
    });
    input.addEventListener('change', (e) => processStandardImage(e.target.files[0], zone, targetKey));
}

function processStandardImage(file, zoneElement, targetKey) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const webCanvas = document.createElement('canvas');
            const webCtx = webCanvas.getContext('2d');
            let wWidth = img.width, wHeight = img.height;
            if (wWidth > 1200) { wHeight = Math.round((wHeight * 1200) / wWidth); wWidth = 1200; }
            webCanvas.width = wWidth; webCanvas.height = wHeight;
            webCtx.drawImage(img, 0, 0, wWidth, wHeight);
            
            optimizedImages[targetKey] = webCanvas.toDataURL('image/webp', 0.8); 
            const fileInput = zoneElement.querySelector('input[type="file"]');
            zoneElement.innerHTML = `<img src="${optimizedImages[targetKey]}" style="max-height: 80px; border-radius: 8px;"> <p style="color:var(--usm-pink); font-size:11px; margin-top:5px;">✓ Prêt</p>`;
            if (fileInput) zoneElement.appendChild(fileInput);
            if (targetKey === 'service') {
                setServiceCropImage(optimizedImages[targetKey]);
                resetServiceCrop('card');
                resetServiceCrop('hero');
                updateServiceCropPreview();
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

setupDropZone('drop-zone-founder', 'founder-upload', 'founder');
setupDropZone('drop-zone-nav', 'nav-upload', 'nav');
setupDropZone('drop-zone-hero', 'hero-upload', 'hero');
setupDropZone('drop-zone-srv', 'srv-upload', 'service');
setupDropZone('drop-zone-article', 'article-upload', 'article');
setupDropZone('drop-zone-agency', 'agency-upload', 'agency');
setupDropZone('drop-zone-marquee', 'marquee-upload', 'marquee'); 


/* ================= 3B. CADRAGE VISUEL DES SERVICES ================= */
const SERVICE_CROP_DEFAULT = { x: 0, y: 0, zoom: 1 };
let serviceCropState = {
    imageUrl: '',
    card: { ...SERVICE_CROP_DEFAULT },
    hero: { ...SERVICE_CROP_DEFAULT }
};

function clampServiceCropValue(value, min, max, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function normalizeServiceCropSettings(raw) {
    const crop = raw && typeof raw === 'object' ? raw : {};
    return {
        x: clampServiceCropValue(crop.x, -45, 45, 0),
        y: clampServiceCropValue(crop.y, -45, 45, 0),
        zoom: clampServiceCropValue(crop.zoom, 0.55, 3, 1)
    };
}

function serializeServiceCropSettings(crop) {
    const normalized = normalizeServiceCropSettings(crop);
    return {
        x: Number(normalized.x.toFixed(2)),
        y: Number(normalized.y.toFixed(2)),
        zoom: Number(normalized.zoom.toFixed(2))
    };
}

function getActiveServiceLang() {
    return document.querySelector('.lang-tab-srv.active')?.dataset.lang || 'fr';
}

function getServicePreviewText() {
    const lang = getActiveServiceLang();
    const title = document.getElementById(`srv-title-${lang}`)?.value || document.getElementById('srv-title-fr')?.value || 'TITRE SERVICE';
    const subtitle = document.getElementById(`srv-subtitle-${lang}`)?.value || document.getElementById('srv-subtitle-fr')?.value || 'Sous-titre du service';
    return { title, subtitle };
}

function updateServiceCropCopyPreview() {
    const { title, subtitle } = getServicePreviewText();
    ['card', 'hero'].forEach((kind) => {
        const titleEl = document.getElementById(`srv-preview-${kind}-title`);
        const subEl = document.getElementById(`srv-preview-${kind}-subtitle`);
        if (titleEl) titleEl.textContent = title;
        if (subEl) subEl.textContent = subtitle;
    });
}

function setServiceCropImage(url = '') {
    serviceCropState.imageUrl = url || '';
    const ui = document.getElementById('service-crop-ui');
    if (ui) ui.classList.toggle('hidden', !serviceCropState.imageUrl);

    ['card', 'hero'].forEach((kind) => {
        const img = document.getElementById(`srv-${kind}-preview-img`);
        if (!img) return;
        if (serviceCropState.imageUrl) {
            img.src = serviceCropState.imageUrl;
            img.style.display = 'block';
        } else {
            img.removeAttribute('src');
            img.style.display = 'none';
        }
    });

    updateServiceCropPreview();
}

function updateServiceCropSlider(kind) {
    const crop = serviceCropState[kind];
    if (!crop) return;
    const zoom = document.getElementById(`srv-${kind}-zoom`);
    const x = document.getElementById(`srv-${kind}-x`);
    const y = document.getElementById(`srv-${kind}-y`);
    if (zoom) zoom.value = crop.zoom;
    if (x) x.value = crop.x;
    if (y) y.value = crop.y;

    const zoomVal = document.getElementById(`srv-${kind}-zoom-val`);
    const xVal = document.getElementById(`srv-${kind}-x-val`);
    const yVal = document.getElementById(`srv-${kind}-y-val`);
    if (zoomVal) zoomVal.textContent = `${Math.round(crop.zoom * 100)}%`;
    if (xVal) xVal.textContent = `${Math.round(crop.x)}`;
    if (yVal) yVal.textContent = `${Math.round(crop.y)}`;
}

function applyServiceCropToFrame(kind) {
    const crop = normalizeServiceCropSettings(serviceCropState[kind]);
    serviceCropState[kind] = crop;
    const frame = document.querySelector(`.service-crop-frame[data-crop-kind="${kind}"]`);
    if (frame) {
        frame.style.setProperty('--crop-x', `${crop.x}%`);
        frame.style.setProperty('--crop-y', `${crop.y}%`);
        frame.style.setProperty('--crop-zoom', String(crop.zoom));
    }
    updateServiceCropSlider(kind);
}

function updateServiceCropPreview() {
    applyServiceCropToFrame('card');
    applyServiceCropToFrame('hero');
    updateServiceCropCopyPreview();
}

function resetServiceCrop(kind) {
    if (!serviceCropState[kind]) return;
    serviceCropState[kind] = { ...SERVICE_CROP_DEFAULT };
    applyServiceCropToFrame(kind);
}

function hydrateServiceCropStateFromService(srv = {}) {
    serviceCropState.card = normalizeServiceCropSettings(srv.card_crop || srv.serviceCardCrop || srv.cardCrop);
    serviceCropState.hero = normalizeServiceCropSettings(srv.hero_crop || srv.serviceHeroCrop || srv.heroCrop);
    setServiceCropImage(srv.image_url || '');
}

['card', 'hero'].forEach((kind) => {
    ['zoom', 'x', 'y'].forEach((axis) => {
        const input = document.getElementById(`srv-${kind}-${axis}`);
        if (!input) return;
        input.addEventListener('input', (event) => {
            const nextValue = parseFloat(event.target.value);
            if (axis === 'zoom') serviceCropState[kind].zoom = clampServiceCropValue(nextValue, 0.55, 3, 1);
            if (axis === 'x') serviceCropState[kind].x = clampServiceCropValue(nextValue, -45, 45, 0);
            if (axis === 'y') serviceCropState[kind].y = clampServiceCropValue(nextValue, -45, 45, 0);
            applyServiceCropToFrame(kind);
        });
    });

    const frame = document.querySelector(`.service-crop-frame[data-crop-kind="${kind}"]`);
    if (!frame) return;

    let isServiceCropDragging = false;
    let lastX = 0;
    let lastY = 0;

    const startDrag = (clientX, clientY) => {
        if (!serviceCropState.imageUrl) return;
        isServiceCropDragging = true;
        lastX = clientX;
        lastY = clientY;
        frame.classList.add('is-dragging');
    };

    const moveDrag = (clientX, clientY) => {
        if (!isServiceCropDragging) return;
        const rect = frame.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dx = ((clientX - lastX) / rect.width) * 100;
        const dy = ((clientY - lastY) / rect.height) * 100;
        serviceCropState[kind].x = clampServiceCropValue(serviceCropState[kind].x + dx, -45, 45, 0);
        serviceCropState[kind].y = clampServiceCropValue(serviceCropState[kind].y + dy, -45, 45, 0);
        lastX = clientX;
        lastY = clientY;
        applyServiceCropToFrame(kind);
    };

    const endDrag = () => {
        isServiceCropDragging = false;
        frame.classList.remove('is-dragging');
    };

    frame.addEventListener('mousedown', (event) => startDrag(event.clientX, event.clientY));
    window.addEventListener('mousemove', (event) => moveDrag(event.clientX, event.clientY));
    window.addEventListener('mouseup', endDrag);

    frame.addEventListener('wheel', (event) => {
        if (!serviceCropState.imageUrl) return;
        event.preventDefault();
        const direction = event.deltaY > 0 ? -1 : 1;
        const nextZoom = serviceCropState[kind].zoom + direction * 0.08;
        serviceCropState[kind].zoom = clampServiceCropValue(nextZoom, 0.55, 3, 1);
        applyServiceCropToFrame(kind);
    }, { passive: false });

    frame.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 1) return;
        event.preventDefault();
        startDrag(event.touches[0].clientX, event.touches[0].clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (event) => {
        if (!isServiceCropDragging || event.touches.length !== 1) return;
        event.preventDefault();
        moveDrag(event.touches[0].clientX, event.touches[0].clientY);
    }, { passive: false });

    window.addEventListener('touchend', endDrag);
});

const btnResetServiceCrops = document.getElementById('btn-reset-service-crops');
if (btnResetServiceCrops) {
    btnResetServiceCrops.addEventListener('click', () => {
        resetServiceCrop('card');
        resetServiceCrop('hero');
    });
}

['fr', 'en', 'es', 'pt'].forEach((lang) => {
    ['title', 'subtitle'].forEach((field) => {
        const el = document.getElementById(`srv-${field}-${lang}`);
        if (el) el.addEventListener('input', updateServiceCropCopyPreview);
    });
});

let cropState = { img: null, zoom: 1, x: 0, y: 0, baseScale: 1 };
const playerDropZone = document.getElementById('drop-zone');
const playerInput = document.getElementById('media-upload');
const cropCanvas = document.getElementById('crop-canvas');

if(playerDropZone && playerInput) {
    playerDropZone.addEventListener('click', () => playerInput.click());
    playerDropZone.addEventListener('dragover', (e) => { e.preventDefault(); playerDropZone.classList.add('dragover'); });
    playerDropZone.addEventListener('dragleave', () => playerDropZone.classList.remove('dragover'));
    playerDropZone.addEventListener('drop', (e) => { 
        e.preventDefault(); playerDropZone.classList.remove('dragover'); 
        loadPlayerImage(e.dataTransfer.files[0]); 
    });
    playerInput.addEventListener('change', (e) => loadPlayerImage(e.target.files[0]));
}

function loadPlayerImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            cropState.img = img;
            const scaleX = 240 / img.width;
            const scaleY = 320 / img.height;
            cropState.baseScale = Math.max(scaleX, scaleY);
            
            const zSlider = document.getElementById('crop-zoom');
            if(zSlider) { zSlider.min = cropState.baseScale * 0.2; zSlider.max = cropState.baseScale * 5; }
            
            const xSlider = document.getElementById('crop-x');
            if(xSlider) { xSlider.min = -img.width; xSlider.max = img.width; }
            
            const ySlider = document.getElementById('crop-y');
            if(ySlider) { ySlider.min = -img.height; ySlider.max = img.height; }

            resetCropState();
            
            if(playerDropZone) playerDropZone.classList.add('hidden');
            const ui = document.getElementById('cropper-ui');
            if(ui) ui.classList.remove('hidden');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function resetCropState() {
    cropState.zoom = cropState.baseScale;
    cropState.x = 0;
    cropState.y = 0;
    if(document.getElementById('crop-zoom')) document.getElementById('crop-zoom').value = cropState.zoom;
    if(document.getElementById('crop-x')) document.getElementById('crop-x').value = 0;
    if(document.getElementById('crop-y')) document.getElementById('crop-y').value = 0;
    updateCropUI();
}

['crop-zoom', 'crop-x', 'crop-y'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener('input', (e) => {
            if(id === 'crop-zoom') cropState.zoom = parseFloat(e.target.value);
            if(id === 'crop-x') cropState.x = parseFloat(e.target.value);
            if(id === 'crop-y') cropState.y = parseFloat(e.target.value);
            updateCropUI();
        });
    }
});

const btnResetCrop = document.getElementById('btn-reset-crop');
if(btnResetCrop) btnResetCrop.addEventListener('click', resetCropState);

const btnCancelCrop = document.getElementById('btn-cancel-crop');
if(btnCancelCrop) {
    btnCancelCrop.addEventListener('click', () => {
        cropState.img = null;
        const ui = document.getElementById('cropper-ui');
        if(ui) ui.classList.add('hidden');
        if(playerDropZone) playerDropZone.classList.remove('hidden');
        if(playerInput) playerInput.value = '';
    });
}

// --- SUPPORT SOURIS ET TACTILE POUR LE CROPPER ---
let isDragging = false;
let startDragX, startDragY;

if(cropCanvas) {
    const startDrag = (clientX, clientY) => {
        if(!cropState.img) return;
        isDragging = true;
        startDragX = clientX; 
        startDragY = clientY;
        cropCanvas.style.cursor = 'grabbing';
    };

    const doDrag = (clientX, clientY) => {
        if(!isDragging || !cropState.img) return;
        const dx = clientX - startDragX;
        const dy = clientY - startDragY;
        cropState.x += dx / cropState.zoom;
        cropState.y += dy / cropState.zoom;
        
        const xSlider = document.getElementById('crop-x');
        if(xSlider) xSlider.value = cropState.x;
        const ySlider = document.getElementById('crop-y');
        if(ySlider) ySlider.value = cropState.y;
        
        startDragX = clientX; 
        startDragY = clientY;
        updateCropUI();
    };

    const endDrag = () => { 
        isDragging = false; 
        cropCanvas.style.cursor = 'grab'; 
    };

    // Événements Souris (PC)
    cropCanvas.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);

    // Événements Tactiles (Mobile/Tablette)
    cropCanvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            e.preventDefault(); // Empêche le défilement de la page pendant qu'on ajuste la photo
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });
    
    window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            e.preventDefault(); 
            doDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });
    
    window.addEventListener('touchend', endDrag);
}

function updateCropUI() {
    if(!cropCanvas) return;
    const vZoom = document.getElementById('val-zoom');
    if(vZoom) vZoom.textContent = Math.round((cropState.zoom / cropState.baseScale) * 100) + '%';
    const vX = document.getElementById('val-x');
    if(vX) vX.textContent = Math.round(cropState.x);
    const vY = document.getElementById('val-y');
    if(vY) vY.textContent = Math.round(cropState.y);
    
    const ctx = cropCanvas.getContext('2d');
    ctx.clearRect(0,0,240,320);
    ctx.save();
    ctx.translate(120, 160); 
    ctx.scale(cropState.zoom, cropState.zoom);
    ctx.drawImage(cropState.img, -cropState.img.width/2 + cropState.x, -cropState.img.height/2 + cropState.y);
    ctx.restore();
}

function getCroppedWebP() {
    if(!cropState.img) return null;
    const off = document.createElement('canvas');
    off.width = 600; off.height = 800;
    const ctx = off.getContext('2d');
    ctx.translate(300, 400); 
    ctx.scale(cropState.zoom * 2.5, cropState.zoom * 2.5); 
    ctx.drawImage(cropState.img, -cropState.img.width/2 + cropState.x, -cropState.img.height/2 + cropState.y);
    return off.toDataURL('image/webp', 0.9);
}

/* ================= 4. GESTION DU ROSTER (JOUEURS) ================= */
let allAdminPlayers = []; 
let adminCurrentCat = 'gardien';
let adminSearchQuery = '';
let adminCurrentPage = 1;
const ITEMS_PER_PAGE = 20;

document.querySelectorAll('.admin-tab:not(.lang-tab):not(.lang-tab-srv)').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-tab:not(.lang-tab):not(.lang-tab-srv)').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        adminCurrentCat = e.target.getAttribute('data-cat');
        adminSearchQuery = ''; 
        const searchBar = document.getElementById('search-bar');
        if(searchBar) searchBar.value = '';
        adminCurrentPage = 1;
        loadAdminPlayers(adminCurrentCat);
    });
});

const searchBar = document.getElementById('search-bar');
if(searchBar) {
    searchBar.addEventListener('input', (e) => {
        adminSearchQuery = e.target.value.toLowerCase();
        adminCurrentPage = 1;
        if(adminSearchQuery.length > 0) {
            document.querySelectorAll('.admin-tab:not(.lang-tab):not(.lang-tab-srv)').forEach(t => t.classList.remove('active'));
        }
        renderAdminTable();
    });
}

async function loadAdminPlayers(category) {
    const listContainer = document.getElementById('admin-players-list');
    if(!listContainer) return;
    listContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement...</td></tr>';
    try {
        const q = query(collection(db, "players"), where("category", "==", category));
        const querySnapshot = await getDocs(q);
        allAdminPlayers = [];
        querySnapshot.forEach((docSnap) => allAdminPlayers.push({ id: docSnap.id, ...docSnap.data() }));
        renderAdminTable();
    } catch (error) { 
        listContainer.innerHTML = `<tr><td colspan="4" style="color:red;">Erreur base de données.</td></tr>`; 
    }
}

/* 🪄 NOUVELLE FONCTION : Mise à jour en tapant le numéro */
window.updateItemOrder = async (collectionName, id, newOrderStr, listData, refreshCallback) => {
    let newOrder = parseInt(newOrderStr);
    if (isNaN(newOrder) || newOrder < 1) newOrder = 1;
    
    let sortedList = [...listData].sort((a, b) => (a.order || 999) - (b.order || 999));
    const currentIndex = sortedList.findIndex(item => item.id === id);
    if (currentIndex === -1) return;
    
    if (newOrder > sortedList.length) newOrder = sortedList.length;
    const targetIndex = newOrder - 1;
    
    if (currentIndex === targetIndex) return; 
    
    const [movedItem] = sortedList.splice(currentIndex, 1);
    sortedList.splice(targetIndex, 0, movedItem);
    
    const batch = writeBatch(db);
    sortedList.forEach((item, index) => {
        item.order = index + 1;
        batch.update(doc(db, collectionName, item.id), { order: item.order });
    });
    
    await batch.commit();
    clearPublicCache();
    refreshCallback();
};

function renderAdminTable() {
    const listContainer = document.getElementById('admin-players-list');
    if(!listContainer) return;
    const paginationContainer = document.getElementById('pagination-controls');
    
    let filtered = adminSearchQuery.length > 0 
        ? allAdminPlayers.filter(p => p.name.toLowerCase().includes(adminSearchQuery))
        : allAdminPlayers;
    
    filtered.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (adminCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    listContainer.innerHTML = '';
    if (paginated.length === 0) {
        listContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucun joueur trouvé.</td></tr>';
        if(paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    paginated.forEach((player, indexOnPage) => {
        const globalIndex = startIndex + indexOnPage;
        
        // 🪄 LE CHAMP DE NUMÉRO REMPLACE LES FLÈCHES
        const orderInput = `<input type="number" class="input-order" data-id="${player.id}" value="${player.order || globalIndex + 1}">`;
        const catLabel = adminSearchQuery.length > 0 ? `<br><span style="font-size:0.8rem; color:#888;">${player.category}</span>` : '';

        listContainer.innerHTML += `
            <tr>
                <td>${orderInput}</td>
                <td><img src="${player.image_url}" class="player-list-img"></td>
                <td style="font-weight:bold;">${player.name} ${catLabel}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-edit" data-id="${player.id}">Éditer</button>
                        <button class="btn-delete" data-id="${player.id}">Supprimer</button>
                    </div>
                </td>
            </tr>
        `;
    });

    // 🪄 DÉCLENCHEUR : Dès qu'on modifie le chiffre, ça sauvegarde !
    document.querySelectorAll('.input-order').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.getAttribute('data-id');
            const val = e.target.value;
            e.target.disabled = true; 
            updateItemOrder("players", id, val, allAdminPlayers, () => loadAdminPlayers(adminCurrentCat));
        });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', (e) => editPlayer(e.target.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', (e) => deletePlayer(e.target.dataset.id)));

    if(paginationContainer) {
        paginationContainer.innerHTML = '';
        for(let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = `pag-btn ${i === adminCurrentPage ? 'active' : ''}`;
            btn.addEventListener('click', () => { adminCurrentPage = i; renderAdminTable(); });
            paginationContainer.appendChild(btn);
        }
    }
}

const btnAddForm = document.getElementById('btn-show-add-form');
if(btnAddForm) {
    btnAddForm.addEventListener('click', () => {
        const form = document.getElementById('content-form');
        if(form) form.reset();
        const idInput = document.getElementById('edit-player-id');
        if(idInput) idInput.value = '';
        const urlInput = document.getElementById('existing-image-url');
        if(urlInput) urlInput.value = '';
        const title = document.getElementById('form-title');
        if(title) title.textContent = "Créer un Profil";
        const pubBtn = document.getElementById('publish-btn');
        if(pubBtn) pubBtn.textContent = "Ajouter au Roster";
        
        const ui = document.getElementById('cropper-ui');
        if(ui) ui.classList.add('hidden');
        const dz = document.getElementById('drop-zone');
        if(dz) dz.classList.remove('hidden');
        
        prefillImageZone('drop-zone', 'existing-image-url', '', 'Glissez la photo du joueur ici');
        cropState.img = null;
        hideAllSections(); 
        const secF = document.getElementById('form-player-section');
        if(secF) secF.classList.remove('hidden');
    });
}

document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => { 
        hideAllSections(); 
        const secM = document.getElementById('manage-players-section');
        if(secM) secM.classList.remove('hidden'); 
    });
});

function editPlayer(id) {
    const player = allAdminPlayers.find(p => p.id === id);
    if(!player) return;
    
    const fields = ['edit-player-id', 'player-name', 'player-stat', 'player-tm', 'player-category', 'existing-image-url'];
    const values = [player.id, player.name, player.stat || '', player.transfermarkt || '', player.category, player.image_url];
    
    fields.forEach((f, i) => {
        const el = document.getElementById(f);
        if(el) el.value = values[i];
    });
    
    const formTitle = document.getElementById('form-title');
    if(formTitle) formTitle.textContent = "Modifier : " + player.name;
    const pubBtn = document.getElementById('publish-btn');
    if(pubBtn) pubBtn.textContent = "Mettre à jour";
    
    const ui = document.getElementById('cropper-ui');
    if(ui) ui.classList.add('hidden');
    const dz = document.getElementById('drop-zone');
    if(dz) dz.classList.remove('hidden');
    
    prefillImageZone('drop-zone', 'existing-image-url', player.image_url, 'Glissez la photo du joueur ici');
    cropState.img = null;
    hideAllSections(); 
    const secF = document.getElementById('form-player-section');
    if(secF) secF.classList.remove('hidden');
}

async function deletePlayer(id) {
    if(confirm("Supprimer ce profil ?")) {
        await deleteDoc(doc(db, "players", id));
        clearPublicCache();
        loadAdminPlayers(adminCurrentCat);
    }
}

const contentForm = document.getElementById('content-form');
if(contentForm) {
    contentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('publish-btn');
        if(btn) { btn.disabled = true; btn.textContent = "Génération..."; }

        try {
            const editId = document.getElementById('edit-player-id').value;
            const cat = document.getElementById('player-category').value;
            let finalImageUrl = document.getElementById('existing-image-url').value || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
            
            const croppedData = getCroppedWebP();
            if (croppedData) {
                const imageName = `players/${Date.now()}.webp`;
                const storageReference = ref(storage, imageName);
                await uploadString(storageReference, croppedData, 'data_url');
                finalImageUrl = await getDownloadURL(storageReference);
            }

            const payload = {
                name: document.getElementById('player-name').value,
                category: cat,
                stat: document.getElementById('player-stat').value,
                transfermarkt: document.getElementById('player-tm').value,
                image_url: finalImageUrl,
                timestamp: new Date()
            };

            if (editId) {
                await updateDoc(doc(db, "players", editId), payload);
            } else {
                const snap = await getDocs(query(collection(db, "players"), where("category", "==", cat)));
                payload.order = snap.size + 1;
                await addDoc(collection(db, "players"), payload);
            }
            clearPublicCache();
            hideAllSections(); 
            const secM = document.getElementById('manage-players-section');
            if(secM) secM.classList.remove('hidden');
            loadAdminPlayers(cat);
        } catch (err) { 
            alert("Erreur: " + err.message); 
        } finally { 
            if(btn) btn.disabled = false; 
        }
    });
}

/* ================= 5. GESTION DES SERVICES (AVEC SEO) ================= */
let allAdminServices = [];

async function loadAdminServices() {
    const list = document.getElementById('admin-services-list');
    if(!list) return;
    list.innerHTML = '<tr><td colspan=\"3\" style=\"text-align:center;\">Chargement...</td></tr>';
    try {
        const querySnapshot = await getDocs(collection(db, "services")); 
        allAdminServices = [];
        querySnapshot.forEach((docSnap) => allAdminServices.push({ id: docSnap.id, ...docSnap.data() })); 
        renderAdminServicesTable();
    } catch (e) {
        list.innerHTML = '<tr><td colspan=\"3\" style=\"color:red;\">Erreur de chargement.</td></tr>';
    }
}

function renderAdminServicesTable() {
    const listContainer = document.getElementById('admin-services-list'); 
    if(!listContainer) return;
    
    allAdminServices.sort((a, b) => (a.order || 999) - (b.order || 999)); 
    listContainer.innerHTML = '';
    
    if (allAdminServices.length === 0) { 
        listContainer.innerHTML = '<tr><td colspan=\"3\" style=\"text-align:center;\">Aucun service trouvé.</td></tr>'; 
        return; 
    }
    
    allAdminServices.forEach((srv, index) => {
        const upBtn = (index !== 0) ? `<button class="btn-order btn-move-srv-up" data-index="${index}">▲</button>` : `<div style=\"width:30px; height:30px;\"></div>`; 
        const downBtn = (index !== allAdminServices.length - 1) ? `<button class="btn-order btn-move-srv-down" data-index="${index}">▼</button>` : `<div style=\"width:30px; height:30px;\"></div>`;
        listContainer.innerHTML += `
            <tr>
                <td style=\"color:var(--usm-pink); font-weight:bold;\">#${srv.order||'-'}</td>
                <td style=\"font-weight:bold;\">${srv.title_fr||'-'}</td>
                <td>
                    <div style=\"display:flex;gap:8px;\">
                        ${upBtn} ${downBtn}
                        <button class=\"btn-edit btn-edit-srv\" data-id=\"${srv.id}\">Éditer</button>
                        <button class=\"btn-delete btn-delete-srv\" data-id=\"${srv.id}\">Supprimer</button>
                    </div>
                </td>
            </tr>`;
    });

    document.querySelectorAll('.btn-edit-srv').forEach(btn => btn.addEventListener('click', (e) => editService(e.target.dataset.id)));
    document.querySelectorAll('.btn-delete-srv').forEach(btn => btn.addEventListener('click', (e) => deleteService(e.target.dataset.id)));
    document.querySelectorAll('.btn-move-srv-up').forEach(btn => btn.addEventListener('click', (e) => moveService(parseInt(e.target.dataset.index), -1)));
    document.querySelectorAll('.btn-move-srv-down').forEach(btn => btn.addEventListener('click', (e) => moveService(parseInt(e.target.dataset.index), 1)));
}

const btnAddSrv = document.getElementById('btn-add-service');
if(btnAddSrv) {
    btnAddSrv.addEventListener('click', () => {
        const form = document.getElementById('service-form');
        if(form) form.reset(); 
        const editId = document.getElementById('edit-service-id');
        if(editId) editId.value = ''; 
        const title = document.getElementById('service-form-title');
        if(title) title.textContent = "Créer un Service";
        
        prefillImageZone('drop-zone-srv', 'existing-srv-img', '', 'Glissez la photo du service ici'); 
        optimizedImages.service = null;
        serviceCropState.card = { ...SERVICE_CROP_DEFAULT };
        serviceCropState.hero = { ...SERVICE_CROP_DEFAULT };
        setServiceCropImage('');
        updateServiceCropCopyPreview();
        hideAllSections(); 
        const secFS = document.getElementById('form-service-section');
        if(secFS) secFS.classList.remove('hidden');
    });
}

document.querySelectorAll('.btn-cancel-service').forEach(btn => {
    btn.addEventListener('click', () => { 
        hideAllSections(); 
        const sec = document.getElementById('manage-services-section');
        if(sec) sec.classList.remove('hidden'); 
    });
});

function editService(id) {
    const srv = allAdminServices.find(s => s.id === id); 
    if(!srv) return;
    
    const editId = document.getElementById('edit-service-id');
    if(editId) editId.value = srv.id;
    
    prefillImageZone('drop-zone-srv', 'existing-srv-img', srv.image_url, 'Glissez la photo du service ici'); 
    optimizedImages.service = null;
    hydrateServiceCropStateFromService(srv);
    
    ['fr', 'en', 'es', 'pt'].forEach(l => { 
        const t = document.getElementById(`srv-title-${l}`);
        if(t) t.value = srv[`title_${l}`] || ''; 
        const sub = document.getElementById(`srv-subtitle-${l}`);
        if(sub) sub.value = srv[`subtitle_${l}`] || ''; 
        const d = document.getElementById(`srv-desc-${l}`);
        if(d) d.value = srv[`desc_${l}`] || ''; 
        const s = document.getElementById(`srv-seo-${l}`);
        if(s) s.value = srv[`seo_${l}`] || ''; 
    });
    
    const title = document.getElementById('service-form-title');
    if(title) title.textContent = "Modifier le Service"; 
    hideAllSections(); 
    const secFS = document.getElementById('form-service-section');
    if(secFS) secFS.classList.remove('hidden');
    updateServiceCropCopyPreview();
}

async function deleteService(id) { 
    if(confirm("Supprimer ce service ?")) { 
        await deleteDoc(doc(db, "services", id)); 
        clearPublicCache();
        loadAdminServices(); 
    } 
}

async function moveService(currentIndex, direction) {
    const targetIndex = currentIndex + direction; 
    if(targetIndex < 0 || targetIndex >= allAdminServices.length) return;
    
    const temp = allAdminServices[currentIndex]; 
    allAdminServices[currentIndex] = allAdminServices[targetIndex]; 
    allAdminServices[targetIndex] = temp;
    
    const batch = writeBatch(db); 
    allAdminServices.forEach((srv, index) => batch.update(doc(db, "services", srv.id), { order: index + 1 })); 
    await batch.commit(); 
    clearPublicCache();
    loadAdminServices();
}

const srvForm = document.getElementById('service-form');
if(srvForm) {
    srvForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const btn = document.getElementById('save-service-btn'); 
        if(btn) { btn.disabled = true; btn.textContent = "Sauvegarde..."; }
        
        try {
            const editId = document.getElementById('edit-service-id').value; 
            let finalSrvUrl = document.getElementById('existing-srv-img').value || "";
            
            if (optimizedImages.service) { 
                const r = ref(storage, `services/${Date.now()}.webp`); 
                await uploadString(r, optimizedImages.service, 'data_url'); 
                finalSrvUrl = await getDownloadURL(r); 
            }
            
            const payload = {
                image_url: finalSrvUrl,
                card_crop: serializeServiceCropSettings(serviceCropState.card),
                hero_crop: serializeServiceCropSettings(serviceCropState.hero),
                timestamp: new Date()
            };
            ['fr', 'en', 'es', 'pt'].forEach(l => { 
                const t = document.getElementById(`srv-title-${l}`);
                if(t) payload[`title_${l}`] = t.value; 
                const sub = document.getElementById(`srv-subtitle-${l}`);
                if(sub) payload[`subtitle_${l}`] = sub.value; 
                const d = document.getElementById(`srv-desc-${l}`);
                if(d) payload[`desc_${l}`] = d.value; 
                const s = document.getElementById(`srv-seo-${l}`);
                if(s) payload[`seo_${l}`] = s.value; 
            });
            
            if (editId) { 
                await updateDoc(doc(db, "services", editId), payload); 
            } else { 
                payload.order = allAdminServices.length + 1; 
                await addDoc(collection(db, "services"), payload); 
            }
            
            clearPublicCache();
            hideAllSections(); 
            const secM = document.getElementById('manage-services-section');
            if(secM) secM.classList.remove('hidden'); 
            loadAdminServices();
        } catch (err) { 
            alert("Erreur: " + err.message); 
        } finally { 
            if(btn) { btn.disabled = false; btn.textContent = "Enregistrer le Service"; } 
        }
    });
}

/* ================= 6. SAUVEGARDE DES PARAMÈTRES GLOBAUX ================= */

window.currentFounderLang = 'fr';
window.founderDataObj = { fr: { quote: '', desc: '' }, en: { quote: '', desc: '' }, es: { quote: '', desc: '' }, pt: { quote: '', desc: '' } };

window.currentAgencyLang = 'fr';
window.agencyDataObj = { fr: { quote: '', desc: '' }, en: { quote: '', desc: '' }, es: { quote: '', desc: '' }, pt: { quote: '', desc: '' } };

const founderTabs = document.querySelectorAll('#founder-lang-tabs .lang-tab');
if (founderTabs.length > 0) {
    founderTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const fQuote = document.getElementById('founder-quote');
            const fDesc = document.getElementById('founder-desc');
            
            if(fQuote) window.founderDataObj[window.currentFounderLang].quote = fQuote.value;
            if(fDesc) window.founderDataObj[window.currentFounderLang].desc = fDesc.value;
            
            founderTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            window.currentFounderLang = tab.getAttribute('data-lang');
            if(fQuote) fQuote.value = window.founderDataObj[window.currentFounderLang].quote || '';
            if(fDesc) fDesc.value = window.founderDataObj[window.currentFounderLang].desc || '';
        });
    });
}

const agencyTabs = document.querySelectorAll('#agency-lang-tabs .lang-tab');
if (agencyTabs.length > 0) {
    agencyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const aQuote = document.getElementById('agency-quote');
            const aDesc = document.getElementById('agency-desc');
            
            if(aQuote) window.agencyDataObj[window.currentAgencyLang].quote = aQuote.value;
            if(aDesc) window.agencyDataObj[window.currentAgencyLang].desc = aDesc.value;
            
            agencyTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            window.currentAgencyLang = tab.getAttribute('data-lang');
            if(aQuote) aQuote.value = window.agencyDataObj[window.currentAgencyLang].quote || '';
            if(aDesc) aDesc.value = window.agencyDataObj[window.currentAgencyLang].desc || '';
        });
    });
}

const settingsForm = document.getElementById('settings-form');
if(settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-settings-btn');
        if(btn) btn.textContent = "Sauvegarde en cours...";
        
        try {
            const fQuote = document.getElementById('founder-quote');
            const fDesc = document.getElementById('founder-desc');
            if(fQuote) window.founderDataObj[window.currentFounderLang].quote = fQuote.value;
            if(fDesc) window.founderDataObj[window.currentFounderLang].desc = fDesc.value;

            const aQuote = document.getElementById('agency-quote');
            const aDesc = document.getElementById('agency-desc');
            if(aQuote) window.agencyDataObj[window.currentAgencyLang].quote = aQuote.value;
            if(aDesc) window.agencyDataObj[window.currentAgencyLang].desc = aDesc.value;

            let finalFounderUrl = document.getElementById('existing-founder-img').value || "";
            if (optimizedImages.founder) {
                const r = ref(storage, `site/founder_${Date.now()}.webp`);
                await uploadString(r, optimizedImages.founder, 'data_url');
                finalFounderUrl = await getDownloadURL(r);
            }

            let finalNavUrl = document.getElementById('existing-logo-nav').value || "";
            if (optimizedImages.nav) {
                const r = ref(storage, `site/logo_nav_${Date.now()}.webp`);
                await uploadString(r, optimizedImages.nav, 'data_url');
                finalNavUrl = await getDownloadURL(r);
            }

            let finalHeroUrl = document.getElementById('existing-logo-hero').value || "";
            if (optimizedImages.hero) {
                const r = ref(storage, `site/logo_hero_${Date.now()}.webp`);
                await uploadString(r, optimizedImages.hero, 'data_url');
                finalHeroUrl = await getDownloadURL(r);
            }
            
            let finalAgencyUrl = document.getElementById('existing-agency-img').value || "";
            if (optimizedImages.agency) {
                const r = ref(storage, `site/agency_${Date.now()}.webp`);
                await uploadString(r, optimizedImages.agency, 'data_url');
                finalAgencyUrl = await getDownloadURL(r);
            }

            const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
            await setDoc(doc(db, "settings", "general"), {
                logoNav: finalNavUrl,
                logoHero: finalHeroUrl,
                founderImg: finalFounderUrl,
                founderQuote_fr: window.founderDataObj['fr'].quote,
                founderDesc_fr: window.founderDataObj['fr'].desc,
                founderQuote_en: window.founderDataObj['en'].quote,
                founderDesc_en: window.founderDataObj['en'].desc,
                founderQuote_es: window.founderDataObj['es'].quote,
                founderDesc_es: window.founderDataObj['es'].desc,
                founderQuote_pt: window.founderDataObj['pt'].quote,
                founderDesc_pt: window.founderDataObj['pt'].desc,
                stat1: getVal('stat-1'),
                stat2: getVal('stat-2'),
                stat3: getVal('stat-3'),
                stat4: getVal('stat-4')
            }, { merge: true });

            const agencyDataToSave = { image: finalAgencyUrl };
            ['fr', 'en', 'es', 'pt'].forEach(lang => {
                agencyDataToSave[`quote_${lang}`] = window.agencyDataObj[lang].quote;
                agencyDataToSave[`desc_${lang}`] = window.agencyDataObj[lang].desc;
            });
            await setDoc(doc(db, "settings", "agency"), agencyDataToSave);
            
            if(document.getElementById('existing-founder-img')) document.getElementById('existing-founder-img').value = finalFounderUrl;
            if(document.getElementById('existing-logo-nav')) document.getElementById('existing-logo-nav').value = finalNavUrl;
            if(document.getElementById('existing-logo-hero')) document.getElementById('existing-logo-hero').value = finalHeroUrl;
            if(document.getElementById('existing-agency-img')) document.getElementById('existing-agency-img').value = finalAgencyUrl;

            optimizedImages = { founder: null, nav: null, hero: null, service: null, agency: null, article: null };
            localStorage.removeItem('site_agency');
            clearPublicCache();
            alert("Identité et Paramètres mis à jour avec succès !");
            
        } catch(err) { 
            alert("Erreur : " + err.message); 
        } finally { 
            if(btn) btn.textContent = "Enregistrer les paramètres"; 
        }
    });
}

/* ================= 7. GESTION DES ONGLETS DE LANGUES ================= */
document.querySelectorAll('.lang-tab-srv').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault(); 
        document.querySelectorAll('.lang-tab-srv').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        document.querySelectorAll('.lang-content-srv').forEach(c => c.classList.add('hidden'));
        const lang = e.target.getAttribute('data-lang');
        const content = document.getElementById(`lang-srv-${lang}`);
        if(content) content.classList.remove('hidden');
        updateServiceCropCopyPreview();
    });
});

/* ================= 8. GESTION DE LA PRESSE (VIDÉOS & ARTICLES) ================= */
let allAdminVideos = [];
let allAdminArticles = [];

window.loadAdminPresse = async () => {
    loadAdminVideos();
    loadAdminArticles();
}

async function loadAdminVideos() {
    const list = document.getElementById('admin-videos-list');
    if(!list) return;
    list.innerHTML = '<tr><td colspan="2" style="text-align:center;">Chargement...</td></tr>';
    try {
        const snap = await getDocs(collection(db, "presse_videos"));
        allAdminVideos = [];
        snap.forEach(docSnap => allAdminVideos.push({ id: docSnap.id, ...docSnap.data() }));
        renderAdminVideos();
    } catch(e) { list.innerHTML = '<tr><td colspan="2" style="color:red;">Erreur.</td></tr>'; }
}

function renderAdminVideos() {
    const list = document.getElementById('admin-videos-list');
    if(!list) return;
    allAdminVideos.sort((a, b) => (a.order || 999) - (b.order || 999));
    list.innerHTML = '';
    if(allAdminVideos.length === 0) { list.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#aaa;">Aucune vidéo.</td></tr>'; return; }
    
    allAdminVideos.forEach((v, index) => {
        const upBtn = index !== 0 ? `<button class="btn-order" onclick="movePresseItem('presse_videos', ${index}, -1)">▲</button>` : `<div style="width:34px;height:34px;"></div>`;
        const downBtn = index !== allAdminVideos.length - 1 ? `<button class="btn-order" onclick="movePresseItem('presse_videos', ${index}, 1)">▼</button>` : `<div style="width:34px;height:34px;"></div>`;
        list.innerHTML += `
            <tr>
                <td style="font-weight:bold;">${v.title || 'Vidéo sans titre'}</td>
                <td>
                    <div style="display:flex;gap:8px;">
                        ${upBtn} ${downBtn}
                        <button class="btn-edit" onclick="editVideo('${v.id}')">Éditer</button> <button class="btn-delete" onclick="deletePresseItem('presse_videos', '${v.id}')">Supprimer</button>
                    </div>
                </td>
            </tr>`;
    });
}

async function loadAdminArticles() {
    const list = document.getElementById('admin-articles-list');
    if(!list) return;
    list.innerHTML = '<tr><td colspan="2" style="text-align:center;">Chargement...</td></tr>';
    try {
        const snap = await getDocs(collection(db, "presse_articles"));
        allAdminArticles = [];
        snap.forEach(docSnap => allAdminArticles.push({ id: docSnap.id, ...docSnap.data() }));
        renderAdminArticles();
    } catch(e) { list.innerHTML = '<tr><td colspan="2" style="color:red;">Erreur.</td></tr>'; }
}

function renderAdminArticles() {
    const list = document.getElementById('admin-articles-list');
    if(!list) return;
    allAdminArticles.sort((a, b) => (a.order || 999) - (b.order || 999));
    list.innerHTML = '';
    if(allAdminArticles.length === 0) { list.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#aaa;">Aucun article.</td></tr>'; return; }
    
    allAdminArticles.forEach((a, index) => {
        const upBtn = index !== 0 ? `<button class="btn-order" onclick="movePresseItem('presse_articles', ${index}, -1)">▲</button>` : `<div style="width:34px;height:34px;"></div>`;
        const downBtn = index !== allAdminArticles.length - 1 ? `<button class="btn-order" onclick="movePresseItem('presse_articles', ${index}, 1)">▼</button>` : `<div style="width:34px;height:34px;"></div>`;
        list.innerHTML += `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <img src="${a.image_url}" style="height:50px; width: 40px; border-radius:4px; object-fit:cover; border: 1px solid #333;">
                        <span style="font-weight:bold;">${a.title || 'Article de Presse'}</span>
                    </div>
                </td>
                <td>
                    <div style="display:flex;gap:8px;">
                        ${upBtn} ${downBtn}
                        <button class="btn-edit" onclick="editArticle('${a.id}')">Éditer</button> <button class="btn-delete" onclick="deletePresseItem('presse_articles', '${a.id}')">Supprimer</button>
                    </div>
                </td>
            </tr>`;
    });
}

window.deletePresseItem = async (collectionName, id) => {
    if(confirm("Supprimer cet élément définitivement ?")) {
        await deleteDoc(doc(db, collectionName, id));
        clearPublicCache();
        if(collectionName === 'presse_videos') loadAdminVideos();
        else loadAdminArticles();
    }
};

window.movePresseItem = async (collectionName, currentIndex, direction) => {
    let items = collectionName === 'presse_videos' ? allAdminVideos : allAdminArticles;
    const targetIndex = currentIndex + direction;
    if(targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[currentIndex];
    items[currentIndex] = items[targetIndex];
    items[targetIndex] = temp;

    const batch = writeBatch(db);
    items.forEach((item, index) => batch.update(doc(db, collectionName, item.id), { order: index + 1 }));
    await batch.commit();
    clearPublicCache();
    if(collectionName === 'presse_videos') loadAdminVideos();
    else loadAdminArticles();
};

const btnAddVid = document.getElementById('btn-add-video');
if(btnAddVid) {
    btnAddVid.addEventListener('click', () => {
        document.getElementById('video-form').reset();
        document.getElementById('edit-video-id').value = '';
        document.getElementById('form-video-title').textContent = "Ajouter une Vidéo";
        hideAllSections();
        document.getElementById('form-video-section').classList.remove('hidden');
    });
}

window.editVideo = (id) => {
    const v = allAdminVideos.find(x => x.id === id);
    if(!v) return;
    document.getElementById('edit-video-id').value = v.id;
    document.getElementById('video-title').value = v.title || '';
    document.getElementById('video-url').value = v.url || '';
    document.getElementById('video-desc').value = v.description || '';
    document.getElementById('form-video-title').textContent = "Modifier la Vidéo";
    hideAllSections();
    document.getElementById('form-video-section').classList.remove('hidden');
};

const btnAddArt = document.getElementById('btn-add-article');
if(btnAddArt) {
    btnAddArt.addEventListener('click', () => {
        document.getElementById('article-form').reset();
        document.getElementById('edit-article-id').value = '';
        document.getElementById('article-link').value = '';
        document.getElementById('form-article-title').textContent = "Ajouter un Article";
        optimizedImages.article = null; 
        prefillImageZone('drop-zone-article', 'existing-article-img', '', 'Glissez la photo de l\'article ici');
        hideAllSections();
        document.getElementById('form-article-section').classList.remove('hidden');
    });
}

window.editArticle = (id) => {
    const a = allAdminArticles.find(x => x.id === id);
    if(!a) return;
    document.getElementById('edit-article-id').value = a.id;
    document.getElementById('article-title').value = a.title || '';
    document.getElementById('article-link').value = a.link || '';
    document.getElementById('article-desc').value = a.description || '';
    document.getElementById('form-article-title').textContent = "Modifier l'Article";
    optimizedImages.article = null; 
    prefillImageZone('drop-zone-article', 'existing-article-img', a.image_url, 'Glissez la photo de l\'article ici');
    hideAllSections();
    document.getElementById('form-article-section').classList.remove('hidden');
};

document.querySelectorAll('.btn-cancel-presse').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        document.getElementById('manage-presse-section').classList.remove('hidden');
    });
});

const vidForm = document.getElementById('video-form');
if(vidForm) {
    vidForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-video-btn');
        btn.disabled = true; btn.textContent = "Enregistrement...";
        try {
            const editId = document.getElementById('edit-video-id').value;
            let url = document.getElementById('video-url').value;
            
            if(url.includes('watch?v=')) {
                url = url.replace('watch?v=', 'embed/');
                const ampersandPos = url.indexOf('&');
                if(ampersandPos !== -1) url = url.substring(0, ampersandPos);
            } else if(url.includes('youtu.be/')) {
                url = url.replace('youtu.be/', 'youtube.com/embed/');
                const qPos = url.indexOf('?');
                if(qPos !== -1) url = url.substring(0, qPos);
            }

            const payload = {
                title: document.getElementById('video-title').value,
                description: document.getElementById('video-desc').value || "", 
                url: url,
                timestamp: new Date()
            };
            
            if(editId) {
                await updateDoc(doc(db, "presse_videos", editId), payload);
            } else {
                payload.order = -Date.now(); 
                await addDoc(collection(db, "presse_videos"), payload);
            }
            
            clearPublicCache(); 
            hideAllSections();
            document.getElementById('manage-presse-section').classList.remove('hidden');
            loadAdminVideos();
        } catch(err) { alert("Erreur: " + err.message); }
        finally { btn.disabled = false; btn.textContent = "Enregistrer la vidéo"; }
    });
}

const artForm = document.getElementById('article-form');
if(artForm) {
    artForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-article-id').value;
        let finalUrl = document.getElementById('existing-article-img').value;
        
        if(!optimizedImages.article && !finalUrl) { alert("Veuillez glisser une image pour l'article."); return; }
        
        const btn = document.getElementById('save-article-btn');
        btn.disabled = true; btn.textContent = "Upload en cours...";
        try {
            if(optimizedImages.article) {
                const r = ref(storage, `presse/article_${Date.now()}.webp`);
                await uploadString(r, optimizedImages.article, 'data_url');
                finalUrl = await getDownloadURL(r);
            }
            
            const payload = {
                title: document.getElementById('article-title').value,
                link: document.getElementById('article-link').value || "", 
                description: document.getElementById('article-desc').value || "", 
                image_url: finalUrl,
                timestamp: new Date()
            };

            if(editId) {
                await updateDoc(doc(db, "presse_articles", editId), payload);
            } else {
                payload.order = -Date.now(); 
                await addDoc(collection(db, "presse_articles"), payload);
            }
            
            clearPublicCache(); 
            hideAllSections();
            document.getElementById('manage-presse-section').classList.remove('hidden');
            loadAdminArticles();
        } catch(err) { alert("Erreur: " + err.message); }
        finally { btn.disabled = false; btn.textContent = "Enregistrer l'article"; }
    });
}

/* ==========================================================================
   🪄 FIX : MÉMORISATION DE L'ONGLET ACTIF (RÉSISTANCE AU F5)
   ========================================================================== */
const navBtnIds = ['nav-manage', 'nav-services', 'nav-settings', 'nav-presse'];

navBtnIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', () => {
            localStorage.setItem('admin_active_tab', id);
        });
    }
});

const dashboardAdmin = document.getElementById('dashboard');
if (dashboardAdmin) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && !dashboardAdmin.classList.contains('hidden')) {
                const savedTab = localStorage.getItem('admin_active_tab');
                if (savedTab && document.getElementById(savedTab)) {
                    document.getElementById(savedTab).click();
                }
                observer.disconnect(); 
            }
        });
    });
    observer.observe(dashboardAdmin, { attributes: true });
}

/* ================= 9. GESTION DES RÉSEAUX SOCIAUX ================= */

const SOCIAL_ADMIN_PLATFORMS = ['tiktok', 'linkedin', 'instagram', 'facebook', 'youtube', 'x'];
const SOCIAL_ADMIN_TARGETS = ['usm', 'christophe'];

function getSocialAdminInput(platform, target, suffix = '') {
    const id = suffix ? `social-${platform}-${target}-${suffix}` : `social-${platform}-${target}`;
    return document.getElementById(id);
}

function setSocialAdminStatus(message = '', type = 'info') {
    const status = document.getElementById('social-admin-status');
    if (!status) return;

    status.textContent = message;
    status.style.display = message ? 'block' : 'none';

    const colorMap = {
        info: '#aaa',
        success: '#75f0a5',
        warning: '#ffd37a',
        error: '#ff8a8a'
    };
    const borderMap = {
        info: 'rgba(255,255,255,0.08)',
        success: 'rgba(117,240,165,0.28)',
        warning: 'rgba(255,211,122,0.28)',
        error: 'rgba(255,138,138,0.32)'
    };

    status.style.color = colorMap[type] || colorMap.info;
    status.style.borderColor = borderMap[type] || borderMap.info;
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readSocialValue(data, platform, target) {
    if (!isPlainObject(data)) return '';

    const directKey = `${platform}_${target}`;
    const platformData = data[platform];
    const nestedValue = isPlainObject(platformData) ? platformData[target] : '';
    const legacyValue = target === 'usm' && typeof platformData === 'string' ? platformData : '';

    return String(nestedValue || data[directKey] || legacyValue || '').trim();
}

function readSocialFollowers(data, platform, target) {
    if (!isPlainObject(data)) return '';

    const directKey = `${platform}_${target}_followers`;
    const followersRoot = isPlainObject(data.followers) ? data.followers : {};
    const platformFollowers = isPlainObject(followersRoot[platform]) ? followersRoot[platform] : {};
    const nestedValue = platformFollowers[target];
    const directValue = data[directKey];

    const value = nestedValue ?? directValue ?? '';
    return value === 0 ? '' : String(value).trim();
}

function formatSocialSyncDate(value) {
    if (!value) return '';

    let date = value;
    if (typeof value.toDate === 'function') {
        date = value.toDate();
    } else if (typeof value.seconds === 'number') {
        date = new Date(value.seconds * 1000);
    } else if (!(value instanceof Date)) {
        date = new Date(value);
    }

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(date);
}

function renderSocialApiSyncDetails(data = {}) {
    const details = document.getElementById('social-api-sync-details');
    if (!details) return;

    const apiSync = isPlainObject(data.apiSync) ? data.apiSync : {};
    const status = data.last_api_sync_status || apiSync.status || '';
    const updatedAt = data.last_api_sync_at || apiSync.updatedAt || '';
    const errors = Array.isArray(data.last_api_sync_errors)
        ? data.last_api_sync_errors
        : Array.isArray(apiSync.errors)
            ? apiSync.errors
            : [];

    const formattedDate = formatSocialSyncDate(updatedAt);
    const statusLabel = {
        ok: 'OK',
        partial: 'Partielle',
        error: 'Erreur'
    }[status] || status || 'Jamais lancée';

    const errorText = errors.length
        ? ` · Avertissements : ${errors.map(error => error.message || error.status || String(error)).join(' | ')}`
        : '';

    details.textContent = `Dernière synchro API YouTube : ${statusLabel}${formattedDate ? ` · ${formattedDate}` : ''}${errorText}`;
    details.style.display = 'block';
    details.style.color = status === 'error' ? '#ff8a8a' : status === 'partial' ? '#ffd37a' : '#aaa';
}

function setSocialAdminValues(data = {}) {
    SOCIAL_ADMIN_PLATFORMS.forEach((platform) => {
        SOCIAL_ADMIN_TARGETS.forEach((target) => {
            const urlInput = getSocialAdminInput(platform, target);
            const followersInput = getSocialAdminInput(platform, target, 'followers');

            if (urlInput) urlInput.value = readSocialValue(data, platform, target);
            if (followersInput) followersInput.value = readSocialFollowers(data, platform, target);
        });
    });

    renderSocialApiSyncDetails(data);
}

function normalizeSocialAdminUrl(value) {
    return String(value || '').trim();
}

function normalizeSocialAdminFollowers(value) {
    const number = Number.parseInt(String(value || '').replace(/\s/g, ''), 10);
    return Number.isFinite(number) && number > 0 ? number : 0;
}

function buildSocialAdminPayload() {
    const payload = {
        updatedAt: new Date(),
        source: 'admin',
        followers: {}
    };

    SOCIAL_ADMIN_PLATFORMS.forEach((platform) => {
        payload[platform] = {};
        payload.followers[platform] = {};

        SOCIAL_ADMIN_TARGETS.forEach((target) => {
            const url = normalizeSocialAdminUrl(getSocialAdminInput(platform, target)?.value);
            const followers = normalizeSocialAdminFollowers(getSocialAdminInput(platform, target, 'followers')?.value);

            payload[platform][target] = url;
            payload.followers[platform][target] = followers;
            payload[`${platform}_${target}`] = url;
            payload[`${platform}_${target}_followers`] = followers;
        });

        payload[`${platform}_followers`] = payload[`${platform}_usm_followers`];
    });

    return payload;
}

async function loadSocialAdminSettings() {
    setSocialAdminStatus('Chargement des réseaux depuis Firebase...', 'info');

    try {
        const docSnap = await getDoc(doc(db, 'settings', 'social'));
        const data = docSnap.exists() ? docSnap.data() : {};

        setSocialAdminValues(data);
        setSocialAdminStatus(
            docSnap.exists()
                ? 'Réseaux chargés depuis Firebase. Tu peux modifier puis enregistrer.'
                : 'Aucun réglage social trouvé dans Firebase pour le moment. Remplis les champs puis enregistre pour créer settings/social.',
            docSnap.exists() ? 'success' : 'warning'
        );
    } catch (error) {
        console.error('Erreur chargement réseaux:', error);
        setSocialAdminStatus(`Erreur lecture Firebase : ${error.message || error.code || error}`, 'error');
    }
}

const navSocial = document.getElementById('nav-social');
if (navSocial) {
    navSocial.addEventListener('click', async (e) => {
        document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
        const clickedButton = e.currentTarget || navSocial;
        clickedButton.classList.add('active');

        hideAllSections();
        const socialSection = document.getElementById('manage-social-section');
        if (socialSection) socialSection.classList.remove('hidden');

        localStorage.setItem('admin_active_tab', 'nav-social');
        await loadSocialAdminSettings();
    });
}

async function refreshSocialStatsFromAdmin() {
    const btn = document.getElementById('sync-youtube-api-btn');
    const originalText = btn?.textContent || 'Synchroniser YouTube API';

    if (!auth.currentUser) {
        setSocialAdminStatus('Connexion admin expirée. Reconnecte-toi avant de synchroniser.', 'error');
        return;
    }

    if (btn) {
        btn.textContent = 'Synchronisation YouTube...';
        btn.disabled = true;
        btn.style.opacity = '0.65';
    }

    setSocialAdminStatus('Synchronisation YouTube via Firebase Function...', 'info');

    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch('/api/refreshSocialStatsNow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ provider: 'youtube' })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok === false) {
            throw new Error(result.message || `Erreur HTTP ${response.status}`);
        }

        clearPublicCache();
        localStorage.removeItem('site_social');
        localStorage.removeItem('site_social_picker_v1');
        localStorage.removeItem('site_social_picker_v2');

        const updatedTargets = Number(result.successfulUpdates || 0);
        setSocialAdminStatus(
            updatedTargets > 0
                ? `Synchronisation YouTube terminée : ${updatedTargets} compteur(s) mis à jour.`
                : 'Synchronisation YouTube terminée, aucun compteur mis à jour. Vérifie les liens YouTube.',
            result.status === 'error' ? 'warning' : 'success'
        );

        await loadSocialAdminSettings();
    } catch (error) {
        console.error('Erreur synchronisation YouTube API:', error);
        setSocialAdminStatus(`Erreur synchro YouTube API : ${error.message || error}`, 'error');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.opacity = '';
        }
    }
}

const syncYoutubeApiBtn = document.getElementById('sync-youtube-api-btn');
if (syncYoutubeApiBtn) {
    syncYoutubeApiBtn.addEventListener('click', refreshSocialStatsFromAdmin);
}

const socialForm = document.getElementById('social-form');
if (socialForm) {
    socialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-social-btn');
        const originalText = btn?.textContent || 'Enregistrer les Réseaux';

        if (btn) {
            btn.textContent = 'Sauvegarde en cours...';
            btn.disabled = true;
        }
        setSocialAdminStatus('Enregistrement dans Firebase...', 'info');

        try {
            const payload = buildSocialAdminPayload();
            await setDoc(doc(db, 'settings', 'social'), payload, { merge: true });

            clearPublicCache();
            localStorage.removeItem('site_social');
            localStorage.removeItem('site_social_picker_v1');
            localStorage.removeItem('site_social_picker_v2');

            setSocialAdminStatus('Réseaux sociaux enregistrés avec succès dans Firebase.', 'success');
            alert('Réseaux sociaux mis à jour avec succès !');
        } catch (err) {
            console.error('Erreur sauvegarde réseaux:', err);
            setSocialAdminStatus(`Erreur écriture Firebase : ${err.message || err.code || err}`, 'error');
            alert('Erreur : ' + (err.message || err.code || err));
        } finally {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    });
}

if (!navBtnIds.includes('nav-social')) {
    navBtnIds.push('nav-social');
}

/* ================= 10. GESTION BANDEROLE IMAGES ================= */
let allMarqueeImages = [];

const navMarquee = document.getElementById('nav-marquee');
if(navMarquee) {
    if (!navBtnIds.includes('nav-marquee')) navBtnIds.push('nav-marquee');
    navMarquee.addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        hideAllSections();
        document.getElementById('manage-marquee-section').classList.remove('hidden');
        localStorage.setItem('admin_active_tab', 'nav-marquee');
        loadAdminMarquee();
    });
}

setupDropZone('drop-zone-marquee', 'marquee-upload', 'marquee');

async function loadAdminMarquee() {
    const list = document.getElementById('admin-marquee-list');
    if(!list) return;
    list.innerHTML = '<tr><td colspan="2">Chargement...</td></tr>';
    try {
        const snap = await getDocs(collection(db, "marquee_images"));
        allMarqueeImages = [];
        snap.forEach(docSnap => allMarqueeImages.push({ id: docSnap.id, ...docSnap.data() }));
        allMarqueeImages.sort((a, b) => b.timestamp - a.timestamp); 
        
        list.innerHTML = '';
        if(allMarqueeImages.length === 0) { list.innerHTML = '<tr><td colspan="2" style="color:#aaa;">Aucune image.</td></tr>'; return; }
        
        allMarqueeImages.forEach((img) => {
            list.innerHTML += `
                <tr>
                    <td><img src="${img.image_url}" style="height:60px; border-radius:6px; object-fit:cover;"></td>
                    <td><button class="btn-delete" onclick="deleteMarquee('${img.id}')">Supprimer</button></td>
                </tr>`;
        });
    } catch(e) { list.innerHTML = '<tr><td colspan="2" style="color:red;">Erreur.</td></tr>'; }
}

window.deleteMarquee = async (id) => {
    if(confirm("Supprimer cette image de la banderole ?")) {
        await deleteDoc(doc(db, "marquee_images", id));
        localStorage.removeItem('site_marquee'); 
        loadAdminMarquee();
    }
};

const marqueeForm = document.getElementById('marquee-form');
if(marqueeForm) {
    marqueeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!optimizedImages.marquee) { alert("Veuillez sélectionner une image."); return; }
        
        const btn = document.getElementById('save-marquee-btn');
        btn.disabled = true; btn.textContent = "Upload...";
        try {
            const r = ref(storage, `marquee/${Date.now()}.webp`);
            await uploadString(r, optimizedImages.marquee, 'data_url');
            const url = await getDownloadURL(r);
            
            await addDoc(collection(db, "marquee_images"), { image_url: url, timestamp: Date.now() });
            
            optimizedImages.marquee = null;
            document.getElementById('drop-zone-marquee').innerHTML = `<p>Glissez une nouvelle image ici</p><input type="file" id="marquee-upload" accept="image/*" hidden>`;
            localStorage.removeItem('site_marquee');
            loadAdminMarquee();
        } catch(err) { alert("Erreur: " + err.message); }
        finally { btn.disabled = false; btn.textContent = "Ajouter à la banderole"; }
    });
}
