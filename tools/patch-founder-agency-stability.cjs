const fs = require('fs');

function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) throw new Error(`Missing patch anchor: ${label}`);
  return content.replace(search, replacement);
}

function replaceRegex(content, pattern, replacement, label) {
  if (!pattern.test(content)) throw new Error(`Missing patch pattern: ${label}`);
  return content.replace(pattern, replacement);
}

let main = fs.readFileSync('main.js', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');

const helpersV2 = `

const vipPreloadCache = new Map();
let agencyWarmPromise = null;

function normalizeVipUrl(url) {
    if (!url) return '';
    try {
        return new URL(url, window.location.href).href;
    } catch (e) {
        return url;
    }
}

function preloadImageUrl(url, timeout = 5000) {
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
        ['pointerenter', 'mouseenter', 'focus', 'touchstart'].forEach((eventName) => {
            tabAgency.addEventListener(eventName, warmAgencyAssets, { passive: true });
        });
    }

    if (tabFounder) {
        ['pointerenter', 'mouseenter', 'focus', 'touchstart'].forEach((eventName) => {
            tabFounder.addEventListener(eventName, warmFounderAssets, { passive: true });
        });
    }

    const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 700));
    idle(() => {
        warmFounderAssets();
        warmAgencyAssets();
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
    const licenses = document.getElementById('vip-licenses-display');
    if (!section || !content) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const baseSectionMin = isMobile ? 0 : 590;
    const baseContentMin = isMobile ? 470 : 530;
    const baseDescMin = isMobile ? 150 : 130;

    const currentSectionMin = parseFloat(section.style.minHeight || '0') || 0;
    const currentContentMin = parseFloat(content.style.minHeight || '0') || 0;
    const sectionHeight = Math.ceil(section.getBoundingClientRect().height);
    const contentHeight = Math.ceil(content.getBoundingClientRect().height);

    if (!isMobile) {
        section.style.minHeight = Math.max(currentSectionMin, sectionHeight, baseSectionMin) + 'px';
        if (photo) photo.style.minHeight = section.style.minHeight;
    }

    content.style.minHeight = Math.max(currentContentMin, contentHeight, baseContentMin) + 'px';

    if (desc) {
        const descHeight = Math.ceil(desc.getBoundingClientRect().height);
        const currentDescMin = parseFloat(desc.style.minHeight || '0') || 0;
        desc.style.minHeight = Math.max(currentDescMin, descHeight, baseDescMin) + 'px';
    }

    if (licenses) {
        const licensesHeight = Math.ceil(licenses.getBoundingClientRect().height);
        const currentLicensesMin = parseFloat(licenses.style.minHeight || '0') || 0;
        licenses.style.minHeight = Math.max(currentLicensesMin, licensesHeight, 48) + 'px';
    }
}
`;

const helperPattern = /function preloadImageUrl\(url, timeout = 1200\) \{[\s\S]*?\n\}\n\n    const updateContent = \(lang\) => \{/;
if (helperPattern.test(main)) {
  main = main.replace(helperPattern, `${helpersV2}\n\n    const updateContent = (lang) => {`);
} else if (!main.includes('const vipPreloadCache = new Map();')) {
  main = replaceOnce(main, '    const updateContent = (lang) => {', `${helpersV2}\n\n    const updateContent = (lang) => {`, 'insert vip helpers v2');
}

main = main.replace(/document\.getElementById\('vip-licenses-display'\)\.style\.display = 'flex';/g, 'setVipLicensesVisible(true);');
main = main.replace(/document\.getElementById\('vip-licenses-display'\)\.style\.display = 'none';/g, 'setVipLicensesVisible(false);');

if (!main.includes('setupFounderAgencyPrewarm(tabFounder, tabAgency);')) {
  main = replaceOnce(
    main,
    '        stabilizeFounderAgencyPanel();',
    '        stabilizeFounderAgencyPanel();\n        setupFounderAgencyPrewarm(tabFounder, tabAgency);',
    'setup founder agency prewarm'
  );
}

if (!main.includes("window.addEventListener('resize', stabilizeFounderAgencyPanel);")) {
  main = main.replace('    }\r\n\r\n\n\n\n\nfunction preloadImageUrl', "        window.addEventListener('resize', stabilizeFounderAgencyPanel);\r\n    }\r\n\r\n\n\n\n\nfunction preloadImageUrl");
}

const cssV2 = `

/* ================= STABILITÉ VIP FONDATEUR / AGENCE V2 ================= */
.founder-vip-section {
    min-height: clamp(590px, 43vw, 700px);
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
    min-height: 530px;
    justify-content: center;
}

#vip-title-display,
#vip-quote-display,
#vip-desc-display,
#vip-licenses-display {
    transition: opacity 0.28s ease, transform 0.28s ease;
}

#vip-desc-display {
    min-height: 130px;
}

#vip-licenses-display {
    display: flex !important;
    min-height: 48px;
    opacity: 1;
    visibility: visible;
    transition: opacity 0.25s ease, visibility 0.25s ease;
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
        min-height: 470px;
        padding: 42px 28px;
    }

    #vip-desc-display {
        min-height: 150px;
    }
}
`;

if (css.includes('/* ================= STABILITÉ VIP FONDATEUR / AGENCE V2 ================= */')) {
  css = css.replace(/\/\* ================= STABILITÉ VIP FONDATEUR \/ AGENCE V2 ================= \*\/[\s\S]*$/m, cssV2.trimStart());
} else {
  css += cssV2;
}

fs.writeFileSync('main.js', main, 'utf8');
fs.writeFileSync('style.css', css, 'utf8');
console.log('Founder/agency panel stability V2 patch complete.');
