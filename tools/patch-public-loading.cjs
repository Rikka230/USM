const fs = require('fs');

function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) throw new Error(`Missing patch anchor: ${label}`);
  return content.replace(search, replacement);
}

let main = fs.readFileSync('main.js', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');

if (!main.includes('const LoadingUI = {')) {
  const loadingBlock = `

/* ================= 2B. CHARGEMENT PROGRESSIF PUBLIC ================= */
const LoadingUI = {
    showServices() {
        const container = document.getElementById('services-container');
        if (!container || container.dataset.ready === 'true' || container.children.length) return;
        container.classList.add('is-loading', 'progressive-zone');
        container.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton-card skeleton-service-card" aria-hidden="true"></div>').join('');
    },
    showRoster() {
        const container = document.getElementById('roster-categories-container');
        if (!container || container.dataset.ready === 'true' || container.children.length) return;
        container.classList.add('is-loading', 'progressive-zone');
        container.innerHTML = '<div class="category-block skeleton-roster-block" aria-hidden="true"><div class="category-header"><div class="skeleton-line skeleton-title"></div><div class="slider-controls"><span class="skeleton-dot"></span><span class="skeleton-dot"></span></div></div><div class="horizontal-scroller">' + Array.from({ length: 4 }, () => '<div class="skeleton-card skeleton-player-card"></div>').join('') + '</div></div>';
    },
    showPresse() {
        ['videos-container', 'articles-container', 'presse-videos-container', 'presse-articles-container'].forEach((id) => {
            const container = document.getElementById(id);
            if (!container || container.dataset.ready === 'true' || container.children.length) return;
            container.classList.add('is-loading', 'progressive-zone');
            container.innerHTML = Array.from({ length: 3 }, () => '<div class="skeleton-card skeleton-press-card" aria-hidden="true"></div>').join('');
        });
    },
    markReady(target) {
        const el = typeof target === 'string' ? document.getElementById(target) : target;
        if (!el) return;
        el.dataset.ready = 'true';
        el.classList.remove('is-loading');
        el.classList.add('is-ready', 'progressive-zone');
    },
    imageLoaded(img) {
        if (!img) return;
        img.classList.add('loaded');
    }
};
`;
  main = replaceOnce(main, '/* ================= 3. TRADUCTION i18n ================= */', `${loadingBlock}\n/* ================= 3. TRADUCTION i18n ================= */`, 'insert LoadingUI');
}

if (!main.includes('LoadingUI.showServices();')) {
  main = replaceOnce(main, '    const startApp = async () => {\r\n        await loadSettings();', '    const startApp = async () => {\r\n        LoadingUI.showServices();\r\n        LoadingUI.showRoster();\r\n        LoadingUI.showPresse();\r\n        await loadSettings();', 'startApp loading placeholders CRLF');
}

if (!main.includes("img.classList.add('dynamic-img')")) {
  const oldSmooth = `function loadSmoothImage(selector, url, finalOpacity = '1') {\r\n    const img = document.querySelector(selector);\r\n    if (img && url) {\r\n        img.style.opacity = '0'; \r\n        img.style.transition = 'opacity 1.2s ease-in-out'; \r\n        img.onload = () => { img.style.opacity = finalOpacity; };\r\n        img.src = url; \r\n    }\r\n}`;
  const newSmooth = `function loadSmoothImage(selector, url, finalOpacity = '1') {\r\n    const img = document.querySelector(selector);\r\n    if (img && url) {\r\n        img.classList.add('dynamic-img');\r\n        img.style.setProperty('--final-opacity', finalOpacity);\r\n        img.onload = () => {\r\n            img.style.opacity = finalOpacity;\r\n            LoadingUI.imageLoaded(img);\r\n        };\r\n        img.src = url;\r\n        if (img.complete) {\r\n            img.style.opacity = finalOpacity;\r\n            LoadingUI.imageLoaded(img);\r\n        }\r\n    }\r\n}`;
  main = replaceOnce(main, oldSmooth, newSmooth, 'loadSmoothImage');
}

if (!main.includes("LoadingUI.markReady(container);\r\n\r\n    const btnSrvPrev")) {
  main = replaceOnce(main, '    container.innerHTML = html;\r\n\r\n    const btnSrvPrev = document.getElementById(\'btn-srv-prev\');', '    container.innerHTML = html;\r\n    LoadingUI.markReady(container);\r\n\r\n    const btnSrvPrev = document.getElementById(\'btn-srv-prev\');', 'services ready');
}

if (!main.includes("LoadingUI.markReady('roster-categories-container')")) {
  const rosterTargets = [
    'container.innerHTML = html;\r\n        setupSliderControls();',
    'container.innerHTML = html;\r\n    setupSliderControls();'
  ];
  let patched = false;
  for (const target of rosterTargets) {
    if (main.includes(target)) {
      main = main.replace(target, target.replace('container.innerHTML = html;', "container.innerHTML = html;\r\n        LoadingUI.markReady('roster-categories-container');"));
      patched = true;
      break;
    }
  }
  if (!patched) console.warn('Roster ready marker not patched, anchor not found.');
}

if (!main.includes("document.addEventListener('DOMContentLoaded', () => document.body.classList.add('dom-ready'))")) {
  main += `\n\n// Public loading safety flag\ndocument.addEventListener('DOMContentLoaded', () => document.body.classList.add('dom-ready'));\n`;
}

const cssBlock = `

/* ================= CHARGEMENT PROGRESSIF / ANTI-POP ================= */
.progressive-zone {
    transition: opacity 0.35s ease, transform 0.35s ease;
}

.progressive-zone.is-loading {
    opacity: 0.78;
}

.progressive-zone.is-ready {
    opacity: 1;
    animation: progressiveReveal 0.42s ease both;
}

@keyframes progressiveReveal {
    from { opacity: 0.55; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.skeleton-card,
.skeleton-line,
.skeleton-dot {
    position: relative;
    overflow: hidden;
    background: linear-gradient(110deg, rgba(255,255,255,0.055) 8%, rgba(255,255,255,0.11) 18%, rgba(255,255,255,0.055) 33%);
    background-size: 200% 100%;
    animation: skeletonSweep 1.25s linear infinite;
    border: 1px solid rgba(255,255,255,0.08);
}

@keyframes skeletonSweep {
    to { background-position-x: -200%; }
}

.skeleton-service-card {
    flex: 0 0 auto;
    width: 320px;
    height: 320px;
    border-radius: 16px;
}

.skeleton-roster-block {
    width: 100%;
    margin-bottom: 60px;
}

.skeleton-player-card {
    flex: 0 0 280px;
    height: 395px;
    border-radius: 24px;
}

.skeleton-press-card {
    min-height: 220px;
    border-radius: 22px;
}

.skeleton-line.skeleton-title {
    width: 220px;
    height: 22px;
    border-radius: 999px;
}

.skeleton-dot {
    display: inline-flex;
    width: 44px;
    height: 44px;
    border-radius: 50%;
}

.dynamic-img {
    opacity: 0;
    transition: opacity 0.65s ease-in-out, filter 0.65s ease-in-out;
}

.dynamic-img.loaded {
    opacity: var(--final-opacity, 1);
}

#services-container:empty,
#roster-categories-container:empty {
    min-height: 320px;
}

#services-container.is-loading,
#roster-categories-container.is-loading {
    min-height: 320px;
}
`;

if (!css.includes('CHARGEMENT PROGRESSIF / ANTI-POP')) {
  css += cssBlock;
}

fs.writeFileSync('main.js', main, 'utf8');
fs.writeFileSync('style.css', css, 'utf8');
console.log('Public loading UX patch complete.');
