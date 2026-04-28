# Patch USM - Email visible + preview Firebase

Remplacer ces fichiers dans ton repo local, puis redéployer la preview Firebase.

## Ce que le patch fait

- Remplace partout l'ancienne adresse visible et les mailto :
  - ancien : contact@usm-football.com
  - nouveau : contact@usmfootball.com

- Corrige aussi les cas où le href était bon mais le texte visible restait ancien.
- Ajoute un cache-buster HTML :
  - style.css?v=contact-visible-2
  - main.js?v=contact-visible-2

- Dans main.js :
  - App Check et Analytics restent actifs sur les domaines stables/prod.
  - App Check et Analytics sont ignorés sur les URLs Firebase preview temporaires pour éviter les erreurs reCAPTCHA/referrer dans la console.

## Fichiers inclus

- `404.html`
- `admin.html`
- `contact.html`
- `index.html`
- `main.js`
- `mentions.html`
- `page-dynamique.html`
- `presse.html`

## Après remplacement

```bash
git status
git add 404.html admin.html contact.html index.html main.js mentions.html page-dynamique.html presse.html
git commit -m "fix: update visible contact email and preview init"
git push origin main
firebase hosting:channel:deploy preview-main --expires 7d
```
