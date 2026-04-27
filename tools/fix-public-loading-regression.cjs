const fs = require('fs');

let content = fs.readFileSync('main.js', 'utf8');

content = content.replace('        LoadingUI.showRoster();\r\n', '');

content = content.replace(
  '        await loadSettings(); \r\n        await loadSocialLinks();',
  '        await loadSettings(); \r\n        updateContent(localStorage.getItem(\'usm_lang\') || currentLang);\r\n        await loadSocialLinks();'
);

content = content.replace(
  "        const container = document.getElementById('roster-categories-container');\n        if (!container || container.dataset.ready === 'true' || container.children.length) return;\n        container.classList.add('is-loading', 'progressive-zone');\n        container.innerHTML = '<div class=\"category-block skeleton-roster-block\" aria-hidden=\"true\"><div class=\"category-header\"><div class=\"skeleton-line skeleton-title\"></div><div class=\"slider-controls\"><span class=\"skeleton-dot\"></span><span class=\"skeleton-dot\"></span></div></div><div class=\"horizontal-scroller\">' + Array.from({ length: 4 }, () => '<div class=\"skeleton-card skeleton-player-card\"></div>').join('') + '</div></div>';",
  "        return;"
);

fs.writeFileSync('main.js', content, 'utf8');
console.log('Public loading regression fixed.');
