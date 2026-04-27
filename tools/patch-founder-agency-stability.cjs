const fs = require('fs');

function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) throw new Error(`Missing patch anchor: ${label}`);
  return content.replace(search, replacement);
}

function replaceRegex(content, pattern, replacement, label) {
  if (!pattern.test(content)) throw new Error(`Missing patch pattern: ${label}`);
  return content.replace(pattern, replacement);
}

let index = fs.readFileSync('index.html', 'utf8');
let main = fs.readFileSync('main.js', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');

index = index.replace(/href="style\.css(?:\?v=[^"]*)?"/g, 'href="style.css?v=vip-agency-v3"');
index = index.replace(/src="main\.js(?:\?v=[^"]*)?"/g, 'src="main.js?v=vip-agency-v3"');

const tabLogicV3 = `    // LOGIQUE DES ONGLETS AGENCE / FONDATEUR
    const tabFounder = document.getElementById('tab-founder');
    const tabAgency = document.getElementById('tab-agency');
    
    if (tabFounder && tabAgency) {
        const textElements = ['vip-title-display', 'vip-quote-display', 'vip-desc-display', 'vip-licenses-display'];

        const setActiveVipTab = (target) => {
            const isFounder = target === 'founder';
            tabFounder.classList.toggle('active', isFounder);
            tabAgency.classList.toggle('active', !isFounder);
            tabFounder.style.background = isFounder ? 'var(--usm-pink)' : 'rgba(255,255,255,0.1)';
            tabFounder.style.color = isFounder ? '#fff' : '#aaa';
            tabAgency.style.background = !isFounder ? 'var(--usm-pink)' : 'rgba(255,255,255,0.1)';
            tabAgency.style.color = !isFounder ? '#fff' : '#aaa';
        };

        const setVipTextVisible = (isVisible) => {
            textElements.forEach((id) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.classList.toggle('vip-content-switching', !isVisible);
            });
        };

        const applyFounderContent = async () => {
            setActiveVipTab('founder');
            setVipTextVisible(false);
            await waitFrame();

            const currLang = localStorage.getItem('usm_lang') || 'fr';
            const title = document.getElementById('vip-title-display');
            const quote = document.getElementById('vip-quote-display');
            const desc = document.getElementById('vip-desc-display');

            if (title) title.innerHTML = 'Christophe<br><span>Mongai</span>';
            if (quote) quote.textContent = translations[currLang].vip_quote || '...';
            if (desc) desc.textContent = translations[currLang].vip_desc || '';
            setVipLicensesVisible(true);

            const fImg = Cache.get('site_settings')?.founderImg;
            if (fImg) await setVipImageSmooth(fImg);

            stabilizeFounderAgencyPanel();
            await waitFrame();
            stabilizeFounderAgencyPanel();
            setVipTextVisible(true);
        };

        const applyAgencyContent = async () => {
            setActiveVipTab('agency');
            setVipTextVisible(false);
            await waitFrame();

            const title = document.getElementById('vip-title-display');
            const quote = document.getElementById('vip-quote-display');
            const desc = document.getElementById('vip-desc-display');
            if (title) title.innerHTML = 'L\\'Agence<br><span>USM Football</span>';
            if (quote) quote.textContent = '...';
            if (desc) desc.textContent = 'Chargement en cours...';
            setVipLicensesVisible(false);
            stabilizeFounderAgencyPanel();

            const agencyData = await getAgencyDataWarm();
            if (agencyData && !agencyData.empty) {
                const currLang = localStorage.getItem('usm_lang') || 'fr';
                if (quote) quote.textContent = agencyData[\`quote_\${currLang}\`] || '';
                if (desc) desc.textContent = agencyData[\`desc_\${currLang}\`] || '';
                if (agencyData.image) await setVipImageSmooth(agencyData.image);
            } else {
                if (desc) desc.textContent = 'Informations de l\\'agence à venir.';
                if (quote) quote.textContent = '';
            }

            stabilizeFounderAgencyPanel();
            await waitFrame();
            stabilizeFounderAgencyPanel();
            setVipTextVisible(true);
        };

        stabilizeFounderAgencyPanel();
        setupFounderAgencyPrewarm(tabFounder, tabAgency);
        window.addEventListener('resize', stabilizeFounderAgencyPanel);

        tabFounder.addEventListener('click', () => {
            if (tabFounder.classList.contains('active')) return;
            applyFounderContent();
        });

        tabAgency.addEventListener('click', () => {
            if (tabAgency.classList.contains('active')) return;
            applyAgencyContent();
        });
    }
`;

const helpersV3 = `

const vipPreloadCache = new Map();
let agencyWarmPromise = null;

function waitFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function normalizeVipUrl(url) {
    if (!url) return '';
    try {
        return new URL(url, window.location.href).href;
    } catch (e) {
        return url;
    }
}

function preloadImageUrl(url, timeout = 6000) {
    const normalizedUrl = normalizeVipUrl(url);
    if (!normalizedUrl) return Promise.resolve(false);
    if (vipPreloadCache.has(normalizedUrl)) return vipPreloadCache.get(normalizedUrl);

    const promise = new Promise((resolve) => {
        const img = new Image();
        let done = false;

        const finish = (ok) => {
            if (done) return;
            done = true;
            resolve(ok);
        };

        img.decoding = 'async';
        img.onload = async () => {
            try {
                if (img.decode) await img.decode();
            } catch (e) {}
            finish(true);
        };
        img.onerror = () => finish(false);
        setTimeout(() => finish(false), timeout);
        img.src = normalizedUrl;
    });

    vipPreloadCache.set(normalizedUrl, promise);
    return promise;
}

async function getAgencyDataWarm() {
    const cachedAgency = Cache.get('site_agency');
    if (cachedAgency) {
        if (cachedAgency.image) preloadImageUrl(cachedAgency.image);
        return cachedAgency;
    }

    if (agencyWarmPromise) return agencyWarmPromise;

    agencyWarmPromise = (async () => {
        try {
            const d = await getDoc(doc(db, 'settings', 'agency'));
            const agencyData = d.exists() ? d.data() : { empty: true };
            Cache.set('site_agency', agencyData);
            if (agencyData.image) await preloadImageUrl(agencyData.image);
            return agencyData;
        } catch (e) {
            agencyWarmPromise = null;
            console.error('Erreur préchargement agence:', e);
            return null;
        }
    })();

    return agencyWarmPromise;
}

function warmFounderAssets() {
    const settings = Cache.get('site_settings');
    const currentImg = document.getElementById('vip-img-display');
    const founderUrl = settings?.founderImg || currentImg?.currentSrc || currentImg?.src;
    if (founderUrl) preloadImageUrl(founderUrl);
}

function warmAgencyAssets() {
    getAgencyDataWarm();
}

function setupFounderAgencyPrewarm(tabFounder, tabAgency) {
    if (tabAgency) {
        ['pointerenter', 'mouseenter', 'focus', 'touchstart', 'mouseover'].forEach((eventName) => {
            tabAgency.addEventListener(eventName, warmAgencyAssets, { passive: true });
        });
    }

    if (tabFounder) {
        ['pointerenter', 'mouseenter', 'focus', 'touchstart', 'mouseover'].forEach((eventName) => {
            tabFounder.addEventListener(eventName, warmFounderAssets, { passive: true });
        });
    }

    const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 450));
    idle(() => {
        warmFounderAssets();
        warmAgencyAssets();
        stabilizeFounderAgencyPanel();
    });
}

function setVipLicensesVisible(isVisible) {
    const licenses = document.getElementById('vip-licenses-display');
    if (!licenses) return;
    licenses.style.display = 'flex';
    licenses.classList.toggle('vip-licenses-hidden', !isVisible);
    licenses.setAttribute('aria-hidden', String(!isVisible));
}

async function setVipImageSmooth(nextUrl) {
    const baseImg = document.getElementById('vip-img-display');
    if (!baseImg || !nextUrl) return;

    const normalizedNextUrl = normalizeVipUrl(nextUrl);
    const currentUrl = normalizeVipUrl(baseImg.dataset.currentVipSrc || baseImg.currentSrc || baseImg.src);
    if (currentUrl === normalizedNextUrl) return;

    await preloadImageUrl(normalizedNextUrl);

    const wrapper = baseImg.closest('.vip-photo-wrapper');
    if (!wrapper) {
        baseImg.src = normalizedNextUrl;
        baseImg.dataset.currentVipSrc = normalizedNextUrl;
        return;
    }

    wrapper.querySelectorAll('.vip-img-crossfade-layer').forEach((layer) => layer.remove());

    const layer = new Image();
    layer.className = 'vip-img-crossfade-layer';
    layer.alt = baseImg.alt || '';
    layer.decoding = 'async';
    layer.src = normalizedNextUrl;
    wrapper.appendChild(layer);

    requestAnimationFrame(() => {
        layer.classList.add('is-active');
    });

    window.clearTimeout(baseImg._vipSwapTimer);
    baseImg._vipSwapTimer = window.setTimeout(() => {
        baseImg.src = normalizedNextUrl;
        baseImg.dataset.currentVipSrc = normalizedNextUrl;
        layer.remove();
    }, 430);
}

function stabilizeFounderAgencyPanel() {
    const section = document.querySelector('.founder-vip-section');
    const content = document.querySelector('.vip-content');
    const photo = document.querySelector('.vip-photo-wrapper');
    const desc = document.getElementById('vip-desc-display');
    const quote = document.getElementById('vip-quote-display');
    const title = document.getElementById('vip-title-display');
    const licenses = document.getElementById('vip-licenses-display');
    if (!section || !content) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const baseSectionMin = isMobile ? 0 : 620;
    const baseContentMin = isMobile ? 500 : 560;
    const baseDescMin = isMobile ? 165 : 150;
    const baseQuoteMin = isMobile ? 84 : 70;
    const baseTitleMin = isMobile ? 96 : 90;

    if (!isMobile) {
        section.style.minHeight = Math.max(parseFloat(section.style.minHeight || '0') || 0, Math.ceil(section.getBoundingClientRect().height), baseSectionMin) + 'px';
        if (photo) photo.style.minHeight = section.style.minHeight;
    }

    content.style.minHeight = Math.max(parseFloat(content.style.minHeight || '0') || 0, Math.ceil(content.getBoundingClientRect().height), baseContentMin) + 'px';

    if (title) title.style.minHeight = Math.max(parseFloat(title.style.minHeight || '0') || 0, Math.ceil(title.getBoundingClientRect().height), baseTitleMin) + 'px';
    if (quote) quote.style.minHeight = Math.max(parseFloat(quote.style.minHeight || '0') || 0, Math.ceil(quote.getBoundingClientRect().height), baseQuoteMin) + 'px';
    if (desc) desc.style.minHeight = Math.max(parseFloat(desc.style.minHeight || '0') || 0, Math.ceil(desc.getBoundingClientRect().height), baseDescMin) + 'px';
    if (licenses) licenses.style.minHeight = Math.max(parseFloat(licenses.style.minHeight || '0') || 0, Math.ceil(licenses.getBoundingClientRect().height), 52) + 'px';
}
`;

main = replaceRegex(
  main,
  /    \/\/ LOGIQUE DES ONGLETS AGENCE \/ FONDATEUR[\s\S]*?    \}\r?\n\r?\n\r?\n\r?\n\r?\n\r?\nconst vipPreloadCache = new Map\(\);/,
  `${tabLogicV3}\n\nconst vipPreloadCache = new Map();`,
  'replace tab logic v3'
);

main = replaceRegex(
  main,
  /const vipPreloadCache = new Map\(\);[\s\S]*?\n\n    const updateContent = \(lang\) => \{/,
  `${helpersV3}\n\n    const updateContent = (lang) => {`,
  'replace vip helpers v3'
);

main = main.replace(/document\.getElementById\('vip-licenses-display'\)\.style\.display = 'flex';/g, 'setVipLicensesVisible(true);');
main = main.replace(/document\.getElementById\('vip-licenses-display'\)\.style\.display = 'none';/g, 'setVipLicensesVisible(false);');

main = main.replace(
  '        await loadSettings(); \r\n        updateContent(localStorage.getItem(\'usm_lang\') || currentLang);',
  '        await loadSettings(); \r\n        warmFounderAssets();\r\n        warmAgencyAssets();\r\n        stabilizeFounderAgencyPanel();\r\n        updateContent(localStorage.getItem(\'usm_lang\') || currentLang);\r\n        requestAnimationFrame(stabilizeFounderAgencyPanel);'
);

const cssV3 = `

/* ================= STABILITÉ VIP FONDATEUR / AGENCE V3 ================= */
.founder-vip-section {
    min-height: clamp(620px, 44vw, 720px);
    align-items: stretch;
    contain: paint;
}

.vip-photo-wrapper {
    min-height: inherit;
    overflow: hidden;
    background: #050507;
    isolation: isolate;
}

.vip-photo-wrapper img {
    display: block;
    backface-visibility: hidden;
    transform: translateZ(0);
}

#vip-img-display {
    opacity: 1 !important;
    transition: none !important;
    position: relative;
    z-index: 0;
}

.vip-img-crossfade-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    filter: contrast(1.1) brightness(0.9);
    opacity: 0;
    z-index: 1;
    pointer-events: none;
    transition: opacity 0.42s cubic-bezier(0.25, 1, 0.5, 1);
    will-change: opacity;
}

.vip-img-crossfade-layer.is-active {
    opacity: 1;
}

.vip-photo-wrapper::after {
    z-index: 2;
    pointer-events: none;
}

.vip-content {
    min-height: 560px;
    justify-content: center;
}

#vip-title-display,
#vip-quote-display,
#vip-desc-display,
#vip-licenses-display {
    transition: opacity 0.24s ease, transform 0.24s ease;
}

.vip-content-switching {
    opacity: 0 !important;
    transform: translateY(8px);
}

#vip-title-display {
    min-height: 90px;
}

#vip-quote-display {
    min-height: 70px;
}

#vip-desc-display {
    min-height: 150px;
}

#vip-licenses-display {
    display: flex !important;
    min-height: 52px;
    opacity: 1;
    visibility: visible;
    transition: opacity 0.24s ease, visibility 0.24s ease;
}

#vip-licenses-display.vip-licenses-hidden,
#vip-licenses-display[aria-hidden="true"] {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}

@media (max-width: 768px) {
    .founder-vip-section {
        min-height: auto;
        contain: paint;
    }

    .vip-photo-wrapper {
        min-height: 420px;
    }

    .vip-content {
        min-height: 500px;
        padding: 42px 28px;
    }

    #vip-title-display {
        min-height: 96px;
    }

    #vip-quote-display {
        min-height: 84px;
    }

    #vip-desc-display {
        min-height: 165px;
    }
}
`;

css = css.replace(/\/\* ================= STABILITÉ VIP FONDATEUR \/ AGENCE V[23] ================= \*\/[\s\S]*$/m, '').trimEnd();
css += cssV3;

fs.writeFileSync('index.html', index, 'utf8');
fs.writeFileSync('main.js', main, 'utf8');
fs.writeFileSync('style.css', css, 'utf8');
console.log('Founder/agency panel stability V3 patch complete.');
