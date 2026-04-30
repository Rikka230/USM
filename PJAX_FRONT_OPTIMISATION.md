# PJAX Front Optimisation - Fix logo persistant

Correctif incrémental : le moteur PJAX ne remplace plus brutalement tout le `<body>`.

## Objectif

Éviter que le logo PNG de la top bar soit détruit puis recréé à chaque navigation PJAX.

## Principe

- `header.navbar` est synchronisé avec la page cible, mais les noeuds image déjà chargés sont conservés.
- `#nav-logo-dyn` reste vivant dans le DOM pendant la transition.
- `#footer-logo-dyn` est également préservé.
- Le contenu de page est remplacé séparément, hors chrome persistant : sticky social bar, navbar, footer.
- Les liens de navigation restent synchronisés avec la page cible.

## Cache bust

Les pages publiques chargent maintenant :

```html
<script src="pjax.js?v=pjax-front-2"></script>
```

## Pages concernées

- index.html
- contact.html
- presse.html
- mentions.html
- page-dynamique.html
