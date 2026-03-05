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

/* ================= 5. SCRIPT D'IMPORTATION MASSIVE (TEMPORAIRE) ================= */
const jsonPlayersData = {
    "players": [
      {"firstName": "Iker", "lastName": "Casillas", "category": "Gardiens", "info": "167 sélections avec la Roja"},
      {"firstName": "Petr", "lastName": "Cech", "category": "Gardiens", "info": "124 sélections avec la République tchèque"},
      {"firstName": "Nicolas", "lastName": "Penneteau", "category": "Gardiens", "info": "5 sélections avec l'équipe de France U21"},
      {"firstName": "Guillermo", "lastName": "Ochoa", "category": "Gardiens", "info": "148 sélections avec le Mexique"},
      {"firstName": "Yohann", "lastName": "Pelé", "category": "Gardiens", "info": "Nommé au Trophée UNFP de meilleur gardien de Ligue 2 en 2014"},
      {"firstName": "Maxime", "lastName": "Dupé", "category": "Gardiens", "info": "Vainqueur de la Coupe de France 2023"},
      {"firstName": "Florian", "lastName": "Escales", "category": "Gardiens", "info": "13 sélections avec l'équipe de France U20"},
      {"firstName": "Alexandre", "lastName": "Oukidja", "category": "Gardiens", "info": "6 sélections avec l'Algérie"},
      {"firstName": "Landry", "lastName": "Bonnefoi", "category": "Gardiens", "info": "Champion de France de Ligue 2 en 2017"},
      {"firstName": "Nicolas", "lastName": "Douchez", "category": "Gardiens", "info": "Meilleur gardien de Ligue 2 en 2017"},
      {"firstName": "Ludovic", "lastName": "Butelle", "category": "Gardiens", "info": "3 sélections avec la France U21"},
      {"firstName": "Tony", "lastName": "Sylva", "category": "Gardiens", "info": "83 sélections avec le Sénégal"},
      {"firstName": "Gérard", "lastName": "Gnanhouan", "category": "Gardiens", "info": "9 sélections avec la Côte d'Ivoire"},
      {"firstName": "Macedo Magno", "lastName": "Novaes", "category": "Gardiens", "info": "Trophée UNFP de meilleur gardien de Ligue 2 en 2012"},
      {"firstName": "Cyrille", "lastName": "Merville", "category": "Gardiens", "info": "Finaliste de la Coupe de France avec Amiens en 2001"},
      {"firstName": "Jérémy", "lastName": "Frick", "category": "Gardiens", "info": "Champion de Challenge League 2018-19"},
      {"firstName": "Rémy", "lastName": "Descamps", "category": "Gardiens", "info": "Appelé en équipe de France U21"},
      {"firstName": "Jeremy", "lastName": "Mathieu", "category": "Défenseurs", "info": "5 sélections en équipe de France"},
      {"firstName": "Bacary", "lastName": "Sagna", "category": "Défenseurs", "info": "65 sélections avec l'équipe de France"},
      {"firstName": "Mario", "lastName": "Yepes", "category": "Défenseurs", "info": "102 sélections avec l'équipe de Colombie"},
      {"firstName": "Kalidou", "lastName": "Koulibaly", "category": "Défenseurs", "info": "71 sélections avec l'équipe du Sénégal"},
      {"firstName": "Bruno", "lastName": "Alves", "category": "Défenseurs", "info": "96 sélections avec l'équipe du Portugal"},
      {"firstName": "Kolo", "lastName": "Touré", "category": "Défenseurs", "info": "118 sélections avec la Côte d'Ivoire"},
      {"firstName": "Diego", "lastName": "Placente", "category": "Défenseurs", "info": "22 sélections avec l'équipe de l'Argentine"},
      {"firstName": "Mauro", "lastName": "Cetto", "category": "Défenseurs", "info": "Vainqueur de la Copa Libertadores 13/14"},
      {"firstName": "Adriano", "lastName": "Pereira da Silva", "category": "Défenseurs", "info": "Champion de France Ligue 2 en 2013"},
      {"firstName": "Romain", "lastName": "Danzé", "category": "Défenseurs", "info": "4 sélections en équipe de France"},
      {"firstName": "Abdou", "lastName": "Diallo", "category": "Défenseurs", "info": "23 sélections avec le Sénégal"},
      {"firstName": "Milan", "lastName": "Bisevac", "category": "Défenseurs", "info": "19 sélections avec la Serbie"},
      {"firstName": "David", "lastName": "Sauget", "category": "Défenseurs", "info": "107 titularisations avec le FC Sochaux"},
      {"firstName": "Oswaldo", "lastName": "Vizcarrondo", "category": "Défenseurs", "info": "83 sélections avec le Vénézuela"},
      {"firstName": "Jonathan", "lastName": "Rivierez", "category": "Défenseurs", "info": "10 sélections avec la Martinique"},
      {"firstName": "Jérémy", "lastName": "Choplin", "category": "Défenseurs", "info": "Champion de France de Ligue 2 en 2012 et 2014"},
      {"firstName": "Grégory", "lastName": "Lorenzi", "category": "Défenseurs", "info": "Corsica Football Cup en 2010"},
      {"firstName": "Gaëtan", "lastName": "Belaud", "category": "Défenseurs", "info": "302 titularisations en Ligue 2"},
      {"firstName": "Vincent", "lastName": "Rüfli", "category": "Défenseurs", "info": "1 sélection avec la Suisse"},
      {"firstName": "Simon", "lastName": "Falette", "category": "Défenseurs", "info": "17 sélections avec la Guinée"},
      {"firstName": "Adama", "lastName": "Soumaoro", "category": "Défenseurs", "info": "Vainqueur de la Ligue 1 en 2021"},
      {"firstName": "Mohamed", "lastName": "Fofana", "category": "Défenseurs", "info": "5 sélections avec le Mali"},
      {"firstName": "", "lastName": "Carlao", "category": "Défenseurs", "info": "Vainqueur de la Coupe de Chypre en 2015"},
      {"firstName": "Cédric", "lastName": "Cambon", "category": "Défenseurs", "info": "Vainqueur de la Coupe et de la Supercoupe de Bulgarie en 2008"},
      {"firstName": "Jean-Charles", "lastName": "Castelletto", "category": "Défenseurs", "info": "19 sélections avec le Cameroun"},
      {"firstName": "François", "lastName": "Moubandje", "category": "Défenseurs", "info": "21 sélections avec la Suisse"},
      {"firstName": "Vincent", "lastName": "Manceau", "category": "Défenseurs", "info": "389 titularisations avec le SCO Angers"},
      {"firstName": "Romain", "lastName": "Métanire", "category": "Défenseurs", "info": "24 sélections avec Madagascar"},
      {"firstName": "Jonathan", "lastName": "Gradit", "category": "Défenseurs", "info": "Vice-Champion de France en 2023"},
      {"firstName": "Loïck", "lastName": "Landre", "category": "Défenseurs", "info": "1 sélection avec l'équipe de France U23"},
      {"firstName": "Yaya", "lastName": "Banana", "category": "Défenseurs", "info": "14 sélections avec le Cameroun"},
      {"firstName": "Alexander", "lastName": "Djiku", "category": "Défenseurs", "info": "23 sélections avec le Ghana"},
      {"firstName": "Abdelilah", "lastName": "Fahmi", "category": "Défenseurs", "info": "30 sélections avec le Maroc"},
      {"firstName": "Anthar", "lastName": "Yahia", "category": "Défenseurs", "info": "53 sélections avec l'Algérie"},
      {"firstName": "Igor", "lastName": "Lolo", "category": "Défenseurs", "info": "22 sélections avec la Côte d'Ivoire"},
      {"firstName": "Lamine", "lastName": "Gassama", "category": "Défenseurs", "info": "49 sélections avec le Sénégal"},
      {"firstName": "Fabrice", "lastName": "N'Sakala", "category": "Défenseurs", "info": "19 sélections avec le Congo"},
      {"firstName": "Aly", "lastName": "Cissokho", "category": "Défenseurs", "info": "1 sélection avec l'équipe de France"},
      {"firstName": "Yoan", "lastName": "Séverin", "category": "Défenseurs", "info": "5 sélections avec la France U20"},
      {"firstName": "Yhoan", "lastName": "Andzouana", "category": "Défenseurs", "info": "7 sélections avec le Congo"},
      {"firstName": "Pape", "lastName": "Diakhaté", "category": "Défenseurs", "info": "39 sélections avec le Sénégal"},
      {"firstName": "Cédric", "lastName": "Avinel", "category": "Défenseurs", "info": "20 sélections avec la Guadeloupe"},
      {"firstName": "Alassane", "lastName": "Touré", "category": "Défenseurs", "info": "Vice champion de Ligue 2 2014"},
      {"firstName": "Massadio", "lastName": "Haïdara", "category": "Défenseurs", "info": "17 sélections avec le Mali"},
      {"firstName": "Joël", "lastName": "Sami", "category": "Défenseurs", "info": "6 sélections avec le Congo"},
      {"firstName": "Steven", "lastName": "Fortes", "category": "Défenseurs", "info": "13 sélections avec le Cap Vert"},
      {"firstName": "Laurent", "lastName": "Bonnart", "category": "Défenseurs", "info": "Champion de France et Vainqueur de la Coupe de la Ligue en 2010"},
      {"firstName": "Nenad", "lastName": "Dzodic", "category": "Défenseurs", "info": "5 sélections avec la Yougoslavie"},
      {"firstName": "Dimitri", "lastName": "Foulquier", "category": "Défenseurs", "info": "2 sélections avec la Guadeloupe"},
      {"firstName": "Jean-Armel", "lastName": "Kana-Biyik", "category": "Défenseurs", "info": "6 sélections avec le Cameroun"},
      {"firstName": "Cédric", "lastName": "Mongongu", "category": "Défenseurs", "info": "31 sélections avec le Congo"},
      {"firstName": "Jordan", "lastName": "Amavi", "category": "Défenseurs", "info": "Vainqueur de la Gambardella 2012"},
      {"firstName": "Sébastien", "lastName": "Puygrenier", "category": "Défenseurs", "info": "461 matchs dans sa carrière TCC"},
      {"firstName": "Nadir", "lastName": "Belhadj", "category": "Défenseurs", "info": "54 sélections avec l'Algérie"},
      {"firstName": "Jean-Pascal", "lastName": "Mignot", "category": "Défenseurs", "info": "Double vainqueur de la Coupe de France avec l'AJA en 2003 et 2005"},
      {"firstName": "Jean-Joël", "lastName": "Perrier-Doumbé", "category": "Défenseurs", "info": "21 sélections avec le Cameroun"},
      {"firstName": "Bill", "lastName": "Tchato", "category": "Défenseurs", "info": "46 sélections en équipe nationale du Cameroun"},
      {"firstName": "Fabien", "lastName": "Centonze", "category": "Défenseurs", "info": ""},
      {"firstName": "", "lastName": "Nenê", "category": "Milieux", "info": "Meilleur attaquant de Ligue1 en 2010"},
      {"firstName": "Alexandre", "lastName": "Song", "category": "Milieux", "info": "49 sélections avec le Cameroun"},
      {"firstName": "Ismaël", "lastName": "Bennacer", "category": "Milieux", "info": "46 sélections avec l'équipe d'Algérie"},
      {"firstName": "Lorik", "lastName": "Cana", "category": "Milieux", "info": "92 sélections avec l'équipe d'Albanie"},
      {"firstName": "", "lastName": "Denilson", "category": "Milieux", "info": "Vainqueur de la Copa Libertadores 2005"},
      {"firstName": "Yannick", "lastName": "Cahuzac", "category": "Milieux", "info": "Champion de France de Ligue 2 en 2011"},
      {"firstName": "Bocundji", "lastName": "Ca", "category": "Milieux", "info": "19 sélections avec la Guinée Bissau"},
      {"firstName": "Alain", "lastName": "Traoré", "category": "Milieux", "info": "65 sélections avec le Burkina Faso"},
      {"firstName": "Jordan", "lastName": "Marié", "category": "Milieux", "info": "Plus de 280 titularisations avec le Dijon FC"},
      {"firstName": "Sanjin", "lastName": "Prcic", "category": "Milieux", "info": "17 sélections avec la Bosnie Herzégovine"},
      {"firstName": "Carlos", "lastName": "Sanchez", "category": "Milieux", "info": "88 sélections avec la Colombie"},
      {"firstName": "Florian", "lastName": "Tardieu", "category": "Milieux", "info": "Champion de Ligue 2 en 2021"},
      {"firstName": "Florian", "lastName": "Martin", "category": "Milieux", "info": "210 titularisations en Ligue 2 TCC"},
      {"firstName": "Diego", "lastName": "Rigonato", "category": "Milieux", "info": "Double vainqueur de la coupe de Hongrie"},
      {"firstName": "Toko", "lastName": "N'Zuzi", "category": "Milieux", "info": "5 sélections avec le RD Congo"},
      {"firstName": "Bryan", "lastName": "Bergougnoux", "category": "Milieux", "info": "21 sélections avec l'équipe de France U21"},
      {"firstName": "Yohann", "lastName": "Court", "category": "Milieux", "info": "Vainqueur de la Ligue 2 en 2015"},
      {"firstName": "Franck", "lastName": "Chaussidière", "category": "Milieux", "info": "Champions de France de National en 2007"},
      {"firstName": "Ismaël", "lastName": "Diomandé", "category": "Milieux", "info": "18 sélections avec la Côte d'Ivoire"},
      {"firstName": "Elohim", "lastName": "Rolland", "category": "Milieux", "info": "102 titularisations avec le KV COURTRAI"},
      {"firstName": "Daniel", "lastName": "Follonier", "category": "Milieux", "info": "Vainqueur de la Coupe de Suisse en 2015"},
      {"firstName": "Jessy", "lastName": "Pi", "category": "Milieux", "info": "Champion de Ligue 2 en 2015"},
      {"firstName": "Olivier", "lastName": "Quint", "category": "Milieux", "info": "Vainqueur du Trophée des Champions en 2001"},
      {"firstName": "Camel", "lastName": "Meriem", "category": "Milieux", "info": "3 sélections avec l'équipe de France"},
      {"firstName": "Pantxi", "lastName": "Sirieix", "category": "Milieux", "info": "Vainqueur de la Coupe de France en 2003"},
      {"firstName": "Laurent", "lastName": "Courtois", "category": "Milieux", "info": "Champion de MLS Next Pro 2022 en tant qu'entraîneur"},
      {"firstName": "Arnaud", "lastName": "Djoum", "category": "Milieux", "info": "28 sélections avec le Cameroun"},
      {"firstName": "Yann", "lastName": "M'Vila", "category": "Milieux", "info": "22 sélections avec l'équipe de France"},
      {"firstName": "Landry", "lastName": "N'Guémo", "category": "Milieux", "info": "42 sélections avec le Cameroun"},
      {"firstName": "Alfred", "lastName": "N'Diaye", "category": "Milieux", "info": "28 sélections avec le Sénégal"},
      {"firstName": "Petrus", "lastName": "Boumal", "category": "Milieux", "info": "3 sélections avec le Cameroun"},
      {"firstName": "Hugo", "lastName": "Magnetti", "category": "Milieux", "info": "Vice-Champion de Ligue2 2018-19"},
      {"firstName": "André", "lastName": "Luiz", "category": "Milieux", "info": "13 sélections avec le Brésil"},
      {"firstName": "Fabien", "lastName": "Lemoine", "category": "Milieux", "info": "Vainqueur de la Coupe de la Ligue 2013"},
      {"firstName": "Éric", "lastName": "Djemba-Djemba", "category": "Milieux", "info": "34 sélections avec le Cameroun"},
      {"firstName": "Julien", "lastName": "Sablé", "category": "Milieux", "info": "3 sélections avec la France U21"},
      {"firstName": "Nenad", "lastName": "Kovacevic", "category": "Milieux", "info": "18 sélections avec la Serbie"},
      {"firstName": "Marcel", "lastName": "Mahouvé", "category": "Milieux", "info": "38 sélections avec le Cameroun"},
      {"firstName": "", "lastName": "Wendel", "category": "Milieux", "info": "Champion de France 2009 avec Bordeaux"},
      {"firstName": "Antoine", "lastName": "Hainaut", "category": "Milieux", "info": ""},
      {"firstName": "Hicham", "lastName": "Mahou", "category": "Milieux", "info": ""},
      {"firstName": "Frédéric", "lastName": "Kanouté", "category": "Attaquants", "info": "38 sélections avec l'équipe du Mali"},
      {"firstName": "Paul-Georges", "lastName": "Ntep", "category": "Attaquants", "info": "4 sélections avec le Cameroun"},
      {"firstName": "Geoffrey", "lastName": "Dernis", "category": "Attaquants", "info": "Vainqueur de la Ligue 1 avec Montpellier HSC sur la saison 13/14"},
      {"firstName": "Claudiu", "lastName": "Keseru", "category": "Attaquants", "info": "46 sélections avec la Roumanie"},
      {"firstName": "Xavier", "lastName": "Pentecôte", "category": "Attaquants", "info": "3 sélections avec l'équipe de France U21"},
      {"firstName": "Sofiane", "lastName": "Boufal", "category": "Attaquants", "info": "42 sélections avec le Maroc"},
      {"firstName": "Serge", "lastName": "Gakpé", "category": "Attaquants", "info": "44 sélections avec le Togo"},
      {"firstName": "Joseph-Désiré", "lastName": "Job", "category": "Attaquants", "info": "52 sélections avec le Cameroun"},
      {"firstName": "Jacques", "lastName": "Zoua", "category": "Attaquants", "info": "26 sélections avec le Cameroun"},
      {"firstName": "Yoric", "lastName": "Ravet", "category": "Attaquants", "info": "Champion de Suisse en 2018"},
      {"firstName": "Quentin", "lastName": "Cornette", "category": "Attaquants", "info": "Vainqueur de la Ligue 2 en 2023"},
      {"firstName": "Wesley", "lastName": "Jobello", "category": "Attaquants", "info": "3 sélections avec la Martinique"},
      {"firstName": "Nicolas", "lastName": "Fauvergue", "category": "Attaquants", "info": "8 sélections avec l'équipe de France U21"},
      {"firstName": "Brighton", "lastName": "Labeau", "category": "Attaquants", "info": "11 sélections avec la Martinique"},
      {"firstName": "Mamadou", "lastName": "Diallo", "category": "Attaquants", "info": "42 sélections avec le Mali"},
      {"firstName": "Martin", "lastName": "Braithwaite", "category": "Attaquants", "info": "69 sélections avec le Danemark"},
      {"firstName": "Steven", "lastName": "Joseph-Monrose", "category": "Attaquants", "info": "Vainqueur de la Coupe d'Azerbaïdjan 2019"},
      {"firstName": "Lenny", "lastName": "Pintor", "category": "Attaquants", "info": "10 sélections avec la France U20"},
      {"firstName": "Esmaël", "lastName": "Gonçalves", "category": "Attaquants", "info": "1 sélection avec la Guinée Bissau"},
      {"firstName": "Andy", "lastName": "Delort", "category": "Attaquants", "info": "15 sélections avec l'Algérie"},
      {"firstName": "Junior", "lastName": "Tallo", "category": "Attaquants", "info": "8 sélections avec la Côte d'Ivoire"},
      {"firstName": "", "lastName": "Kim", "category": "Attaquants", "info": "Vainqueur de la Coupe de Ligue 2006"},
      {"firstName": "Mathieu", "lastName": "Dossevi", "category": "Attaquants", "info": "27 sélections avec le Togo"},
      {"firstName": "Kevin", "lastName": "Mayi", "category": "Attaquants", "info": "5 sélections avec le Gabon"},
      {"firstName": "Steeven", "lastName": "Langil", "category": "Attaquants", "info": "11 sélections avec la Martinique"},
      {"firstName": "Luigi", "lastName": "Pieroni", "category": "Attaquants", "info": "24 sélections avec la Belgique"},
      {"firstName": "Jean-Christophe", "lastName": "Bahebeck", "category": "Attaquants", "info": "7 sélections avec la France U20"},
      {"firstName": "Daniel", "lastName": "Braaten", "category": "Attaquants", "info": "52 sélections avec la Norvège"},
      {"firstName": "Idriss", "lastName": "Saadi", "category": "Attaquants", "info": "2 sélections avec l'Algérie"},
      {"firstName": "Tressor", "lastName": "Moreno", "category": "Attaquants", "info": "32 sélections avec la Colombie"},
      {"firstName": "Kanga", "lastName": "Akalé", "category": "Attaquants", "info": "35 sélections avec la Côte d'Ivoire"},
      {"firstName": "Chaouki", "lastName": "Ben Saada", "category": "Attaquants", "info": "40 sélections avec la Tunisie"},
      {"firstName": "Stéphane", "lastName": "Bahoken", "category": "Attaquants", "info": "22 sélections avec le Cameroun"},
      {"firstName": "Frédéric", "lastName": "Mendy", "category": "Attaquants", "info": "36 sélections avec le Sénégal"},
      {"firstName": "Habib", "lastName": "Bamogo", "category": "Attaquants", "info": "1 sélection avec le Burkina Faso"},
      {"firstName": "Matt", "lastName": "Moussilou", "category": "Attaquants", "info": "3 sélections avec le Congo"},
      {"firstName": "Suk", "lastName": "Hyun-jun", "category": "Attaquants", "info": "victoire écrasante 9-0 contre le PSG"},
      {"firstName": "Albert", "lastName": "Cartier", "category": "Coachs", "info": "617 matchs en tant que coach"},
      {"firstName": "Ricardo", "lastName": "Gomes", "category": "Coachs", "info": "440 matchs en tant que coach"},
      {"firstName": "Romain", "lastName": "Revelli", "category": "Coachs", "info": "190 matchs en tant que coach"},
      {"firstName": "Mehmed", "lastName": "Bazdarevic", "category": "Coachs", "info": "389 matchs en tant que coach"},
      {"firstName": "Farouk", "lastName": "Hadzibegic", "category": "Coachs", "info": "518 matchs en tant que coach"},
      {"firstName": "Patrick", "lastName": "Colleter", "category": "Coachs", "info": "264 matchs en tant qu'assistant coach"},
      {"firstName": "Sylvain", "lastName": "Marchal", "category": "Coachs", "info": "Coach du FC Metz B depuis Juillet 2022"},
      {"firstName": "Yoann", "lastName": "Lachor", "category": "Coachs", "info": "ex coordinateur sportif du RC Lens"},
      {"firstName": "Thomas", "lastName": "Dossevi", "category": "Coachs", "info": "Coach du US Boulogne U19 pour la saison 2019/20"},
      {"firstName": "Keira", "lastName": "Hamraoui", "category": "Féminines", "info": "Vainqueure de la LDC Féminines en 2017; 2018 et 2021"},
      {"firstName": "Kenza", "lastName": "Dali", "category": "Féminines", "info": "Vainqueure D1 ARKEMA en 2010 et 2017"},
      {"firstName": "Manon", "lastName": "Revelli", "category": "Féminines", "info": "Championne Euro 2019 avec la FranceU19"}
    ]
};

// Injection du bouton d'import dynamique dans la barre latérale de l'admin
document.addEventListener("DOMContentLoaded", () => {
    // Vérifier qu'on est bien sur la page admin (via la présence de la sidebar)
    const navBar = document.querySelector('.sidebar nav');
    if(navBar) {
        const importBtn = document.createElement("button");
        importBtn.textContent = "🔥 Lancer l'import JSON complet";
        importBtn.style = "background: #d80056; color: white; padding: 15px; font-weight: bold; width: 100%; margin-top: 30px; cursor: pointer; border-radius: 8px;";
        
        navBar.appendChild(importBtn);

        importBtn.addEventListener('click', async () => {
            if(!confirm("Attention, cela va envoyer tous les joueurs dans Firebase ! Continuer ?")) return;

            importBtn.disabled = true;
            importBtn.textContent = "Importation en cours... Ne fermez pas la page !";

            let successCount = 0;

            for (const player of jsonPlayersData.players) {
                // Normalisation de la catégorie pour correspondre aux filtres (Gardiens -> gardien)
                let cat = player.category.toLowerCase();
                if(cat === "gardiens") cat = "gardien";
                if(cat === "défenseurs") cat = "defenseur";
                if(cat === "milieux") cat = "milieu";
                if(cat === "attaquants") cat = "attaquant";
                if(cat === "coachs") cat = "coach";
                if(cat === "féminines") cat = "feminine";

                try {
                    // On simule une image générique puisque le JSON n'a que des URL de pages
                    const placeholderImg = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
                    
                    await addDoc(collection(db, "players"), {
                        name: `${player.firstName} ${player.lastName}`.trim(),
                        category: cat,
                        stat: player.info,
                        image_url: placeholderImg,
                        timestamp: new Date() // Pour le tri du plus récent
                    });
                    successCount++;
                    console.log(`Joueur ajouté : ${player.lastName}`);
                } catch (err) {
                    console.error("Erreur d'importation sur : " + player.lastName, err);
                }
            }

            alert(`✅ Importation terminée avec succès ! ${successCount} profils ajoutés.`);
            importBtn.textContent = "Importation Terminée";
        });
    }
});

