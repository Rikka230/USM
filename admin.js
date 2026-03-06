/* ==========================================================================
   USM FOOTBALL - ADMIN JAVASCRIPT (CMS & RECHERCHE GLOBALE)
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
        loadAdminPlayers(); // Charge tous les joueurs
    } else {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    }
});

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, document.getElementById('admin-email').value, document.getElementById('admin-pwd').value)
        .catch(err => { alert("Identifiants incorrects."); });
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
    
    const docSnap = await getDoc(doc(db, "settings", "general"));
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('set-stat1').value = data.stat1 || '';
        document.getElementById('set-stat2').value = data.stat2 || '';
        document.getElementById('set-stat3').value = data.stat3 || '';
    }
});

document.getElementById('btn-show-add-form').addEventListener('click', () => {
    document.getElementById('content-form').reset();
    document.getElementById('edit-player-id').value = '';
    document.getElementById('existing-image-url').value = '';
    document.getElementById('form-title').textContent = "Créer un Profil";
    document.getElementById('publish-btn').textContent = "Ajouter au Roster";
    document.getElementById('drop-zone').innerHTML = "<p>Glissez la photo du joueur ici</p>";
    optimizedWebMedia = null;
    secManage.classList.add('hidden'); secForm.classList.remove('hidden');
});

document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
        secForm.classList.add('hidden'); secManage.classList.remove('hidden');
    });
});

/* ================= 3. IMAGE (CANVAS) ================= */
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('media-upload');
let optimizedWebMedia = null;

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); handleImage(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', (e) => { handleImage(e.target.files[0]); });

function handleImage(file) {
    if (!file.type.startsWith('image/')) return alert("Image uniquement.");
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
            optimizedWebMedia = webCanvas.toDataURL('image/webp', 0.8);
            dropZone.innerHTML = `<img src="${optimizedWebMedia}" style="max-height: 150px; border-radius: 8px;"> <p style="color:var(--usm-pink); font-size:12px; margin-top:10px;">Prêt pour l'envoi</p>`;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

/* ================= 4. GESTION DES JOUEURS (MOTEUR DE RECHERCHE & AFFICHAGE) ================= */
let allAdminPlayers = []; // Stocke TOUTE la base de données
let adminCurrentCat = 'gardien';
let adminSearchQuery = '';
let adminCurrentPage = 1;
const ITEMS_PER_PAGE = 5;

document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        adminCurrentCat = e.target.getAttribute('data-cat');
        adminSearchQuery = ''; // On vide la recherche quand on change d'onglet
        document.getElementById('search-bar').value = '';
        adminCurrentPage = 1;
        renderAdminTable();
    });
});

document.getElementById('search-bar').addEventListener('input', (e) => {
    adminSearchQuery = e.target.value.toLowerCase();
    adminCurrentPage = 1;
    // Si on cherche, on désactive visuellement les onglets car on cherche partout
    if(adminSearchQuery.length > 0) {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    }
    renderAdminTable();
});

// A. Charger TOUTE la base (Une seule fois pour éviter de ramer)
async function loadAdminPlayers() {
    const listContainer = document.getElementById('admin-players-list');
    listContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement de la base de données...</td></tr>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "players"));
        allAdminPlayers = [];
        querySnapshot.forEach((docSnap) => {
            allAdminPlayers.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderAdminTable();
    } catch (error) {
        listContainer.innerHTML = `<tr><td colspan="4" style="color:red;">Erreur de chargement.</td></tr>`;
    }
}

// B. Rendu du tableau (Avec Recherche Globale)
function renderAdminTable() {
    const listContainer = document.getElementById('admin-players-list');
    const paginationContainer = document.getElementById('pagination-controls');
    
    let filtered = [];
    
    // RECHERCHE GLOBALE : Si on tape un nom, on ignore les onglets et on cherche dans toute la base
    if (adminSearchQuery.length > 0) {
        filtered = allAdminPlayers.filter(p => p.name.toLowerCase().includes(adminSearchQuery));
    } else {
        // Sinon, on affiche l'onglet actif
        filtered = allAdminPlayers.filter(p => p.category === adminCurrentCat);
        // On remet la couleur sur l'onglet actif
        document.querySelector(`.admin-tab[data-cat="${adminCurrentCat}"]`).classList.add('active');
    }
    
    // Tri par ordre d'apparition
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
        
        // On ne peut réorganiser l'ordre que si on est dans un onglet (pas pendant une recherche globale)
        const canMove = adminSearchQuery === '';
        const isFirst = globalIndex === 0;
        const isLast = globalIndex === filtered.length - 1;
        
        const upBtn = (canMove && !isFirst) ? `<button class="btn-order btn-move-up" data-index="${globalIndex}">▲</button>` : '';
        const downBtn = (canMove && !isLast) ? `<button class="btn-order btn-move-down" data-index="${globalIndex}">▼</button>` : '';

        // J'affiche la catégorie sous le nom si on est en mode recherche globale
        const catLabel = adminSearchQuery.length > 0 ? `<br><span style="font-size:0.8rem; color:#888; text-transform:uppercase;">${player.category}</span>` : '';

        listContainer.innerHTML += `
            <tr>
                <td style="font-weight:900; color:var(--usm-pink); font-size:1.2rem;">#${player.order || '-'}</td>
                <td><img src="${player.image_url}" class="player-list-img" alt="Photo"></td>
                <td style="font-weight:bold;">${player.name} ${catLabel}</td>
                <td>
                    <div style="display:flex; gap:8px; align-items:center;">
                        ${upBtn} ${downBtn}
                        <button class="btn-edit" style="background:#444; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; margin-left:10px;" data-id="${player.id}">Éditer</button>
                        <button class="btn-delete" data-id="${player.id}">Supprimer</button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Événements sécurisés (remplace les onclick)
    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', (e) => editPlayer(e.target.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', (e) => deletePlayer(e.target.dataset.id)));
    document.querySelectorAll('.btn-move-up').forEach(btn => btn.addEventListener('click', (e) => movePlayer(parseInt(e.target.dataset.index), -1)));
    document.querySelectorAll('.btn-move-down').forEach(btn => btn.addEventListener('click', (e) => movePlayer(parseInt(e.target.dataset.index), 1)));

    // Pagination
    paginationContainer.innerHTML = '';
    for(let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style = `padding: 5px 12px; border:none; border-radius:4px; cursor:pointer; background: ${i === adminCurrentPage ? '#d80056' : '#333'}; color:white;`;
        btn.addEventListener('click', () => { adminCurrentPage = i; renderAdminTable(); });
        paginationContainer.appendChild(btn);
    }
}

/* ================= 5. CRUD ACTIONS (EDIT, DELETE, MOVE) ================= */
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
    document.getElementById('drop-zone').innerHTML = `<img src="${player.image_url}" style="max-height: 150px; border-radius: 8px;"> <p style="font-size:12px; color:#aaa; margin-top:10px;">(Glissez une nouvelle photo pour remplacer)</p>`;
    
    optimizedWebMedia = null;
    secManage.classList.add('hidden'); secForm.classList.remove('hidden');
}

async function deletePlayer(id) {
    if(confirm("Supprimer définitivement ce profil ?")) {
        await deleteDoc(doc(db, "players", id));
        loadAdminPlayers(); // Recharge propre
    }
}

async function movePlayer(currentIndex, direction) {
    // Récupérer uniquement les joueurs de la catégorie actuelle
    let categoryPlayers = allAdminPlayers.filter(p => p.category === adminCurrentCat);
    categoryPlayers.sort((a, b) => (a.order || 999) - (b.order || 999));

    const targetIndex = currentIndex + direction;
    if(targetIndex < 0 || targetIndex >= categoryPlayers.length) return;

    // Swap
    const temp = categoryPlayers[currentIndex];
    categoryPlayers[currentIndex] = categoryPlayers[targetIndex];
    categoryPlayers[targetIndex] = temp;

    // Batch update
    const batch = writeBatch(db);
    categoryPlayers.forEach((player, index) => {
        const newOrder = index + 1;
        const docRef = doc(db, "players", player.id);
        batch.update(docRef, { order: newOrder });
    });

    try {
        await batch.commit();
        loadAdminPlayers(); // Rafraîchit la base
    } catch(err) { alert("Erreur de réorganisation."); }
}

/* ================= 6. SOUMISSION DU FORMULAIRE (SAVE) ================= */
document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('publish-btn');
    btn.disabled = true; btn.textContent = "Enregistrement en cours...";

    try {
        const editId = document.getElementById('edit-player-id').value;
        const cat = document.getElementById('player-category').value;
        let finalImageUrl = document.getElementById('existing-image-url').value || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
        
        if (optimizedWebMedia) {
            const imageName = `players/${Date.now()}.webp`;
            const storageReference = ref(storage, imageName);
            await uploadString(storageReference, optimizedWebMedia, 'data_url');
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
            alert("Profil mis à jour !");
        } else {
            const q = query(collection(db, "players"), where("category", "==", cat));
            const snap = await getDocs(q);
            payload.order = snap.size + 1;
            await addDoc(collection(db, "players"), payload);
            alert("Nouveau profil ajouté !");
        }

        secForm.classList.add('hidden'); secManage.classList.remove('hidden');
        loadAdminPlayers();

    } catch (err) { alert("Erreur: " + err.message); } 
    finally { btn.disabled = false; }
});

/* ================= 7. PARAMÈTRES DU SITE ================= */
document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = "Sauvegarde en cours...";
    
    try {
        await setDoc(doc(db, "settings", "general"), {
            stat1: document.getElementById('set-stat1').value,
            stat2: document.getElementById('set-stat2').value,
            stat3: document.getElementById('set-stat3').value
        }, { merge: true });
        alert("Les statistiques ont été mises à jour !");
    } catch(err) { alert("Erreur : " + err.message); } 
    finally { btn.textContent = "Mettre à jour le site"; }
});
