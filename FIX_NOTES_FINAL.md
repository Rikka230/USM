# Correctif final smooth - USM loading-prep

## Fichiers principaux modifiés

- `index.html`
  - Suppression des scripts de surcouche `vip-runtime-fix.js` et `roster-runtime-fix.js`.
  - Retour à un seul script principal : `main.js?v=final-smooth-1`.
  - Cache-buster CSS : `style.css?v=final-smooth-1`.

- `main.js`
  - Rebuild propre du bloc Fondateur / Agence directement dans le flux principal.
  - Correction de l'erreur JavaScript `Unexpected identifier 'Agence'`.
  - Préchargement image + data de l'agence.
  - Crossfade image via calque temporaire `.vip-crossfade-layer`.
  - Verrouillage léger des hauteurs pour éviter les sauts de cadre.
  - Refonte du chargement roster : les anciennes cartes restent visibles pendant la préparation de la catégorie suivante.
  - Préchargement des images joueurs avant remplacement du HTML.
  - Préchargement des catégories au survol/focus/touch des boutons.

- `style.css`
  - Nouveau bloc final `FINAL SMOOTH FIX - VIP + ROSTER`.
  - Placeholder visuel pour cartes joueurs : gradient + shimmer léger au lieu d'un fond noir.
  - Apparition douce des images joueurs dès que l'image est prête.

## Fichiers supprimés du ZIP

- `vip-runtime-fix.js`
- `roster-runtime-fix.js`

Ces fichiers n'étaient plus nécessaires et pouvaient créer des conflits d'exécution.

## Test attendu

1. La page ne doit plus rester vide avec une erreur JS.
2. Le switch Fondateur / Agence doit garder le même design et ne plus casser le cadre.
3. Les cartes joueurs ne doivent plus faire noir puis pop brutalement au changement de catégorie.
4. Vérifier dans Network que `main.js?v=final-smooth-1` et `style.css?v=final-smooth-1` sont bien chargés.
