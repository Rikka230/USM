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

/* ================= 3. DRAG & DROP & GÉNÉRATION DES MÉDIAS ================= */
// Variables globales pour stocker les deux versions de l'image
let optimizedWebMedia = null;  // Format WebP pour le site
let socialMediaMedia = null;   // Format JPG 4:5 pour Instagram/LinkedIn

function handleImageOptimization(file) {
    if (!file.type.startsWith('image/')) return alert("Seules les images sont acceptées.");
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            
            // --- A. GÉNÉRATION DE L'IMAGE WEB (WebP - Max 1920px) ---
            const webCanvas = document.createElement('canvas');
            const webCtx = webCanvas.getContext('2d');
            
            const MAX_WIDTH = 1920;
            let webWidth = img.width;
            let webHeight = img.height;
            
            if (webWidth > MAX_WIDTH) {
                webHeight = Math.round((webHeight * MAX_WIDTH) / webWidth);
                webWidth = MAX_WIDTH;
            }
            
            webCanvas.width = webWidth;
            webCanvas.height = webHeight;
            webCtx.drawImage(img, 0, 0, webWidth, webHeight);
            optimizedWebMedia = webCanvas.toDataURL('image/webp', 0.8);

            // --- B. GÉNÉRATION DE L'IMAGE SOCIALE (JPG - Ratio 4:5) ---
            const socialCanvas = document.createElement('canvas');
            const socialCtx = socialCanvas.getContext('2d');
            
            const targetRatio = 4 / 5; // Format portrait Instagram/LinkedIn
            const imgRatio = img.width / img.height;
            
            let cropWidth, cropHeight, offsetX, offsetY;

            // Calcul du "Center Crop" (Recadrage centré)
            if (imgRatio > targetRatio) {
                // L'image est trop large -> on coupe les côtés
                cropHeight = img.height;
                cropWidth = img.height * targetRatio;
                offsetX = (img.width - cropWidth) / 2;
                offsetY = 0;
            } else {
                // L'image est trop haute -> on coupe en haut et en bas
                cropWidth = img.width;
                cropHeight = img.width / targetRatio;
                offsetX = 0;
                offsetY = (img.height - cropHeight) / 2;
            }

            // Dimensions de sortie pour les réseaux (ex: 1080x1350)
            const finalSocialWidth = Math.min(cropWidth, 1080);
            const finalSocialHeight = finalSocialWidth / targetRatio;

            socialCanvas.width = finalSocialWidth;
            socialCanvas.height = finalSocialHeight;
            
            // On dessine la portion découpée sur le nouveau canvas
            socialCtx.drawImage(
                img,
                offsetX, offsetY, cropWidth, cropHeight, // Coordonnées Source (découpe)
                0, 0, finalSocialWidth, finalSocialHeight // Coordonnées Destination (rendu)
            );
            
            // Export en JPG qualitatif pour les réseaux sociaux
            socialMediaMedia = socialCanvas.toDataURL('image/jpeg', 0.9);

            // --- C. AFFICHAGE DE LA PRÉVISUALISATION ---
            const dropZone = document.getElementById('drop-zone');
            dropZone.innerHTML = `
                <div style="display: flex; gap: 15px; justify-content: center; align-items: flex-end;">
                    <div>
                        <p style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Format Web</p>
                        <img src="${optimizedWebMedia}" style="max-height: 150px; border-radius: 8px; border: 1px solid #333;">
                    </div>
                    <div>
                        <p style="font-size: 12px; color: #d80056; margin-bottom: 5px;">Format Réseaux (4:5)</p>
                        <img src="${socialMediaMedia}" style="max-height: 150px; border-radius: 8px; border: 1px solid #d80056;">
                    </div>
                </div>
            `;
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
            image_web: optimizedWebMedia,  // Pour mise à jour/stockage lié au site Web
            image_social: socialMediaMedia // Que Make enverra directement à l'API Instagram/LinkedIn
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
