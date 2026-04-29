PATCH CORRECTIF USM - API YOUTUBE FUNCTIONS

A appliquer a la racine du repo USM, sur la branche test-social-picker-stats.

Ce patch remet les fichiers imbriques au bon endroit :
- functions/index.js
- functions/package.json
- functions/package-lock.json
- admin/modules/legacy-admin.js
- firebase.json
- SOCIAL_API_SYNC.md

Important : si un fichier package-lock.json a ete cree a la racine du repo par erreur, il faut le supprimer :
  git rm -f package-lock.json

Verification attendue apres application :
  grep -n "refreshSocialStats" functions/index.js

Il faut voir :
  exports.refreshSocialStats = onSchedule(...)
  exports.refreshSocialStatsNow = onRequest(...)
