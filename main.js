/* ================= 1. IMPORTS FIREBASE ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

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
const db = getFirestore(app);
const analytics = getAnalytics(app); 

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
    },
    en: {
        nav_agency: "The Agency", nav_services: "Services", nav_talents: "Talents", nav_button: "Contact",
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
        contact_ph_msg: "Your message...", contact_btn_send: "Send message"
    },
    es: {
        nav_agency: "La Agencia", nav_services: "Servicios", nav_talents: "Los Talentos", nav_button: "Contacto",
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
        contact_ph_msg: "Tu mensaje...", contact_btn_send: "Enviar mensaje"
    },
    pt: {
        nav_agency: "A Agência", nav_services: "Serviços", nav_talents: "Os Talentos", nav_button: "Contato",
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
        contact_ph_msg: "Sua mensagem...", contact_btn_send: "Enviar mensagem"
    }
};

window.currentServiceData = null; 

/* ================= 3. LOGIQUE GLOBALE ================= */
document.addEventListener("DOMContentLoaded", () => {
    const langSelect = document.getElementById('lang-select');
    let currentLang = localStorage.getItem('usm_lang') || 'fr';
    if (!translations[currentLang]) currentLang = 'fr';
    if(langSelect) langSelect.value = currentLang;

    const updateContent = (lang) => {
        document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key]; });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const key = el.getAttribute('data-i18n-placeholder'); if (translations[lang] && translations[lang][key]) el.placeholder = translations[lang][key]; });
        document.documentElement.lang = lang;
        
        renderServices(); 
        
        if(window.currentServiceData) {
            const srv = window.currentServiceData;
            const titleEl = document.getElementById('srv-page-title'); const descEl = document.getElementById('srv-page-desc');
            if(titleEl) titleEl.textContent = srv[`title_${lang}`] || srv.title_fr;
            if(descEl) descEl.textContent = srv[`desc_${lang}`] || srv.desc_fr;
        }
    };
    
    if(langSelect) langSelect.addEventListener('change', (e) => { localStorage.setItem('usm_lang', e.target.value); updateContent(e.target.value); });
    updateContent(currentLang);

    const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }); }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    loadSettings(); loadServices(); loadPlayers(); loadSingleServicePage();
});

/* ================= 4. CHARGEMENT PARAMÈTRES ================= */
async function loadSettings() {
    try {
        const d = await getDoc(doc(db, "settings", "general"));
        if (d.exists()) {
            const data = d.data();
            ['stat1', 'stat2', 'stat3', 'stat4'].forEach(s => { if(data[s] && document.getElementById(`stat-${s.replace('stat','')}`)) document.getElementById(`stat-${s.replace('stat','')}`).textContent = data[s]; });
            if(data.logoNav && document.querySelector('.logo-nav img')) document.querySelector('.logo-nav img').src = data.logoNav;
            if(data.logoHero && document.querySelector('.massive-eagle-wrapper img')) document.querySelector('.massive-eagle-wrapper img').src = data.logoHero;
            if(data.founderImg && document.querySelector('.vip-photo-wrapper img')) document.querySelector('.vip-photo-wrapper img').src = data.founderImg;

            ['fr', 'en', 'es', 'pt'].forEach(lang => { if(data[`founderQuote_${lang}`]) translations[lang].vip_quote = data[`founderQuote_${lang}`]; if(data[`founderDesc_${lang}`]) translations[lang].vip_desc = data[`founderDesc_${lang}`]; });
            const currentLang = localStorage.getItem('usm_lang') || 'fr';
            document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (translations[currentLang] && translations[currentLang][key]) el.textContent = translations[currentLang][key]; });
        }
    } catch (e) {}
}

/* ================= 5. CHARGEMENT DES SERVICES DYNAMIQUES ================= */
let allServicesData = [];
async function loadServices() {
    const container = document.getElementById('services-container'); if(!container) return;
    try {
        const querySnapshot = await getDocs(collection(db, "services")); allServicesData = [];
        querySnapshot.forEach((docSnap) => allServicesData.push({ id: docSnap.id, ...docSnap.data() }));
        allServicesData.sort((a, b) => (a.order || 999) - (b.order || 999)); renderServices();
    } catch (error) { container.innerHTML = '<p style="color:red;">Erreur de chargement.</p>'; }
}

function renderServices() {
    const container = document.getElementById('services-container'); if(!container) return;
    if(allServicesData.length === 0) { container.innerHTML = '<p style="color:#aaa;">Aucun service disponible.</p>'; return; }
    const currentLang = localStorage.getItem('usm_lang') || 'fr'; let html = '';
    
    allServicesData.forEach(srv => {
        const title = srv[`title_${currentLang}`] || srv.title_fr || 'Service';
        html += `<a href="service.html?id=${srv.id}" class="service-mini-card"><span>${title}</span> <span>➔</span></a>`;
    });
    container.innerHTML = html;
}

/* ================= 6. CHARGEMENT DE LA PAGE SERVICE UNIQUE ================= */
async function loadSingleServicePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const srvId = urlParams.get('id');
    if(!srvId) return;

    try {
        const docSnap = await getDoc(doc(db, "services", srvId));
        if(docSnap.exists()) {
            window.currentServiceData = docSnap.data();
            const srv = window.currentServiceData;
            
            const imgEl = document.getElementById('srv-hero-img');
            if(imgEl && srv.image_url) imgEl.src = srv.image_url;
            
            const currentLang = localStorage.getItem('usm_lang') || 'fr';
            const titleEl = document.getElementById('srv-page-title');
            const descEl = document.getElementById('srv-page-desc');
            if(titleEl) titleEl.textContent = srv[`title_${currentLang}`] || srv.title_fr;
            if(descEl) descEl.textContent = srv[`desc_${currentLang}`] || srv.desc_fr;
        } else {
            // SÉCURITÉ : Si le service a été supprimé !
            if(document.getElementById('srv-page-title')) document.getElementById('srv-page-title').textContent = "Service Introuvable";
            if(document.getElementById('srv-page-desc')) document.getElementById('srv-page-desc').textContent = "Ce service n'existe pas ou a été supprimé.";
        }
    } catch(e) { console.error("Erreur Service: ", e); }
}

/* ================= 7. CHARGEMENT DU ROSTER ================= */
let allPlayersData = []; let currentFrontCat = 'gardien'; let currentFrontSearch = '';
async function loadPlayers() {
    const container = document.getElementById('roster-categories-container'); if (!container) return;
    try {
        const querySnapshot = await getDocs(collection(db, "players")); allPlayersData = [];
        querySnapshot.forEach((docSnap) => allPlayersData.push(docSnap.data())); allPlayersData.sort((a, b) => (a.order || 999) - (b.order || 999));
        renderCategorySlider(); setupTabs();
        const searchInput = document.getElementById('front-search');
        if(searchInput) searchInput.addEventListener('input', (e) => { currentFrontSearch = e.target.value.toLowerCase(); if(currentFrontSearch.length > 0) document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active')); else document.querySelector(`.filter-btn[data-tab="${currentFrontCat}"]`).classList.add('active'); renderCategorySlider(); });
    } catch (error) { container.innerHTML = '<p style="color:red; text-align:center;">Erreur base de données.</p>'; }
}
function renderCategorySlider() {
    const container = document.getElementById('roster-categories-container'); if(!container) return;
    let filteredPlayers = currentFrontSearch.length > 0 ? allPlayersData.filter(p => p.name.toLowerCase().includes(currentFrontSearch)) : allPlayersData.filter(p => p.category === currentFrontCat);
    if (filteredPlayers.length === 0) { container.innerHTML = '<p style="text-align:center; color:#888; padding: 40px;">Aucun joueur trouvé.</p>'; return; }
    let sliderHTML = `<div class="category-block reveal visible"><div class="category-header"><h3 class="category-title" style="color: #fff; text-transform:none;">${currentFrontSearch.length > 0 ? `Résultats pour "${currentFrontSearch}"` : `✦ <span style="color:var(--usm-pink)">${filteredPlayers.length}</span> Profils`}</h3><div class="slider-controls"><button class="slider-btn prev-btn">❮</button><button class="slider-btn next-btn">❯</button></div></div><div class="slider-container"><div class="horizontal-scroller" id="active-scroller">`;
    filteredPlayers.forEach(player => { sliderHTML += `<div class="player-card"><div class="player-img-container"><img src="${player.image_url}" alt="${player.name}" loading="lazy"></div><div class="player-info"><div><h3>${player.name}</h3>${currentFrontSearch.length > 0 ? `<p style="color:#888; font-size:0.75rem; text-transform:uppercase; margin-top:2px;">${player.category}</p>` : ''}${player.transfermarkt ? `<a href="${player.transfermarkt}" target="_blank" style="color:var(--usm-pink); font-size:0.8rem; text-decoration:none; display:inline-block; margin-top:5px;">🔗 Transfermarkt</a>` : ''}</div></div><div style="padding: 0 15px 15px;"><div class="player-stat">${player.stat || ''}</div></div></div>`; });
    container.innerHTML = sliderHTML + `</div></div></div>`;
    const scroller = document.getElementById('active-scroller');
    document.querySelector('.prev-btn').addEventListener('click', () => scroller.scrollBy({ left: -(scroller.clientWidth * 0.8), behavior: 'smooth' })); document.querySelector('.next-btn').addEventListener('click', () => scroller.scrollBy({ left: (scroller.clientWidth * 0.8), behavior: 'smooth' }));
}
function setupTabs() { document.querySelectorAll('.filter-btn').forEach(tab => { tab.addEventListener('click', (e) => { document.getElementById('front-search').value = ''; currentFrontSearch = ''; document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active')); e.target.classList.add('active'); currentFrontCat = e.target.getAttribute('data-tab'); renderCategorySlider(); }); }); }
