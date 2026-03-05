/* ================= 1. IMPORTS & CONFIGURATION FIREBASE ADMIN ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

/* ================= 2. AUTHENTIFICATION ================= */
onAuthStateChanged(auth, (user) => {
    document.getElementById('login-screen').classList.toggle('hidden', !!user);
    document.getElementById('dashboard').classList.toggle('hidden', !user);
});

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault(); // Empêche la page de se recharger (et de vider les champs)
    
    const email = document.getElementById('admin-email').value;
    const pwd = document.getElementById('admin-pwd').value;
    
    signInWithEmailAndPassword(auth, email, pwd)
        .catch(err => {
            console.error(err);
            alert("Identifiants incorrects ou non autorisés.");
        });
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

/* ================= 3. TRAITEMENT IMAGE (Canvas WebP & JPG 4:5) ================= */
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('media-upload');
let optimizedWebMedia = null;
let socialMediaMedia = null;

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
            // A. Version WebP pour le site (Allégée)
            const webCanvas = document.createElement('canvas');
            const webCtx = webCanvas.getContext('2d');
            let wWidth = img.width, wHeight = img.height;
            if (wWidth > 1200) { wHeight = Math.round((wHeight * 1200) / wWidth); wWidth = 1200; }
            webCanvas.width = wWidth; webCanvas.height = wHeight;
            webCtx.drawImage(img, 0, 0, wWidth, wHeight);
            optimizedWebMedia = webCanvas.toDataURL('image/webp', 0.8);

            // B. Version JPG 4:5 pour Réseaux
            const socCanvas = document.createElement('canvas');
            const socCtx = socCanvas.getContext('2d');
            const targetRatio = 4/5;
            let cropW, cropH, offX = 0, offY = 0;
            if (img.width / img.height > targetRatio) {
                cropH = img.height; cropW = img.height * targetRatio; offX = (img.width - cropW) / 2;
            } else {
                cropW = img.width; cropH = img.width / targetRatio; offY = (img.height - cropH) / 2;
            }
            socCanvas.width = 1080; socCanvas.height = 1350; // Format Insta
            socCtx.drawImage(img, offX, offY, cropW, cropH, 0, 0, 1080, 1350);
            socialMediaMedia = socCanvas.toDataURL('image/jpeg', 0.9);

            dropZone.innerHTML = `<img src="${optimizedWebMedia}" style="max-height: 200px; border-radius: 8px;"> <p style="color:var(--usm-pink)">Prêt pour publication</p>`;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

/* ================= 4. PUBLICATION & WEBHOOK MAKE ================= */
document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!optimizedWebMedia) return alert("Veuillez ajouter une photo.");

    const btn = document.getElementById('publish-btn');
    btn.disabled = true; 
    btn.textContent = "Upload en cours...";

    try {
        const playerName = document.getElementById('player-name').value;
        const playerCategory = document.getElementById('player-category').value;
        const playerStat = document.getElementById('player-stat').value;

        // 1. Upload Firebase Storage
        const imageName = `players/${Date.now()}_${playerName.replace(/\s+/g, '-').toLowerCase()}.webp`;
        const storageReference = ref(storage, imageName);
        await uploadString(storageReference, optimizedWebMedia, 'data_url');
        const publicImageUrl = await getDownloadURL(storageReference);

        // 2. Sauvegarde Firestore
        const payload = {
            name: playerName,
            category: playerCategory,
            stat: playerStat,
            image_url: publicImageUrl, 
            timestamp: new Date()
        };
        const docRef = await addDoc(collection(db, "players"), payload);

        // 3. Envoi Webhook Make
        await fetch("https://hook.eu1.make.com/TON_ID_WEBHOOK_ICI", {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: docRef.id, image_social: socialMediaMedia })
        });

        alert("Joueur publié avec succès !");
        document.getElementById('content-form').reset();
        dropZone.innerHTML = "<p>Glissez la photo du joueur ici</p>";
        optimizedWebMedia = null; socialMediaMedia = null;

    } catch (err) { 
        console.error(err);
        alert("Erreur: " + err.message); 
    } 
    finally { 
        btn.disabled = false; 
        btn.textContent = "Publier & Envoyer Webhook"; 
    }
});




