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
  isTokenAutoRefreshEnabled: true
});

const db = getFirestore(app);
const analytics = getAnalytics(app);

/* ================= 2. SYSTEME DE CACHE ANTI-COÛT ================= */
const CACHE_TIME_24H = 1000 * 60 * 60 * 24; 

const Cache = {
    get: (key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (Date.now() - parsed.timestamp > CACHE_TIME_24H) {
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
        contact_info_title: "Nos Coordonnées", contact_hq: "Siège Social", contact_hq_val: "351, chemin des Gourettes - 06370 Mouans-Sartoux - France",
        contact_phone: "Téléphone", contact_phone_val: "+33 492 90 90 25",
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
        contact_info_title: "Our Details", contact_hq: "Headquarters", contact_hq_val: "351, chemin des Gourettes - 06370 Mouans-Sartoux - France",
        contact_phone: "Phone", contact_phone_val: "+33 492 90 90 25",
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
        contact_info_title: "Nuestros Datos", contact_hq: "Sede Central", contact_hq_val: "351, chemin des Gourettes - 06370 Mouans-Sartoux - Francia",
        contact_phone: "Teléfono", contact_phone_val: "+33 492 90 90 25",
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
        contact_info_title: "Nossos Dados", contact_hq: "Sede", contact_hq_val: "351, chemin des Gourettes - 06370 Mouans-Sartoux - França",
        contact_phone: "Telefone", contact_phone_val: "+33 492 90 90 25",
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

    // LOGIQUE DES ONGLETS AGENCE / FONDATEUR
    const tabFounder = document.getElementById('tab-founder');
    const tabAgency = document.getElementById('tab-agency');
    
    if (tabFounder && tabAgency) {
        const doFadeTransition = async (updateContentCallback) => {
            const elements = ['vip-title-display', 'vip-quote-display', 'vip-desc-display', 'vip-licenses-display', 'vip-img-display'];
            elements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.opacity = '0';
            });
            setTimeout(async () => {
                await updateContentCallback();
                elements.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.opacity = '1';
                });
            }, 300);
        };

        tabFounder.addEventListener('click', () => {
            if (tabFounder.style.background === 'var(--usm-pink)') return;
            tabFounder.style.background = 'var(--usm-pink)'; tabFounder.style.color = '#fff';
            tabAgency.style.background = 'rgba(255,255,255,0.1)'; tabAgency.style.color = '#aaa';
            
            doFadeTransition(() => {
                document.getElementById('vip-title-display').innerHTML = 'Christophe<br><span>Mongai</span>';
                const currLang = localStorage.getItem('usm_lang') || 'fr';
                document.getElementById('vip-quote-display').textContent = translations[currLang].vip_quote || '...';
                document.getElementById('vip-desc-display').textContent = translations[currLang].vip_desc || '';
                document.getElementById('vip-licenses-display').style.display = 'flex';
                
                const fImg = Cache.get('site_settings')?.founderImg;
                if(fImg) document.getElementById('vip-img-display').src = fImg;
            });
        });

        tabAgency.addEventListener('click', () => {
            if (tabAgency.style.background === 'var(--usm-pink)') return;
            tabAgency.style.background = 'var(--usm-pink)'; tabAgency.style.color = '#fff';
            tabFounder.style.background = 'rgba(255,255,255,0.1)'; tabFounder.style.color = '#aaa';

            doFadeTransition(async () => {
                document.getElementById('vip-title-display').innerHTML = 'L\'Agence<br><span>USM Football</span>';
                document.getElementById('vip-licenses-display').style.display = 'none';
                document.getElementById('vip-quote-display').textContent = '...';
                document.getElementById('vip-desc-display').textContent = 'Chargement en cours...';

                let agencyData = Cache.get('site_agency');
                if (!agencyData) {
                    try {
                        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                        const d = await getDoc(doc(db, "settings", "agency")); 
                        if(d.exists()) {
                            agencyData = d.data();
                            Cache.set('site_agency', agencyData);
                        } else {
                            agencyData = { empty: true };
                        }
                    } catch(e) { console.error("Erreur Agence:", e); }
                }

                if (agencyData && !agencyData.empty) {
                    const currLang = localStorage.getItem('usm_lang') || 'fr';
                    document.getElementById('vip-quote-display').textContent = agencyData[`quote_${currLang}`] || '';
                    document.getElementById('vip-desc-display').textContent = agencyData[`desc_${currLang}`] || '';
                    if(agencyData.image) document.getElementById('vip-img-display').src = agencyData.image;
                } else {
                     document.getElementById('vip-desc-display').textContent = 'Informations de l\'agence à venir.';
                     document.getElementById('vip-quote-display').textContent = '';
                }
            });
        });
    }

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

    const mobileBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const navLinks = document.getElementById('nav-links');
    
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => navLinks.classList.add('active'));
        closeBtn.addEventListener('click', () => navLinks.classList.remove('active'));
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }
    
    updateContent(currentLang);

    const observer = new IntersectionObserver((entries) => { 
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }); 
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    const startApp = async () => {
        await loadSettings(); 
        await loadSocialLinks();
        await loadServices(); 
        await loadPlayers('gardien'); 
        await loadSingleServicePage(); 
    };
    startApp();
}); /* <-- 🪄 LA FERMETURE GLOBALE DU DOMCONTENTLOADED EST ICI */

/* ================= 5. CHARGEMENT PARAMÈTRES AVEC CACHE ================= */

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
        
        if(data.logoNav) {
            loadSmoothImage('#nav-logo-dyn', data.logoNav);
            loadSmoothImage('#footer-logo-dyn', data.logoNav);
        }
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

/* ================= 5.5 CHARGEMENT DES RÉSEAUX SOCIAUX ================= */
async function loadSocialLinks() {
    let socialData = Cache.get('site_social');
    
    if (!socialData) {
        try {
            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const docSnap = await getDoc(doc(db, "settings", "social"));
            if (docSnap.exists()) {
                socialData = docSnap.data();
                Cache.set('site_social', socialData);
            }
        } catch (e) { 
            console.error("Erreur chargement réseaux:", e); 
            return; 
        }
    }

    if (socialData) {
        const platforms = [
            { key: 'tiktok', title: 'TikTok' },
            { key: 'linkedin', title: 'LinkedIn' },
            { key: 'instagram', title: 'Instagram' },
            { key: 'facebook', title: 'Facebook' },
            { key: 'youtube', title: 'YouTube' }
        ];

        platforms.forEach(platform => {
            const icons = document.querySelectorAll(`.social-icon[title="${platform.title}"], .sticky-icon[title="${platform.title}"], .dyn-social[title="${platform.title}"]`);
            const url = socialData[platform.key];
            
            icons.forEach(iconEl => {
                if (url && url.trim() !== '') {
                    iconEl.href = url;
                    iconEl.style.display = 'flex'; 
                } else {
                    iconEl.style.display = 'none'; 
                }
            });
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

    const btnSrvPrev = document.getElementById('btn-srv-prev');
    const btnSrvNext = document.getElementById('btn-srv-next');
  
    if (btnSrvPrev && container) {
        const newBtnPrev = btnSrvPrev.cloneNode(true);
        btnSrvPrev.parentNode.replaceChild(newBtnPrev, btnSrvPrev);
        newBtnPrev.addEventListener('click', () => container.scrollBy({ left: -(container.clientWidth * 0.8), behavior: 'smooth' }));
    }
    if (btnSrvNext && container) {
        const newBtnNext = btnSrvNext.cloneNode(true);
        btnSrvNext.parentNode.replaceChild(newBtnNext, btnSrvNext);
        newBtnNext.addEventListener('click', () => container.scrollBy({ left: (container.clientWidth * 0.8), behavior: 'smooth' }));
    }
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

            // 🪄 SEO DYNAMIQUE : Mise à jour du Titre de l'onglet
            document.title = `${titleText} | USM Football`;

            // 🪄 SEO DYNAMIQUE : Mise à jour de la Meta Description
            if (descText) {
                let metaDesc = document.querySelector('meta[name="description"]');
                if (!metaDesc) {
                    metaDesc = document.createElement('meta');
                    metaDesc.name = "description";
                    document.head.appendChild(metaDesc);
                }
                metaDesc.content = descText.length > 150 ? descText.substring(0, 150) + "..." : descText;
            }

            // 🪄 SEO DYNAMIQUE : Mise à jour des Mots-clés (Keywords)
            if (seoText) {
                let metaKeys = document.querySelector('meta[name="keywords"]');
                if (!metaKeys) {
                    metaKeys = document.createElement('meta');
                    metaKeys.name = "keywords";
                    document.head.appendChild(metaKeys);
                }
                metaKeys.content = seoText;
            }

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
    let players = Cache.get(`players_${category}`);
    
    if(!players) {
        try {
            const { query, collection, getDocs, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const q = query(collection(db, "players"), where("category", "==", category));
            
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
            loadPlayers(e.target.getAttribute('data-tab')); 
        }); 
    }); 
}
setupTabs(); 

const searchInput = document.getElementById('front-search');
if(searchInput) {
    searchInput.addEventListener('input', (e) => { 
        clearTimeout(searchTimeout);
        
        // 🪄 OPTIMISATION 1 : Délai augmenté à 600ms (Debounce)
        searchTimeout = setTimeout(async () => {
            currentFrontSearch = e.target.value.trim().toLowerCase(); 
            
            // 🪄 OPTIMISATION 2 : On ne lance la recherche qu'à partir de 2 caractères minimum
            if(currentFrontSearch.length >= 2) {
                document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active')); 
                
                let all = Cache.get('players_all');
                if (!all) {
                    try {
                        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                        const querySnapshot = await getDocs(collection(db, "players"));
                        all = [];
                        querySnapshot.forEach(d => all.push(d.data()));
                        Cache.set('players_all', all); 
                    } catch(err) { console.error("Erreur recherche globale:", err); all = []; }
                }
                
                allPlayersData = all; 
                renderCategorySlider(); 
                
            } else if (currentFrontSearch.length === 0) {
                // Si la barre de recherche est vidée, on réaffiche la catégorie sélectionnée
                const activeTab = document.querySelector(`.filter-btn[data-tab="${currentFrontCat}"]`);
                if(activeTab) activeTab.classList.add('active'); 
                
                allPlayersData = Cache.get(`players_${currentFrontCat}`) || [];
                if (allPlayersData.length === 0) loadPlayers(currentFrontCat);
                else renderCategorySlider();
            }
        }, 600); 
    });
}
/* ================= 9. PAGE PRESSE (VIDEOS & ARTICLES) ================= */

function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

window.openPresseLightbox = (type, mediaUrl, title, desc, linkUrl, source, currentIndex) => {
    const lb = document.getElementById('presse-lightbox');
    const mediaContainer = document.getElementById('lightbox-media');
    const titleEl = document.getElementById('lightbox-title');
    const descEl = document.getElementById('lightbox-desc');
    const linkContainer = document.getElementById('lightbox-link-container');
    const miniSlider = document.getElementById('lightbox-mini-slider');
    
    if(lb && mediaContainer) {
        if(type === 'video') {
            let embedUrl = mediaUrl;
            if(embedUrl.includes('watch?v=')) {
                embedUrl = embedUrl.replace('watch?v=', 'embed/');
                const amp = embedUrl.indexOf('&');
                if(amp !== -1) embedUrl = embedUrl.substring(0, amp);
            }
            mediaContainer.innerHTML = `<iframe src="${embedUrl}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        } else {
            mediaContainer.innerHTML = `<img src="${mediaUrl}" alt="Presse">`;
        }
        
        titleEl.textContent = title;
        descEl.textContent = desc || '';
        if(linkUrl && linkUrl.length > 5) {
            linkContainer.innerHTML = `<a href="${linkUrl}" target="_blank" class="btn-premium" style="display:inline-block; margin-top:20px; text-decoration:none; text-align:center; width:100%;">Lire l'article complet ➔</a>`;
        } else {
            linkContainer.innerHTML = '';
        }
        
        if (miniSlider && source && source !== 'null') {
            if (miniSlider.getAttribute('data-current-source') !== source) {
                let items = [];
                if (source === 'tv') items = Cache.get('site_presse_videos') || [];
                if (source === 'yt') items = window.site_presse_yt || [];
                if (source === 'articles') items = Cache.get('site_presse_articles') || [];
                
                miniSlider.innerHTML = items.map((item, i) => {
                    let thumb = '', itemType = 'video', itemUrl = '', itemTitle = '', itemDesc = '', itemLink = '', extraClass = '';
                    
                    if (source === 'tv') {
                        const ytId = getYouTubeId(item.url);
                        thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
                        itemUrl = item.url; itemTitle = item.title; itemDesc = item.description;
                    } else if (source === 'yt') {
                        const ytId = getYouTubeId(item.link);
                        thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : item.thumbnail;
                        itemUrl = item.link; itemTitle = item.title;
                    } else if (source === 'articles') {
                        itemType = 'image'; thumb = item.image_url; itemUrl = item.image_url;
                        itemTitle = item.title; itemDesc = item.description; itemLink = item.link; extraClass = 'is-article';
                    }
                    
                    return `
                    <div class="mini-slider-item ${extraClass} presse-trigger" 
                         id="mini-item-${i}"
                         data-type="${itemType}" data-url="${itemUrl}" 
                         data-title="${encodeURIComponent(itemTitle || '')}" 
                         data-desc="${encodeURIComponent(itemDesc || '')}" 
                         data-link="${encodeURIComponent(itemLink || '')}" 
                         data-source="${source}" data-index="${i}">
                        <img src="${thumb}">
                    </div>`;
                }).join('');
                
                miniSlider.setAttribute('data-current-source', source);
            }

            document.querySelectorAll('.mini-slider-item').forEach(el => el.classList.remove('active'));
            const activeItem = document.getElementById(`mini-item-${currentIndex}`);
            if (activeItem) {
                activeItem.classList.add('active');
                setTimeout(() => {
                    const scrollPos = activeItem.offsetLeft - (miniSlider.clientWidth / 2) + (activeItem.clientWidth / 2);
                    miniSlider.scrollTo({ left: scrollPos, behavior: 'smooth' });
                }, 50);
            }
        } else if (miniSlider) {
             miniSlider.innerHTML = '';
             miniSlider.removeAttribute('data-current-source');
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

document.addEventListener('click', (e) => {
    if (e.target.id === 'presse-lightbox') {
        closeLightbox();
        return;
    }

    const trigger = e.target.closest('.presse-trigger');
    if (trigger) {
        const type = trigger.getAttribute('data-type');
        const url = trigger.getAttribute('data-url');
        
        const safeDecode = (str) => { try { return decodeURIComponent(str || ''); } catch(err) { return str || ''; } };
        const decodeHTML = (html) => { const txt = document.createElement("textarea"); txt.innerHTML = html; return txt.value; };

        const title = decodeHTML(safeDecode(trigger.getAttribute('data-title')));
        const desc = decodeHTML(safeDecode(trigger.getAttribute('data-desc')));
        const link = safeDecode(trigger.getAttribute('data-link'));
        const source = trigger.getAttribute('data-source');
        const index = parseInt(trigger.getAttribute('data-index'), 10);
        
        openPresseLightbox(type, url, title, desc, link, source, index);
    }
});

async function loadPresseData() {
    const vidContainer = document.getElementById('presse-video-container');
    const mosContainer = document.getElementById('presse-mosaic-container');
    if(!vidContainer || !mosContainer) return; 

    let videos = Cache.get('site_presse_videos');
    if(!videos || videos.length === 0) {
        try {
            const { query, collection, getDocs, limit } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const q = query(collection(db, "presse_videos"), limit(50));
            const snap = await getDocs(q);
            videos = [];
            snap.forEach(d => videos.push({id: d.id, ...d.data()}));
            videos.sort((a, b) => (a.order || 999) - (b.order || 999));
            if(videos.length > 0) Cache.set('site_presse_videos', videos);
        } catch(e) { console.error(e); }
    }
    
    if(videos && videos.length > 0) {
        vidContainer.innerHTML = videos.map((v, index) => {
            const ytId = getYouTubeId(v.url);
            const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
            return `
            <div class="video-card presse-trigger" style="cursor:pointer;" data-type="video" data-url="${v.url}" data-title="${encodeURIComponent(v.title || '')}" data-desc="${encodeURIComponent(v.description || '')}" data-link="" data-source="tv" data-index="${index}">
                <div class="video-container">
                    <img src="${thumbUrl}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;">
                    <div style="position:absolute; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
                        <div style="width:50px; height:50px; background:var(--usm-pink); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; padding-left:4px;">▶</div>
                    </div>
                </div>
                <div class="video-title">${v.title || ''}</div>
            </div>`;
        }).join('');
    } else {
        vidContainer.innerHTML = '<p style="color:#888; margin-left:20px;">Aucune vidéo pour le moment.</p>';
    }

    const ytContainer = document.getElementById('youtube-feed-container');
    if (ytContainer) {
        let ytItems = Cache.get('usm_yt_feed');
        if (!ytItems || ytItems.length === 0) {
            const YOUTUBE_CHANNEL_ID = "UCuaiYfKTeTWvQyz4tJXMlug"; 
            const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`);
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                if(data.status === 'ok' && data.items && data.items.length > 0) {
                    ytItems = data.items;
                    Cache.set('usm_yt_feed', ytItems); 
                }
            } catch(e) { console.error("Erreur YouTube:", e); }
        }

        if (ytItems && ytItems.length > 0) {
            window.site_presse_yt = ytItems; 
            
            ytContainer.innerHTML = ytItems.map((item, index) => {
                const ytId = getYouTubeId(item.link);
                const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : item.thumbnail;
                const safeTitle = encodeURIComponent(item.title);
                
                return `
                <div class="video-card presse-trigger" style="cursor:pointer;" data-type="video" data-url="${item.link}" data-title="${safeTitle}" data-desc="" data-link="" data-source="yt" data-index="${index}">
                    <div class="video-container">
                        <img src="${thumbUrl}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;">
                        <div style="position:absolute; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
                            <div style="width:50px; height:50px; background:#ff0000; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; padding-left:4px; box-shadow: 0 4px 15px rgba(255,0,0,0.4);">▶</div>
                        </div>
                    </div>
                    <div class="video-title">${item.title}</div>
                </div>`;
            }).join('');
        } else {
            ytContainer.innerHTML = '<p style="color:#888; margin-left:20px;">Aucune vidéo récente (ou limite de connexion API atteinte).</p>';
        }

        const btnYtPrev = document.getElementById('btn-yt-prev');
        const btnYtNext = document.getElementById('btn-yt-next');
        if(btnYtPrev) btnYtPrev.addEventListener('click', () => ytContainer.scrollBy({ left: -400, behavior: 'smooth' }));
        if(btnYtNext) btnYtNext.addEventListener('click', () => ytContainer.scrollBy({ left: 400, behavior: 'smooth' }));
    }

    let articles = Cache.get('site_presse_articles');
    if(!articles || articles.length === 0) {
        try {
            const { query, collection, getDocs, limit } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const q = query(collection(db, "presse_articles"), limit(80)); 
            const snap = await getDocs(q);
            articles = [];
            snap.forEach(d => articles.push({id: d.id, ...d.data()}));
            articles.sort((a, b) => (a.order || 999) - (b.order || 999));
            if(articles.length > 0) Cache.set('site_presse_articles', articles);
        } catch(e) { console.error(e); }
    }
    
    window.presseArticles = articles || [];
    window.currentArtPage = 1;

    window.renderArticlesPage = () => {
        if(!mosContainer) return;
        const pageInfo = document.getElementById('art-page-info');
        
        if(window.presseArticles.length === 0) {
            mosContainer.innerHTML = '<p style="color:#888; grid-column: 1/-1;">Aucun article pour le moment.</p>';
            if(pageInfo) pageInfo.textContent = '0 / 0';
            return;
        }

        const ART_PER_PAGE = 16;
        const totalPages = Math.ceil(window.presseArticles.length / ART_PER_PAGE);
        if(window.currentArtPage > totalPages) window.currentArtPage = totalPages;
        
        const start = (window.currentArtPage - 1) * ART_PER_PAGE;
        const pageItems = window.presseArticles.slice(start, start + ART_PER_PAGE);

        mosContainer.innerHTML = pageItems.map((a, i) => {
            const globalIndex = start + i;
            return `
            <div class="mosaic-item presse-trigger" data-type="image" data-url="${a.image_url}" data-title="${encodeURIComponent(a.title || '')}" data-desc="${encodeURIComponent(a.description || '')}" data-link="${encodeURIComponent(a.link || '')}" data-source="articles" data-index="${globalIndex}">
                <img src="${a.image_url}" loading="lazy" alt="Presse">
            </div>`;
        }).join('');

        if(pageInfo) pageInfo.textContent = `${window.currentArtPage} / ${totalPages}`;
    };

    window.renderArticlesPage(); 

    const btnArtPrev = document.getElementById('btn-art-prev');
    const btnArtNext = document.getElementById('btn-art-next');
    if(btnArtPrev) btnArtPrev.addEventListener('click', () => { 
        if(window.currentArtPage > 1) { 
            window.currentArtPage--; 
            window.renderArticlesPage(); 
        } 
    });
    if(btnArtNext) btnArtNext.addEventListener('click', () => { 
        const maxP = Math.ceil(window.presseArticles.length / 16); 
        if(window.currentArtPage < maxP) { 
            window.currentArtPage++; 
            window.renderArticlesPage(); 
        } 
    });

    const btnPrev = document.getElementById('btn-vid-prev');
    const btnNext = document.getElementById('btn-vid-next');
    if(btnPrev) btnPrev.addEventListener('click', () => vidContainer.scrollBy({ left: -400, behavior: 'smooth' }));
    if(btnNext) btnNext.addEventListener('click', () => vidContainer.scrollBy({ left: 400, behavior: 'smooth' }));
}

const startPresse = () => { if(document.getElementById('presse-video-container')) loadPresseData(); };
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', startPresse); } else { startPresse(); }

/* ================= 10. BANDEROLE IMAGES (LAZY LOAD & CACHE 1H) ================= */
document.addEventListener("DOMContentLoaded", () => {
    const marqueeSection = document.getElementById('marquee-section');
    const marqueeTrack = document.getElementById('marquee-track');
    
    if (!marqueeSection || !marqueeTrack) return;

    let marqueeLoaded = false;
    const CACHE_TIME_1H = 1000 * 60 * 60; // 1 heure

    const loadMarqueeImages = async () => {
        if (marqueeLoaded) return;
        marqueeLoaded = true;

        let marqueeData = null;
        const cachedItem = localStorage.getItem('site_marquee');
        
        if (cachedItem) {
            const parsed = JSON.parse(cachedItem);
            if (Date.now() - parsed.timestamp < CACHE_TIME_1H) {
                marqueeData = parsed.data;
            }
        }

        if (!marqueeData) {
            try {
                const { collection, getDocs, limit, query } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                const q = query(collection(db, "marquee_images"), limit(20));
                const snap = await getDocs(q);
                marqueeData = [];
                snap.forEach(doc => marqueeData.push(doc.data().image_url));
                
                if (marqueeData.length > 0) {
                    localStorage.setItem('site_marquee', JSON.stringify({timestamp: Date.now(), data: marqueeData}));
                }
            } catch(e) { console.error("Erreur Marquee:", e); return; }
        }

        if (marqueeData && marqueeData.length > 0) {
            const itemsHTML = marqueeData.map(url => `
                <div class="marquee-item">
                    <img src="${url}" loading="lazy" alt="Gallery">
                </div>
            `).join('');

            marqueeTrack.innerHTML = itemsHTML + itemsHTML;
        } else {
            marqueeSection.style.display = 'none'; 
        }
    };

    const marqueeObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMarqueeImages();
            marqueeObserver.disconnect();
        }
    }, { rootMargin: '300px' });

    marqueeObserver.observe(marqueeSection);
});

// ================= SWITCH D'ANIMATION BOUTONS VIP =================
const btnFounder = document.getElementById('tab-founder');
const btnAgency = document.getElementById('tab-agency');

if (btnFounder && btnAgency) {
    btnFounder.addEventListener('click', () => {
        btnFounder.classList.add('active');    // Coupe la lumière sur Fondateur
        btnAgency.classList.remove('active');  // Allume la lumière sur Agence
    });

    btnAgency.addEventListener('click', () => {
        btnAgency.classList.add('active');     // Coupe la lumière sur Agence
        btnFounder.classList.remove('active'); // Allume la lumière sur Fondateur
    });
}
