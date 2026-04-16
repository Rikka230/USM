/* ==========================================================================
   USM FOOTBALL - ADMIN JAVASCRIPT (OPTIMISÉ + SÉCURITÉ ANTI-DDOS)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, query, where, writeBatch, getDoc, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyDd7OvBbX35PaQPlm6saccOGTQyvI3UEoU",
  authDomain: "usm-football-b56ba.firebaseapp.com",
  projectId: "usm-football-b56ba",
  storageBucket: "usm-football-b56ba.firebasestorage.app",
  messagingSenderId: "1004955626049",
  appId: "1:1004955626049:web:1982ac82e68599946f74c0"
};

const app = initializeApp(firebaseConfig);

// --- BOUCLIER ANTI-DDOS (APP CHECK + RECAPTCHA V3) ---
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdF2rUsAAAAAOUCVKJt2DCDKWQIEQXHyBkYETT1'),
  isTokenAutoRefreshEnabled: true
});

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let optimizedImages = { founder: null, nav: null, hero: null, service: null };

// Fonction vitale : quand l'admin modifie quelque chose, on vide le cache local
function clearPublicCache() { localStorage.clear(); }

/* ================= 1. AUTHENTIFICATION ================= */
onAuthStateChanged(auth, (user) => {
    const loader = document.getElementById('auth-loader');
    if(loader) loader.classList.add('hidden');
    
    if (user) {
        const login = document.getElementById('login-screen');
        if(login) login.classList.add('hidden');
        const dash = document.getElementById('dashboard');
        if(dash) dash.classList.remove('hidden');
        
        loadAdminPlayers('gardien'); 
        loadAdminServices();
    } else {
        const dash = document.getElementById('dashboard');
        if(dash) dash.classList.add('hidden');
        const login = document.getElementById('login-screen');
        if(login) login.classList.remove('hidden');
    }
});

const loginForm = document.getElementById('login-form');
if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, document.getElementById('admin-email').value, document.getElementById('admin-pwd').value)
            .catch(err => { alert("Identifiants incorrects."); });
    });
}

const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => signOut(auth).then(() => window.location.reload()));
}

/* ================= 2. NAVIGATION ET CHARGEMENT SETTINGS ================= */
function hideAllSections() {
    ['manage-players-section', 'form-player-section', 'settings-section', 'manage-services-section', 'form-service-section', 'manage-presse-section', 'form-video-section', 'form-article-section'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
}

const navPresse = document.getElementById('nav-presse');
if(navPresse) {
    navPresse.addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        hideAllSections();
        document.getElementById('manage-presse-section').classList.remove('hidden');
        loadAdminPresse(); // Lance le téléchargement de la presse
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
                
                ['stat1', 'stat2', 'stat3', 'stat4'].forEach(s => {
                    const el = document.getElementById(`set-${s}`);
                    if(el) el.value = data[s] || '';
                });
                
                ['fr', 'en', 'es', 'pt'].forEach(lang => {
                    const q = document.getElementById(`set-founder-quote-${lang}`);
                    if(q) q.value = data[`founderQuote_${lang}`] || data.founderQuote || '';
                    const d = document.getElementById(`set-founder-desc-${lang}`);
                    if(d) d.value = data[`founderDesc_${lang}`] || data.founderDesc || '';
                });

                prefillImageZone('drop-zone-nav', 'existing-logo-nav', data.logoNav, 'Glissez le logo header');
                prefillImageZone('drop-zone-hero', 'existing-logo-hero', data.logoHero, 'Glissez le logo central');
                prefillImageZone('drop-zone-founder', 'existing-founder-img', data.founderImg, 'Glissez la photo du fondateur');
                
                optimizedImages = { founder: null, nav: null, hero: null, service: null };
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

let isDragging = false;
let startDragX, startDragY;

if(cropCanvas) {
    cropCanvas.addEventListener('mousedown', (e) => {
        if(!cropState.img) return;
        isDragging = true;
        startDragX = e.clientX; 
        startDragY = e.clientY;
        cropCanvas.style.cursor = 'grabbing';
    });
    
    window.addEventListener('mouseup', () => { 
        isDragging = false; 
        if(cropCanvas) cropCanvas.style.cursor = 'grab'; 
    });
    
    window.addEventListener('mousemove', (e) => {
        if(!isDragging || !cropState.img) return;
        const dx = e.clientX - startDragX;
        const dy = e.clientY - startDragY;
        cropState.x += dx / cropState.zoom;
        cropState.y += dy / cropState.zoom;
        
        const xSlider = document.getElementById('crop-x');
        if(xSlider) xSlider.value = cropState.x;
        const ySlider = document.getElementById('crop-y');
        if(ySlider) ySlider.value = cropState.y;
        
        startDragX = e.clientX; 
        startDragY = e.clientY;
        updateCropUI();
    });
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
const ITEMS_PER_PAGE = 20; // 20 joueurs par page dans l'administration

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
    listContainer.innerHTML = '<tr><td colspan=\"4\" style=\"text-align:center;\">Chargement...</td></tr>';
    try {
        const q = query(collection(db, "players"), where("category", "==", category));
        const querySnapshot = await getDocs(q);
        allAdminPlayers = [];
        querySnapshot.forEach((docSnap) => allAdminPlayers.push({ id: docSnap.id, ...docSnap.data() }));
        renderAdminTable();
    } catch (error) { 
        listContainer.innerHTML = `<tr><td colspan=\"4\" style=\"color:red;\">Erreur base de données.</td></tr>`; 
    }
}

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
        listContainer.innerHTML = '<tr><td colspan=\"4\" style=\"text-align:center;\">Aucun joueur trouvé.</td></tr>';
        if(paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    paginated.forEach((player, indexOnPage) => {
        const globalIndex = startIndex + indexOnPage;
        const canMove = adminSearchQuery === '';
        
        const upBtn = (canMove && globalIndex !== 0) ? `<button class="btn-order btn-move-up" data-index="${globalIndex}">▲</button>` : `<div style="width: 30px; height: 30px;"></div>`; 
        const downBtn = (canMove && globalIndex !== filtered.length - 1) ? `<button class="btn-order btn-move-down" data-index="${globalIndex}">▼</button>` : `<div style="width: 30px; height: 30px;"></div>`;
        const catLabel = adminSearchQuery.length > 0 ? `<br><span style="font-size:0.8rem; color:#888;">${player.category}</span>` : '';

        listContainer.innerHTML += `
            <tr>
                <td style="font-weight:900; color:var(--usm-pink);">#${player.order || '-'}</td>
                <td><img src="${player.image_url}" class="player-list-img"></td>
                <td style="font-weight:bold;">${player.name} ${catLabel}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        ${upBtn} ${downBtn}
                        <button class="btn-edit" data-id="${player.id}">Éditer</button>
                        <button class="btn-delete" data-id="${player.id}">Supprimer</button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', (e) => editPlayer(e.target.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', (e) => deletePlayer(e.target.dataset.id)));
    document.querySelectorAll('.btn-move-up').forEach(btn => btn.addEventListener('click', (e) => movePlayer(parseInt(e.target.dataset.index), -1)));
    document.querySelectorAll('.btn-move-down').forEach(btn => btn.addEventListener('click', (e) => movePlayer(parseInt(e.target.dataset.index), 1)));

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

async function movePlayer(currentIndex, direction) {
    let categoryPlayers = allAdminPlayers.sort((a, b) => (a.order || 999) - (b.order || 999));
    const targetIndex = currentIndex + direction;
    if(targetIndex < 0 || targetIndex >= categoryPlayers.length) return;

    const temp = categoryPlayers[currentIndex];
    categoryPlayers[currentIndex] = categoryPlayers[targetIndex];
    categoryPlayers[targetIndex] = temp;

    const batch = writeBatch(db);
    categoryPlayers.forEach((player, index) => batch.update(doc(db, "players", player.id), { order: index + 1 }));
    await batch.commit();
    clearPublicCache();
    loadAdminPlayers(adminCurrentCat);
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
            
            const payload = { image_url: finalSrvUrl, timestamp: new Date() };
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
const settingsForm = document.getElementById('settings-form');
if(settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        if(btn) btn.textContent = "Sauvegarde en cours...";
        
        try {
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

            const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

            await setDoc(doc(db, "settings", "general"), {
                logoNav: finalNavUrl,
                logoHero: finalHeroUrl,
                founderImg: finalFounderUrl,
                founderQuote_fr: getVal('set-founder-quote-fr'),
                founderDesc_fr: getVal('set-founder-desc-fr'),
                founderQuote_en: getVal('set-founder-quote-en'),
                founderDesc_en: getVal('set-founder-desc-en'),
                founderQuote_es: getVal('set-founder-quote-es'),
                founderDesc_es: getVal('set-founder-desc-es'),
                founderQuote_pt: getVal('set-founder-quote-pt'),
                founderDesc_pt: getVal('set-founder-desc-pt'),
                stat1: getVal('set-stat1'),
                stat2: getVal('set-stat2'),
                stat3: getVal('set-stat3'),
                stat4: getVal('set-stat4')
            }, { merge: true });
            
            const eFounder = document.getElementById('existing-founder-img');
            if(eFounder) eFounder.value = finalFounderUrl;
            const eNav = document.getElementById('existing-logo-nav');
            if(eNav) eNav.value = finalNavUrl;
            const eHero = document.getElementById('existing-logo-hero');
            if(eHero) eHero.value = finalHeroUrl;
            
            optimizedImages = { founder: null, nav: null, hero: null, service: null };
            clearPublicCache();
            alert("Identité et Paramètres mis à jour avec succès !");
        } catch(err) { 
            alert("Erreur : " + err.message); 
        } finally { 
            if(btn) btn.textContent = "Enregistrer les modifications"; 
        }
    });
}

/* ================= 7. GESTION DES ONGLETS DE LANGUES ================= */
document.querySelectorAll('.lang-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault(); 
        document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        document.querySelectorAll('.lang-content').forEach(c => c.classList.add('hidden'));
        const lang = e.target.getAttribute('data-lang');
        const content = document.getElementById(`lang-${lang}`);
        if(content) content.classList.remove('hidden');
    });
});

document.querySelectorAll('.lang-tab-srv').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault(); 
        document.querySelectorAll('.lang-tab-srv').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        document.querySelectorAll('.lang-content-srv').forEach(c => c.classList.add('hidden'));
        const lang = e.target.getAttribute('data-lang');
        const content = document.getElementById(`lang-srv-${lang}`);
        if(content) content.classList.remove('hidden');
    });
});

/* ================= 8. GESTION DE LA PRESSE (VIDÉOS & ARTICLES) ================= */
let allAdminVideos = [];
let allAdminArticles = [];

window.loadAdminPresse = async () => {
    loadAdminVideos();
    loadAdminArticles();
}

// --- GESTION DES VIDÉOS ---
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

// --- GESTION DES ARTICLES ---
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

// --- ACTIONS GLOBALES PRESSE ---
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

// --- LOGIQUE D'AFFICHAGE ET D'ÉDITION ---
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

// --- SAUVEGARDE VIDÉO ---
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
                payload.order = allAdminVideos.length + 1;
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

// --- SAUVEGARDE ARTICLE ---
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
                payload.order = allAdminArticles.length + 1;
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
