const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');

index = index.replace(/href="style\.css(?:\?v=[^"]*)?"/g, 'href="style.css?v=runtime-fix-1"');
index = index.replace(/src="main\.js(?:\?v=[^"]*)?"/g, 'src="main.js?v=runtime-fix-1"');

index = index.replace(/\s*<script type="module" src="vip-runtime-fix\.js(?:\?v=[^"]*)?"><\/script>/g, '');
index = index.replace(/\s*<script type="module" src="roster-runtime-fix\.js(?:\?v=[^"]*)?"><\/script>/g, '');

const runtimeScripts = `\n    <script type="module" src="vip-runtime-fix.js?v=runtime-fix-1"></script>\n    <script type="module" src="roster-runtime-fix.js?v=runtime-fix-1"></script>`;

index = index.replace(
  /(<script type="module" src="main\.js\?v=runtime-fix-1"><\/script>)/,
  `$1${runtimeScripts}`
);

fs.writeFileSync('index.html', index, 'utf8');
console.log('Runtime fixes wired into index.html.');
