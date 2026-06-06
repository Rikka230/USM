import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // URL du site de prod (sert au sitemap + URLs absolues).
  site: 'https://www.usmfootball.com',
  output: 'static',
  // format 'file' -> /presse.html (servi proprement à /presse par cleanUrls Firebase)
  build: { format: 'file' },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'es', 'pt'],
    routing: {
      // / = FR (pas de préfixe), /en /es /pt pour les autres langues
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    react(),
    sitemap({
      // Ne pas lister l'espace d'admin (cohérent avec robots.txt Disallow: /admin)
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    // Optimisation des images distantes hébergées sur Firebase Storage.
    domains: ['firebasestorage.googleapis.com'],
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '**.firebasestorage.app' },
    ],
  },
});
