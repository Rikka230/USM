/* ================= 1. IMPORTS FIREBASE ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { /* Tes identifiants Firebase Admin */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= 2. AUTHENTIFICATION ================= */
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.replace('active', 'hidden');
        dashboard.classList.replace('hidden', 'active');
    } else {
        dashboard.classList.replace('active', 'hidden');
        loginScreen.classList.replace('hidden', 'active');
    }
});

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pwd = document.getElementById('admin-pwd').value;
    signInWithEmailAndPassword(auth, email, pwd).catch(err => alert("Erreur : " + err.message));
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

/* ================= 3. DRAG & DROP & COMPRESSION CANVAS ================= */
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('media-upload');
let optimizedImageData = null;

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if(e.dataTransfer.files.length) handleImageOptimization(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if(e.target.files.length) handleImageOptimization(e.target.files[0]);
});

function handleImageOptimization(file) {
    if (!file.type.startsWith('image/')) return alert("Seules les images sont acceptées.");
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calcul Redimensionnement (Max 1920px)
            const MAX_WIDTH = 1920;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compression en WebP à 80% de qualité
            optimizedImageData = canvas.toDataURL('image/webp', 0.8);
            dropZone.innerHTML = `<img src="${optimizedImageData}" style="max-height: 200px; border-radius: 8px;">`;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

/* ================= 4. PUBLICATION & WEBHOOK MAKE ================= */
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/TON_ID_WEBHOOK_ICI";

document.getElementById('content-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('publish-btn');
    btn.textContent = "Publication en cours...";
    btn.disabled = true;

    try {
        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const content = document.getElementById('post-content').value;

        // 1. Sauvegarde Firestore (On stocke le Base64 ou une URL Storage si tu l'uploades d'abord)
        const docRef = await addDoc(collection(db, "posts"), {
            title, category, content, image: optimizedImageData,
            timestamp: new Date()
        });

        // 2. Envoi du Payload au Webhook Make (Automatisation)
        await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: docRef.id,
                title: title,
                category: category,
                content: content,
                image: optimizedImageData // Attention, si l'image est trop lourde pour le webhook, privilégier l'envoi du lien Storage
            })
        });

        alert("Succès ! Profil publié et envoyé via Make.");
        document.getElementById('content-form').reset();
        dropZone.innerHTML = "<p>Glissez la photo ici ou cliquez</p>";
        optimizedImageData = null;

    } catch (error) {
        console.error("Erreur de publication :", error);
        alert("Erreur lors de la publication.");
    } finally {
        btn.textContent = "Publier & Diffuser";
        btn.disabled = false;
    }
});