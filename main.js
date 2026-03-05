/* ================= 1. TRADUCTION i18n ================= */
const translations = {
    fr: {
        nav_agency: "L'Agence", nav_services: "Services", nav_talents: "Les Talents", nav_button: "Espace Joueur",
        hero_subtitle: "Ensemble, développons vos talents.",
        stat_1_label: "Activité & Transactions", stat_1_desc: "Opérations réalisées et plus de 25 000 contacts directs avec des clubs.",
        stat_2_label: "Confiance & Roster", stat_2_desc: "Joueurs gérés depuis 1998. +100 joueurs professionnels actuellement représentés.",
        stat_3_label: "Impact Digital (N°3 Mondial Linkedin)", stat_3_sub: "Abonnés cumulés",
        services_label: "Accompagnement Global", services_title: "Services Exclusifs",
        srv_1: "Conciergerie Service Dédié 5*", srv_2: "Droit du Sport & Fiscalité", srv_3: "Family Office (Réseau d'experts)",
        srv_4: "Gestion de Carrière & Transferts", srv_5: "Sponsoring (Puma, etc.) & Image", srv_6: "Valorisation Data & Performance",
        vip_badge: "Fondateur & CEO", vip_quote: '"Le conseiller aux 3 000 numéros."',
        vip_desc: "Agent FIFA et FFF depuis 1998, Christophe Mongai a bâti l'une des plus importantes écuries d'Europe. Avec plus de 27 ans d'expérience au sommet, il possède un réseau mondial inégalé.",
        roster_title: "Roster Premium", filter_all: "Tous", filter_gk: "Gardiens", filter_def: "Défenseurs",
        legal_mentions: "Mentions Légales"
    },
    en: {
        nav_agency: "The Agency", nav_services: "Services", nav_talents: "Talents", nav_button: "Player Portal",
        hero_subtitle: "Together, let's develop your talents.",
        stat_1_label: "Activity & Transactions", stat_1_desc: "Completed operations and over 25,000 direct club contacts.",
        stat_2_label: "Trust & Roster", stat_2_desc: "Players managed since 1998. +100 pro players currently represented.",
        stat_3_label: "Digital Impact (#3 Worldwide Linkedin)", stat_3_sub: "Total Followers",
        services_label: "Global Support", services_title: "Exclusive Services",
        srv_1: "5* Dedicated Concierge Service", srv_2: "Sports Law & Taxation", srv_3: "Family Office (Expert Network)",
        srv_4: "Career Management & Transfers", srv_5: "Sponsorship (Puma, etc.) & Image", srv_6: "Data & Performance Valuation",
        vip_badge: "Founder & CEO", vip_quote: '"The advisor with 3,000 contacts."',
        vip_desc: "FIFA and FFF Agent since 1998, Christophe Mongai has built one of Europe's largest agencies. With over 27 years of experience, he holds an unmatched global network.",
        roster_title: "Premium Roster", filter_all: "All", filter_gk: "Goalkeepers", filter_def: "Defenders",
        legal_mentions: "Legal Notice"
    },
    es: {
        nav_agency: "La Agencia", nav_services: "Servicios", nav_talents: "Los Talentos", nav_button: "Portal del Jugador",
        hero_subtitle: "Juntos, desarrollemos tus talentos.",
        stat_1_label: "Actividad y Transacciones", stat_1_desc: "Operaciones realizadas y más de 25.000 contactos directos con clubes en todo el mundo.",
        stat_2_label: "Confianza y Roster", stat_2_desc: "Jugadores gestionados desde 1998. +100 jugadores profesionales representados actualmente.",
        stat_3_label: "Impacto Digital (N°3 Mundial Linkedin)", stat_3_sub: "Seguidores totales",
        services_label: "Acompañamiento Global", services_title: "Servicios Exclusivos",
        srv_1: "Conserjería Servicio Dedicado 5*", srv_2: "Derecho Deportivo y Fiscalidad", srv_3: "Family Office (Red de expertos)",
        srv_4: "Gestión de Carrera y Traspasos", srv_5: "Patrocinio (Puma, etc.) e Imagen", srv_6: "Valoración Data y Rendimiento",
        vip_badge: "Fundador y CEO", vip_quote: '"El asesor de los 3.000 contactos."',
        vip_desc: "Agente FIFA y FFF desde 1998, Christophe Mongai ha construido una de las agencias más grandes de Europa. Con más de 27 años de experiencia en la cima, posee una red mundial inigualable.",
        roster_title: "Roster Premium", filter_all: "Todos", filter_gk: "Porteros", filter_def: "Defensas",
        legal_mentions: "Aviso Legal"
    },
    pt: {
        nav_agency: "A Agência", nav_services: "Serviços", nav_talents: "Os Talentos", nav_button: "Portal do Jogador",
        hero_subtitle: "Juntos, vamos desenvolver seus talentos.",
        stat_1_label: "Atividade e Transações", stat_1_desc: "Operações concluídas e mais de 25.000 contatos diretos com clubes em todo o mundo.",
        stat_2_label: "Confiança e Roster", stat_2_desc: "Jogadores gerenciados desde 1998. +100 jogadores profissionais atualmente representados.",
        stat_3_label: "Impacto Digital (N°3 Mundial Linkedin)", stat_3_sub: "Seguidores totais",
        services_label: "Acompanhamento Global", services_title: "Serviços Exclusivos",
        srv_1: "Concierge Serviço Dedicado 5*", srv_2: "Direito Desportivo e Fiscalidade", srv_3: "Family Office (Rede de especialistas)",
        srv_4: "Gestão de Carreira e Transferências", srv_5: "Patrocínio (Puma, etc.) e Imagem", srv_6: "Valorização Data e Desempenho",
        vip_badge: "Fundador e CEO", vip_quote: '"O conselheiro de 3.000 contatos."',
        vip_desc: "Agente FIFA e FFF desde 1998, Christophe Mongai construiu uma das maiores agências da Europa. Com mais de 27 anos de experiência no topo, possui uma rede global incomparável.",
        roster_title: "Roster Premium", filter_all: "Todos", filter_gk: "Goleiros", filter_def: "Defensores",
        legal_mentions: "Aviso Legal"
    }
};

/* ================= 2. CONFIGURATION FIREBASE FRONT ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

/* ================= 3. LOGIQUE GLOBALE (UI & ROSTER) ================= */
document.addEventListener("DOMContentLoaded", () => {
    
    // --- A. GESTION DES LANGUES (i18n) ---
    const langSelect = document.getElementById('lang-select');
    let currentLang = localStorage.getItem('usm_lang') || 'fr';
    if (!translations[currentLang]) currentLang = 'fr';
    langSelect.value = currentLang;

    const updateContent = (lang) => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
        });
        document.documentElement.lang = lang;
    };
    langSelect.addEventListener('change', (e) => {
        const newLang = e.target.value;
        localStorage.setItem('usm_lang', newLang);
        updateContent(newLang);
    });
    updateContent(currentLang);

    // --- B. ANIMATIONS AU SCROLL ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Lancement du chargement des joueurs au démarrage
    loadPlayers();
});

// --- C. CHARGEMENT DYNAMIQUE DES JOUEURS (FIREBASE) ---
async function loadPlayers() {
    const container = document.getElementById('players-container');
    if (!container) return; // Sécurité si l'élément n'existe pas

    try {
        const q = query(collection(db, "players"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        container.innerHTML = ''; // On vide le spinner
        
        querySnapshot.forEach((doc) => {
            const player = doc.data();
            const cardHTML = `
                <div class="player-card reveal visible" data-category="${player.category}">
                    <div class="player-img-container">
                        <img src="${player.image_url}" alt="${player.name}" loading="lazy">
                    </div>
                    <div class="player-info">
                        <div>
                            <h3>${player.name}</h3>
                            <p style="color: #888; font-size: 0.8rem; text-transform: uppercase;">${player.category}</p>
                        </div>
                        <div class="player-stat">${player.stat || ''}</div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        initFilters();

    } catch (error) {
        console.error("Erreur de récupération :", error);
        container.innerHTML = '<p style="color:red; text-align:center;">Aucun joueur trouvé ou erreur de connexion à la base de données.</p>';
    }
}

// --- D. SYSTÈME DE FILTRES ---
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const playerCards = document.querySelectorAll('.player-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            playerCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                    setTimeout(() => card.style.opacity = '1', 50);
                } else {
                    card.style.opacity = '0';
                    setTimeout(() => card.style.display = 'none', 300);
                }
            });
        });
    });
}
