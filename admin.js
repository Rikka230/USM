/* ================= 1. IMPORTS & CONFIGURATION FIREBASE ADMIN ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
    // Dès que Firebase répond, on cache le loader global
    document.getElementById('auth-loader').classList.add('hidden');

    if (user) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
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

/* ================= 3. GESTION DES ONGLETS (NAVIGATION ADMIN) ================= */
const navAdd = document.getElementById('nav-add');
const navManage = document.getElementById('nav-manage');
const secAdd = document.getElementById('add-player-section');
const secManage = document.getElementById('manage-players-section');

navAdd.addEventListener('click', () => {
    navAdd.classList.add('active'); navManage.classList.remove('active');
    secAdd.classList.remove('hidden'); secManage.classList.add('hidden');
});

navManage.addEventListener('click', () => {
    navManage.classList.add('active'); navAdd.classList.remove('active');
    secManage.classList.remove('hidden'); secAdd.classList.add('hidden');
    loadAdminPlayers(); // Charge la liste à l'ouverture de l'onglet
});


/* ================= 4. TRAITEMENT IMAGE (Canvas WebP) ================= */
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

            dropZone.innerHTML = `<img src="${optimizedWebMedia}" style="max-height: 200px; border-radius: 8px;"> <p style="color:var(--usm-pink)">Prêt pour publication</p>`;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

/* ================= 5. PUBLICATION (AVEC ORDRE AUTO) ================= */
document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('publish-btn');
    btn.disabled = true; btn.textContent = "Upload en cours...";

    try {
        const cat = document.getElementById('player-category').value;
        
        // Calcul du prochain numéro d'ordre pour ne pas avoir de trou
        const q = query(collection(db, "players"), where("category", "==", cat));
        const snap = await getDocs(q);
        const nextOrder = snap.size + 1;

        let publicImageUrl = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
        if (optimizedWebMedia) {
            const imageName = `players/${Date.now()}.webp`;
            const storageReference = ref(storage, imageName);
            await uploadString(storageReference, optimizedWebMedia, 'data_url');
            publicImageUrl = await getDownloadURL(storageReference);
        }

        const payload = {
            name: document.getElementById('player-name').value,
            category: cat,
            stat: document.getElementById('player-stat').value,
            transfermarkt: document.getElementById('player-tm').value, // Nouveau champ
            order: nextOrder, // Ajout de l'ordre automatique
            image_url: publicImageUrl, 
            timestamp: new Date()
        };

        await addDoc(collection(db, "players"), payload);

        alert("Joueur ajouté en position " + nextOrder);
        document.getElementById('content-form').reset();
        dropZone.innerHTML = "<p>Glissez la photo du joueur ici</p>";
        optimizedWebMedia = null;

    } catch (err) { alert("Erreur: " + err.message); } 
    finally { btn.disabled = false; btn.textContent = "Publier (Ordre Auto)"; }
});

/* ================= 6. GESTION EXPERTE (RECHERCHE, PAGINATION, ORDRE) ================= */
let adminPlayers = [];
let adminCurrentCat = 'gardien';
let adminSearchQuery = '';
let adminCurrentPage = 1;
const ITEMS_PER_PAGE = 5;

// Gestion des onglets Admin
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active', 'pink-accent'));
        e.target.classList.add('active');
        e.target.style.borderBottom = "2px solid var(--usm-pink)"; // Style actif rapide
        
        adminCurrentCat = e.target.getAttribute('data-cat');
        adminCurrentPage = 1; // On reset la page
        loadAdminPlayers();
    });
});

// Gestion de la recherche
document.getElementById('search-bar').addEventListener('input', (e) => {
    adminSearchQuery = e.target.value.toLowerCase();
    adminCurrentPage = 1;
    renderAdminTable();
});

// 1. Récupération de la base (pour l'onglet actif)
async function loadAdminPlayers() {
    const listContainer = document.getElementById('admin-players-list');
    listContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement...</td></tr>';
    
    try {
        const q = query(collection(db, "players"), where("category", "==", adminCurrentCat), orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);
        
        adminPlayers = [];
        querySnapshot.forEach((docSnap) => {
            adminPlayers.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        renderAdminTable();
    } catch (error) {
        console.error(error);
        listContainer.innerHTML = `<tr><td colspan="4" style="color:red;">Erreur de chargement.</td></tr>`;
    }
}

// 2. Affichage avec Filtres et Pagination
function renderAdminTable() {
    const listContainer = document.getElementById('admin-players-list');
    const paginationContainer = document.getElementById('pagination-controls');
    
    // Filtre de recherche
    let filtered = adminPlayers.filter(p => p.name.toLowerCase().includes(adminSearchQuery));
    
    // Pagination (Découpage par 5)
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
        
        // Boutons de réorganisation (Désactivés si recherche en cours ou aux extrémités)
        const isFirst = globalIndex === 0;
        const isLast = globalIndex === filtered.length - 1;
        const upBtn = (!isFirst && adminSearchQuery === '') ? `<button class="btn-order" onclick="movePlayer(${globalIndex}, -1)">▲</button>` : '';
        const downBtn = (!isLast && adminSearchQuery === '') ? `<button class="btn-order" onclick="movePlayer(${globalIndex}, 1)">▼</button>` : '';

        listContainer.innerHTML += `
            <tr>
                <td style="font-weight:900; color:var(--usm-pink); font-size:1.2rem;">#${player.order}</td>
                <td><img src="${player.image_url}" class="player-list-img" alt="Photo"></td>
                <td style="font-weight:bold;">${player.name}</td>
                <td>
                    <div style="display:flex; gap:5px; align-items:center;">
                        ${upBtn} ${downBtn}
                        <button class="btn-delete" style="margin-left:15px;" onclick="deletePlayer('${player.id}', ${player.order})">Supprimer</button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Rendu des boutons de pagination
    paginationContainer.innerHTML = '';
    for(let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style = `padding: 5px 12px; border:none; border-radius:4px; cursor:pointer; background: ${i === adminCurrentPage ? '#d80056' : '#333'}; color:white;`;
        btn.addEventListener('click', () => { adminCurrentPage = i; renderAdminTable(); });
        paginationContainer.appendChild(btn);
    }
}

// 3. Algorithme de Réorganisation ("No Gap")
window.movePlayer = async function(currentIndex, direction) {
    const targetIndex = currentIndex + direction;
    // On inverse les éléments dans le tableau local
    const temp = adminPlayers[currentIndex];
    adminPlayers[currentIndex] = adminPlayers[targetIndex];
    adminPlayers[targetIndex] = temp;

    // Sauvegarde en masse (Batch) pour garantir la numérotation 1, 2, 3...
    await saveNewOrderToFirebase();
};

window.deletePlayer = async function(id, currentOrder) {
    if(confirm("Supprimer définitivement ce joueur ?")) {
        await deleteDoc(doc(db, "players", id));
        // On retire le joueur du tableau local
        adminPlayers = adminPlayers.filter(p => p.id !== id);
        // On recalcule l'ordre de tous les restants pour boucher le "trou"
        await saveNewOrderToFirebase(); 
    }
};

// Fonction de Sauvegarde "Batch" (Mise à jour simultanée)
async function saveNewOrderToFirebase() {
    const batch = writeBatch(db);
    
    // On ré-assigne un ordre parfait (1, 2, 3...) basé sur la nouvelle position dans le tableau
    adminPlayers.forEach((player, index) => {
        const newOrder = index + 1;
        player.order = newOrder; // Met à jour localement
        const docRef = doc(db, "players", player.id);
        batch.update(docRef, { order: newOrder }); // Prépare l'envoi Firebase
    });

    try {
        await batch.commit(); // Exécute toutes les modifications d'un coup
        renderAdminTable(); // Met à jour l'affichage
    } catch(err) {
        alert("Erreur de synchronisation : " + err.message);
    }
}

