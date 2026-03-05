import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
        roster_title: "Roster Premium", filter_all: "Tous", filter_gk: "Gardiens", filter_def: "Défenseurs"
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
        roster_title: "Premium Roster", filter_all: "All", filter_gk: "Goalkeepers", filter_def: "Defenders"
    }
    // Ajouter es et pt ici sur le même modèle
};

document.addEventListener("DOMContentLoaded", () => {
    // ---- INITIALISATION i18n ----
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

    // ---- ANIMATIONS SCROLL ----
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

/* ================= 2. FIREBASE & LECTURE JOUEURS ================= */
const firebaseConfig = { /* Insérer clés front-end ici */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadPlayers() {
    const container = document.getElementById('players-container');
    try {
        const q = query(collection(db, "players"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        container.innerHTML = ''; 

        querySnapshot.forEach((doc) => {
            const player = doc.data();
            // Utilise l'image web optimisée générée par l'admin
            const imgSource = player.image_web || 'assets/placeholder.jpg'; 
            
            container.innerHTML += `
                <div class="player-card reveal visible" data-category="${player.category}">
                    <div class="player-img-container">
                        <img src="${imgSource}" alt="${player.name}" loading="lazy">
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
        });
    } catch (error) {
        console.error("Erreur chargement joueurs:", error);
        container.innerHTML = '<p>Erreur de chargement du roster.</p>';
    }
}
// Décommenter loadPlayers() une fois Firebase configuré
// loadPlayers();
