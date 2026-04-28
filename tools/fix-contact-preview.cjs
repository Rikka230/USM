const fs = require('fs');
const path = require('path');

const root = process.cwd();
const oldEmail = 'contact@usm-football.com';
const newEmail = 'contact@usmfootball.com';
const version = 'contact-preview-1';

const allowedExt = new Set(['.html', '.js', '.css', '.json', '.md', '.txt', '.xml']);
const skipDirs = new Set(['.git', 'node_modules']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (allowedExt.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

for (const file of walk(root)) {
  let txt = fs.readFileSync(file, 'utf8');
  const next = txt.split(oldEmail).join(newEmail);
  if (next !== txt) fs.writeFileSync(file, next, 'utf8');
}

for (const name of ['index.html', 'contact.html', 'presse.html', 'mentions.html']) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) continue;
  let txt = fs.readFileSync(file, 'utf8');
  txt = txt.replace(/href="style\.css(?:\?v=[^"]*)?"/g, `href="style.css?v=${version}"`);
  txt = txt.replace(/src="main\.js(?:\?v=[^"]*)?"/g, `src="main.js?v=${version}"`);
  fs.writeFileSync(file, txt, 'utf8');
}

const mainFile = path.join(root, 'main.js');
let main = fs.readFileSync(mainFile, 'utf8');

if (!main.includes('isFirebasePreviewHost')) {
  main = main.replace(
    'const app = initializeApp(firebaseConfig);',
    `const app = initializeApp(firebaseConfig);\n\nconst firebaseHost = window.location.hostname;\nconst isFirebasePreviewHost = firebaseHost.startsWith('usm-football-b56ba--') && firebaseHost.endsWith('.web.app');\nconst isStableFirebaseHost = ['usm-football-b56ba.web.app', 'usm-football-b56ba.firebaseapp.com', 'usmfootball.com', 'www.usmfootball.com', 'localhost', '127.0.0.1'].includes(firebaseHost);`
  );

  main = main.replace(
    /const appCheck = initializeAppCheck\(app, \{[\s\S]*?\n\}\);/,
    `if (isStableFirebaseHost) {\n  try {\n    initializeAppCheck(app, {\n      provider: new ReCaptchaV3Provider('6LdF2rUsAAAAAOUCVKJt2DCDKWQIEQXHyBkYETT1'),\n      isTokenAutoRefreshEnabled: true\n    });\n  } catch (error) {\n    console.warn('App Check non initialise:', error);\n  }\n} else if (isFirebasePreviewHost) {\n  console.info('App Check ignore sur preview Firebase:', firebaseHost);\n}`
  );

  main = main.replace(
    'const analytics = getAnalytics(app);',
    `let analytics = null;\nif (isStableFirebaseHost) {\n  try { analytics = getAnalytics(app); }\n  catch (error) { console.warn('Analytics non initialise:', error); }\n}`
  );
}

fs.writeFileSync(mainFile, main, 'utf8');
console.log('Patch contact preview applied.');
