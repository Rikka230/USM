import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDd7OvBbX35PaQPlm6saccOGTQyvI3UEoU",
  authDomain: "usm-football-b56ba.firebaseapp.com",
  projectId: "usm-football-b56ba",
  storageBucket: "usm-football-b56ba.firebasestorage.app",
  messagingSenderId: "1004955626049",
  appId: "1:1004955626049:web:1982ac82e68599946f74c0"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const logoutButton = document.getElementById('logout-btn');

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    const originalContent = logoutButton.innerHTML;

    try {
      logoutButton.disabled = true;
      logoutButton.style.opacity = '0.7';
      logoutButton.innerHTML = 'Déconnexion...';

      await signOut(auth);
      localStorage.removeItem('firebase:host:usm-football-b56ba.firebaseio.com');

      const dashboard = document.getElementById('dashboard');
      const loginScreen = document.getElementById('login-screen');

      if (dashboard) dashboard.style.display = 'none';
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        loginScreen.style.display = 'flex';
      }

      window.location.replace('admin.html');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      logoutButton.disabled = false;
      logoutButton.style.opacity = '1';
      logoutButton.innerHTML = originalContent;
      alert('Impossible de vous déconnecter. Réessayez ou rechargez la page.');
    }
  });
}
