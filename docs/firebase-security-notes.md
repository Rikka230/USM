# Notes de sécurité Firebase

Le site USM Football utilise Firebase côté navigateur. La configuration Firebase web visible dans le code n'est pas un secret. La sécurité réelle dépend des règles Firebase, de Firebase Auth et d'App Check.

## Objectif général

- Le site public doit pouvoir lire uniquement les contenus nécessaires à l'affichage.
- L'administration doit être la seule zone capable d'écrire, modifier ou supprimer des données.
- Les visiteurs anonymes ne doivent jamais pouvoir écrire dans Firestore ou Storage.
- Les fichiers sensibles ou techniques ne doivent pas être considérés comme protégés par `robots.txt` uniquement.

## Collections publiques probables

À vérifier dans Firebase Console :

- `players`
- `services`
- `settings`
- `presse`
- collections liées aux vidéos, articles ou images décoratives si elles existent

Ces collections peuvent être lisibles publiquement si elles alimentent le site public. Les écritures doivent être limitées à des comptes admin explicitement autorisés.

## Firestore

À contrôler dans les règles :

- Pas de règle globale autorisant lecture et écriture à tout le monde.
- Lecture publique uniquement sur les collections utilisées par le front public.
- Écriture réservée aux utilisateurs connectés et reconnus comme admins.
- Refus par défaut sur tout ce qui n'est pas explicitement autorisé.
- Validation minimale des champs importants si possible : type, taille, URLs.

## Storage

À contrôler dans les règles :

- Lecture publique uniquement pour les médias nécessaires au site.
- Upload, remplacement et suppression réservés aux admins.
- Limite de taille pour les fichiers uploadés.
- Limitation aux formats image nécessaires.
- Refus par défaut sur les chemins non prévus.

## App Check

- App Check est déjà initialisé côté front public dans `main.js`.
- Ajouter les domaines Vercel preview dans App Check pendant la phase de test.
- Ajouter le domaine final après bascule DNS.
- Tester le site public et l'admin avant d'activer une enforcement stricte.
- Surveiller les erreurs Firebase après activation stricte.

## Firebase Auth

À vérifier :

- Ajouter les domaines Vercel et le domaine final dans Authorized domains.
- Limiter les comptes admin à des emails maîtrisés.
- Supprimer les comptes de test inutiles.
- Activer une politique de mot de passe solide si disponible.

## Admin

L'interface admin utilise Firebase Auth côté client. Cela protège l'interface, mais la vraie protection doit être côté Firebase Rules.

Recommandation :

- Maintenir une liste explicite des admins autorisés.
- Vérifier que seul un admin autorisé peut créer, modifier ou supprimer un joueur, un service, une image ou un contenu presse.
- Tester les refus depuis un compte non admin.

## À ne pas faire

- Ne pas mettre de secret serveur dans le JavaScript front.
- Ne pas ouvrir temporairement les écritures publiques pour tester.
- Ne pas désactiver App Check en production sans raison.
- Ne pas compter sur `robots.txt` comme seule protection de l'admin.
