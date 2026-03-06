/* ==========================================================================
   USM FOOTBALL - ADMIN JAVASCRIPT (CMS COMPLET)
   ========================================================================== */

/* ================= 1. IMPORTS & CONFIGURATION FIREBASE ================= */
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

/* ================= 2. AUTHENTIFICATION & ANTI-FLICKER ================= */
onAuthStateChanged(auth, (user) => {
    // Cache le loader global dès que Firebase répond
    document.getElementById('auth-loader').classList.add('hidden');

    if (user) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadAdminPlayers(); // Charge les joueurs au démarrage
    } else {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    }
});

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pwd = document.getElementById('admin-pwd').value;
    signInWithEmailAndPassword(auth, email, pwd)
        .catch(err => { alert("Identifiants incorrects."); });
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.reload());
});

/* ================= 3. GESTION DE LA NAVIGATION (ONGLETS ADMIN) ================= */
const secManage = document.getElementById('manage-players-section');
const secForm = document.getElementById('form-player-section');
const secSettings = document.getElementById('settings-section');

// Navigation principale (Sidebar)
document.getElementById('nav-manage').addEventListener('click', (e) => {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    secManage.classList.remove('hidden'); 
    secForm.classList.add('hidden'); 
    secSettings.classList.add('hidden');
    loadAdminPlayers();
});

document.getElementById('nav-settings').addEventListener('click', async (e) => {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    secSettings.classList.remove('hidden'); 
    secManage.classList.add('hidden'); 
    secForm.classList.add('hidden');
    
    // Charger les paramètres actuels du site
    const docSnap = await getDoc(doc(db, "settings", "general"));
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('set-stat1').value = data.stat1 || '';
        document.getElementById('set-stat2').value = data.stat2 || '';
        document.getElementById('set-stat3').value = data.stat3 || '';
    }
});

// Boutons d'ouverture/fermeture du Formulaire
document.getElementById('btn-show-add-form').addEventListener('click', () => {
    document.getElementById('content-form').reset();
    document.getElementById('edit-player-id').value = '';
    document.getElementById('existing-image-url').value = '';
    document.getElementById('form-title').textContent = "Créer un Profil";
    document.getElementById('publish-btn').textContent = "Ajouter au Roster";
    document.getElementById('drop-zone').innerHTML = "<p>Glissez la photo du joueur ici</p>";
    optimizedWebMedia = null;
    
    secManage.classList.add('hidden'); 
    secForm.classList.remove('hidden');
});

document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
        secForm.classList.add('hidden'); 
        secManage.classList.remove('hidden');
    });
});

/* ================= 4. TRAITEMENT DE L'IMAGE (CANVAS & WEBP) ================= */
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
            
            // Redimensionnement max 1200px
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

/* ================= 5. GESTION DES JOUEURS : CRÉATION & MODIFICATION ================= */

// A. Remplir le formulaire pour Modification
window.editPlayer = function(id) {
    const player = adminPlayers.find(p => p.id === id);
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

    secManage.classList.add('hidden'); 
    secForm.classList.remove('hidden');
}

// B. Soumission du Formulaire (Save / Update)
document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('publish-btn');
    btn.disabled = true; btn.textContent = "Enregistrement en cours...";

    try {
        const editId = document.getElementById('edit-player-id').value;
        const cat = document.getElementById('player-category').value;
        
        let finalImageUrl = document.getElementById('existing-image-url').value || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
        
        // Si une nouvelle image a été générée
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
            // MISE À JOUR
            await updateDoc(doc(db, "players", editId), payload);
            alert("Profil mis à jour avec succès !");
        } else {
            // NOUVEAU JOUEUR (Calcul de l'ordre pour se mettre à la fin)
            const q = query(collection(db, "players"), where("category", "==", cat));
            const snap = await getDocs(q);
            payload.order = snap.size + 1;
            await addDoc(collection(db, "players"), payload);
            alert("Nouveau profil ajouté !");
        }

        secForm.classList.add('hidden'); 
        secManage.classList.remove('hidden');
        loadAdminPlayers(); // On rafraichit la liste

    } catch (err) { 
        alert("Erreur: " + err.message); 
    } finally { 
        btn.disabled = false; 
    }
});

/* ================= 6. GESTION DES JOUEURS : LISTE, TRI ET RECHERCHE ================= */
let adminPlayers = [];
let adminCurrentCat = 'gardien';
let adminSearchQuery = '';
let adminCurrentPage = 1;
const ITEMS_PER_PAGE = 5;

// Gestion des onglets de filtres
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        adminCurrentCat = e.target.getAttribute('data-cat');
        adminCurrentPage = 1;
        loadAdminPlayers();
    });
});

// Barre de recherche
document.getElementById('search-bar').addEventListener('input', (e) => {
    adminSearchQuery = e.target.value.toLowerCase();
    adminCurrentPage = 1;
    renderAdminTable();
});

// A. Récupérer depuis Firebase (SANS orderBy pour éviter l'erreur d'Index)
async function loadAdminPlayers() {
    const listContainer = document.getElementById('admin-players-list');
    listContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement...</td></tr>';
    
    try {
        const q = query(collection(db, "players"), where("category", "==", adminCurrentCat));
        const querySnapshot = await getDocs(q);
        
        adminPlayers = [];
        querySnapshot.forEach((docSnap) => {
            adminPlayers.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Tri Javascript (Met ceux qui n'ont pas d'ordre à la fin)
        adminPlayers.sort((a, b) => (a.order || 999) - (b.order || 999));
        
        renderAdminTable();
    } catch (error) {
        console.error(error);
        listContainer.innerHTML = `<tr><td colspan="4" style="color:red;">Erreur de chargement de la base.</td></tr>`;
    }
}

// B. Afficher dans le tableau HTML
function renderAdminTable() {
    const listContainer = document.getElementById('admin-players-list');
    const paginationContainer = document.getElementById('pagination-controls');
    
    // Filtre de recherche
    let filtered = adminPlayers.filter(p => p.name.toLowerCase().includes(adminSearchQuery));
    
    // Pagination
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
        
        // Boutons de tri conditionnels
        const isFirst = globalIndex === 0;
        const isLast = globalIndex === filtered.length - 1;
        const upBtn = (!isFirst && adminSearchQuery === '') ? `<button class="btn-order" onclick="movePlayer(${globalIndex}, -1)" title="Monter">▲</button>` : '';
        const downBtn = (!isLast && adminSearchQuery === '') ? `<button class="btn-order" onclick="movePlayer(${globalIndex}, 1)" title="Descendre">▼</button>` : '';

        listContainer.innerHTML += `
            <tr>
                <td style="font-weight:900; color:var(--usm-pink); font-size:1.2rem;">#${player.order || '-'}</td>
                <td><img src="${player.image_url}" class="player-list-img" alt="Photo"></td>
                <td style="font-weight:bold;">${player.name}</td>
                <td>
                    <div style="display:flex; gap:8px; align-items:center;">
                        ${upBtn} ${downBtn}
                        <button class="btn-edit" style="background:#444; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; margin-left:15px;" onclick="editPlayer('${player.id}')">Éditer</button>
                        <button class="btn-delete" onclick="deletePlayer('${player.id}')">Supprimer</button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Boutons de pagination
    paginationContainer.innerHTML = '';
    for(let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style = `padding: 5px 12px; border:none; border-radius:4px; cursor:pointer; background: ${i === adminCurrentPage ? '#d80056' : '#333'}; color:white;`;
        btn.addEventListener('click', () => { adminCurrentPage = i; renderAdminTable(); });
        paginationContainer.appendChild(btn);
    }
}

// C. Algorithme de réorganisation (Montée / Descente)
window.movePlayer = async function(currentIndex, direction) {
    const targetIndex = currentIndex + direction;
    const temp = adminPlayers[currentIndex];
    adminPlayers[currentIndex] = adminPlayers[targetIndex];
    adminPlayers[targetIndex] = temp;
    await saveNewOrderToFirebase();
};

window.deletePlayer = async function(id) {
    if(confirm("Supprimer définitivement ce profil ?")) {
        await deleteDoc(doc(db, "players", id));
        adminPlayers = adminPlayers.filter(p => p.id !== id);
        await saveNewOrderToFirebase(); // Recalcule l'ordre pour boucher le trou
    }
};

async function saveNewOrderToFirebase() {
    const batch = writeBatch(db);
    
    // Assigne proprement l'ordre de 1 à N
    adminPlayers.forEach((player, index) => {
        const newOrder = index + 1;
        player.order = newOrder;
        const docRef = doc(db, "players", player.id);
        batch.update(docRef, { order: newOrder });
    });

    try {
        await batch.commit();
        renderAdminTable();
    } catch(err) {
        alert("Erreur lors de la réorganisation : " + err.message);
    }
}

/* ================= 7. PARAMÈTRES DU SITE (CMS GLOBAL) ================= */
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
        
        alert("Les statistiques ont été mises à jour sur le site public !");
    } catch(err) { 
        alert("Erreur lors de la sauvegarde : " + err.message); 
    } finally { 
        btn.textContent = "Mettre à jour le site"; 
    }
});
