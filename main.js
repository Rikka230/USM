/* ================= 1. IMPORTS FIREBASE ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";

/* ================= 2. CONFIGURATION FIREBASE ================= */
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

// --- BOUCLIER ANTI-DDOS (APP CHECK + RECAPTCHA V3) ---
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdF2rUsAAAAAOUCVKJt2DCDKWQIEQXHyBkYETT1'),
  isTokenAutoRefreshEnabled: true // Firebase renouvelle le jeton de sécurité tout seul
});

const db = getFirestore(app);
const analytics = getAnalytics(app);

/* ================= 2. SYSTEME DE CACHE ANTI-COÛT ================= */
// Le cache expire après 24 heures (équilibre parfait entre budget Firebase et mise à jour du site)
const CACHE_TIME_24H = 1000 * 60 * 60 * 24; 

const Cache = {
    get: (key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (Date.now() - parsed.timestamp > CACHE_TIME_24H) { // <-- Modifié ici
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    },
    set: (key, data) => localStorage.setItem(key, JSON.stringify({timestamp: Date.now(), data}))
};

/* ================= 3. TRADUCTION i18n ================= */
const translations = {
    fr: {
        nav_agency: "L'Agence", nav_services: "Services", nav_talents: "Les Talents", nav_press: "Presse", nav_button: "Contact",
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
        contact_ph_msg: "Votre message...", contact_btn_send: "Envoyer le message",
        back_services: "❮ Retour à l'accueil", other_services: "Naviguer"
    },
    en: {
        nav_agency: "The Agency", nav_services: "Services", nav_talents: "Talents", nav_press: "Press", nav_button: "Contact",
        hero_subtitle: "Together, let's develop your talents.",
        stat_1_label: "Activity & Transactions", stat_1_desc: "Transfer market operations completed.",
        stat_4_label: "Global Network", stat_4_desc: "Direct contacts with clubs worldwide.",
        stat_2_label: "Trust & Roster", stat_2_desc: "Players managed since 1998. +100 pro players currently represented.",
        stat_3_label: "Digital Impact (#3 Worldwide)", stat_3_sub: "Total Followers",
        services_label: "Global Support", services_title: "Exclusive Services",
        vip_badge: "Founder & CEO", vip_quote: "...", vip_desc: "", 
        roster_title: "USM FAMILY", filter_all: "All", filter_gk: "Goalkeepers", filter_def: "Defenders",
        legal_mentions: "Legal Notice",
        contact_title: "Contact", contact_subtitle: "Let's discuss your future.",
        contact_info_title: "Our Details", contact_hq: "Headquarters", contact_hq_val: "Marseille, France",
        contact_phone: "Phone", contact_phone_val: "+33 (0)4 XX XX XX XX",
        contact_email: "Email", contact_email_val: "contact@usm-football.com",
        contact_form_title: "Send a message",
        contact_ph_name: "Your full name", contact_ph_email: "Your email address",
        contact_opt_player: "I am a player", contact_opt_club: "I represent a club", contact_opt_other: "Other request",
        contact_ph_msg: "Your message...", contact_btn_send: "Send message",
        back_services: "❮ Back to Home", other_services: "Navigate"
    },
    es: {
        nav_agency: "La Agencia", nav_services: "Servicios", nav_talents: "Los Talentos", nav_press: "Prensa", nav_button: "Contacto",
        hero_subtitle: "Juntos, desarrollemos tus talentos.",
        stat_1_label: "Actividad y Transacciones", stat_1_desc: "Operaciones realizadas en el mercado de fichajes.",
        stat_4_label: "Red Mundial", stat_4_desc: "Contactos directos con clubes de todo el mundo.",
        stat_2_label: "Confianza y Roster", stat_2_desc: "Jugadores gestionados desde 1998. +100 jugadores profesionales representados actualmente.",
        stat_3_label: "Impacto Digital (N°3 Mundial)", stat_3_sub: "Seguidores totales",
        services_label: "Acompañamiento Global", services_title: "Servicios Exclusivos",
        vip_badge: "Fundador y CEO", vip_quote: "...", vip_desc: "", 
        roster_title: "USM FAMILY", filter_all: "Todos", filter_gk: "Porteros", filter_def: "Defensas",
        legal_mentions: "Aviso Legal",
        contact_title: "Contacto", contact_subtitle: "Hablemos de tu futuro.",
        contact_info_title: "Nuestros Datos", contact_hq: "Sede Central", contact_hq_val: "Marsella, Francia",
        contact_phone: "Teléfono", contact_phone_val: "+33 (0)4 XX XX XX XX",
        contact_email: "Email", contact_email_val: "contact@usm-football.com",
        contact_form_title: "Enviar un mensaje",
        contact_ph_name: "Tu nombre completo", contact_ph_email: "Tu correo electrónico",
        contact_opt_player: "Soy jugador", contact_opt_club: "Represento a un club", contact_opt_other: "Otra consulta",
        contact_ph_msg: "Tu mensaje...", contact_btn_send: "Enviar mensaje",
        back_services: "❮ Volver al inicio", other_services: "Navegar"
    },
    pt: {
        nav_agency: "A Agência", nav_services: "Serviços", nav_talents: "Os Talentos", nav_press: "Imprensa", nav_button: "Contato",
        hero_subtitle: "Juntos, vamos desenvolver seus talentos.",
        stat_1_label: "Atividade e Transações", stat_1_desc: "Operações realizadas no mercado de transferências.",
        stat_4_label: "Rede Global", stat_4_desc: "Contactos diretos com clubes em todo o mundo.",
        stat_2_label: "Confiança e Roster", stat_2_desc: "Jogadores gerenciados desde 1998. +100 jogadores profissionais atualmente representados.",
        stat_3_label: "Impacto Digital (N°3 Mundial)", stat_3_sub: "Seguidores totais",
        services_label: "Acompanhamento Global", services_title: "Serviços Exclusivos",
        vip_badge: "Fundador e CEO", vip_quote: "...", vip_desc: "", 
        roster_title: "USM FAMILY", filter_all: "Todos", filter_gk: "Goleiros", filter_def: "Defensores",
        legal_mentions: "Aviso Legal",
        contact_title: "Contato", contact_subtitle: "Vamos discutir o seu futuro.",
        contact_info_title: "Nossos Dados", contact_hq: "Sede", contact_hq_val: "Marselha, França",
        contact_phone: "Telefone", contact_phone_val: "+33 (0)4 XX XX XX XX",
        contact_email: "Email", contact_email_val: "contact@usm-football.com",
        contact_form_title: "Enviar uma mensagem",
        contact_ph_name: "Seu nome completo", contact_ph_email: "Seu endereço de email",
        contact_opt_player: "Sou jogador", contact_opt_club: "Represento um clube", contact_opt_other: "Outro pedido",
        contact_ph_msg: "Sua mensagem...", contact_btn_send: "Enviar mensagem",
        back_services: "❮ Voltar ao Início", other_services: "Navegar"
    }
};

window.currentServiceData = null; 
window.currentServiceId = null;

/* ================= 4. LOGIQUE GLOBALE ================= */
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
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { 
            const key = el.getAttribute('data-i18n-placeholder'); 
            if (translations[lang] && translations[lang][key]) el.placeholder = translations[lang][key]; 
        });
        document.documentElement.lang = lang;
        
        renderServices(); 
        
        if(window.currentServiceData) {
            const srv = window.currentServiceData;
            const titleText = srv[`title_${lang}`] || srv.title_fr;
            const subText = srv[`subtitle_${lang}`] || srv.subtitle_fr;
            const descText = srv[`desc_${lang}`] || srv.desc_fr;
            const seoText = srv[`seo_${lang}`] || srv.seo_fr;
            
            const titleEl = document.getElementById('srv-page-title'); 
            const subEl = document.getElementById('srv-page-subtitle');
            const descEl = document.getElementById('srv-page-desc');
            const imgEl = document.getElementById('srv-hero-img');
            
            if(titleEl) titleEl.textContent = titleText;
            if(subEl) subEl.textContent = subText;
            if(descEl) descEl.textContent = descText;
            if(imgEl) imgEl.alt = titleText;
            
            document.title = `${titleText} | USM Football`;
            
            if (descText) {
                let metaDesc = document.querySelector('meta[name="description"]');
                if (!metaDesc) {
                    metaDesc = document.createElement('meta');
                    metaDesc.name = "description";
                    document.head.appendChild(metaDesc);
                }
                metaDesc.content = descText.length > 155 ? descText.substring(0, 155) + "..." : descText;
            }
            if (seoText) {
                let metaKeys = document.querySelector('meta[name="keywords"]');
                if (!metaKeys) {
                    metaKeys = document.createElement('meta');
                    metaKeys.name = "keywords";
                    document.head.appendChild(metaKeys);
                }
                metaKeys.content = seoText;
            }
            renderOtherServices(window.currentServiceId, lang);
        }
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
        await loadPlayers('gardien'); // Charge uniquement les gardiens au démarrage
        await loadSingleServicePage(); 
    };
    startApp();
});

/* ================= 5. CHARGEMENT PARAMÈTRES AVEC CACHE ================= */

// La fonction magique qui manquait et qui faisait planter tout le site !
function loadSmoothImage(selector, url, finalOpacity = '1') {
    const img = document.querySelector(selector);
    if (img && url) {
        img.style.opacity = '0'; 
        img.style.transition = 'opacity 1.2s ease-in-out'; 
        img.onload = () => { img.style.opacity = finalOpacity; };
        img.src = url; 
    }
}

async function loadSettings() {
    let data = Cache.get('site_settings');
    if(!data) {
        try {
            const d = await getDoc(doc(db, "settings", "general"));
            if (d.exists()) {
                data = d.data();
                Cache.set('site_settings', data);
            }
        } catch (e) { console.error("Erreur Settings:", e); return; }
    }
    if(data) {
        ['stat1', 'stat2', 'stat3', 'stat4'].forEach(s => { 
            if(data[s] && document.getElementById(`stat-${s.replace('stat','')}`)) 
                document.getElementById(`stat-${s.replace('stat','')}`).textContent = data[s]; 
        });
        
        if(data.logoNav) loadSmoothImage('.logo-nav img', data.logoNav);
        if(data.logoHero) loadSmoothImage('.massive-eagle-wrapper img', data.logoHero);
        if(data.founderImg) loadSmoothImage('.vip-photo-wrapper img', data.founderImg);

        ['fr', 'en', 'es', 'pt'].forEach(lang => { 
            if(data[`founderQuote_${lang}`]) translations[lang].vip_quote = data[`founderQuote_${lang}`]; 
            if(data[`founderDesc_${lang}`]) translations[lang].vip_desc = data[`founderDesc_${lang}`]; 
        });
        
        const currentLang = localStorage.getItem('usm_lang') || 'fr';
        document.querySelectorAll('[data-i18n]').forEach(el => { 
            const key = el.getAttribute('data-i18n'); 
            if (translations[currentLang] && translations[currentLang][key]) el.textContent = translations[currentLang][key]; 
        });
    }
}

/* ================= 6. CHARGEMENT DES SERVICES AVEC CACHE ================= */
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
            Cache.set('site_services', allServicesData);
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
    if(allServicesData.length === 0) { container.innerHTML = '<p style="color:#aaa;">Aucun service disponible.</p>'; return; }
    
    const currentLang = localStorage.getItem('usm_lang') || 'fr'; 
    let html = '';
    
    allServicesData.forEach(srv => {
        const title = srv[`title_${currentLang}`] || srv.title_fr || 'Service';
        const sub = srv[`subtitle_${currentLang}`] || srv.subtitle_fr || '';
        const bgImg = srv.image_url ? `url('${srv.image_url}')` : 'none';
        html += `
        <a href="page-dynamique.html?id=${srv.id}" class="bento-service-card" style="background-image: linear-gradient(to top, rgba(5,5,7,0.95) 10%, rgba(5,5,7,0.2) 100%), ${bgImg}; background-size: cover; background-position: center;">
            <div class="srv-card-content"><h3>${title}</h3><p>${sub}</p></div>
            <div class="srv-card-arrow">En savoir plus ➔</div>
        </a>`;
    });
    container.innerHTML = html;
}

function renderOtherServices(currentId, lang) {
    const container = document.getElementById('other-services-container'); 
    if(!container) return;
    let html = '';
    allServicesData.forEach(srv => {
        const title = srv[`title_${lang}`] || srv.title_fr || 'Service';
        const isActive = srv.id === currentId ? 'active' : '';
        html += `
        <a href="page-dynamique.html?id=${srv.id}" class="sidebar-srv-link ${isActive}">
            <span>${title}</span><span>➔</span>
        </a>`;
    });
    container.innerHTML = html;
}

/* ================= 7. PAGE SERVICE UNIQUE ================= */
async function loadSingleServicePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const srvId = urlParams.get('id');
    if(!srvId) return;

    try {
        const docSnap = await getDoc(doc(db, "services", srvId));
        if(docSnap.exists()) {
            window.currentServiceId = srvId;
            window.currentServiceData = docSnap.data();
            const srv = window.currentServiceData;
            const currentLang = localStorage.getItem('usm_lang') || 'fr';
            
            const titleText = srv[`title_${currentLang}`] || srv.title_fr || "Service";
            const subText = srv[`subtitle_${currentLang}`] || srv.subtitle_fr || "";
            const descText = srv[`desc_${currentLang}`] || srv.desc_fr || "";
            const seoText = srv[`seo_${currentLang}`] || srv.seo_fr || "";
            
            const imgEl = document.getElementById('srv-hero-img');
            if(imgEl && srv.image_url) { 
                loadSmoothImage('#srv-hero-img', srv.image_url, '0.4');
                imgEl.alt = titleText; 
            }
            
            const titleEl = document.getElementById('srv-page-title'); if(titleEl) titleEl.textContent = titleText;
            const subEl = document.getElementById('srv-page-subtitle'); if(subEl) subEl.textContent = subText;
            const descEl = document.getElementById('srv-page-desc'); if(descEl) descEl.textContent = descText;

            document.title = `${titleText} | USM Football`;
            renderOtherServices(srvId, currentLang);
        } else {
            const titleEl = document.getElementById('srv-page-title'); if(titleEl) titleEl.textContent = "Service Introuvable";
            const descEl = document.getElementById('srv-page-desc'); if(descEl) descEl.textContent = "Ce service n'existe pas ou a été supprimé.";
        }
    } catch(e) { console.error("Erreur Service: ", e); }
}

/* ================= 8. CHARGEMENT OPTIMISÉ DU ROSTER ================= */
let allPlayersData = []; 
let currentFrontCat = 'gardien'; 
let currentFrontSearch = '';
let searchTimeout;

async function loadPlayers(category = 'gardien') {
    const container = document.getElementById('roster-categories-container'); 
    if (!container) return;
    
    currentFrontCat = category;
    
    // 1. Vérification du Cache
    let players = Cache.get(`players_${category}`);
    
    // 2. Si pas en cache, on télécharge depuis Firebase (LIMITE A 20 POUR PROTEGER LE BUDGET)
    if(!players) {
        try {
            const q = query(collection(db, "players"), where("category", "==", category), limit(20));
            const querySnapshot = await getDocs(q); 
            players = [];
            querySnapshot.forEach((docSnap) => players.push(docSnap.data())); 
            players.sort((a, b) => (a.order || 999) - (b.order || 999));
            
            Cache.set(`players_${category}`, players);
        } catch (error) { 
            container.innerHTML = '<p style="color:red; text-align:center;">Erreur base de données.</p>'; 
            return;
        }
    }
    
    allPlayersData = players;
    renderCategorySlider(); 
}

function renderCategorySlider() {
    const container = document.getElementById('roster-categories-container'); 
    if(!container) return;
    
    let filteredPlayers = currentFrontSearch.length > 0 
        ? allPlayersData.filter(p => p.name.toLowerCase().includes(currentFrontSearch)) 
        : allPlayersData;
        
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
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if(prevBtn) prevBtn.addEventListener('click', () => scroller.scrollBy({ left: -(scroller.clientWidth * 0.8), behavior: 'smooth' })); 
    if(nextBtn) nextBtn.addEventListener('click', () => scroller.scrollBy({ left: (scroller.clientWidth * 0.8), behavior: 'smooth' }));
}

function setupTabs() { 
    document.querySelectorAll('.filter-btn').forEach(tab => { 
        tab.addEventListener('click', (e) => { 
            const fSearch = document.getElementById('front-search');
            if(fSearch) fSearch.value = ''; 
            currentFrontSearch = ''; 
            document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active')); 
            e.target.classList.add('active'); 
            
            // Charge la nouvelle catégorie sélectionnée
            loadPlayers(e.target.getAttribute('data-tab')); 
        }); 
    }); 
}
setupTabs(); // Initialisation des boutons

// Système "Debounce" pour protéger Firebase contre le SPAM de la barre de recherche
const searchInput = document.getElementById('front-search');
if(searchInput) {
    searchInput.addEventListener('input', (e) => { 
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFrontSearch = e.target.value.toLowerCase(); 
            if(currentFrontSearch.length > 0) {
                document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active')); 
            } else {
                const activeTab = document.querySelector(`.filter-btn[data-tab="${currentFrontCat}"]`);
                if(activeTab) activeTab.classList.add('active'); 
            }
            renderCategorySlider(); 
        }, 400); // 400ms d'attente avant d'exécuter la recherche
    });
}

/* ================= 9. PAGE PRESSE (VIDEOS & ARTICLES) ================= */

// Fonctions globales pour la Lightbox (doivent être accessibles depuis le HTML)
window.openLightbox = (url) => {
    const lb = document.getElementById('presse-lightbox');
    const img = document.getElementById('lightbox-img');
    if(lb && img) { 
        img.src = url; 
        lb.classList.add('active'); 
        document.body.style.overflow = 'hidden'; // Bloque le scroll du site derrière
    }
};
window.closeLightbox = () => {
    const lb = document.getElementById('presse-lightbox');
    if(lb) {
        lb.classList.remove('active');
        document.body.style.overflow = ''; // Rétablit le scroll
    }
};

async function loadPresseData() {
    const vidContainer = document.getElementById('presse-video-container');
    const mosContainer = document.getElementById('presse-mosaic-container');
    
    // Si on n'est pas sur la page presse, on arrête ici
    if(!vidContainer || !mosContainer) return;

    // --- 1. Chargement des Vidéos (Avec Cache) ---
    let videos = Cache.get('site_presse_videos');
    if(!videos) {
        try {
            const q = query(collection(db, "presse_videos"), orderBy("order", "asc"), limit(15));
            const snap = await getDocs(q);
            videos = [];
            snap.forEach(d => videos.push({id: d.id, ...d.data()}));
            Cache.set('site_presse_videos', videos);
        } catch(e) { console.error("Erreur Vidéos:", e); }
    }
    
    if(videos && videos.length > 0) {
        vidContainer.innerHTML = videos.map(v => `
            <div class="video-card">
                <div class="video-container">
                    <iframe src="${v.url}" loading="lazy" allowfullscreen></iframe>
                </div>
                <div class="video-title">${v.title}</div>
            </div>
        `).join('');
    } else {
        vidContainer.innerHTML = '<p style="color:#888;">Aucune vidéo pour le moment.</p>';
    }

    // --- 2. Chargement des Articles (Avec Cache) ---
    let articles = Cache.get('site_presse_articles');
    if(!articles) {
        try {
            const q = query(collection(db, "presse_articles"), orderBy("order", "asc"), limit(30));
            const snap = await getDocs(q);
            articles = [];
            snap.forEach(d => articles.push({id: d.id, ...d.data()}));
            Cache.set('site_presse_articles', articles);
        } catch(e) { console.error("Erreur Articles:", e); }
    }
    
    if(articles && articles.length > 0) {
        mosContainer.innerHTML = articles.map(a => `
            <div class="mosaic-item" onclick="openLightbox('${a.image_url}')">
                <img src="${a.image_url}" loading="lazy" alt="Article de presse">
            </div>
        `).join('');
    } else {
        mosContainer.innerHTML = '<p style="color:#888; grid-column: 1/-1;">Aucun article pour le moment.</p>';
    }

    // --- 3. Logique des flèches du Slider Vidéo ---
    const btnPrev = document.getElementById('btn-vid-prev');
    const btnNext = document.getElementById('btn-vid-next');
    if(btnPrev) btnPrev.addEventListener('click', () => vidContainer.scrollBy({ left: -400, behavior: 'smooth' }));
    if(btnNext) btnNext.addEventListener('click', () => vidContainer.scrollBy({ left: 400, behavior: 'smooth' }));
}

// Ajout du déclencheur dans la logique de démarrage
document.addEventListener("DOMContentLoaded", () => {
    // ... [Ton code existant dans DOMContentLoaded] ...
    // Vérifie qu'à la fin de DOMContentLoaded, tu ajoutes bien l'appel à loadPresseData() :
    setTimeout(loadPresseData, 500); 
});

/* ================= 9. PAGE PRESSE (VIDEOS & ARTICLES) ================= */

function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

window.openPresseLightbox = (type, mediaUrl, title, desc, linkUrl) => {
    const lb = document.getElementById('presse-lightbox');
    const mediaContainer = document.getElementById('lightbox-media');
    const titleEl = document.getElementById('lightbox-title');
    const descEl = document.getElementById('lightbox-desc');
    const linkContainer = document.getElementById('lightbox-link-container');
    
    if(lb && mediaContainer) {
        if(type === 'video') {
            mediaContainer.innerHTML = `<iframe src="${mediaUrl}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        } else {
            mediaContainer.innerHTML = `<img src="${mediaUrl}" alt="${title}">`;
        }
        titleEl.textContent = title;
        descEl.textContent = desc || '';
        
        // 🪄 Si un lien a été renseigné, on affiche le bouton rose
        if(linkUrl && linkUrl.length > 5) {
            linkContainer.innerHTML = `<a href="${linkUrl}" target="_blank" class="btn-premium" style="display:inline-block; margin-top:20px; text-decoration:none; text-align:center; width:100%;">Lire l'article complet ➔</a>`;
        } else {
            linkContainer.innerHTML = '';
        }
        
        lb.classList.add('active'); 
        document.body.style.overflow = 'hidden'; 
    }
};

window.closeLightbox = () => {
    const lb = document.getElementById('presse-lightbox');
    if(lb) {
        lb.classList.remove('active');
        document.body.style.overflow = ''; 
        document.getElementById('lightbox-media').innerHTML = ''; 
    }
};

async function loadPresseData() {
    const vidContainer = document.getElementById('presse-video-container');
    const mosContainer = document.getElementById('presse-mosaic-container');
    if(!vidContainer || !mosContainer) return; 

    // 🪄 FIX ABSOLU : On force le vidage du cache Presse à chaque rechargement de page pour être sûr d'afficher les nouveautés !
    localStorage.removeItem('site_presse_videos');
    localStorage.removeItem('site_presse_articles');

    // --- 1. Vidéos ---
    let videos = Cache.get('site_presse_videos');
    if(!videos) {
        try {
            const q = query(collection(db, "presse_videos"), limit(15));
            const snap = await getDocs(q);
            videos = [];
            snap.forEach(d => videos.push({id: d.id, ...d.data()}));
            videos.sort((a, b) => (a.order || 999) - (b.order || 999));
            Cache.set('site_presse_videos', videos);
        } catch(e) { console.error(e); }
    }
    
    if(videos && videos.length > 0) {
        vidContainer.innerHTML = videos.map(v => {
            const ytId = getYouTubeId(v.url);
            const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
            const safeTitle = v.title ? v.title.replace(/'/g, "\\'") : '';
            const safeDesc = v.description ? v.description.replace(/'/g, "\\'").replace(/\n/g, "\\n") : '';
            
            return `
            <div class="video-card" style="cursor:pointer;" onclick="openPresseLightbox('video', '${v.url}', '${safeTitle}', '${safeDesc}', '')">
                <div class="video-container">
                    <img src="${thumbUrl}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;">
                    <div style="position:absolute; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
                        <div style="width:50px; height:50px; background:var(--usm-pink); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; padding-left:4px;">▶</div>
                    </div>
                </div>
                <div class="video-title">${v.title}</div>
            </div>`;
        }).join('');
    } else {
        vidContainer.innerHTML = '<p style="color:#888; margin-left:20px;">Aucune vidéo pour le moment.</p>';
    }

    // --- 2. Articles ---
    let articles = Cache.get('site_presse_articles');
    if(!articles) {
        try {
            const q = query(collection(db, "presse_articles"), limit(30));
            const snap = await getDocs(q);
            articles = [];
            snap.forEach(d => articles.push({id: d.id, ...d.data()}));
            articles.sort((a, b) => (a.order || 999) - (b.order || 999));
            Cache.set('site_presse_articles', articles);
        } catch(e) { console.error(e); }
    }
    
    if(articles && articles.length > 0) {
        mosContainer.innerHTML = articles.map(a => {
            const safeTitle = a.title ? a.title.replace(/'/g, "\\'") : '';
            const safeDesc = a.description ? a.description.replace(/'/g, "\\'").replace(/\n/g, "\\n") : '';
            const safeLink = a.link ? a.link.replace(/'/g, "\\'") : ''; // Récupère le lien
            
            return `
            <div class="mosaic-item" onclick="openPresseLightbox('image', '${a.image_url}', '${safeTitle}', '${safeDesc}', '${safeLink}')">
                <img src="${a.image_url}" loading="lazy" alt="${a.title}">
                <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent, rgba(0,0,0,0.9)); padding:20px 15px 15px;">
                    <h4 style="color:white; font-size:1rem; margin:0;">${a.title || 'Article'}</h4>
                </div>
            </div>`;
        }).join('');
    } else {
        mosContainer.innerHTML = '<p style="color:#888; grid-column: 1/-1;">Aucun article pour le moment.</p>';
    }

    const btnPrev = document.getElementById('btn-vid-prev');
    const btnNext = document.getElementById('btn-vid-next');
    if(btnPrev) btnPrev.addEventListener('click', () => vidContainer.scrollBy({ left: -400, behavior: 'smooth' }));
    if(btnNext) btnNext.addEventListener('click', () => vidContainer.scrollBy({ left: 400, behavior: 'smooth' }));
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(loadPresseData, 300); 
});
