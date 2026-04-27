const fs = require('fs');

function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) throw new Error(`Missing patch anchor: ${label}`);
  return content.replace(search, replacement);
}

let main = fs.readFileSync('main.js', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');

if (!main.includes('function stabilizeFounderAgencyPanel')) {
  const helper = `

function stabilizeFounderAgencyPanel() {
    const section = document.querySelector('.founder-vip-section');
    const content = document.querySelector('.vip-content');
    const desc = document.getElementById('vip-desc-display');
    const licenses = document.getElementById('vip-licenses-display');
    if (!section || !content) return;

    const currentSectionMin = parseFloat(section.style.minHeight || '0') || 0;
    const currentContentMin = parseFloat(content.style.minHeight || '0') || 0;
    const sectionHeight = Math.ceil(section.getBoundingClientRect().height);
    const contentHeight = Math.ceil(content.getBoundingClientRect().height);

    section.style.minHeight = Math.max(currentSectionMin, sectionHeight, 560) + 'px';
    content.style.minHeight = Math.max(currentContentMin, contentHeight, 500) + 'px';

    if (desc) {
        const descHeight = Math.ceil(desc.getBoundingClientRect().height);
        const currentDescMin = parseFloat(desc.style.minHeight || '0') || 0;
        desc.style.minHeight = Math.max(currentDescMin, descHeight, 105) + 'px';
    }

    if (licenses) {
        const licensesHeight = Math.ceil(licenses.getBoundingClientRect().height);
        const currentLicensesMin = parseFloat(licenses.style.minHeight || '0') || 0;
        licenses.style.minHeight = Math.max(currentLicensesMin, licensesHeight, 44) + 'px';
    }
}
`;
  main = replaceOnce(main, '    const updateContent = (lang) => {', `${helper}\n    const updateContent = (lang) => {`, 'insert stabilize helper');
}

if (!main.includes('stabilizeFounderAgencyPanel();\r\n\r\n        tabFounder.addEventListener')) {
  main = main.replace('        tabFounder.addEventListener', '        stabilizeFounderAgencyPanel();\r\n\r\n        tabFounder.addEventListener');
}

if (!main.includes('setTimeout(stabilizeFounderAgencyPanel, 40);')) {
  main = main.replace('                await updateContentCallback();\r\n                elements.forEach(id => {', '                await updateContentCallback();\r\n                stabilizeFounderAgencyPanel();\r\n                setTimeout(stabilizeFounderAgencyPanel, 40);\r\n                elements.forEach(id => {');
}

if (!main.includes("window.addEventListener('resize', stabilizeFounderAgencyPanel);")) {
  main = main.replace('        });\r\n    }\r\n\r\n    const updateContent = (lang) => {', "        });\r\n\r\n        window.addEventListener('resize', stabilizeFounderAgencyPanel);\r\n    }\r\n\r\n    const updateContent = (lang) => {");
}

const cssPatch = `

/* ================= STABILITÉ BLOC FONDATEUR / AGENCE ================= */
.founder-vip-section {
    min-height: 560px;
    contain: layout paint;
}

.vip-content {
    min-height: 500px;
}

#vip-desc-display {
    min-height: 105px;
}

#vip-licenses-display {
    min-height: 44px;
    transition: opacity 0.25s ease, visibility 0.25s ease;
}

#vip-licenses-display[style*="display: none"] {
    display: flex !important;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}

@media (max-width: 768px) {
    .founder-vip-section {
        min-height: auto;
        contain: paint;
    }

    .vip-content {
        min-height: 460px;
    }

    #vip-desc-display {
        min-height: 130px;
    }
}
`;

if (!css.includes('STABILITÉ BLOC FONDATEUR / AGENCE')) {
  css += cssPatch;
}

fs.writeFileSync('main.js', main, 'utf8');
fs.writeFileSync('style.css', css, 'utf8');
console.log('Founder/agency panel stability patch complete.');
