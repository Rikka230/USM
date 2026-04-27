# Checklist changement de domaine USM Football

Cette checklist sert pour la bascule finale vers le domaine public du site USM Football sur Vercel.

## 1. Avant de toucher aux DNS

- Confirmer le domaine final exact :
  - `usmfootball.com`
  - `www.usmfootball.com`
- Choisir le domaine canonique : recommandé `https://www.usmfootball.com/` si les metas actuelles restent comme elles sont.
- Vérifier que la preview Vercel de la branche en cours fonctionne.
- Tester les pages publiques :
  - accueil ;
  - contact ;
  - presse ;
  - page service dynamique ;
  - mentions légales ;
  - 404.
- Tester l'admin :
  - connexion ;
  - ajout/modification joueur ;
  - ajout/modification service ;
  - upload image ;
  - vidage cache.

## 2. Vercel

- Ajouter le domaine dans Vercel Project Settings > Domains.
- Ajouter `usmfootball.com` et `www.usmfootball.com` si les deux sont utilisés.
- Suivre les instructions DNS données par Vercel.
- Attendre que Vercel indique que le domaine est valide.

## 3. DNS

Selon le registrar, config recommandée habituelle :

- Domaine racine `usmfootball.com` : enregistrement A ou configuration fournie par Vercel.
- Sous-domaine `www` : CNAME vers Vercel.

Ne supprimer les anciens réglages Netlify qu'après validation que Vercel répond correctement.

## 4. Firebase

Dans Firebase Console :

- Authentication > Settings > Authorized domains : ajouter :
  - `usmfootball.com`
  - `www.usmfootball.com`
  - domaine preview Vercel si nécessaire.
- App Check : ajouter/valider les domaines utilisés.
- Vérifier que Firestore et Storage restent accessibles sur le domaine final.

## 5. SEO

- Vérifier `sitemap.xml`.
- Vérifier `robots.txt`.
- Vérifier les URLs Open Graph dans les pages HTML.
- Vérifier les emails/téléphones affichés dans les footers.
- Déclarer le domaine final dans Google Search Console.
- Soumettre `https://www.usmfootball.com/sitemap.xml` après bascule.

## 6. Après bascule

- Tester en navigation privée.
- Tester mobile 4G/5G.
- Tester desktop.
- Tester que l'ancien domaine ou ancienne URL redirige correctement si nécessaire.
- Vérifier que l'admin n'est pas indexable.
- Surveiller les erreurs Firebase et Vercel pendant les premières heures.

## 7. Points de vigilance

- Ne pas activer une Content Security Policy trop stricte sans test complet, car le site utilise Firebase, Google, YouTube et Elfsight.
- Ne pas supprimer Netlify avant confirmation que Vercel sert bien toutes les pages.
- Ne pas forcer App Check en mode strict sans tester l'admin sur le domaine final.
