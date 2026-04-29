# Workflow Brevo - USM Football

Ce workflow fait transiter le formulaire de contact par Firebase Hosting, puis Firebase Functions Gen 2, puis Brevo.

Flux actif :

```text
/contact.html -> /api/sendContactEmail -> Firebase Function europe-west1 -> Brevo SMTP + Brevo Contacts
```

## Fichiers concernés

- `contact.html` : formulaire public, champs obligatoires et texte RGPD.
- `contact-brevo.js` : validation front, messages utilisateur, honeypot, délai anti-spam et appel `fetch` vers `/api/sendContactEmail`.
- `style.css` : mise en page des nouveaux champs, consentement RGPD et messages formulaire.
- `main.js` : traductions FR/EN/ES/PT des nouveaux champs du formulaire.
- `firebase.json` : rewrite `/api/sendContactEmail` vers la Function `sendContactEmail` en `europe-west1`.
- `functions/index.js` : validation serveur, rate limit, envoi email Brevo, ajout/mise à jour du contact Brevo.
- `functions/package.json` et `functions/package-lock.json` : runtime Node.js 20 et dépendances Functions.

## Données demandées par le formulaire

Champs obligatoires :

- prénom ;
- nom ;
- profession ;
- email ;
- téléphone ;
- profil, champ “Je suis…” ;
- message ;
- consentement RGPD de traitement de la demande.

Le front envoie aussi :

- `source` : URL de la page d’envoi ;
- `pageTitle` : titre de la page ;
- `formStartedAt` : timestamp anti-spam ;
- `company` : honeypot invisible.

## Sécurité

La clé API Brevo ne doit jamais être mise dans le front, dans GitHub, dans `contact-brevo.js`, ni dans un fichier `.env` commité.

Secret Firebase attendu :

```bash
firebase functions:secrets:set BREVO_API_KEY
```

La Function utilise aussi un paramètre backend non secret :

```text
BREVO_CONTACT_LIST_ID
```

Ce paramètre contient l’ID de la liste Brevo dans laquelle ajouter ou mettre à jour les contacts. Il peut contenir un seul ID, par exemple `12`, ou plusieurs IDs séparés par des virgules, par exemple `12,18`.

## Configuration du listId Brevo

Créer un fichier local non commité :

```bash
cd functions
printf "BREVO_CONTACT_LIST_ID=REMPLACER_PAR_ID_LISTE_BREVO\n" > .env.usm-football-b56ba
cd ..
```

Le fichier `.env.usm-football-b56ba` est ignoré par `.gitignore`. Ne pas le pousser dans GitHub.

Si `BREVO_CONTACT_LIST_ID` est vide ou absent, l’email est envoyé normalement, mais la synchronisation Brevo Contacts est ignorée et loggée côté serveur.

## Installation locale après application du patch

```bash
git checkout brevo-mail-workflow
git pull origin brevo-mail-workflow
npm install --prefix functions
firebase use usm-football-b56ba
```

## Déploiement

Si le secret Brevo existe déjà, ne pas le recréer. Vérifier seulement qu’il est bien disponible.

Déployer la Function et le Hosting :

```bash
firebase deploy --only functions:sendContactEmail,hosting
```

Ou, si besoin de redéployer toutes les Functions du projet :

```bash
firebase deploy --only functions,hosting
```

## Test rapide après déploiement

Tester la page :

```text
https://usm-football-b56ba.web.app/contact.html?v=contact-brevo-2
```

Tester l’endpoint sans passer par le formulaire :

```bash
curl -X POST "https://usm-football-b56ba.web.app/api/sendContactEmail" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Test",
    "name":"USM",
    "profession":"Contrôle qualité",
    "email":"test@example.com",
    "phone":"+33600000000",
    "profile":"autre",
    "message":"Test technique Brevo depuis Firebase Functions avec ajout contact.",
    "privacyConsent":true,
    "source":"https://usm-football-b56ba.web.app/contact.html",
    "pageTitle":"Contact test USM"
  }'
```

Résultat attendu :

- email reçu sur `contact@usmfootball.com` ;
- email HTML propre avec prénom, nom, profession, email, téléphone, profil, message, date/heure, source ;
- contact créé ou mis à jour dans la liste Brevo configurée ;
- si l’ajout contact échoue, l’email reste envoyé et l’erreur est visible dans les logs Functions.

## Logs utiles

```bash
firebase functions:log --only sendContactEmail
```

À surveiller :

- `Brevo contact email sent` ;
- `Brevo contact synced` ;
- `Brevo contact sync skipped because BREVO_CONTACT_LIST_ID is not configured` ;
- `Brevo contact sync failed`.

## Notes Brevo

Le sender transactionnel utilisé est :

```text
contact@usmfootball.com
```

Cette adresse ou le domaine `usmfootball.com` doit être validé dans Brevo, sinon l’API peut refuser l’envoi.

Pour les contacts, les attributs Brevo utilisés sont :

- `FIRSTNAME` ;
- `LASTNAME` ;
- `JOB_TITLE` ;
- `SMS`, uniquement si le téléphone est convertible en format international.

Le profil et le message restent dans l’email de réception. Ne pas créer d’usage marketing sans base légale dédiée.
