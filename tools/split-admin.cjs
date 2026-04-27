const fs = require('fs');
const path = require('path');

const root = process.cwd();
const adminPath = path.join(root, 'admin.js');
const legacyPath = path.join(root, 'admin/modules/legacy-admin.js');
const readmePath = path.join(root, 'admin/modules/README.md');

const currentAdmin = fs.readFileSync(adminPath, 'utf8');

if (currentAdmin.includes("./admin/modules/legacy-admin.js")) {
  console.log('Admin is already using the legacy module entrypoint. Nothing to do.');
  process.exit(0);
}

fs.mkdirSync(path.dirname(legacyPath), { recursive: true });

fs.writeFileSync(legacyPath, currentAdmin.replace(/\r\n/g, '\n').trimEnd() + '\n', 'utf8');

fs.writeFileSync(adminPath, `/* ==========================================================================\n   USM FOOTBALL - ADMIN JAVASCRIPT\n   Modular entrypoint\n   ========================================================================== */\n\nimport './admin/modules/legacy-admin.js';\n`, 'utf8');

fs.writeFileSync(readmePath, `# Admin modules\n\nThis folder contains the admin dashboard JavaScript modules.\n\nCurrent safe split:\n\n- \`legacy-admin.js\`: full previous admin dashboard logic, moved as-is to avoid behavior changes.\n\nNext split phases:\n\n- \`firebase.js\`: Firebase initialization and exports.\n- \`auth.js\`: login, auth state and logout.\n- \`ui.js\`: shared UI helpers.\n- \`media.js\`: uploads, image optimization and cropper.\n- \`players.js\`: roster management.\n- \`services.js\`: services management.\n- \`settings.js\`: global settings, founder and agency content.\n- \`presse.js\`: press videos and articles.\n- \`social.js\`: social links.\n- \`marquee.js\`: decorative marquee images.\n\nThe public visual interface must not change during these refactors.\n`, 'utf8');

console.log('Admin safe module split complete.');
