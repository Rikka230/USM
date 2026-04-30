# USM PJAX Front Optimisation

Branche cible : `test-pjax-front-optimisation`

## Objectif

Ajouter une navigation PJAX sur les pages publiques sans modifier le visuel validé.

Pages concernées :

- `index.html`
- `contact.html`
- `presse.html`
- `mentions.html`
- `page-dynamique.html`

Page exclue :

- `admin.html`

## Fonctionnement

Le fichier `pjax.js` intercepte les liens internes vers les pages publiques, récupère la page en HTML, remplace le contenu du `<body>`, met à jour le `<title>` et les metas principales, puis relance l'initialisation front via l'évènement :

```js
usm:page-ready
```

Le script conserve une navigation classique en fallback si le chargement PJAX échoue.

## Optimisations incluses

- transitions fluides entre pages ;
- barre de chargement fine ;
- préchargement des liens au survol / focus / touch ;
- réinitialisation des modules dynamiques publics après navigation ;
- formulaire Brevo compatible PJAX ;
- roster / recherche / filtres rejouables après navigation ;
- presse et banderole images rejouables après navigation ;
- `admin.html` non intercepté pour éviter tout risque côté back-office.

## Test preview

```bash
firebase hosting:channel:deploy pjax-front --expires 7d
```

Preview créée :

```txt
https://usm-football-b56ba--pjax-front-gwc89m4f.web.app
```

## Points à tester

1. Accueil vers Presse.
2. Presse vers Contact.
3. Contact vers Mentions.
4. Mentions vers Accueil.
5. Accueil vers un service dynamique.
6. Navigation retour navigateur.
7. Formulaire contact après navigation PJAX.
8. Filtres roster après navigation PJAX.
9. Réseaux sociaux et bulles de choix.
10. Admin : doit rester en navigation classique.
