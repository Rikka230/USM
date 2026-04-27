# USM Football Website

Site vitrine statique USM Football, hébergé via Vercel après migration depuis Netlify.

## Structure principale

- `index.html` : page d'accueil publique.
- `contact.html` : page contact publique.
- `presse.html` : page presse et médias.
- `page-dynamique.html` : page service dynamique alimentée par Firebase.
- `main.js` : logique front publique, Firebase Firestore, App Check, i18n, sliders et chargements dynamiques.
- `style.css` : styles front-office.
- `admin.html` : interface d'administration.
- `admin.js` : logique admin Firebase Auth, Firestore et Storage.
- `admin.css` : styles admin.
- `robots.txt` : indexation publique et exclusion de l'admin.
- `sitemap.xml` : sitemap du domaine public.
- `vercel.json` : headers, cache et configuration de déploiement Vercel.

## Déploiement Vercel

Configuration recommandée dans Vercel :

- Framework preset : `Other`
- Build command : vide
- Install command : vide
- Output directory : `.`

Chaque Pull Request doit générer une preview Vercel avant merge dans `main`.

## Règles de travail

- Ne jamais modifier `main` directement.
- Travailler sur une branche dédiée.
- Tester la preview Vercel avant merge.
- Ne pas modifier le rendu public sans validation explicite.
- Les changements de sécurité, cache et SEO doivent rester invisibles côté interface.

## Checklist sécurité Firebase

À vérifier dans la console Firebase avant mise en production complète :

- Ajouter les domaines Vercel preview dans Firebase Auth > Authorized domains.
- Ajouter `usmfootball.com` et `www.usmfootball.com` après validation DNS.
- Vérifier App Check pour le domaine Vercel et le domaine final.
- Vérifier les règles Firestore :
  - lecture publique uniquement sur les collections nécessaires au site public ;
  - écriture réservée aux comptes admin autorisés.
- Vérifier les règles Storage :
  - lecture publique uniquement sur les médias nécessaires ;
  - upload, update et delete réservés aux comptes admin autorisés.
- Tester l'admin après activation stricte d'App Check.

## Checklist avant changement de domaine

- Confirmer le domaine final exact : `usmfootball.com`, `www.usmfootball.com`, ou les deux.
- Vérifier les URLs dans `sitemap.xml`.
- Vérifier les URLs Open Graph dans les pages HTML.
- Vérifier `robots.txt`.
- Tester la page d'accueil, contact, presse, services dynamiques et admin sur preview Vercel.
- Tester mobile et desktop.
- Vérifier que les emails et téléphones affichés sont cohérents sur toutes les pages.
- Une fois validé, brancher le domaine dans Vercel puis ajuster les DNS.

## Notes importantes

La configuration Firebase web est visible côté navigateur, ce qui est normal pour un projet Firebase front-end. La vraie sécurité dépend donc des règles Firestore, Storage, Auth et App Check.

L'admin est protégé par Firebase Auth côté interface, mais l'accès aux données doit impérativement être protégé par les règles Firebase côté serveur.
