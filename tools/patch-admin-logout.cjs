const fs = require('fs');
const path = require('path');

const adminPath = path.join(process.cwd(), 'admin.js');
let content = fs.readFileSync(adminPath, 'utf8');

const marker = "\r\n/* ================= 3. NAVIGATION ET CHARGEMENT SETTINGS ================= */";
const fallbackMarker = "\n/* ================= 3. NAVIGATION ET CHARGEMENT SETTINGS ================= */";

const logoutBlock = `

/* ================= 2B. DÉCONNEXION ADMIN ================= */
const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const originalContent = logoutBtn.innerHTML;

        try {
            logoutBtn.disabled = true;
            logoutBtn.style.opacity = '0.7';
            logoutBtn.innerHTML = 'Déconnexion...';

            await signOut(auth);
            localStorage.clear();

            const dashboard = document.getElementById('dashboard');
            const loginScreen = document.getElementById('login-screen');

            if (dashboard) {
                dashboard.classList.add('hidden');
                dashboard.style.display = 'none';
            }

            if (loginScreen) {
                loginScreen.classList.remove('hidden');
                loginScreen.style.display = 'flex';
            }

            window.location.replace('admin.html');
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            logoutBtn.disabled = false;
            logoutBtn.style.opacity = '1';
            logoutBtn.innerHTML = originalContent;
            alert('Impossible de vous déconnecter. Rechargez la page puis réessayez.');
        }
    });
}
`;

if (content.includes('/* ================= 2B. DÉCONNEXION ADMIN ================= */')) {
  console.log('Logout block already present. Nothing to patch.');
  process.exit(0);
}

if (content.includes(marker)) {
  content = content.replace(marker, logoutBlock + marker);
} else if (content.includes(fallbackMarker)) {
  content = content.replace(fallbackMarker, logoutBlock + fallbackMarker);
} else {
  throw new Error('Patch marker not found in admin.js');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('admin.js patched with logout handler.');
