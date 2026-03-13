/* ================= 1. IMPORTS FIREBASE ================= */
// TOUS LES IMPORTS SONT BIEN EN HAUT !
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

/* ================= 3. TRADUCTION i18n ================= */
const translations = {
    fr: {
        nav_agency: "L'Agence", nav_services: "Services", nav_talents: "Les Talents", nav_button: "Contact",
        hero_subtitle: "Ensemble, développons vos talents.",
        stat_1_label: "Activité & Transactions", stat_1_desc: "Opérations réalisées sur le marché des transferts.",
        stat_4_label: "Réseau Mondial", stat_4_desc: "Contacts directs avec des clubs à travers le monde.",
        stat_2_label: "Confiance & Roster", stat_2_desc: "Joueurs gérés depuis 1998. +100 joueurs professionnels actuellement représentés.",
        stat_3_label: "Impact Digital (N°3 Mondial)", stat_3_sub: "Abonnés cumulés",
        services_label: "Accompagnement Global", services_title: "Services Exclusifs",
        srv_1: "Conciergerie Service Dédié 5*", srv_2: "Droit du Sport & Fiscalité", srv_3: "Family Office (Réseau d'experts)",
        srv_4: "Gestion de Carrière & Transferts", srv_5: "Sponsoring (Puma, etc.) & Image", srv_6: "Valorisation Data & Performance",
        
        vip_badge: "Fondateur & CEO", 
        vip_quote: '"Le conseiller aux 3 000 numéros."',
        vip_desc: "Né à Marseille dans le quartier de la \"Belle de Mai\", Christophe Mongai s'est forgé une détermination à toute épreuve. Devenu Agent FIFA et FFF, il fonde USM Football en 1998, une agence dédiée à l'accompagnement et la gestion de carrière des footballeurs et entraîneurs professionnels.\n\nAujourd'hui à la tête de l'une des plus importantes écuries de France et d'Europe, il s'impose comme une référence incontournable. Fort d'un réseau mondial exclusif de plus de 25 000 contacts directs avec les clubs, il accompagne tous types de profils, des jeunes talents prometteurs aux internationaux confirmés.\n\nEn plus de 25 ans, il a géré la trajectoire de figures emblématiques telles que Bacary Sagna, Lorik Cana, Kalidou Koulibaly, Mario Yepes ou encore Frédéric Kanouté. Une excellence récompensée en 2012 par le prestigieux CIES Football Observatory, classant le Groupe USM 1ère agence mondiale pour son nombre de joueurs évoluant dans le Top 5 européen.",
        
        roster_title: "USM FAMILY", filter_all: "Tous", filter_gk: "Gardiens", filter_def: "Défenseurs",
        legal_mentions: "Mentions Légales",

        // Textes Page Contact
        contact_title: "Contact", contact_subtitle: "Discutons de votre avenir.",
        contact_info_title: "Nos Coordonnées",
        contact_hq: "Siège Social", contact_hq_val: "Marseille, France",
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
        srv_1: "5* Dedicated Concierge Service", srv_2: "Sports Law & Taxation", srv_3: "Family Office (Expert Network)",
        srv_4: "Career Management & Transfers", srv_5: "Sponsorship (Puma, etc.) & Image", srv_6: "Data & Performance Valuation",
        
        vip_badge: "Founder & CEO", 
        vip_quote: '"The advisor with 3,000 contacts."',
        vip_desc: "Born in Marseille in the \"Belle de Mai\" district, Christophe Mongai forged an unfailing determination. Becoming a FIFA and FFF Agent, he founded USM Football in 1998, an agency dedicated to the support and career management of professional footballers and coaches.\n\nToday at the head of one of the largest agencies in France and Europe, he stands out as an essential reference. Armed with an exclusive global network of over 25,000 direct club contacts, he manages all types of profiles, from promising young talents to established internationals.\n\nIn over 25 years, he has managed the careers of iconic figures such as Bacary Sagna, Lorik Cana, Kalidou Koulibaly, Mario Yepes, and Frédéric Kanouté. This excellence was recognized in 2012 by the prestigious CIES Football Observatory, ranking the USM Group as the #1 global agency for the number of players in the European Top 5.",
        
        roster_title: "USM FAMILY", filter_all: "All", filter_gk: "Goalkeepers", filter_def: "Defenders",
        legal_mentions: "Legal Notice",

        contact_title: "Contact", contact_subtitle: "Let's discuss your future.",
        contact_info_title: "Our Details",
        contact_hq: "Headquarters", contact_hq_val: "Marseille, France",
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
        srv_1: "Conserjería Servicio Dedicado 5*", srv_2: "Derecho Deportivo y Fiscalidad", srv_3: "Family Office (Red de expertos)",
        srv_4: "Gestión de Carrera y Traspasos", srv_5: "Patrocinio (Puma, etc.) e Imagen", srv_6: "Valoración Data y Rendimiento",
        
        vip_badge: "Fundador y CEO", 
        vip_quote: '"El asesor de los 3.000 contactos."',
        vip_desc: "Nacido en Marsella en el barrio de la \"Belle de Mai\", Christophe Mongai forjó una determinación inquebrantable. Convertido en Agente FIFA y FFF, fundó USM Football en 1998, una agencia dedicada al acompañamiento y la gestión de carrera de futbolistas y entrenadores profesionales.\n\nHoy a la cabeza de una de las agencias más importantes de Francia y Europa, se impone como una referencia ineludible. Con una red mundial exclusiva de más de 25.000 contactos directos con clubes, acompaña a todo tipo de perfiles, desde jóvenes promesas hasta internacionales consolidados.\n\nEn más de 25 años, ha gestionado la trayectoria de figuras emblemáticas como Bacary Sagna, Lorik Cana, Kalidou Koulibaly, Mario Yepes o Frédéric Kanouté. Una excelencia premiada en 2012 por el prestigioso CIES Football Observatory, que clasificó al Grupo USM como la 1ª agencia mundial por su número de jugadores en el Top 5 europeo.",
        
        roster_title: "USM FAMILY", filter_all: "Todos", filter_gk: "Porteros", filter_def: "Defensas",
        legal_mentions: "Aviso Legal",

        contact_title: "Contacto", contact_subtitle: "Hablemos de tu futuro.",
        contact_info_title: "Nuestros Datos",
        contact_hq: "Sede Central", contact_hq_val: "Marsella, Francia",
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
        srv_1: "Concierge Serviço Dedicado 5*", srv_2: "Direito Desportivo e Fiscalidade", srv_3: "Family Office (Rede de especialistas)",
        srv_4: "Gestão de Carreira e Transferências", srv_5: "Patrocínio (Puma, etc.) e Imagem", srv_6: "Valorização Data e Desempenho",
        
        vip_badge: "Fundador e CEO", 
        vip_quote: '"O conselheiro de 3.000 contatos."',
        vip_desc: "Nascido em Marselha, no bairro da \"Belle de Mai\", Christophe Mongai forjou uma determinação inabalável. Tornando-se Agente FIFA e FFF, fundou a USM Football em 1998, uma agência dedicada ao acompanhamento e gestão de carreira de jogadores e treinadores profissionais.\n\nHoje à frente de uma das maiores agências da França e da Europa, impõe-se como uma referência incontornável. Com uma rede global exclusiva de mais de 25.000 contactos diretos com clubes, acompanha todos os tipos de perfis, desde jovens promessas a internacionais confirmados.\n\nEm mais de 25 anos, geriu a carreira de figuras emblemáticas como Bacary Sagna, Lorik Cana, Kalidou Koulibaly, Mario Yepes e Frédéric Kanouté. Uma excelência reconhecida em 2012 pelo prestigiado CIES Football Observatory, classificando o Grupo USM como a 1ª agência mundial pelo seu número de jogadores no Top 5 europeu.",
        
        roster_title: "USM FAMILY", filter_all: "Todos", filter_gk: "Goleiros", filter_def: "Defensores",
        legal_mentions: "Aviso Legal",

        contact_title: "Contato", contact_subtitle: "Vamos discutir o seu futuro.",
        contact_info_title: "Nossos Dados",
        contact_hq: "Sede", contact_hq_val: "Marselha, França",
        contact_phone: "Telefone", contact_phone_val: "+33 (0)4 XX XX XX XX",
        contact_email: "Email", contact_email_val: "contact@usm-football.com",
        contact_form_title: "Enviar uma mensagem",
        contact_ph_name: "Seu nome completo", contact_ph_email: "Seu endereço de email",
        contact_opt_player: "Sou jogador", contact_opt_club: "Represento um clube", contact_opt_other: "Outro pedido",
        contact_ph_msg: "Sua mensagem...", contact_btn_send: "Enviar mensagem"
    }
};

/* ================= 4. LOGIQUE GLOBALE ================= */
document.addEventListener("DOMContentLoaded", () => {
    const langSelect = document.getElementById('lang-select');
    let currentLang = localStorage.getItem('usm_lang') || 'fr';
    if (!translations[currentLang]) currentLang = 'fr';
    if(langSelect) langSelect.value = currentLang;

    const updateContent = (lang) => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
        });
        
        // NOUVEAU : Traduction des placeholders (Textes grisés dans les formulaires)
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang] && translations[lang][key]) el.placeholder = translations[lang][key];
        });
        
        document.documentElement.lang = lang;
    };
    
    if(langSelect) {
        langSelect.addEventListener('change', (e) => {
            const newLang = e.target.value;
            localStorage.setItem('usm_lang', newLang);
            updateContent(newLang);
        });
    }
    updateContent(currentLang);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    loadSettings();
    loadPlayers();
});

/* ================= 5. CHARGEMENT DES PARAMÈTRES DU SITE ================= */
async function loadSettings() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "general"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Stats
            if(data.stat1 && document.getElementById('stat-1')) document.getElementById('stat-1').textContent = data.stat1;
            if(data.stat2 && document.getElementById('stat-2')) document.getElementById('stat-2').textContent = data.stat2;
            if(data.stat3 && document.getElementById('stat-3')) document.getElementById('stat-3').textContent = data.stat3;
            if(data.stat4 && document.getElementById('stat-4')) document.getElementById('stat-4').textContent = data.stat4;
            
            // Logos
            if(data.logoNav && document.querySelector('.logo-nav img')) document.querySelector('.logo-nav img').src = data.logoNav;
            if(data.logoHero && document.querySelector('.massive-eagle-wrapper img')) document.querySelector('.massive-eagle-wrapper img').src = data.logoHero;
            
            // Fondateur (Image)
            if(data.founderImg && document.querySelector('.vip-photo-wrapper img')) document.querySelector('.vip-photo-wrapper img').src = data.founderImg;

            // INJECTION DYNAMIQUE DES TRADUCTIONS DEPUIS FIREBASE
            if(data.founderQuote_fr) translations.fr.vip_quote = data.founderQuote_fr;
            if(data.founderDesc_fr) translations.fr.vip_desc = data.founderDesc_fr;
            
            if(data.founderQuote_en) translations.en.vip_quote = data.founderQuote_en;
            if(data.founderDesc_en) translations.en.vip_desc = data.founderDesc_en;
            
            if(data.founderQuote_es) translations.es.vip_quote = data.founderQuote_es;
            if(data.founderDesc_es) translations.es.vip_desc = data.founderDesc_es;
            
            if(data.founderQuote_pt) translations.pt.vip_quote = data.founderQuote_pt;
            if(data.founderDesc_pt) translations.pt.vip_desc = data.founderDesc_pt;

            // Rafraîchissement immédiat du texte sur la page avec la langue en cours
            const langSelect = document.getElementById('lang-select');
            const currentLang = langSelect ? langSelect.value : 'fr';
            
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (translations[currentLang] && translations[currentLang][key]) {
                    el.textContent = translations[currentLang][key];
                }
            });
        }
    } catch (e) { console.error("Erreur de chargement des paramètres :", e); }
}

/* ================= 6. CHARGEMENT DYNAMIQUE DU ROSTER ================= */
let allPlayersData = []; 
let currentFrontCat = 'gardien';
let currentFrontSearch = '';

async function loadPlayers() {
    const container = document.getElementById('roster-categories-container');
    if (!container) return;

    try {
        const q = collection(db, "players");
        const querySnapshot = await getDocs(q);
        
        allPlayersData = [];
        querySnapshot.forEach((docSnap) => allPlayersData.push(docSnap.data()));
        allPlayersData.sort((a, b) => (a.order || 999) - (b.order || 999));

        renderCategorySlider();
        setupTabs();

        const frontSearch = document.getElementById('front-search');
        if(frontSearch) {
            frontSearch.addEventListener('input', (e) => {
                currentFrontSearch = e.target.value.toLowerCase();
                if(currentFrontSearch.length > 0) {
                    document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active'));
                } else {
                    document.querySelector(`.filter-btn[data-tab="${currentFrontCat}"]`).classList.add('active');
                }
                renderCategorySlider();
            });
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="color:red; text-align:center;">Erreur de connexion base de données.</p>';
    }
}

function renderCategorySlider() {
    const container = document.getElementById('roster-categories-container');
    if(!container) return;
    
    let filteredPlayers = [];

    if (currentFrontSearch.length > 0) {
        filteredPlayers = allPlayersData.filter(p => p.name.toLowerCase().includes(currentFrontSearch));
    } else {
        filteredPlayers = allPlayersData.filter(p => p.category === currentFrontCat);
    }

    if (filteredPlayers.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding: 40px;">Aucun joueur trouvé.</p>';
        return;
    }

    let titleText = currentFrontSearch.length > 0 
        ? `Résultats pour "${currentFrontSearch}"` 
        : `✦ <span style="color:var(--usm-pink)">${filteredPlayers.length}</span> Profils`;

    let sliderHTML = `
        <div class="category-block reveal visible">
            <div class="category-header">
                <h3 class="category-title" style="color: #fff; text-transform:none;">${titleText}</h3>
                <div class="slider-controls">
                    <button class="slider-btn prev-btn">❮</button>
                    <button class="slider-btn next-btn">❯</button>
                </div>
            </div>
            <div class="slider-container">
                <div class="horizontal-scroller" id="active-scroller">
    `;

    filteredPlayers.forEach(player => {
        const tmLink = player.transfermarkt ? `<a href="${player.transfermarkt}" target="_blank" style="color:var(--usm-pink); font-size:0.8rem; text-decoration:none; display:inline-block; margin-top:5px;">🔗 Transfermarkt</a>` : '';
        const catLabel = currentFrontSearch.length > 0 ? `<p style="color:#888; font-size:0.75rem; text-transform:uppercase; margin-top:2px;">${player.category}</p>` : '';

        sliderHTML += `
            <div class="player-card">
                <div class="player-img-container">
                    <img src="${player.image_url}" alt="${player.name}" loading="lazy">
                </div>
                <div class="player-info">
                    <div>
                        <h3>${player.name}</h3>
                        ${catLabel}
                        ${tmLink}
                    </div>
                </div>
                <div style="padding: 0 15px 15px;"><div class="player-stat">${player.stat || ''}</div></div>
            </div>
        `;
    });

    sliderHTML += `</div></div></div>`;
    container.innerHTML = sliderHTML;

    const scroller = document.getElementById('active-scroller');
    document.querySelector('.prev-btn').addEventListener('click', () => scroller.scrollBy({ left: -(scroller.clientWidth * 0.8), behavior: 'smooth' }));
    document.querySelector('.next-btn').addEventListener('click', () => scroller.scrollBy({ left: (scroller.clientWidth * 0.8), behavior: 'smooth' }));
}

function setupTabs() {
    const tabs = document.querySelectorAll('.filter-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.getElementById('front-search').value = '';
            currentFrontSearch = '';
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentFrontCat = e.target.getAttribute('data-tab');
            renderCategorySlider();
        });
    });
}
