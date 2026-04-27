const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');
let main = fs.readFileSync('main.js', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');

// Force the Firebase preview/browser to fetch the updated front assets.
index = index.replace(/href="style\.css(?:\?v=[^"]*)?"/g, 'href="style.css?v=vip-agency-v3"');
index = index.replace(/src="main\.js(?:\?v=[^"]*)?"/g, 'src="main.js?v=vip-agency-v3"');

// Previous patch accidentally registered the prewarm inside the transition callback.
// That means the first user click was not preloaded. Move it to initial setup.
main = main.replace(
  /\n\s*stabilizeFounderAgencyPanel\(\);\n\s*setupFounderAgencyPrewarm\(tabFounder, tabAgency\);\r?\n\s*setTimeout\(stabilizeFounderAgencyPanel, 40\);/,
  '\n                stabilizeFounderAgencyPanel();\r\n                setTimeout(stabilizeFounderAgencyPanel, 40);'
);

if (!main.includes('setupFounderAgencyPrewarm(tabFounder, tabAgency);\r\n\r\n        tabFounder.addEventListener')) {
  main = main.replace(
    '        stabilizeFounderAgencyPanel();\r\n\r\n        tabFounder.addEventListener',
    '        stabilizeFounderAgencyPanel();\r\n        setupFounderAgencyPrewarm(tabFounder, tabAgency);\r\n\r\n        tabFounder.addEventListener'
  );
}

// Warm the real Firebase settings/images as soon as settings are loaded, before interaction.
if (!main.includes('warmAgencyAssets();\r\n        stabilizeFounderAgencyPanel();\r\n        updateContent')) {
  main = main.replace(
    "        await loadSettings(); \r\n        updateContent(localStorage.getItem('usm_lang') || currentLang);",
    "        await loadSettings(); \r\n        warmFounderAssets();\r\n        warmAgencyAssets();\r\n        stabilizeFounderAgencyPanel();\r\n        updateContent(localStorage.getItem('usm_lang') || currentLang);\r\n        requestAnimationFrame(stabilizeFounderAgencyPanel);"
  );
}

// Add a slightly stronger visual state for text switch without relying on inline opacity only.
if (!css.includes('vip-content-switching')) {
  css += `\n\n.vip-content-switching {\n    opacity: 0 !important;\n    transform: translateY(8px);\n}\n`;
}

// Ensure existing V2 CSS receives minimums strong enough to avoid agency/founder frame jump.
css = css.replace(/min-height: clamp\(590px, 43vw, 700px\);/g, 'min-height: clamp(620px, 44vw, 720px);');
css = css.replace(/min-height: 530px;/g, 'min-height: 560px;');
css = css.replace(/min-height: 130px;/g, 'min-height: 150px;');
css = css.replace(/min-height: 48px;/g, 'min-height: 52px;');

fs.writeFileSync('index.html', index, 'utf8');
fs.writeFileSync('main.js', main, 'utf8');
fs.writeFileSync('style.css', css, 'utf8');
console.log('Founder/agency panel direct stability patch complete.');
