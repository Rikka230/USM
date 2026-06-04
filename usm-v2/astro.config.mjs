import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // URL du site de staging (mise à jour après création du site Hosting).
  site: 'https://usm-v2-staging.web.app',
  output: 'static',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'es', 'pt'],
    routing: {
      // / = FR (pas de préfixe), /en /es /pt pour les autres langues
      prefixDefaultLocale: false,
    },
  },
  integrations: [react(), sitemap()],
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
