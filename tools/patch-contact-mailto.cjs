const fs = require('fs');

const file = 'contact.html';
let html = fs.readFileSync(file, 'utf8');

html = html.replace(/href="style\.css(?:\?v=[^"]*)?"/g, 'href="style.css?v=contact-mailto-1"');
html = html.replace(/src="main\.js(?:\?v=[^"]*)?"/g, 'src="main.js?v=contact-mailto-1"');
html = html.replace(/\s*<script src="contact-mailto\.js(?:\?v=[^"]*)?"><\/script>/g, '');

const scriptTag = '\n    <script src="contact-mailto.js?v=contact-mailto-1"></script>';

if (html.includes('<script type="module" src="main.js?v=contact-mailto-1"></script>')) {
  html = html.replace(
    '<script type="module" src="main.js?v=contact-mailto-1"></script>',
    '<script type="module" src="main.js?v=contact-mailto-1"></script>' + scriptTag
  );
} else {
  html = html.replace('</body>', scriptTag + '\n</body>');
}

fs.writeFileSync(file, html, 'utf8');
console.log('Contact mailto fallback wired.');
