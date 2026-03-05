/* ================= 1. CONFIGURATION FIREBASE (Lecture seule) ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { /* Tes identifiants Firebase Front */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= 2. ANIMATIONS & UI ================= */
// Lazy Loading Images Anti-Stretch
document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll('.lazy-load');
    images.forEach(img => {
        if (img.complete) img.classList.add('loaded');
        else img.addEventListener('load', () => img.classList.add('loaded'));
    });

    // Intersection Observer pour le Scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

/* ================= 3. ROUTAGE DYNAMIQUE (page-dynamique.html) ================= */
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

if (itemId && document.getElementById('dynamic-content')) {
    // Fonction fetchFirestoreData() à implémenter ici pour remplir la page
    console.log("Chargement de l'élément :", itemId);
    // document.title = data.title + " | USM Football";
}