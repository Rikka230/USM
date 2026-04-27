const fs = require('fs');

let main = fs.readFileSync('main.js', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');

// Keep the roster skeleton disabled: it was blocking initial player rendering.
main = main.replace('        LoadingUI.showRoster();\r\n', '');
main = main.replace('        LoadingUI.showRoster();\n', '');

// Ensure founder text is refreshed after Firebase settings have populated translations.
main = main.replace(
  '        await loadSettings(); \r\n        await loadSocialLinks();',
  '        await loadSettings(); \r\n        updateContent(localStorage.getItem(\'usm_lang\') || currentLang);\r\n        await loadSocialLinks();'
);

// Make showRoster a no-op so it cannot inject blocking placeholders again.
main = main.replace(
  "        const container = document.getElementById('roster-categories-container');\n        if (!container || container.dataset.ready === 'true' || container.children.length) return;\n        container.classList.add('is-loading', 'progressive-zone');\n        container.innerHTML = '<div class=\"category-block skeleton-roster-block\" aria-hidden=\"true\"><div class=\"category-header\"><div class=\"skeleton-line skeleton-title\"></div><div class=\"slider-controls\"><span class=\"skeleton-dot\"></span><span class=\"skeleton-dot\"></span></div></div><div class=\"horizontal-scroller\">' + Array.from({ length: 4 }, () => '<div class=\"skeleton-card skeleton-player-card\"></div>').join('') + '</div></div>';",
  "        return;"
);

// VIP: keep text fade, but do not fade the image with text.
main = main.replace(
  "const elements = ['vip-title-display', 'vip-quote-display', 'vip-desc-display', 'vip-licenses-display', 'vip-img-display'];",
  "const elements = ['vip-title-display', 'vip-quote-display', 'vip-desc-display', 'vip-licenses-display'];"
);

if (!main.includes('function preloadImageUrl(url')) {
  const helper = `

function preloadImageUrl(url, timeout = 1200) {
    return new Promise((resolve) => {
        if (!url) return resolve(false);
        const img = new Image();
        let done = false;
        const finish = (ok) => {
            if (done) return;
            done = true;
            resolve(ok);
        };
        img.onload = () => finish(true);
        img.onerror = () => finish(false);
        setTimeout(() => finish(false), timeout);
        img.src = url;
    });
}

async function setVipImageSmooth(nextUrl) {
    const img = document.getElementById('vip-img-display');
    if (!img || !nextUrl || img.src === nextUrl) return;
    await preloadImageUrl(nextUrl);
    img.classList.add('vip-image-switching');
    requestAnimationFrame(() => {
        img.src = nextUrl;
        img.onload = () => img.classList.remove('vip-image-switching');
        setTimeout(() => img.classList.remove('vip-image-switching'), 520);
    });
}
`;
  main = main.replace('function stabilizeFounderAgencyPanel() {', `${helper}\nfunction stabilizeFounderAgencyPanel() {`);
}

main = main.replace(
  "if(fImg) document.getElementById('vip-img-display').src = fImg;",
  "if(fImg) setVipImageSmooth(fImg);"
);
main = main.replace(
  "if(agencyData.image) document.getElementById('vip-img-display').src = agencyData.image;",
  "if(agencyData.image) await setVipImageSmooth(agencyData.image);"
);

// Dynamic image reveal: apply to images that arrive after Firebase renders cards.
if (!main.includes('function setupDynamicImageReveal()')) {
  const revealHelper = `

function setupDynamicImageReveal() {
    const selector = '.player-card img, .player-img, .card-player img, .talent-card img, .roster-card img, .press-card img, .article-card img, .video-card img';
    const prepare = (img) => {
        if (!img || img.dataset.fadeReady === 'true') return;
        img.dataset.fadeReady = 'true';
        img.classList.add('soft-load-img');
        const reveal = () => img.classList.add('is-loaded');
        if (img.complete && img.naturalWidth > 0) reveal();
        else {
            img.addEventListener('load', reveal, { once: true });
            img.addEventListener('error', reveal, { once: true });
        }
    };

    document.querySelectorAll(selector).forEach(prepare);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                if (node.matches?.(selector)) prepare(node);
                node.querySelectorAll?.(selector).forEach(prepare);
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
`;
  main = main.replace('const startApp = async () => {', `${revealHelper}\n    setupDynamicImageReveal();\r\n\r\n    const startApp = async () => {`);
}

const cssPatch = `

/* ================= IMAGE REVEAL CONTROLLED ================= */
#vip-img-display {
    transition: opacity 0.42s ease, filter 0.42s ease, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

#vip-img-display.vip-image-switching {
    opacity: 0.18;
    filter: blur(6px) brightness(0.82);
    transform: scale(1.012);
}

.soft-load-img {
    opacity: 0;
    filter: blur(6px);
    transform: scale(1.015);
    transition: opacity 0.42s ease, filter 0.42s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.soft-load-img.is-loaded {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
}
`;

if (!css.includes('IMAGE REVEAL CONTROLLED')) {
  css += cssPatch;
}

fs.writeFileSync('main.js', main, 'utf8');
fs.writeFileSync('style.css', css, 'utf8');
console.log('VIP and dynamic image loading smoothed.');
