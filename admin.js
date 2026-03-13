/* ==========================================================================
   USM FOOTBALL - ADMIN JAVASCRIPT (VERSION 100% COMPLÈTE)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, query, writeBatch, getDoc, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

/* ================= 1. AUTHENTIFICATION ================= */
onAuthStateChanged(auth, (user) => {
    document.getElementById('auth-loader').classList.add('hidden');
    if (user) { 
        document.getElementById('login-screen').classList.add('hidden'); 
        document.getElementById('dashboard').classList.remove('hidden'); 
        loadAdminPlayers(); 
        loadAdminServices(); 
    } else { 
        document.getElementById('dashboard').classList.add('hidden'); 
        document.getElementById('login-screen').classList.remove('hidden'); 
    }
});

document.getElementById('login-form').addEventListener('submit', (e) => { 
    e.preventDefault(); 
    signInWithEmailAndPassword(auth, document.getElementById('admin-email').value, document.getElementById('admin-pwd').value)
        .catch(() => alert("Identifiants incorrects.")); 
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.reload());
});

/* ================= 2. NAVIGATION ================= */
const secManage = document.getElementById('manage-players-section');
const secForm = document.getElementById('form-player-section');
const secSettings = document.getElementById('settings-section');
const secServices = document.getElementById('manage-services-section');
const secFormSrv = document.getElementById('form-service-section');

function hideAllSections() { 
    [secManage, secForm, secSettings, secServices, secFormSrv].forEach(s => s.classList.add('hidden')); 
}

document.getElementById('nav-manage').addEventListener('click', (e) => { 
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active')); 
    e.target.classList.add('active'); 
    hideAllSections(); 
    secManage.classList.remove('hidden'); 
});

document.getElementById('nav-services').addEventListener('click', (e) => { 
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active')); 
    e.target.classList.add('active'); 
    hideAllSections(); 
    secServices.classList.remove('hidden'); 
});

document.getElementById('nav-settings').addEventListener('click', async (e) => {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active')); 
    e.target.classList.add('active'); 
    hideAllSections(); 
    secSettings.classList.remove('hidden');
    
    try {
        const d = await getDoc(doc(db, "settings", "general"));
        if (d.exists()) {
            const data = d.data();
            ['stat1', 'stat2', 'stat3', 'stat4'].forEach(s => document.getElementById(`set-${s}`).value = data[s] || '');
            
            ['fr', 'en', 'es', 'pt'].forEach(lang => { 
                document.getElementById(`set-founder-quote-${lang}`).value = data[`founderQuote_${lang}`] || data.founderQuote || ''; 
                document.getElementById(`set-founder-desc-${lang}`).value = data[`founderDesc_${lang}`] || data.founderDesc || ''; 
            });
            
            prefillImageZone('drop-zone-nav', 'existing-logo-nav', data.logoNav, 'Glissez le logo header'); 
            prefillImageZone('drop-zone-hero', 'existing-logo-hero', data.logoHero, 'Glissez le logo central'); 
            prefillImageZone('drop-zone-founder', 'existing-founder-img', data.founderImg, 'Glissez la photo du fondateur');
            
            optImages = { founder: null, nav: null, hero: null, service: null };
        }
    } catch(err) { console.error(err); }
});

function prefillImageZone(zoneId, inputId, url, text) {
    document.getElementById(inputId).value = url || ''; 
    const zone = document.getElementById(zoneId); 
    const fileInput = zone.querySelector('input[type="file"]'); 
    
    if(url) {
        zone.innerHTML = `<img src="${url}" style="max-height: 80px; border-radius: 8px;"> <p style="font-size:11px; color:#aaa; margin-top:5px;">(Cliquez pour remplacer)</p>`; 
    } else {
        zone.innerHTML = `<p style="font-size: 0.9rem;">${text}</p>`;
    }
    
    if (fileInput) zone.appendChild(fileInput);
}

document.querySelectorAll('.btn-cancel').forEach(btn => btn.addEventListener('click', () => { hideAllSections(); secManage.classList.remove('hidden'); }));
document.querySelectorAll('.btn-cancel-service').forEach(btn => btn.addEventListener('click', () => { hideAllSections(); secServices.classList.remove('hidden'); }));

/* ================= 3. UPLOADS STANDARDS ================= */
let optImages = { founder: null, nav: null, hero: null, service: null };

function setupDropZone(zoneId, inputId, targetKey) {
    const zone = document.getElementById(zoneId); 
    const input = document.getElementById(inputId);
    
    zone.addEventListener('click', () => input.click()); 
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); }); 
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('dragover'); processStandardImage(e.dataTransfer.files[0], zone, targetKey); });
    
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
            
            webCanvas.width = wWidth; 
            webCanvas.height = wHeight; 
            webCtx.drawImage(img, 0, 0, wWidth, wHeight);
            
            optImages[targetKey] = webCanvas.toDataURL('image/webp', 0.8); 
            
            const fileInput = zoneElement.querySelector('input[type="file"]');
            zoneElement.innerHTML = `<img src="${optImages[targetKey]}" style="max-height: 80px; border-radius: 8px;"> <p style="color:var(--usm-pink); font-size:11px; margin-top:5px;">✓ Prêt</p>`;
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

/* ================= 4. CROPPER (JOUEURS) ================= */
let cropState = { img: null, zoom: 1, x: 0, y: 0, baseScale: 1 };
const playerDropZone = document.getElementById('drop-zone'); 
const playerInput = document.getElementById('media-upload'); 
const cropCanvas = document.getElementById('crop-canvas');

if(playerDropZone) {
    playerDropZone.addEventListener('click', () => playerInput.click()); 
    playerDropZone.addEventListener('dragover', (e) => { e.preventDefault(); playerDropZone.classList.add('dragover'); }); 
    playerDropZone.addEventListener('dragleave', () => playerDropZone.classList.remove('dragover'));
    playerDropZone.addEventListener('drop', (e) => { e.preventDefault(); playerDropZone.classList.remove('dragover'); loadPlayerImage(e.dataTransfer.files[0]); });
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
            
            document.getElementById('crop-zoom').min = cropState.baseScale * 0.2; 
            document.getElementById('crop-zoom').max = cropState.baseScale * 5;
            document.getElementById('crop-x').min = -img.width; 
            document.getElementById('crop-x').max = img.width; 
            document.getElementById('crop-y').min = -img.height; 
            document.getElementById('crop-y').max = img.height;
            
            resetCropState(); 
            document.getElementById('drop-zone').classList.add('hidden'); 
            document.getElementById('cropper-ui').classList.remove('hidden');
        }; 
        img.src = e.target.result;
    }; 
    reader.readAsDataURL(file);
}

function resetCropState() { 
    cropState.zoom = cropState.baseScale; 
    cropState.x = 0; 
    cropState.y = 0; 
    document.getElementById('crop-zoom').value = cropState.zoom; 
    document.getElementById('crop-x').value = 0; 
    document.getElementById('crop-y').value = 0; 
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
        document.getElementById('cropper-ui').classList.add('hidden'); 
        document.getElementById('drop-zone').classList.remove('hidden'); 
        playerInput.value = ''; 
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
        cropState.x += (e.clientX - startDragX) / cropState.zoom; 
        cropState.y += (e.clientY - startDragY) / cropState.zoom;
        document.getElementById('crop-x').value = cropState.x; 
        document.getElementById('crop-y').value = cropState.y; 
        startDragX = e.clientX; 
        startDragY = e.clientY; 
        updateCropUI();
    });
}

function updateCropUI() {
    document.getElementById('val-zoom').textContent = Math.round((cropState.zoom / cropState.baseScale) * 100) + '%'; 
    document.getElementById('val-x').textContent = Math.round(cropState.x); 
    document.getElementById('val-y').textContent = Math.round(cropState.y);
    
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
    off.width = 600; 
    off.height = 800; 
    const ctx = off.getContext('2d'); 
    ctx.translate(300, 400); 
    ctx.scale(cropState.zoom * 2.5, cropState.zoom * 2.5); 
    ctx.drawImage(cropState.img, -cropState.img.width/2 + cropState.x, -cropState.img.height/2 + cropState.y); 
    return off.toDataURL('image/webp', 0.9);
}

/* ================= 5. GESTION DES SERVICES ================= */
let allAdminServices = [];

async function loadAdminServices() {
    try {
        const querySnapshot = await getDocs(collection(db, "services")); 
        allAdminServices = [];
        querySnapshot.forEach((docSnap) => allAdminServices.push({ id: docSnap.id, ...docSnap.data() })); 
        renderAdminServicesTable();
    } catch (e) { console.error(e); }
}

function renderAdminServicesTable() {
    const listContainer = document.getElementById('admin-services-list'); 
    allAdminServices.sort((a, b) => (a.order || 999) - (b.order || 999)); 
    listContainer.innerHTML = '';
    
    if (allAdminServices.length === 0) { 
        listContainer.innerHTML = '<tr><td colspan="3" style="text-align:center;">Aucun service.</td></tr>'; 
        return; 
    }
    
    allAdminServices.forEach((srv, index) => {
        const upBtn = (index !== 0) ? `<button class="btn-order btn-move-srv-up" data-index="${index}">▲</button>` : `<div style="width:30px; height:30px;"></div>`; 
        const downBtn = (index !== allAdminServices.length - 1) ? `<button class="btn-order btn-move-srv-down" data-index="${index}">▼</button>` : `<div style="width:30px; height:30px;"></div>`;
        listContainer.innerHTML += `
            <tr>
                <td style="color:var(--usm-pink);">#${srv.order||'-'}</td>
                <td style="font-weight:bold;">${srv.title_fr||'-'}</td>
                <td>
                    <div style="display:flex;gap:8px;">
                        ${upBtn} ${downBtn}
                        <button class="btn-edit-srv" data-id="${srv.id}">Éditer</button>
                        <button class="btn-delete-srv" data-id="${srv.id}">Supprimer</button>
                    </div>
                </td>
            </tr>`;
    });

    document.querySelectorAll('.btn-edit-srv').forEach(btn => btn.addEventListener('click', (e) => {
        const srv = allAdminServices.find(s => s.id === e.target.dataset.id); 
        if(!srv) return;
        document.getElementById('edit-service-id').value = srv.id; 
        prefillImageZone('drop-zone-srv', 'existing-srv-img', srv.image_url, 'Glissez la photo du service ici'); 
        optImages.service = null;
        
        ['fr', 'en', 'es', 'pt'].forEach(l => { 
            document.getElementById(`srv-title-${l}`).value = srv[`title_${l}`] || ''; 
            document.getElementById(`srv-desc-${l}`).value = srv[`desc_${l}`] || ''; 
        });
        
        document.getElementById('service-form-title').textContent = "Modifier le Service"; 
        hideAllSections(); 
        secFormSrv.classList.remove('hidden');
    }));

    document.querySelectorAll('.btn-delete-srv').forEach(btn => btn.addEventListener('click', async (e) => { 
        if(confirm("Supprimer ce service ?")) { 
            await deleteDoc(doc(db, "services", e.target.dataset.id)); 
            loadAdminServices(); 
        } 
    }));

    document.querySelectorAll('.btn-move-srv-up').forEach(btn => btn.addEventListener('click', async (e) => { 
        moveService(parseInt(e.target.dataset.index), -1); 
    }));

    document.querySelectorAll('.btn-move-srv-down').forEach(btn => btn.addEventListener('click', async (e) => { 
        moveService(parseInt(e.target.dataset.index), 1); 
    }));
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
    loadAdminServices();
}

document.getElementById('btn-add-service').addEventListener('click', () => {
    document.getElementById('service-form').reset(); 
    document.getElementById('edit-service-id').value = ''; 
    document.getElementById('service-form-title').textContent = "Créer un Service";
    prefillImageZone('drop-zone-srv', 'existing-srv-img', '', 'Glissez la photo du service ici'); 
    optImages.service = null;
    hideAllSections(); 
    secFormSrv.classList.remove('hidden');
});

document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const btn = document.getElementById('save-service-btn'); 
    btn.disabled = true; 
    btn.textContent = "Sauvegarde...";
    
    try {
        const editId = document.getElementById('edit-service-id').value; 
        let finalSrvUrl = document.getElementById('existing-srv-img').value || "";
        
        if (optImages.service) { 
            const r = ref(storage, `services/${Date.now()}.webp`); 
            await uploadString(r, optImages.service, 'data_url'); 
            finalSrvUrl = await getDownloadURL(r); 
        }
        
        const payload = { image_url: finalSrvUrl, timestamp: new Date() };
        ['fr', 'en', 'es', 'pt'].forEach(l => { 
            payload[`title_${l}`] = document.getElementById(`srv-title-${l}`).value; 
            payload[`desc_${l}`] = document.getElementById(`srv-desc-${l}`).value; 
        });
        
        if (editId) { 
            await updateDoc(doc(db, "services", editId), payload); 
        } else { 
            payload.order = allAdminServices.length + 1; 
            await addDoc(collection(db, "services"), payload); 
        }
        
        hideAllSections(); 
        secServices.classList.remove('hidden'); 
        loadAdminServices();
    } catch (err) { 
        alert("Erreur: " + err.message); 
    } finally { 
        btn.disabled = false; 
        btn.textContent = "Enregistrer le Service"; 
    }
});

/* ================= 6. GESTION DU ROSTER (JOUEURS) ================= */
let allAdminPlayers = []; 
let adminCurrentCat = 'gardien'; 
let adminSearchQuery = ''; 
let adminCurrentPage = 1; 
const ITEMS_PER_PAGE = 5;

document.querySelectorAll('.admin-tab:not(.lang-tab):not(.lang-tab-srv)').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-tab:not(.lang-tab):not(.lang-tab-srv)').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active'); 
        adminCurrentCat = e.target.getAttribute('data-cat'); 
        adminSearchQuery = ''; 
        document.getElementById('search-bar').value = ''; 
        adminCurrentPage = 1; 
        renderAdminTable();
    });
});

document.getElementById('search-bar').addEventListener('input', (e) => {
    adminSearchQuery = e.target.value.toLowerCase(); 
    adminCurrentPage = 1;
    if(adminSearchQuery.length > 0) {
        document.querySelectorAll('.admin-tab:not(.lang-tab):not(.lang-tab-srv)').forEach(t => t.classList.remove('active')); 
    }
    renderAdminTable();
});

async function loadAdminPlayers() {
    document.getElementById('admin-players-list').innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement...</td></tr>';
    try {
        const querySnapshot = await getDocs(collection(db, "players")); 
        allAdminPlayers = []; 
        querySnapshot.forEach((docSnap) => allAdminPlayers.push({ id: docSnap.id, ...docSnap.data() })); 
        renderAdminTable();
    } catch (error) { 
        document.getElementById('admin-players-list').innerHTML = `<tr><td colspan="4" style="color:red;">Erreur.</td></tr>`; 
    }
}

function renderAdminTable() {
    const listContainer = document.getElementById('admin-players-list');
    let filtered = adminSearchQuery.length > 0 ? allAdminPlayers.filter(p => p.name.toLowerCase().includes(adminSearchQuery)) : allAdminPlayers.filter(p => p.category === adminCurrentCat);
    filtered.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    const startIndex = (adminCurrentPage - 1) * ITEMS_PER_PAGE; 
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    listContainer.innerHTML = '';
    if (paginated.length === 0) { 
        listContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucun joueur trouvé.</td></tr>'; 
        document.getElementById('pagination-controls').innerHTML = ''; 
        return; 
    }

    paginated.forEach((player, indexOnPage) => {
        const globalIndex = startIndex + indexOnPage;
        const upBtn = (adminSearchQuery === '' && globalIndex !== 0) ? `<button class="btn-order btn-move-up" data-index="${globalIndex}">▲</button>` : `<div style="width: 30px; height: 30px;"></div>`; 
        const downBtn = (adminSearchQuery === '' && globalIndex !== filtered.length - 1) ? `<button class="btn-order btn-move-down" data-index="${globalIndex}">▼</button>` : `<div style="width: 30px; height: 30px;"></div>`;
        
        listContainer.innerHTML += `
            <tr>
                <td style="font-weight:900; color:var(--usm-pink);">#${player.order || '-'}</td>
                <td><img src="${player.image_url}" class="player-list-img"></td>
                <td style="font-weight:bold;">${player.name}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        ${upBtn} ${downBtn}
                        <button class="btn-edit" data-id="${player.id}">Éditer</button>
                        <button class="btn-delete" data-id="${player.id}">Supprimer</button>
                    </div>
                </td>
            </tr>`;
    });

    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', (e) => {
        const p = allAdminPlayers.find(x => x.id === e.target.dataset.id); 
        if(!p) return;
        document.getElementById('edit-player-id').value = p.id; 
        document.getElementById('player-name').value = p.name; 
        document.getElementById('player-stat').value = p.stat || ''; 
        document.getElementById('player-tm').value = p.transfermarkt || ''; 
        document.getElementById('player-category').value = p.category; 
        document.getElementById('form-title').textContent = "Modifier : " + p.name; 
        document.getElementById('publish-btn').textContent = "Mettre à jour";
        
        document.getElementById('cropper-ui').classList.add('hidden'); 
        document.getElementById('drop-zone').classList.remove('hidden'); 
        prefillImageZone('drop-zone', 'existing-image-url', p.image_url, 'Glissez la photo du joueur ici'); 
        cropState.img = null; 
        hideAllSections(); 
        secForm.classList.remove('hidden');
    }));

    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async (e) => { 
        if(confirm("Supprimer ce profil ?")) { 
            await deleteDoc(doc(db, "players", e.target.dataset.id)); 
            loadAdminPlayers(); 
        } 
    }));

    document.querySelectorAll('.btn-move-up').forEach(btn => btn.addEventListener('click', async (e) => { 
        movePlayer(parseInt(e.target.dataset.index), -1); 
    }));

    document.querySelectorAll('.btn-move-down').forEach(btn => btn.addEventListener('click', async (e) => { 
        movePlayer(parseInt(e.target.dataset.index), 1); 
    }));

    const paginationContainer = document.getElementById('pagination-controls'); 
    paginationContainer.innerHTML = '';
    for(let i = 1; i <= Math.ceil(filtered.length / ITEMS_PER_PAGE); i++) {
        const btn = document.createElement('button'); 
        btn.textContent = i; 
        btn.className = `pag-btn ${i === adminCurrentPage ? 'active' : ''}`;
        btn.addEventListener('click', () => { adminCurrentPage = i; renderAdminTable(); }); 
        paginationContainer.appendChild(btn);
    }
}

async function movePlayer(currentIndex, direction) {
    let categoryPlayers = allAdminPlayers.filter(p => p.category === adminCurrentCat).sort((a, b) => (a.order || 999) - (b.order || 999));
    const targetIndex = currentIndex + direction; 
    if(targetIndex < 0 || targetIndex >= categoryPlayers.length) return;
    
    const temp = categoryPlayers[currentIndex]; 
    categoryPlayers[currentIndex] = categoryPlayers[targetIndex]; 
    categoryPlayers[targetIndex] = temp;
    
    const batch = writeBatch(db); 
    categoryPlayers.forEach((player, index) => batch.update(doc(db, "players", player.id), { order: index + 1 })); 
    await batch.commit(); 
    loadAdminPlayers();
}

document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const btn = document.getElementById('publish-btn'); 
    btn.disabled = true; 
    btn.textContent = "Génération...";
    
    try {
        const editId = document.getElementById('edit-player-id').value; 
        const cat = document.getElementById('player-category').value;
        let finalImageUrl = document.getElementById('existing-image-url').value || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
        
        const croppedData = getCroppedWebP();
        if (croppedData) { 
            const r = ref(storage, `players/${Date.now()}.webp`); 
            await uploadString(r, croppedData, 'data_url'); 
            finalImageUrl = await getDownloadURL(r); 
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
        
        hideAllSections(); 
        secManage.classList.remove('hidden'); 
        loadAdminPlayers();
    } catch (err) { 
        alert("Erreur: " + err.message); 
    } finally { 
        btn.disabled = false; 
    }
});

/* ================= 7. SAUVEGARDE DES PARAMÈTRES (FONDATEUR & LOGOS) ================= */
document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const btn = e.target.querySelector('button[type="submit"]'); 
    btn.textContent = "Sauvegarde en cours...";
    
    try {
        let finalFounderUrl = document.getElementById('existing-founder-img').value || "";
        if (optImages.founder) { 
            const r = ref(storage, `site/founder_${Date.now()}.webp`); 
            await uploadString(r, optImages.founder, 'data_url'); 
            finalFounderUrl = await getDownloadURL(r); 
        }
        
        let finalNavUrl = document.getElementById('existing-logo-nav').value || "";
        if (optImages.nav) { 
            const r = ref(storage, `site/logo_nav_${Date.now()}.webp`); 
            await uploadString(r, optImages.nav, 'data_url'); 
            finalNavUrl = await getDownloadURL(r); 
        }
        
        let finalHeroUrl = document.getElementById('existing-logo-hero').value || "";
        if (optImages.hero) { 
            const r = ref(storage, `site/logo_hero_${Date.now()}.webp`); 
            await uploadString(r, optImages.hero, 'data_url'); 
            finalHeroUrl = await getDownloadURL(r); 
        }

        await setDoc(doc(db, "settings", "general"), {
            logoNav: finalNavUrl, 
            logoHero: finalHeroUrl, 
            founderImg: finalFounderUrl,
            founderQuote_fr: document.getElementById('set-founder-quote-fr').value, 
            founderDesc_fr: document.getElementById('set-founder-desc-fr').value,
            founderQuote_en: document.getElementById('set-founder-quote-en').value, 
            founderDesc_en: document.getElementById('set-founder-desc-en').value,
            founderQuote_es: document.getElementById('set-founder-quote-es').value, 
            founderDesc_es: document.getElementById('set-founder-desc-es').value,
            founderQuote_pt: document.getElementById('set-founder-quote-pt').value, 
            founderDesc_pt: document.getElementById('set-founder-desc-pt').value,
            stat1: document.getElementById('set-stat1').value, 
            stat2: document.getElementById('set-stat2').value, 
            stat3: document.getElementById('set-stat3').value, 
            stat4: document.getElementById('set-stat4').value
        }, { merge: true });
        
        document.getElementById('existing-founder-img').value = finalFounderUrl; 
        document.getElementById('existing-logo-nav').value = finalNavUrl; 
        document.getElementById('existing-logo-hero').value = finalHeroUrl;
        
        optImages = { founder: null, nav: null, hero: null, service: null };
        alert("Identité et Paramètres mis à jour avec succès !");
    } catch(err) { 
        alert("Erreur : " + err.message); 
    } finally { 
        btn.textContent = "Enregistrer les modifications"; 
    }
});

/* ================= 8. GESTION DE TOUS LES ONGLETS (LANGUES) ================= */
document.querySelectorAll('.lang-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault(); 
        document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active')); 
        e.target.classList.add('active');
        document.querySelectorAll('.lang-content').forEach(c => c.classList.add('hidden')); 
        document.getElementById(`lang-${e.target.getAttribute('data-lang')}`).classList.remove('hidden');
    });
});

document.querySelectorAll('.lang-tab-srv').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault(); 
        document.querySelectorAll('.lang-tab-srv').forEach(t => t.classList.remove('active')); 
        e.target.classList.add('active');
        document.querySelectorAll('.lang-content-srv').forEach(c => c.classList.add('hidden')); 
        document.getElementById(`lang-srv-${e.target.getAttribute('data-lang')}`).classList.remove('hidden');
    });
});
