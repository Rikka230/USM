/* ================= 1. IMPORTS FIREBASE ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

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
const db = getFirestore(app);
const analytics = getAnalytics(app); 

/* ================= SYSTEME DE CACHE ANTI-COÛT ================= */
// Stocke les données dans le navigateur pendant 1 heure pour éviter les lectures Firebase inutiles
const CACHE_TIME = 1000 * 60 * 60; 
const Cache = {
    get: (key) => {
        const item = sessionStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (Date.now() - parsed.timestamp > CACHE_TIME) {
            sessionStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    },
    set: (key, data) => sessionStorage.setItem(key, JSON.stringify({timestamp: Date.now(), data}))
};

/* ================= TRADUCTION i18n ================= */
const translations = {
    fr: {
        nav_agency: "L'Agence", nav_services: "Services", nav_talents: "Les Talents", nav_button: "Contact",
        hero_subtitle: "Ensemble, développons vos talents.",
        stat_1_label: "Activité & Transactions", stat_1_desc: "Opérations réalisées sur le marché des transferts.",
        stat_4_label: "Réseau Mondial", stat_4_desc: "Contacts directs avec des clubs à travers le monde.",
        stat_2_label: "Confiance & Roster", stat_2_desc: "Joueurs gérés depuis 1998. +100 joueurs professionnels actuellement représentés.",
        stat_3_label: "Impact Digital (N°3 Mondial)", stat_3_sub: "Abonnés cumulés",
        services_label: "Accompagnement Global", services_title: "Services Exclusifs",
        vip_badge: "Fondateur & CEO", vip_quote: "...", vip_desc: "",
        roster_title: "USM FAMILY", filter_all: "Tous", filter_gk: "Gardiens", filter_def: "Défenseurs",
        legal_mentions: "Mentions Légales",
        contact_title: "Contact", contact_subtitle: "Discutons de votre avenir.",
        contact_info_title: "Nos Coordonnées", contact_hq: "Siège Social", contact_hq_val: "Marseille, France",
        contact_phone: "Téléphone", contact_phone_val: "+33 (0)4 XX XX XX XX",
        contact_email: "Email", contact_email_val: "contact@usm-football.com",
        contact_form_title: "Envoyer un message",
        contact_ph_name: "Votre nom complet", contact_ph_email: "Votre adresse email",
        contact_opt_player: "Je suis un joueur", contact_opt_club: "Je représente un club", contact_opt_other: "Autre demande",
        contact_ph_msg: "Votre message...", contact_btn_send: "Envoyer le message"
    }
};
// Les autres langues ont été raccourcies pour l'exemple mais copie tes langues ici.
// (Mets ton objet translations complet à la place).

window.currentServiceData = null; 
window.currentServiceId = null;

/* ================= 3. LOGIQUE GLOBALE ================= */
document.addEventListener("DOMContentLoaded", async () => { 
    const langSelect = document.getElementById('lang-select');
    let currentLang = localStorage.getItem('usm_lang') || 'fr';
    if (!translations[currentLang]) currentLang = 'fr';
    if(langSelect) langSelect.value = currentLang;

    const updateContent = (lang) => {
        document.querySelectorAll('[data-i18n]').forEach(el => { 
            const key = el.getAttribute('data-i18n'); 
            if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key]; 
        });
        document.documentElement.lang = lang;
        renderServices(); 
    };
    
    if(langSelect) {
        langSelect.addEventListener('change', (e) => { 
            localStorage.setItem('usm_lang', e.target.value); 
            updateContent(e.target.value); 
        });
    }
    
    updateContent(currentLang);

    const observer = new IntersectionObserver((entries) => { 
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }); 
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    const startApp = async () => {
        await loadSettings(); 
        await loadServices(); 
        await loadPlayers('gardien'); // Ne charge QUE la première catégorie
        await loadSingleServicePage(); 
    };
    startApp();
});

/* ================= 4. CHARGEMENT PARAMÈTRES (AVEC CACHE) ================= */
async function loadSettings() {
    let data = Cache.get('site_settings');
    
    if(!data) {
        try {
            const d = await getDoc(doc(db, "settings", "general"));
            if (d.exists()) {
                data = d.data();
                Cache.set('site_settings', data); // Mise en cache
            }
        } catch (e) { console.error("Erreur Settings:", e); return; }
    }

    if(data) {
        ['stat1', 'stat2', 'stat3', 'stat4'].forEach(s => { 
            if(data[s] && document.getElementById(`stat-${s.replace('stat','')}`)) 
                document.getElementById(`stat-${s.replace('stat','')}`).textContent = data[s]; 
        });
        if(data.logoNav && document.querySelector('.logo-nav img')) document.querySelector('.logo-nav img').src = data.logoNav;
        if(data.logoHero && document.querySelector('.massive-eagle-wrapper img')) document.querySelector('.massive-eagle-wrapper img').src = data.logoHero;
        if(data.founderImg && document.querySelector('.vip-photo-wrapper img')) document.querySelector('.vip-photo-wrapper img').src = data.founderImg;
    }
}

/* ================= 5. CHARGEMENT DES SERVICES (AVEC CACHE) ================= */
let allServicesData = [];

async function loadServices() {
    const container = document.getElementById('services-container'); 
    
    let cachedServices = Cache.get('site_services');
    if(cachedServices) {
        allServicesData = cachedServices;
    } else {
        try {
            const querySnapshot = await getDocs(collection(db, "services")); 
            allServicesData = [];
            querySnapshot.forEach((docSnap) => allServicesData.push({ id: docSnap.id, ...docSnap.data() }));
            allServicesData.sort((a, b) => (a.order || 999) - (b.order || 999)); 
            Cache.set('site_services', allServicesData); // Mise en cache
        } catch (error) { 
            if(container) container.innerHTML = '<p style="color:red;">Erreur de chargement.</p>'; 
            return;
        }
    }
    renderServices();
    if(window.currentServiceId) renderOtherServices(window.currentServiceId, localStorage.getItem('usm_lang') || 'fr');
}

function renderServices() {
    const container = document.getElementById('services-container'); 
    if(!container) return;
    if(allServicesData.length === 0) { container.innerHTML = '<p style="color:#aaa;">Aucun service.</p>'; return; }
    
    const currentLang = localStorage.getItem('usm_lang') || 'fr'; 
    let html = '';
    
    allServicesData.forEach(srv => {
        const title = srv[`title_${currentLang}`] || srv.title_fr || 'Service';
        const sub = srv[`subtitle_${currentLang}`] || srv.subtitle_fr || '';
        const bgImg = srv.image_url ? `url('${srv.image_url}')` : 'none';
        html += `<a href="page-dynamique.html?id=${srv.id}" class="bento-service-card" style="background-image: linear-gradient(to top, rgba(5,5,7,0.95) 10%, rgba(5,5,7,0.2) 100%), ${bgImg}; background-size: cover; background-position: center;">
            <div class="srv-card-content"><h3>${title}</h3><p>${sub}</p></div><div class="srv-card-arrow">En savoir plus ➔</div></a>`;
    });
    container.innerHTML = html;
}

function renderOtherServices(excludeId, lang) {
    const container = document.getElementById('other-services-container'); 
    if(!container) return;
    let html = '';
    allServicesData.forEach(srv => {
        if(srv.id !== excludeId) {
            const title = srv[`title_${lang}`] || srv.title_fr || 'Service';
            const isActive = srv.id === excludeId ? 'active' : '';
            html += `<a href="page-dynamique.html?id=${srv.id}" class="sidebar-srv-link ${isActive}"><span>${title}</span><span>➔</span></a>`;
        }
    });
    container.innerHTML = html;
}

/* ================= 6. PAGE SERVICE UNIQUE ================= */
async function loadSingleServicePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const srvId = urlParams.get('id');
    if(!srvId) return;

    try {
        const docSnap = await getDoc(doc(db, "services", srvId));
        if(docSnap.exists()) {
            window.currentServiceId = srvId;
            const srv = docSnap.data();
            const currentLang = localStorage.getItem('usm_lang') || 'fr';
            
            if(document.getElementById('srv-hero-img')) document.getElementById('srv-hero-img').src = srv.image_url;
            if(document.getElementById('srv-page-title')) document.getElementById('srv-page-title').textContent = srv[`title_${currentLang}`] || srv.title_fr;
            if(document.getElementById('srv-page-subtitle')) document.getElementById('srv-page-subtitle').textContent = srv[`subtitle_${currentLang}`] || srv.subtitle_fr;
            if(document.getElementById('srv-page-desc')) document.getElementById('srv-page-desc').textContent = srv[`desc_${currentLang}`] || srv.desc_fr;
            
            document.title = `${srv[`title_${currentLang}`] || srv.title_fr} | USM Football`;
            renderOtherServices(srvId, currentLang);
        }
    } catch(e) { console.error("Erreur Service: ", e); }
}

/* ================= 7. CHARGEMENT OPTIMISÉ DU ROSTER ================= */
let allPlayersData = []; 
let currentFrontCat = 'gardien'; 
let currentFrontSearch = '';
let searchTimeout;

// OPTIMISATION : Ne charge QUE la catégorie demandée, limite à 50 pour protéger le budget
async function loadPlayers(category = 'gardien') {
    const container = document.getElementById('roster-categories-container'); 
    if (!container) return;
    
    currentFrontCat = category;
    
    // Vérifie le cache en premier
    let players = Cache.get(`players_${category}`);
    
    if(!players) {
        try {
            // FIREBASE LECTURE LIMITÉE : On ne demande que 50 joueurs de la catégorie cliquée
            const q = query(collection(db, "players"), where("category", "==", category), limit(50));
            const querySnapshot = await getDocs(q); 
            players = [];
            querySnapshot.forEach((docSnap) => players.push(docSnap.data())); 
            players.sort((a, b) => (a.order || 999) - (b.order || 999));
            Cache.set(`players_${category}`, players); // Mise en cache
        } catch (error) { 
            container.innerHTML = '<p style="color:red; text-align:center;">Erreur base de données.</p>'; 
            return;
        }
    }
    
    allPlayersData = players;
    renderCategorySlider(); 
}

function setupTabs() { 
    document.querySelectorAll('.filter-btn').forEach(tab => { 
        tab.addEventListener('click', (e) => { 
            const fSearch = document.getElementById('front-search');
            if(fSearch) fSearch.value = ''; 
            currentFrontSearch = ''; 
            document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active')); 
            e.target.classList.add('active'); 
            
            // Charge la nouvelle catégorie cliquée
            loadPlayers(e.target.getAttribute('data-tab')); 
        }); 
    }); 
}
setupTabs();

// Recherche locale optimisée (Debounce)
const searchInput = document.getElementById('front-search');
if(searchInput) {
    searchInput.addEventListener('input', (e) => { 
        clearTimeout(searchTimeout);
        // Attend 400ms après la dernière frappe pour ne pas figer l'écran
        searchTimeout = setTimeout(() => {
            currentFrontSearch = e.target.value.toLowerCase(); 
            if(currentFrontSearch.length > 0) {
                document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active')); 
            } else {
                const activeTab = document.querySelector(`.filter-btn[data-tab="${currentFrontCat}"]`);
                if(activeTab) activeTab.classList.add('active'); 
            }
            renderCategorySlider(); 
        }, 400);
    });
}

function renderCategorySlider() {
    const container = document.getElementById('roster-categories-container'); 
    if(!container) return;
    
    // Filtre la liste actuelle en mémoire, sans refaire de requête Firebase !
    let filteredPlayers = currentFrontSearch.length > 0 
        ? allPlayersData.filter(p => p.name.toLowerCase().includes(currentFrontSearch)) 
        : allPlayersData; // allPlayersData ne contient déjà QUE la bonne catégorie
        
    if (filteredPlayers.length === 0) { 
        container.innerHTML = '<p style="text-align:center; color:#888; padding: 40px;">Aucun joueur trouvé.</p>'; 
        return; 
    }
    
    let sliderHTML = `<div class="category-block reveal visible"><div class="category-header"><h3 class="category-title" style="color: #fff; text-transform:none;">${currentFrontSearch.length > 0 ? `Résultats pour "${currentFrontSearch}"` : `✦ <span style="color:var(--usm-pink)">${filteredPlayers.length}</span> Profils`}</h3><div class="slider-controls"><button class="slider-btn prev-btn">❮</button><button class="slider-btn next-btn">❯</button></div></div><div class="slider-container"><div class="horizontal-scroller" id="active-scroller">`;
    
    filteredPlayers.forEach(player => { 
        sliderHTML += `<div class="player-card"><div class="player-img-container"><img src="${player.image_url}" alt="${player.name}" loading="lazy"></div><div class="player-info"><div><h3>${player.name}</h3>${currentFrontSearch.length > 0 ? `<p style="color:#888; font-size:0.75rem; text-transform:uppercase; margin-top:2px;">${player.category}</p>` : ''}${player.transfermarkt ? `<a href="${player.transfermarkt}" target="_blank" style="color:var(--usm-pink); font-size:0.8rem; text-decoration:none; display:inline-block; margin-top:5px;">🔗 Transfermarkt</a>` : ''}</div></div><div style="padding: 0 15px 15px;"><div class="player-stat">${player.stat || ''}</div></div></div>`; 
    });
    
    container.innerHTML = sliderHTML + `</div></div></div>`;
    
    const scroller = document.getElementById('active-scroller');
    document.querySelector('.prev-btn')?.addEventListener('click', () => scroller.scrollBy({ left: -(scroller.clientWidth * 0.8), behavior: 'smooth' })); 
    document.querySelector('.next-btn')?.addEventListener('click', () => scroller.scrollBy({ left: (scroller.clientWidth * 0.8), behavior: 'smooth' }));
}
