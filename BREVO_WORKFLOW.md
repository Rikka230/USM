# Workflow Brevo - USM Football

Ce workflow fait transiter le formulaire de contact par Firebase Hosting, puis Firebase Functions Gen 2, puis Brevo.

Flux actif :

```text
/contact.html -> /api/sendContactEmail -> Firebase Function europe-west1 -> Brevo SMTP + Brevo Contacts
```

## Fichiers concernés

- `contact.html` : formulaire public, champs obligatoires, consentement RGPD et opt-in téléphone/SMS.
- `contact-brevo.js` : validation front, messages utilisateur, honeypot, délai anti-spam et appel `fetch` vers `/api/sendContactEmail`.
- `style.css` : mise en page des champs, consentements et messages formulaire.
- `main.js` : traductions FR/EN/ES/PT des champs du formulaire.
- `firebase.json` : rewrite `/api/sendContactEmail` vers la Function `sendContactEmail` en `europe-west1`.
- `functions/index.js` : validation serveur, rate limit, envoi email Brevo, ajout/mise à jour du contact Brevo, enrichissement des attributs métier/profil et synchronisation optionnelle du téléphone dans l’attribut `SMS`.
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

Champ optionnel :

- consentement téléphone/SMS, envoyé via `smsConsent`, pour autoriser l’enregistrement du numéro dans l’attribut Brevo `SMS`.

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

Ce paramètre contient l’ID de la liste Brevo dans laquelle ajouter ou mettre à jour les contacts. Il peut contenir un seul ID, par exemple `75`, ou plusieurs IDs séparés par des virgules, par exemple `75,18`.

## Configuration du listId Brevo

Créer un fichier local non commité :

```bash
cd functions
printf "BREVO_CONTACT_LIST_ID=REMPLACER_PAR_ID_LISTE_BREVO\n" > .env.usm-football-b56ba
cd ..
```

Le fichier `.env.usm-football-b56ba` est ignoré par `.gitignore`. Ne pas le pousser dans GitHub.

Si `BREVO_CONTACT_LIST_ID` est vide ou absent, l’email est envoyé normalement, mais la synchronisation Brevo Contacts est ignorée et loggée côté serveur.

## Attributs Brevo recommandés

Créer ces attributs dans Brevo avant de tester l’enrichissement complet :

```text
PROFESSION       type texte
PROFILE_TYPE     type texte
PROFILE_LABEL    type texte
PHONE_SMS_OPTIN  type booléen
CONTACT_SOURCE   type texte
```

Ces attributs permettent de retrouver dans Brevo :

- le métier / la profession saisie ;
- la valeur technique du champ “Je suis…” : `joueur`, `club`, `coach`, `staff`, `autre` ;
- le libellé lisible du champ “Je suis…” ;
- l’autorisation téléphone/SMS ;
- la provenance `Site USM Football`.

## Logique Brevo Contacts

La Function crée ou met à jour d’abord le contact par email avec uniquement les attributs sûrs :

- `EMAIL` ;
- `FIRSTNAME` ;
- `LASTNAME`.

Ensuite, elle tente un enrichissement séparé avec les attributs métier/profil :

- `PROFESSION` ;
- `PROFILE_TYPE` ;
- `PROFILE_LABEL` ;
- `PHONE_SMS_OPTIN` ;
- `CONTACT_SOURCE`.

Si ces attributs n’existent pas encore dans Brevo, l’enrichissement est loggé en erreur, mais l’email et la création du contact ne sont pas cassés.

Enfin, si `smsConsent` vaut `true`, la Function tente de mettre à jour le contact par email avec :

- `SMS`, au format international si le numéro peut être normalisé.

Cette synchronisation `SMS` est volontairement séparée. Si Brevo refuse le numéro, par exemple parce qu’il est déjà attaché à un autre contact, l’email reste envoyé et le contact email reste créé/mis à jour. L’erreur est seulement loggée côté serveur.

## Installation locale après application du patch

```bash
git checkout main
npm install --prefix functions
firebase use usm-football-b56ba
```

## Déploiement

Si le secret Brevo existe déjà, ne pas le recréer. Vérifier seulement qu’il est bien disponible.

Déployer la Function et le Hosting :

```bash
firebase deploy --only functions:sendContactEmail,hosting
```

## Test rapide après déploiement

Tester la page :

```text
https://usm-football-b56ba.web.app/contact.html?v=contact-sms-optin-1
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
    "message":"Test technique Brevo depuis Firebase Functions avec ajout contact et opt-in téléphone/SMS.",
    "privacyConsent":true,
    "smsConsent":true,
    "source":"https://usm-football-b56ba.web.app/contact.html",
    "pageTitle":"Contact test USM"
  }'
```

Résultat attendu :

- email reçu sur `contact@usmfootball.com` ;
- email HTML propre avec prénom, nom, profession, email, téléphone, consentement téléphone/SMS, profil, message, date/heure, source ;
- contact créé ou mis à jour dans la liste Brevo configurée ;
- attributs `PROFESSION`, `PROFILE_TYPE`, `PROFILE_LABEL`, `PHONE_SMS_OPTIN` et `CONTACT_SOURCE` visibles dans Brevo si les attributs ont été créés ;
- si `smsConsent` vaut `true`, la Function tente d’ajouter le numéro au champ Brevo `SMS` ;
- si la synchronisation contact ou SMS échoue, l’email reste envoyé et l’erreur est visible dans les logs Functions.

## Logs utiles

```bash
firebase functions:log --only sendContactEmail
```

À surveiller :

- `Brevo contact email sent` ;
- `Brevo contact synced` ;
- `Brevo contact enrichment synced` si les attributs métier/profil existent dans Brevo ;
- `Brevo contact enrichment failed` si les attributs métier/profil n’existent pas encore ou sont mal configurés ;
- `Brevo SMS attribute synced` si l’opt-in téléphone/SMS est coché ;
- `Brevo SMS attribute sync skipped because consent is not granted` si l’opt-in n’est pas coché ;
- `Brevo SMS attribute sync failed` si Brevo refuse le numéro ;
- `Brevo contact sync skipped because BREVO_CONTACT_LIST_ID is not configured` ;
- `Brevo contact sync failed`.

## Notes Brevo

Le sender transactionnel utilisé est :

```text
contact@usmfootball.com
```

Cette adresse ou le domaine `usmfootball.com` doit être validé dans Brevo, sinon l’API peut refuser l’envoi.

Le profil et le message restent dans l’email de réception. Ne pas créer d’usage marketing ou de campagne SMS sans base légale dédiée et sans opt-in clair.

## Navigation mobile

Les icônes courrier de la barre mobile basse pointent vers :

```text
contact.html#contact-form
```

Elles ouvrent donc la page contact et descendent directement vers le formulaire, au lieu d’ouvrir un `mailto:`.
