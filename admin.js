/* ==========================================================================
   USM FOOTBALL - ADMIN JAVASCRIPT (CORRIGÉ : ONGLETS & SERVICES)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, query, writeBatch, getDoc, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = { apiKey: "AIzaSyDd7OvBbX35PaQPlm6saccOGTQyvI3UEoU", authDomain: "usm-football-b56ba.firebaseapp.com", projectId: "usm-football-b56ba", storageBucket: "usm-football-b56ba.firebasestorage.app", messagingSenderId: "1004955626049", appId: "1:1004955626049:web:1982ac82e68599946f74c0" };
const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app); const storage = getStorage(app);

/* ================= 1. AUTHENTIFICATION & NAVIGATION ================= */
onAuthStateChanged(auth, (user) => {
    document.getElementById('auth-loader').classList.add('hidden');
    if (user) { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('dashboard').classList.remove('hidden'); loadAdminPlayers(); loadAdminServices(); } 
    else { document.getElementById('dashboard').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
});
document.getElementById('login-form').addEventListener('submit', (e) => { e.preventDefault(); signInWithEmailAndPassword(auth, document.getElementById('admin-email').value, document.getElementById('admin-pwd').value).catch(() => alert("Identifiants incorrects.")); });
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth).then(() => window.location.reload()));

const secManage = document.getElementById('manage-players-section'), secForm = document.getElementById('form-player-section'), secSettings = document.getElementById('settings-section'), secServices = document.getElementById('manage-services-section'), secFormSrv = document.getElementById('form-service-section');
function hideAllSections() { [secManage, secForm, secSettings, secServices, secFormSrv].forEach(s => s.classList.add('hidden')); }

document.getElementById('nav-manage').addEventListener('click', (e) => { document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); hideAllSections(); secManage.classList.remove('hidden'); });
document.getElementById('nav-services').addEventListener('click', (e) => { document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); hideAllSections(); secServices.classList.remove('hidden'); });
document.getElementById('nav-settings').addEventListener('click', async (e) => {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); hideAllSections(); secSettings.classList.remove('hidden');
    try {
        const d = await getDoc(doc(db, "settings", "general"));
        if (d.exists()) {
            const data = d.data();
            ['stat1', 'stat2', 'stat3', 'stat4'].forEach(s => document.getElementById(`set-${s}`).value = data[s] || '');
            ['fr', 'en', 'es', 'pt'].forEach(lang => { document.getElementById(`set-founder-quote-${lang}`).value = data[`founderQuote_${lang}`] || data.founderQuote || ''; document.getElementById(`set-founder-desc-${lang}`).value = data[`founderDesc_${lang}`] || data.founderDesc || ''; });
            prefillImageZone('drop-zone-nav', 'existing-logo-nav', data.logoNav, 'Glissez le logo header'); prefillImageZone('drop-zone-hero', 'existing-logo-hero', data.logoHero, 'Glissez le logo central'); prefillImageZone('drop-zone-founder', 'existing-founder-img', data.founderImg, 'Glissez la photo du fondateur');
            optimizedImages = { founder: null, nav: null, hero: null, service: null };
        }
    } catch(err) {}
});

function prefillImageZone(zoneId, inputId, url, text) {
    document.getElementById(inputId).value = url || ''; const zone = document.getElementById(zoneId); const fileInput = zone.querySelector('input[type="file"]'); 
    if(url) zone.innerHTML = `<img src="${url}" style="max-height: 80px; border-radius: 8px;"> <p style="font-size:11px; color:#aaa; margin-top:5px;">(Cliquez pour remplacer)</p>`; else zone.innerHTML = `<p style="font-size: 0.9rem;">${text}</p>`;
    if (fileInput) zone.appendChild(fileInput);
}

document.querySelectorAll('.btn-cancel').forEach(btn => btn.addEventListener('click', () => { hideAllSections(); secManage.classList.remove('hidden'); }));
document.querySelectorAll('.btn-cancel-service').forEach(btn => btn.addEventListener('click', () => { hideAllSections(); secServices.classList.remove('hidden'); }));

/* ================= 2. UPLOADS & CROPPER JOUEURS ================= */
let optimizedImages = { founder: null, nav: null, hero: null, service: null };
function setupDropZone(zoneId, inputId, targetKey) {
    const zone = document.getElementById(zoneId); const input = document.getElementById(inputId);
    zone.addEventListener('click', () => input.click()); zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); }); zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('dragover'); processStandardImage(e.dataTransfer.files[0], zone, targetKey); });
    input.addEventListener('change', (e) => processStandardImage(e.target.files[0], zone, targetKey));
}
function processStandardImage(file, zoneElement, targetKey) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const webCanvas = document.createElement('canvas'); const webCtx = webCanvas.getContext('2d');
            let wWidth = img.width, wHeight = img.height; if (wWidth > 1200) { wHeight = Math.round((wHeight * 1200) / wWidth); wWidth = 1200; }
            webCanvas.width = wWidth; webCanvas.height = wHeight; webCtx.drawImage(img, 0, 0, wWidth, wHeight);
            optimizedImages[targetKey] = webCanvas.toDataURL('image/webp', 0.8); 
            const fileInput = zoneElement.querySelector('input[type="file"]');
            zoneElement.innerHTML = `<img src="${optimizedImages[targetKey]}" style="max-height: 80px; border-radius: 8px;"> <p style="color:var(--usm-pink); font-size:11px; margin-top:5px;">✓ Prêt</p>`;
            if (fileInput) zoneElement.appendChild(fileInput);
        }; img.src = event.target.result;
    }; reader.readAsDataURL(file);
}
setupDropZone('drop-zone-founder', 'founder-upload', 'founder'); setupDropZone('drop-zone-nav', 'nav-upload', 'nav'); setupDropZone('drop-zone-hero', 'hero-upload', 'hero'); setupDropZone('drop-zone-srv', 'srv-upload', 'service');

let cropState = { img: null, zoom: 1, x: 0, y: 0, baseScale: 1 };
const playerDropZone = document.getElementById('drop-zone'); const playerInput = document.getElementById('media-upload'); const cropCanvas = document.getElementById('crop-canvas');
if(playerDropZone) {
    playerDropZone.addEventListener('click', () => playerInput.click()); playerDropZone.addEventListener('dragover', (e) => { e.preventDefault(); playerDropZone.classList.add('dragover'); }); playerDropZone.addEventListener('dragleave', () => playerDropZone.classList.remove('dragover'));
    playerDropZone.addEventListener('drop', (e) => { e.preventDefault(); playerDropZone.classList.remove('dragover'); loadPlayerImage(e.dataTransfer.files[0]); });
    playerInput.addEventListener('change', (e) => loadPlayerImage(e.target.files[0]));
}
function loadPlayerImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image(); img.onload = () => {
            cropState.img = img; const scaleX = 240 / img.width; const scaleY = 320 / img.height; cropState.baseScale = Math.max(scaleX, scaleY);
            document.getElementById('crop-zoom').min = cropState.baseScale * 0.2; document.getElementById('crop-zoom').max = cropState.baseScale * 5;
            document.getElementById('crop-x').min = -img.width; document.getElementById('crop-x').max = img.width; document.getElementById('crop-y').min = -img.height; document.getElementById('crop-y').max = img.height;
            resetCropState(); document.getElementById('drop-zone').classList.add('hidden'); document.getElementById('cropper-ui').classList.remove('hidden');
        }; img.src = e.target.result;
    }; reader.readAsDataURL(file);
}
function resetCropState() { cropState.zoom = cropState.baseScale; cropState.x = 0; cropState.y = 0; document.getElementById('crop-zoom').value = cropState.zoom; document.getElementById('crop-x').value = 0; document.getElementById('crop-y').value = 0; updateCropUI(); }
['crop-zoom', 'crop-x', 'crop-y'].forEach(id => { document.getElementById(id).addEventListener('input', (e) => { if(id === 'crop-zoom') cropState.zoom = parseFloat(e.target.value); if(id === 'crop-x') cropState.x = parseFloat(e.target.value); if(id === 'crop-y') cropState.y = parseFloat(e.target.value); updateCropUI(); }); });
if(document.getElementById('btn-reset-crop')) document.getElementById('btn-reset-crop').addEventListener('click', resetCropState);
if(document.getElementById('btn-cancel-crop')) document.getElementById('btn-cancel-crop').addEventListener('click', () => { cropState.img = null; document.getElementById('cropper-ui').classList.add('hidden'); document.getElementById('drop-zone').classList.remove('hidden'); playerInput.value = ''; });

let isDragging = false; let startDragX, startDragY;
if(cropCanvas) {
    cropCanvas.addEventListener('mousedown', (e) => { if(!cropState.img) return; isDragging = true; startDragX = e.clientX; startDragY = e.clientY; cropCanvas.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', () => { isDragging = false; cropCanvas.style.cursor = 'grab'; });
    window.addEventListener('mousemove', (e) => {
        if(!isDragging || !cropState.img) return;
        cropState.x += (e.clientX - startDragX) / cropState.zoom; cropState.y += (e.clientY - startDragY) / cropState.zoom;
        document.getElementById('crop-x').value = cropState.x; document.getElementById('crop-y').value = cropState.y; startDragX = e.clientX; startDragY = e.clientY; updateCropUI();
    });
}
function updateCropUI() {
    document.getElementById('val-zoom').textContent = Math.round((cropState.zoom / cropState.baseScale) * 100) + '%'; document.getElementById('val-x').textContent = Math.round(cropState.x); document.getElementById('val-y').textContent = Math.round(cropState.y);
    const ctx = cropCanvas.getContext('2d'); ctx.clearRect(0,0,240,320); ctx.save(); ctx.translate(120, 160); ctx.scale(cropState.zoom, cropState.zoom); ctx.drawImage(cropState.img, -cropState.img.width/2 + cropState.x, -cropState.img.height/2 + cropState.y); ctx.restore();
}
function getCroppedWebP() {
    if(!cropState.img) return null; const off = document.createElement('canvas'); off.width = 600; off.height = 800; const ctx = off.getContext('2d'); ctx.translate(300, 400); ctx.scale(cropState.zoom * 2.5, cropState.zoom * 2.5); ctx.drawImage(cropState.img, -cropState.img.width/2 + cropState.x, -cropState.img.height/2 + cropState.y); return off.toDataURL('image/webp', 0.9);
}

/* ================= 3. GESTION DES SERVICES (AVEC CORRECTION DES ONGLETS) ================= */
let allAdminServices = [];
async function loadAdminServices() {
    try {
        const querySnapshot = await getDocs(collection(db, "services")); allAdminServices = [];
        querySnapshot.forEach((docSnap) => allAdminServices.push({ id: docSnap.id, ...docSnap.data() })); renderAdminServicesTable();
    } catch (e) {}
}
function renderAdminServicesTable() {
    const listContainer = document.getElementById('admin-services-list'); allAdminServices.sort((a, b) => (a.order || 999) - (b.order || 999)); listContainer.innerHTML = '';
    if (allAdminServices.length === 0) { listContainer.innerHTML = '<tr><td colspan="3" style="text-align:center;">Aucun service.</td></tr>'; return; }
    allAdminServices.forEach((srv, index) => {
        const upBtn = (index !== 0) ? `<button class="btn-order btn-move-srv-up" data-index="${index}">▲</button>` : `<div style="width:30px; height:30px;"></div>`; 
        const downBtn = (index !== allAdminServices.length - 1) ? `<button class="btn-order btn-move-srv-down" data-index="${index}">▼</button>` : `<div style="width:30px; height:30px;"></div>`;
        listContainer.innerHTML += `<tr><td style="color:var(--usm-pink);">#${srv.order||'-'}</td><td style="font-weight:bold;">${srv.title_fr||'-'}</td><td><div style="display:flex;gap:8px;">${upBtn} ${downBtn}<button class="btn-edit-srv" data-id="${srv.id}">Éditer</button><button class="btn-delete-srv" data-id="${srv.id}">Supprimer</button></div></td></tr>`;
    });
    document.querySelectorAll('.btn-edit-srv').forEach(btn => btn.addEventListener('click', (e) => editService(e.target.dataset.id)));
    document.querySelectorAll('.btn-delete-srv').forEach(btn => btn.addEventListener('click', (e) => deleteService(e.target.dataset.id)));
    document.querySelectorAll('.btn-move-srv-up').forEach(btn => btn.addEventListener('click', (e) => moveService(parseInt(e.target.dataset.index), -1)));
    document.querySelectorAll('.btn-move-srv-down').forEach(btn => btn.addEventListener('click', (e) => moveService(parseInt(e.target.dataset.index), 1)));
}

document.getElementById('btn-add-service').addEventListener('click', () => {
    document.getElementById('service-form').reset(); document.getElementById('edit-service-id').value = ''; document.getElementById('service-form-title').textContent = "Créer un Service";
    prefillImageZone('drop-zone-srv', 'existing-srv-img', '', 'Glissez la photo du service ici'); optimizedImages.service = null;
    hideAllSections(); secFormSrv.classList.remove('hidden');
});

function editService(id) {
    const srv = allAdminServices.find(s => s.id === id); if(!srv) return;
    document.getElementById('edit-service-id').value = srv.id;
    prefillImageZone('drop-zone-srv', 'existing-srv-img', srv.image_url, 'Glissez la photo du service ici'); optimizedImages.service = null;
    ['fr', 'en', 'es', 'pt'].forEach(l => { document.getElementById(`srv-title-${l}`).value = srv[`title_${l}`] || ''; document.getElementById(`srv-desc-${l}`).value = srv[`desc_${l}`] || ''; });
    document.getElementById('service-form-title').textContent = "Modifier le Service"; hideAllSections(); secFormSrv.classList.remove('hidden');
}

async function deleteService(id) { if(confirm("Supprimer ce service ?")) { await deleteDoc(doc(db, "services", id)); loadAdminServices(); } }
async function moveService(currentIndex, direction) {
    const targetIndex = currentIndex + direction; if(targetIndex < 0 || targetIndex >= allAdminServices.length) return;
    const temp = allAdminServices[currentIndex]; allAdminServices[currentIndex] = allAdminServices[targetIndex]; allAdminServices[targetIndex] = temp;
    const batch = writeBatch(db); allAdminServices.forEach((srv, index) => batch.update(doc(db, "services", srv.id), { order: index + 1 })); await batch.commit(); loadAdminServices();
}

document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = document.getElementById('save-service-btn'); btn.disabled = true; btn.textContent = "Sauvegarde...";
    try {
        const editId = document.getElementById('edit-service-id').value;
        let finalSrvUrl = document.getElementById('existing-srv-img').value || "";
        if (optimizedImages.service) { const r = ref(storage, `services/${Date.now()}.webp`); await uploadString(r, optimizedImages.service, 'data_url'); finalSrvUrl = await getDownloadURL(r); }
        
        const payload = { image_url: finalSrvUrl, timestamp: new Date() };
        ['fr', 'en', 'es', 'pt'].forEach(l => { payload[`title_${l}`] = document.getElementById(`srv-title-${l}`).value; payload[`desc_${l}`] = document.getElementById(`srv-desc-${l}`).value; });
        
        if (editId) { await updateDoc(doc(db, "services", editId), payload); } 
        else { payload.order = allAdminServices.length + 1; await addDoc(collection(db, "services"), payload); }
        hideAllSections(); secServices.classList.remove('hidden'); loadAdminServices();
    } catch (err) { alert("Erreur: " + err.message); } finally { btn.disabled = false; btn.textContent = "Enregistrer le Service"; }
});

// LE CORRECTIF EST ICI : LES ONGLETS DES SERVICES FONCTIONNENT !
document.querySelectorAll('.lang-tab-srv').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault(); 
        document.querySelectorAll('.lang-tab-srv').forEach(t => t.classList.remove('active')); e.target.classList.add('active');
        document.querySelectorAll('.lang-content-srv').forEach(c => c.classList.add('hidden'));
        document.getElementById(`lang-srv-${e.target.getAttribute('data-lang')}`).classList.remove('hidden');
    });
});

/* ================= 4. GESTION DU ROSTER (JOUEURS) ================= */
let allAdminPlayers = []; let adminCurrentCat = 'gardien'; let adminSearchQuery = ''; let adminCurrentPage = 1; const ITEMS_PER_PAGE = 5;

document.querySelectorAll('.admin-tab:not(.lang-tab):not(.lang-tab-srv)').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-tab:not(.lang-tab):not(.lang-tab-srv)').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); adminCurrentCat = e.target.getAttribute('data-cat');
        adminSearchQuery = ''; document.getElementById('search-bar').value = ''; adminCurrentPage = 1; renderAdminTable();
