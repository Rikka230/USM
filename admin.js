/* ==========================================================================
   USM FOOTBALL - ADMIN JAVASCRIPT (AVEC STUDIO DE CADRAGE PHOTOS)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, query, where, writeBatch, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDd7OvBbX35PaQPlm6saccOGTQyvI3UEoU",
  authDomain: "usm-football-b56ba.firebaseapp.com",
  projectId: "usm-football-b56ba",
  storageBucket: "usm-football-b56ba.firebasestorage.app",
  messagingSenderId: "1004955626049",
  appId: "1:1004955626049:web:1982ac82e68599946f74c0",
  measurementId: "G-5FCYP7CMQD"
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

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth).then(() => window.location.reload()));

/* ================= 2. NAVIGATION ================= */
const secManage = document.getElementById('manage-players-section');
const secForm = document.getElementById('form-player-section');
const secSettings = document.getElementById('settings-section');

document.getElementById('nav-manage').addEventListener('click', (e) => {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    secManage.classList.remove('hidden'); secForm.classList.add('hidden'); secSettings.classList.add('hidden');
});

document.getElementById('nav-settings').addEventListener('click', async (e) => {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    secSettings.classList.remove('hidden'); secManage.classList.add('hidden'); secForm.classList.add('hidden');
    
    try {
        const docSnap = await getDoc(doc(db, "settings", "general"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('set-stat1').value = data.stat1 || '';
            document.getElementById('set-stat2').value = data.stat2 || '';
            document.getElementById('set-stat3').value = data.stat3 || '';
            document.getElementById('set-stat4').value = data.stat4 || '';
            
            ['fr', 'en', 'es', 'pt'].forEach(lang => {
                document.getElementById(`set-founder-quote-${lang}`).value = data[`founderQuote_${lang}`] || data.founderQuote || '';
                document.getElementById(`set-founder-desc-${lang}`).value = data[`founderDesc_${lang}`] || data.founderDesc || '';
            });

            prefillImageZone('drop-zone-nav', 'existing-logo-nav', data.logoNav, 'Glissez le logo header');
            prefillImageZone('drop-zone-hero', 'existing-logo-hero', data.logoHero, 'Glissez le logo central');
            prefillImageZone('drop-zone-founder', 'existing-founder-img', data.founderImg, 'Glissez la photo du fondateur');
            optimizedImages = { founder: null, nav: null, hero: null };
        }
    } catch(err) { console.error(err); }
});

function prefillImageZone(zoneId, inputId, url, defaultText) {
    document.getElementById(inputId).value = url || '';
    const zone = document.getElementById(zoneId);
    const fileInput = zone.querySelector('input[type="file"]'); 
    if(url) zone.innerHTML = `<img src="${url}" style="max-height: 80px; border-radius: 8px;"> <p style="font-size:11px; color:#aaa; margin-top:5px;">(Cliquez pour remplacer)</p>`;
    else zone.innerHTML = `<p style="font-size: 0.9rem;">${defaultText}</p>`;
    if (fileInput) zone.appendChild(fileInput);
}

document.getElementById('btn-show-add-form').addEventListener('click', () => {
    document.getElementById('content-form').reset();
    document.getElementById('edit-player-id').value = '';
    document.getElementById('form-title').textContent = "Créer un Profil";
    document.getElementById('publish-btn').textContent = "Ajouter au Roster";
    
    // Reset du Studio
    document.getElementById('cropper-ui').classList.add('hidden');
    document.getElementById('drop-zone').classList.remove('hidden');
    prefillImageZone('drop-zone', 'existing-image-url', '', 'Glissez la photo du joueur ici');
    cropState.img = null;
    
    secManage.classList.add('hidden'); secForm.classList.remove('hidden');
});

document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => { secForm.classList.add('hidden'); secManage.classList.remove('hidden'); });
});

/* ================= 3. LE STUDIO DE CADRAGE (JOUEURS) ================= */
let cropState = { img: null, zoom: 1, x: 0, y: 0, baseScale: 1 };
const playerDropZone = document.getElementById('drop-zone');
const playerInput = document.getElementById('media-upload');
const cropCanvas = document.getElementById('crop-canvas');

playerDropZone.addEventListener('click', () => playerInput.click());
playerDropZone.addEventListener('dragover', (e) => { e.preventDefault(); playerDropZone.classList.add('dragover'); });
playerDropZone.addEventListener('dragleave', () => playerDropZone.classList.remove('dragover'));
playerDropZone.addEventListener('drop', (e) => { e.preventDefault(); playerDropZone.classList.remove('dragover'); loadPlayerImage(e.dataTransfer.files[0]); });
playerInput.addEventListener('change', (e) => loadPlayerImage(e.target.files[0]));

function loadPlayerImage(file) {
    if (!file || !file.type.startsWith('image/')) return alert("Veuillez utiliser une image.");
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            cropState.img = img;
            // Calcule le ratio pour que l'image couvre parfaitement la carte 3:4 (240x320)
            const scaleX = 240 / img.width;
            const scaleY = 320 / img.height;
            cropState.baseScale = Math.max(scaleX, scaleY);
            
            // Paramétrage des Sliders
            const zSlider = document.getElementById('crop-zoom');
            zSlider.min = cropState.baseScale * 0.2;
            zSlider.max = cropState.baseScale * 5;
            
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
    document.getElementById(id).addEventListener('input', (e) => {
        if(id === 'crop-zoom') cropState.zoom = parseFloat(e.target.value);
        if(id === 'crop-x') cropState.x = parseFloat(e.target.value);
        if(id === 'crop-y') cropState.y = parseFloat(e.target.value);
        updateCropUI();
    });
});

document.getElementById('btn-reset-crop').addEventListener('click', resetCropState);
document.getElementById('btn-cancel-crop').addEventListener('click', () => {
    cropState.img = null;
    document.getElementById('cropper-ui').classList.add('hidden');
    document.getElementById('drop-zone').classList.remove('hidden');
    playerInput.value = '';
});

// DRAG TO PAN (Déplacement à la souris)
let isDragging = false;
let startDragX, startDragY;

cropCanvas.addEventListener('mousedown', (e) => {
    if(!cropState.img) return;
    isDragging = true;
    startDragX = e.clientX; startDragY = e.clientY;
    cropCanvas.style.cursor = 'grabbing';
});
window.addEventListener('mouseup', () => { isDragging = false; cropCanvas.style.cursor = 'grab'; });
window.addEventListener('mousemove', (e) => {
    if(!isDragging || !cropState.img) return;
    const dx = e.clientX - startDragX;
    const dy = e.clientY - startDragY;
    cropState.x += dx / cropState.zoom;
    cropState.y += dy / cropState.zoom;
    
    document.getElementById('crop-x').value = cropState.x;
    document.getElementById('crop-y').value = cropState.y;
    
    startDragX = e.clientX; startDragY = e.clientY;
    updateCropUI();
});

function updateCropUI() {
    document.getElementById('val-zoom').textContent = Math.round((cropState.zoom / cropState.baseScale) * 100) + '%';
    document.getElementById('val-x').textContent = Math.round(cropState.x);
    document.getElementById('val-y').textContent = Math.round(cropState.y);
    
    const ctx = cropCanvas.getContext('2d');
    ctx.clearRect(0,0,240,320);
    ctx.save();
    ctx.translate(120, 160); // Centre du canvas
    ctx.scale(cropState.zoom, cropState.zoom);
    ctx.drawImage(cropState.img, -cropState.img.width/2 + cropState.x, -cropState.img.height/2 + cropState.y);
    ctx.restore();
}

function getCroppedWebP() {
    if(!cropState.img) return null;
    const off = document.createElement('canvas');
    off.width = 600; off.height = 800; // Résolution HD pour le site
    const ctx = off.getContext('2d');
    ctx.translate(300, 400); 
    ctx.scale(cropState.zoom * 2.5, cropState.zoom * 2.5); // 600 / 240 = 2.5
    ctx.drawImage(cropState.img, -cropState.img.width/2 + cropState.x, -cropState.img.height/2 + cropState.y);
    return off.toDataURL('image/webp', 0.9);
}

/* ================= 4. UPLOADS STANDARDS (PARAMÈTRES) ================= */
let optimizedImages = { founder: null, nav: null, hero: null };

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
            webCanvas.width = wWidth; webCanvas.height = wHeight;
            webCtx.drawImage(img, 0, 0, wWidth, wHeight);
            
            const webpData = webCanvas.toDataURL('image/webp', 0.8);
            optimizedImages[targetKey] = webpData; 
            
            const fileInput = zoneElement.querySelector('input[type="file"]');
            zoneElement.innerHTML = `<img src="${webpData}" style="max-height: 80px; border-radius: 8px;"> <p style="color:var(--usm-pink); font-size:11px; margin-top:5px;">✓ Prêt</p>`;
            if (fileInput) zoneElement.appendChild(fileInput);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

setupDropZone('drop-zone-founder', 'founder-upload', 'founder');
setupDropZone('drop-zone-nav', 'nav-upload', 'nav');
setupDropZone('drop-zone-hero', 'hero-upload', 'hero');


/* ================= 5. GESTION DU ROSTER ================= */
let allAdminPlayers = []; 
let adminCurrentCat = 'gardien';
let adminSearchQuery = '';
let adminCurrentPage = 1;
const ITEMS_PER_PAGE = 5;

document.querySelectorAll('.admin-tab:not(.lang-tab)').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-tab:not(.lang-tab)').forEach(t => t.classList.remove('active'));
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
    if(adminSearchQuery.length > 0) document.querySelectorAll('.admin-tab:not(.lang-tab)').forEach(t => t.classList.remove('active'));
    renderAdminTable();
});

async function loadAdminPlayers() {
    const listContainer = document.getElementById('admin-players-list');
    listContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement...</td></tr>';
    try {
        const querySnapshot = await getDocs(collection(db, "players"));
        allAdminPlayers = [];
        querySnapshot.forEach((docSnap) => allAdminPlayers.push({ id: docSnap.id, ...docSnap.data() }));
        renderAdminTable();
    } catch (error) { listContainer.innerHTML = `<tr><td colspan="4" style="color:red;">Erreur.</td></tr>`; }
}

function renderAdminTable() {
    const listContainer = document.getElementById('admin-players-list');
    const paginationContainer = document.getElementById('pagination-controls');
    
    let filtered = adminSearchQuery.length > 0 
        ? allAdminPlayers.filter(p => p.name.toLowerCase().includes(adminSearchQuery))
        : allAdminPlayers.filter(p => p.category === adminCurrentCat);
    
    filtered.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (adminCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    listContainer.innerHTML = '';
    if (paginated.length === 0) {
        listContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucun joueur trouvé.</td></tr>';
        paginationContainer.innerHTML = '';
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

    paginationContainer.innerHTML = '';
    for(let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `pag-btn ${i === adminCurrentPage ? 'active' : ''}`;
        btn.addEventListener('click', () => { adminCurrentPage = i; renderAdminTable(); });
        paginationContainer.appendChild(btn);
    }
}

/* ================= 6. CRUD ACTIONS ================= */
function editPlayer(id) {
    const player = allAdminPlayers.find(p => p.id === id);
    if(!player) return;
    document.getElementById('edit-player-id').value = player.id;
    document.getElementById('player-name').value = player.name;
    document.getElementById('player-stat').value = player.stat || '';
    document.getElementById('player-tm').value = player.transfermarkt || '';
    document.getElementById('player-category').value = player.category;
    document.getElementById('existing-image-url').value = player.image_url;
    document.getElementById('form-title').textContent = "Modifier : " + player.name;
    document.getElementById('publish-btn').textContent = "Mettre à jour";
    
    document.getElementById('cropper-ui').classList.add('hidden');
    document.getElementById('drop-zone').classList.remove('hidden');
    prefillImageZone('drop-zone', 'existing-image-url', player.image_url, 'Glissez la photo du joueur ici');
    cropState.img = null;
    
    secManage.classList.add('hidden'); secForm.classList.remove('hidden');
}

async function deletePlayer(id) {
    if(confirm("Supprimer ce profil ?")) {
        await deleteDoc(doc(db, "players", id));
        loadAdminPlayers();
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

/* ================= 7. SAUVEGARDE JOUEUR ================= */
document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('publish-btn');
    btn.disabled = true; btn.textContent = "Génération de l'image...";

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
        secForm.classList.add('hidden'); secManage.classList.remove('hidden');
        loadAdminPlayers();
    } catch (err) { alert("Erreur: " + err.message); } 
    finally { btn.disabled = false; }
});

/* ================= 8. SAUVEGARDE DES PARAMÈTRES ================= */
document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = "Sauvegarde en cours...";
    
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
        optimizedImages = { founder: null, nav: null, hero: null };

        alert("Identité et Paramètres mis à jour avec succès !");
    } catch(err) { alert("Erreur : " + err.message); } 
    finally { btn.textContent = "Enregistrer les modifications"; }
});

/* ================= 9. GESTION DES ONGLETS DE LANGUE ================= */
document.querySelectorAll('.lang-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault(); 
        document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        document.querySelectorAll('.lang-content').forEach(c => c.classList.add('hidden'));
        const lang = e.target.getAttribute('data-lang');
        document.getElementById(`lang-${lang}`).classList.remove('hidden');
    });
});
