# Patch temporaire formulaire contact par email

Ce patch ajoute une solution temporaire pour le formulaire de contact.

Au clic sur "Envoyer le message", le navigateur ouvre l'application mail du visiteur avec :
- destinataire : contact@usmfootball.com
- sujet prérempli
- nom, email, type de demande et message dans le corps du mail

## Fichiers inclus

- `contact-mailto.js`
- `tools/patch-contact-mailto.cjs`

## Installation

Depuis la racine du repo USM :

```bash
git checkout main
git pull origin main
```

Copier les fichiers du ZIP :
- `contact-mailto.js` à la racine
- `tools/patch-contact-mailto.cjs` dans `tools/`

Puis lancer :

```bash
node tools/patch-contact-mailto.cjs
git add contact.html contact-mailto.js tools/patch-contact-mailto.cjs
git commit -m "feat: add temporary contact mail fallback"
git push origin main
firebase hosting:channel:deploy preview-main --expires 7d
```

## Limite

C'est une solution temporaire : elle dépend de l'application mail configurée chez le visiteur.
Pour une version pro, il faudra ensuite passer par Firebase Functions + Brevo/SendGrid, EmailJS ou Formspree.
