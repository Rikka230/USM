const fs = require('fs');

// Final state is now integrated directly in index.html, main.js and style.css.
// This workflow helper is intentionally conservative so it cannot re-inject
// the old runtime override scripts.
let index = fs.readFileSync('index.html', 'utf8');

index = index.replace(/href="style\.css(?:\?v=[^"]*)?"/g, 'href="style.css?v=final-smooth-1"');
index = index.replace(/src="main\.js(?:\?v=[^"]*)?"/g, 'src="main.js?v=final-smooth-1"');
index = index.replace(/\s*<script type="module" src="vip-runtime-fix\.js(?:\?v=[^"]*)?"><\/script>/g, '');
index = index.replace(/\s*<script type="module" src="roster-runtime-fix\.js(?:\?v=[^"]*)?"><\/script>/g, '');

fs.writeFileSync('index.html', index, 'utf8');
console.log('Final smooth assets verified.');
