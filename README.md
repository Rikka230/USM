const fs = require('fs');

function replaceOrFail(content, pattern, replacement, label) {
  if (!pattern.test(content)) throw new Error(`Missing patch target: ${label}`);
  return content.replace(pattern, replacement);
}

let index = fs.readFileSync('index.html', 'utf8');
let main = fs.readFileSync('main.js', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');

index = index.replace(/href="style\.css(?:\?v=[^"]*)?"/g, 'href="style.css?v=vip-hardfix-1"');
index = index.replace(/src="main\.js(?:\?v=[^"]*)?"/g, 'src="main.js?v=vip-hardfix-1"');

const vipBlock = `    // LOGIQUE DES ONGLETS AGENCE / FONDATEUR - HARD FIX
    const tabFounder = document.getElementById('tab-founder');
    const tabAgency = document.getElementById('tab-agency');

    const vipImageCache = new Map();
    let vipAgencyPromise = null;
    let vipSwitchToken = 0;

    function waitFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    function normalizeVipUrl(url) {
        if (!url) return '';
        try { return new URL(url, window.location.href).href; }
        catch (e) { return url; }
    }

    function preloadVipImage(url) {
        const normalizedUrl = normalizeVipUrl(url);
        if (!normalizedUrl) return Promise.resolve(false);
        if (vipImageCache.has(normalizedUrl)) return vipImageCache.get(normalizedUrl);

        const promise = new Promise((resolve) => {
            const img = new Image();
            let settled = false;
            const done = (ok) => {
                if (settled) return;
                settled = true;
                resolve(ok);
            };
            img.decoding = 'async';
            img.onload = async () => {
                try { if (img.decode) await img.decode(); } catch (e) {}
                done(true);
            };
            img.onerror = () => done(false);
            setTimeout(() => done(false), 6000);
            img.src = normalizedUrl;
        });

        vipImageCache.set(normalizedUrl, promise);
        return promise;
    }

    async function getAgencyDataPrepared() {
        const cached = Cache.get('site_agency');
        if (cached) {
            if (cached.image) preloadVipImage(cached.image);
            return cached;
        }

        if (vipAgencyPromise) return vipAgencyPromise;

        vipAgencyPromise = (async () => {
            try {
                const d = await getDoc(doc(db, 'settings', 'agency'));
                const data = d.exists() ? d.data() : { empty: true };
                Cache.set('site_agency', data);
                if (data.image) await preloadVipImage(data.image);
                return data;
            } catch (e) {
                console.error('Erreur Agence:', e);
                vipAgencyPromise = null;
                return null;
            }
        })();

        return vipAgencyPromise;
    }

    function getFounderImageUrl() {
        const settings = Cache.get('site_settings');
        const img = document.getElementById('vip-img-display');
        return settings?.founderImg || img?.dataset.currentVipSrc || img?.currentSrc || img?.src || '';
    }

    function warmFounderAssets() {
        const url = getFounderImageUrl();
        if (url) preloadVipImage(url);
    }

    function warmAgencyAssets() {
        getAgencyDataPrepared();
    }

    function setVipTabState(target) {
        if (!tabFounder || !tabAgency) return;
        const isFounder = target === 'founder';
        tabFounder.classList.toggle('active', isFounder);
        tabAgency.classList.toggle('active', !isFounder);
        tabFounder.style.background = isFounder ? 'var(--usm-pink)' : 'rgba(255,255,255,0.1)';
        tabFounder.style.color = isFounder ? '#fff' : '#aaa';
        tabAgency.style.background = !isFounder ? 'var(--usm-pink)' : 'rgba(255,255,255,0.1)';
        tabAgency.style.color = !isFounder ? '#fff' : '#aaa';
    }

    function setVipTextHidden(hidden) {
        ['vip-title-display', 'vip-quote-display', 'vip-desc-display', 'vip-licenses-display'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('vip-content-switching', hidden);
        });
    }

    function setVipLicensesVisible(isVisible) {
        const licenses = document.getElementById('vip-licenses-display');
        if (!licenses) return;
        licenses.style.display = 'flex';
        licenses.classList.toggle('vip-licenses-hidden', !isVisible);
        licenses.setAttribute('aria-hidden', String(!isVisible));
    }

    function lockVipLayout() {
        const section = document.querySelector('.founder-vip-section');
        const content = document.querySelector('.vip-content');
        const photo = document.querySelector('.vip-photo-wrapper');
        const title = document.getElementById('vip-title-display');
        const quote = document.getElementById('vip-quote-display');
        const desc = document.getElementById('vip-desc-display');
        const licenses = document.getElementById('vip-licenses-display');
        if (!section || !content) return;

        const mobile = window.matchMedia('(max-width: 768px)').matches;
        const sectionBase = mobile ? 0 : 640;
        const contentBase = mobile ? 520 : 580;

        if (!mobile) {
            const h = Math.max(sectionBase, Math.ceil(section.getBoundingClientRect().height));
            section.style.minHeight = h + 'px';
            if (photo) photo.style.minHeight = h + 'px';
        }

        content.style.minHeight = Math.max(contentBase, Math.ceil(content.getBoundingClientRect().height)) + 'px';
        if (title) title.style.minHeight = Math.max(96, Math.ceil(title.getBoundingClientRect().height)) + 'px';
        if (quote) quote.style.minHeight = Math.max(76, Math.ceil(quote.getBoundingClientRect().height)) + 'px';
        if (desc) desc.style.minHeight = Math.max(mobile ? 170 : 155, Math.ceil(desc.getBoundingClientRect().height)) + 'px';
        if (licenses) licenses.style.minHeight = Math.max(54, Math.ceil(licenses.getBoundingClientRect().height)) + 'px';
    }

    async function setVipImageSmooth(nextUrl) {
        const baseImg = document.getElementById('vip-img-display');
        if (!baseImg || !nextUrl) return;

        const normalizedNextUrl = normalizeVipUrl(nextUrl);
        const currentUrl = normalizeVipUrl(baseImg.dataset.currentVipSrc || baseImg.currentSrc || baseImg.src);
        if (currentUrl === normalizedNextUrl) return;

        await preloadVipImage(normalizedNextUrl);

        const wrapper = baseImg.closest('.vip-photo-wrapper');
        if (!wrapper) {
            baseImg.src = normalizedNextUrl;
            baseImg.dataset.currentVipSrc = normalizedNextUrl;
            return;
        }

        wrapper.querySelectorAll('.vip-img-crossfade-layer').forEach(layer => layer.remove());

        const layer = new Image();
        layer.className = 'vip-img-crossfade-layer';
        layer.alt = baseImg.alt || '';
        layer.decoding = 'async';
        layer.src = normalizedNextUrl;
        wrapper.appendChild(layer);

        await waitFrame();
        layer.classList.add('is-active');

        window.clearTimeout(baseImg._vipSwapTimer);
        baseImg._vipSwapTimer = window.setTimeout(() => {
            baseImg.src = normalizedNextUrl;
            baseImg.dataset.currentVipSrc = normalizedNextUrl;
            layer.remove();
        }, 520);
    }

    async function showFounderVip() {
        const token = ++vipSwitchToken;
        setVipTabState('founder');
        setVipTextHidden(true);
        await waitFrame();
        if (token !== vipSwitchToken) return;

        const lang = localStorage.getItem('usm_lang') || 'fr';
        const title = document.getElementById('vip-title-display');
        const quote = document.getElementById('vip-quote-display');
        const desc = document.getElementById('vip-desc-display');
        if (title) title.innerHTML = 'Christophe<br><span>Mongai</span>';
        if (quote) quote.textContent = translations[lang].vip_quote || '...';
        if (desc) desc.textContent = translations[lang].vip_desc || '';
        setVipLicensesVisible(true);

        const founderUrl = getFounderImageUrl();
        if (founderUrl) await setVipImageSmooth(founderUrl);
        if (token !== vipSwitchToken) return;

        lockVipLayout();
        setVipTextHidden(false);
    }

    async function showAgencyVip() {
        const token = ++vipSwitchToken;
        setVipTabState('agency');
        setVipTextHidden(true);
        await waitFrame();
        if (token !== vipSwitchToken) return;

        const title = document.getElementById('vip-title-display');
        const quote = document.getElementById('vip-quote-display');
        const desc = document.getElementById('vip-desc-display');
        if (title) title.innerHTML = 'L\\\\'Agence<br><span>USM Football</span>';
        if (quote) quote.textContent = '';
        if (desc) desc.textContent = '';
        setVipLicensesVisible(false);
        lockVipLayout();

        const agencyData = await getAgencyDataPrepared();
        if (token !== vipSwitchToken) return;

        const lang = localStorage.getItem('usm_lang') || 'fr';
        if (agencyData && !agencyData.empty) {
            if (quote) quote.textContent = agencyData['quote_' + lang] || '';
            if (desc) desc.textContent = agencyData['desc_' + lang] || '';
            if (agencyData.image) await setVipImageSmooth(agencyData.image);
        } else {
            if (desc) desc.textContent = 'Informations de l\\\\'agence à venir.';
            if (quote) quote.textContent = '';
        }

        if (token !== vipSwitchToken) return;
        lockVipLayout();
        setVipTextHidden(false);
    }

    function setupVipPrewarm() {
        if (tabAgency) ['pointerenter', 'mouseenter', 'mouseover', 'focus', 'touchstart'].forEach(eventName => {
            tabAgency.addEventListener(eventName, warmAgencyAssets, { passive: true });
        });
        if (tabFounder) ['pointerenter', 'mouseenter', 'mouseover', 'focus', 'touchstart'].forEach(eventName => {
            tabFounder.addEventListener(eventName, warmFounderAssets, { passive: true });
        });
        const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 300));
        idle(() => {
            warmFounderAssets();
            warmAgencyAssets();
            lockVipLayout();
        });
    }

    if (tabFounder && tabAgency) {
        lockVipLayout();
        setupVipPrewarm();
        window.addEventListener('resize', lockVipLayout);

        tabFounder.addEventListener('click', () => {
            if (tabFounder.classList.contains('active')) return;
            showFounderVip();
        });

        tabAgency.addEventListener('click', () => {
            if (tabAgency.classList.contains('active')) return;
            showAgencyVip();
        });
    }

`;

main = replaceOrFail(
  main,
  /    \/\/ LOGIQUE DES ONGLETS AGENCE \/ FONDATEUR[\s\S]*?\n    const updateContent = \(lang\) => \{/,
  `${vipBlock}    const updateContent = (lang) => {`,
  'whole VIP founder/agency block'
);

main = main.replace(
  "        await loadSettings(); \r\n        updateContent(localStorage.getItem('usm_lang') || currentLang);",
  "        await loadSettings(); \r\n        warmFounderAssets();\r\n        warmAgencyAssets();\r\n        lockVipLayout();\r\n        updateContent(localStorage.getItem('usm_lang') || currentLang);\r\n        requestAnimationFrame(lockVipLayout);"
);
main = main.replace(/stabilizeFounderAgencyPanel/g, 'lockVipLayout');

const cssHardFix = `

/* ================= HARD FIX VIP FONDATEUR / AGENCE ================= */
.founder-vip-section {
    min-height: clamp(640px, 45vw, 760px);
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
    transition: opacity 0.52s cubic-bezier(0.25, 1, 0.5, 1);
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
    min-height: 580px;
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

#vip-title-display { min-height: 96px; }
#vip-quote-display { min-height: 76px; }
#vip-desc-display { min-height: 155px; }

#vip-licenses-display {
    display: flex !important;
    min-height: 54px;
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
        min-height: 520px;
        padding: 42px 28px;
    }

    #vip-title-display { min-height: 96px; }
    #vip-quote-display { min-height: 84px; }
    #vip-desc-display { min-height: 170px; }
}
`;

css = css.replace(/\/\* ================= STABILITÉ[\s\S]*$/m, '').trimEnd();
css += cssHardFix;

fs.writeFileSync('index.html', index, 'utf8');
fs.writeFileSync('main.js', main, 'utf8');
fs.writeFileSync('style.css', css, 'utf8');
console.log('Founder/agency hard fix applied.');
