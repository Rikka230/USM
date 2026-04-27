# Runbook migration Firebase Hosting - USM Football

Ce document sert de guide opérationnel pour la bascule finale du site USM Football vers Firebase Hosting.

## Objectif

- Garder Vercel actif tant que Firebase Hosting n'est pas validé.
- Tester Firebase Hosting sur un canal preview avant toute bascule DNS.
- Basculer le domaine final uniquement après validation complète.
- Garder une stratégie de rollback simple.

## Prérequis

- Accès au projet Firebase `usm-football-b56ba`.
- Firebase CLI installé en local.
- Connexion au bon compte Google.
- Repo USM à jour en local.
- Fichier `firebase.json` présent à la racine.

## Étape 1 - Préparer Firebase CLI

À faire en local :

- installer Firebase CLI si nécessaire ;
- se connecter avec le compte Google lié au projet ;
- vérifier que le projet Firebase USM est visible ;
- lier le dossier local au bon projet Firebase.

Si un fichier `.firebaserc` est créé, vérifier avant commit s'il doit être conservé ou non dans Git.

## Étape 2 - Tester avec un canal preview Firebase

Avant toute mise en production Firebase Hosting, créer un canal preview temporaire depuis la racine du repo.

Nom conseillé : `preview-usm`.

Durée conseillée : 7 jours.

Firebase renverra une URL de preview à tester avant toute bascule.

## Checklist preview Firebase

Tester les pages :

- `/`
- `/index.html`
- `/contact.html`
- `/presse.html`
- `/mentions.html`
- `/admin.html`
- `/favicon.ico`
- `/robots.txt`
- `/sitemap.xml`

Tester les redirections :

- `/contact`
- `/presse`
- `/mentions`
- `/admin`
- `/joueurs.html`
- `/services.html`
- `/agence.html`

Tester Firebase :

- chargement des services ;
- chargement des joueurs ;
- chargement des réseaux sociaux ;
- connexion admin ;
- lecture des contenus dynamiques ;
- upload admin si nécessaire.

## App Check et domaines

Avant d'utiliser le domaine final sur Firebase Hosting :

- ajouter le domaine Firebase preview si nécessaire dans reCAPTCHA / App Check ;
- ajouter `usmfootball.com` ;
- ajouter `www.usmfootball.com` ;
- vérifier Firebase Authentication > Authorized domains ;
- tester l'admin avant tout durcissement App Check.

## Étape 3 - Déploiement production Firebase Hosting

Déployer en production uniquement après validation de la preview Firebase.

Après déploiement, Firebase donnera l'URL de production Firebase Hosting.

## Étape 4 - Bascule domaine

Dans Firebase Console :

- ouvrir Hosting ;
- ajouter le domaine personnalisé ;
- suivre les instructions DNS Firebase ;
- attendre la validation SSL ;
- tester le domaine final en navigation privée.

Ne pas supprimer Vercel ni ses DNS tant que Firebase Hosting n'est pas validé complètement.

## Checklist après bascule DNS

Tester :

- `https://www.usmfootball.com/`
- `https://www.usmfootball.com/contact.html`
- `https://www.usmfootball.com/presse.html`
- `https://www.usmfootball.com/mentions.html`
- `https://www.usmfootball.com/admin.html`
- `https://www.usmfootball.com/robots.txt`
- `https://www.usmfootball.com/sitemap.xml`

Tester aussi :

- mobile 4G / 5G ;
- desktop ;
- console navigateur ;
- Firebase Auth ;
- Firestore ;
- Storage ;
- App Check.

## Rollback

Si Firebase Hosting pose problème après bascule :

1. Remettre les DNS vers Vercel si Vercel est encore actif.
2. Ou utiliser la console Firebase Hosting pour revenir à une version précédente.
3. Vérifier que les domaines restent autorisés dans Firebase Auth et App Check.
4. Ne pas supprimer l'ancien hébergement tant que le nouveau n'a pas tourné plusieurs jours sans erreur.

## Notes quota Firebase Hosting gratuit

Sur le plan gratuit Spark, Firebase Hosting impose des limites. Le site USM doit éviter de servir des médias lourds directement depuis Hosting.

Bonnes pratiques :

- optimiser les images ;
- éviter les vidéos lourdes dans le repo ;
- nettoyer les anciennes versions Hosting si le stockage approche la limite ;
- privilégier YouTube, Vimeo ou un CDN vidéo pour les vidéos.

## Règle de travail Git

Pour économiser les previews Vercel / Firebase :

- une phase = une branche = une PR ;
- regrouper les modifications dans le moins de commits possible ;
- éviter les micro-commits sauf test quota ou correction bloquante ;
- merger en squash après validation.
