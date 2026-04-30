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

## Patch roster smoothness

- Uniformise la hauteur des cartes joueurs pour éviter les différences liées aux textes longs.
- Stabilise la zone roster pendant les changements de catégorie / recherche.
- Anime l'entrée des cartes joueurs et l'état des contrôles de slider.
- Ajoute une révélation douce des images publiques sans modifier le visuel final.


## Patch pjax-front-5

- Le logo massif de la hero est exclu du système global de fade-in des images pour garder une animation GPU stable.
- Le logo garde son animation `float` dédiée sans transition `transform` concurrente.
- L'entrée PJAX n'anime plus tout le bloc `.hero-massive`, uniquement le texte secondaire, afin d'éviter de superposer deux animations sur le logo.
- Cache-bust mis à jour en `pjax-front-5`.


## Patch pjax-front-6 — Massive logo plus fluide

- Exclusion du `drop-shadow()` sur le massive logo pour éviter les repaints lourds pendant l’animation.
- Remplacement du glow par un pseudo-élément plus léger.
- Apparition progressive du logo après décodage réel de l’image.
- Animation `float` légèrement ralentie et moins ample pour retrouver une sensation plus 60 FPS.
- Cache-bust passé à `pjax-front-6`.


## Patch pjax-front-7 — Topbar fixe & massive logo plus fluide
- La topbar n'est plus remplacée physiquement par PJAX pendant les changements de page.
- Le logo de navigation et les images de chrome sont exclus des transitions globales d'images.
- Le massive logo utilise une apparition plus douce, puis un flottement plus lent et moins ample.
- Cache-bust passé à `pjax-front-7`.
