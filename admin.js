/* ================= 1. IMPORTS & CONFIGURATION FIREBASE ADMIN ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

/* ================= 5. PUBLICATION (AJOUT JOUEUR) ================= */
document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('publish-btn');
    btn.disabled = true; btn.textContent = "Upload en cours...";

    try {
        const playerName = document.getElementById('player-name').value;
        let publicImageUrl = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"; // Fallback par défaut

        // Si une image a été droppée, on l'upload
        if (optimizedWebMedia) {
            const imageName = `players/${Date.now()}_${playerName.replace(/\s+/g, '-').toLowerCase()}.webp`;
            const storageReference = ref(storage, imageName);
            await uploadString(storageReference, optimizedWebMedia, 'data_url');
            publicImageUrl = await getDownloadURL(storageReference);
        }

        const payload = {
            name: playerName,
            category: document.getElementById('player-category').value,
            stat: document.getElementById('player-stat').value,
            image_url: publicImageUrl, 
            timestamp: new Date()
        };

        await addDoc(collection(db, "players"), payload);

        alert("Joueur publié avec succès !");
        document.getElementById('content-form').reset();
        dropZone.innerHTML = "<p>Glissez la photo du joueur ici</p>";
        optimizedWebMedia = null;

    } catch (err) { 
        alert("Erreur: " + err.message); 
    } finally { 
        btn.disabled = false; btn.textContent = "Publier sur le site"; 
    }
});

/* ================= 6. GESTION DES JOUEURS (LISTE ET SUPPRESSION) ================= */
async function loadAdminPlayers() {
    const listContainer = document.getElementById('admin-players-list');
    listContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement...</td></tr>';
    
    try {
        const q = query(collection(db, "players"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        listContainer.innerHTML = '';
        
        querySnapshot.forEach((docSnap) => {
            const player = docSnap.data();
            const playerId = docSnap.id;
            
            listContainer.innerHTML += `
                <tr>
                    <td><img src="${player.image_url}" class="player-list-img" alt="Photo"></td>
                    <td style="font-weight:bold;">${player.name}</td>
                    <td style="text-transform:uppercase; color:#888;">${player.category}</td>
                    <td>
                        <button class="btn-delete" data-id="${playerId}">Supprimer</button>
                    </td>
                </tr>
            `;
        });

        // Attacher les événements de suppression
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idToDelete = e.target.getAttribute('data-id');
                if(confirm("Êtes-vous sûr de vouloir retirer ce joueur du site ?")) {
                    e.target.textContent = "...";
                    await deleteDoc(doc(db, "players", idToDelete));
                    loadAdminPlayers(); // Recharge la liste
                }
            });
        });

    } catch (error) {
        listContainer.innerHTML = `<tr><td colspan="4" style="color:red;">Erreur de chargement</td></tr>`;
    }
}
