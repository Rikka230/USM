# Workflow Brevo - USM Football

Ce patch remplace l'ancien fallback `mailto:` du formulaire contact par un vrai endpoint Firebase Functions qui envoie le message via l'API transactionnelle Brevo.

## Fichiers ajoutés/modifiés

- `contact.html` : le formulaire appelle maintenant `/api/sendContactEmail` et charge `contact-brevo.js`.
- `contact-brevo.js` : validation front, messages utilisateur, honeypot, anti-spam simple et appel `fetch` vers l'endpoint Firebase.
- `firebase.json` : ajoute la configuration `functions`, ignore `functions/**` côté Hosting, et route `/api/sendContactEmail` vers la Function.
- `functions/package.json` : dépendances de la Function.
- `functions/index.js` : Function HTTPS `sendContactEmail`, validation serveur, rate limit simple, secret Firebase `BREVO_API_KEY`, appel API Brevo.

## Important sécurité

La clé API Brevo ne doit jamais être mise dans le front, dans GitHub, dans `contact-brevo.js`, ni dans un fichier `.env` commité.

Elle doit être stockée en secret Firebase :

```bash
firebase functions:secrets:set BREVO_API_KEY
```

## Installation locale après application du patch

```bash
git checkout brevo-mail-workflow
git pull origin brevo-mail-workflow
npm install --prefix functions
firebase use usm-football-b56ba
```

## Déploiement de test

Premier déploiement Brevo :

```bash
firebase functions:secrets:set BREVO_API_KEY
firebase deploy --only functions:sendContactEmail,hosting
```

Ensuite, pour redéployer le workflow complet :

```bash
firebase deploy --only functions,hosting
```

## Test rapide après déploiement

Tester la page :

```text
https://usm-football-b56ba.web.app/contact.html?v=contact-brevo-1
```

Tester l'endpoint sans passer par le formulaire :

```bash
curl -X POST "https://usm-football-b56ba.web.app/api/sendContactEmail" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test USM","email":"test@example.com","phone":"+33600000000","profile":"autre","message":"Test technique Brevo depuis Firebase Functions."}'
```

## Notes Brevo

Dans `functions/index.js`, le sender utilisé est :

```text
contact@usmfootball.com
```

Cette adresse ou le domaine `usmfootball.com` doit être validé dans Brevo, sinon l'API peut refuser l'envoi.
