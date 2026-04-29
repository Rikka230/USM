# USM Football — Synchronisation API Réseaux Sociaux

## Patch `social-api-youtube-1`

Objectif : ajouter une première couche API stable pour les statistiques réseaux sociaux, sans exposer de clé côté front.

## Architecture

```txt
YouTube Data API v3
        ↓
Firebase Function Gen 2
        ↓
Firestore settings/social
        ↓
Front USM Football
```

Le front continue de lire `settings/social`. Les champs manuels restent donc le fallback principal si une API échoue.

## Fonctions ajoutées

### `refreshSocialStats`

Fonction planifiée Gen 2.

- Région : `europe-west1`
- Fréquence : toutes les 12 heures
- Source : YouTube Data API v3
- Écrit dans `settings/social`

### `refreshSocialStatsNow`

Endpoint HTTPS admin.

- Route Hosting : `/api/refreshSocialStatsNow`
- Méthode : `POST`
- Protection : token Firebase Auth admin en `Authorization: Bearer <token>`
- Utilisé par le bouton admin `Synchroniser YouTube API`

## Secret Firebase nécessaire

Créer le secret :

```bash
firebase functions:secrets:set YOUTUBE_API_KEY
```

Coller ensuite la clé API YouTube Data API v3.

## Déploiement preview conseillé

Depuis la branche de test :

```bash
git checkout test-social-picker-stats
git pull --rebase origin test-social-picker-stats
firebase deploy --only functions:refreshSocialStats,functions:refreshSocialStatsNow
firebase hosting:channel:deploy social-picker-stats --expires 7d
```

## Déploiement live après validation

Après merge dans `main` :

```bash
git checkout main
git pull --rebase origin main
firebase deploy --only functions:refreshSocialStats,functions:refreshSocialStatsNow
firebase deploy --only hosting
```

## Champs Firestore mis à jour

La fonction écrit notamment :

```txt
youtube_usm_followers
youtube_christophe_followers
followers.youtube.usm
followers.youtube.christophe
api.youtube.usm
api.youtube.christophe
last_api_sync_at
last_api_sync_status
last_api_sync_errors
stats_source
```

## Liens YouTube compatibles

La fonction accepte :

```txt
https://www.youtube.com/@handle
@handle
https://www.youtube.com/channel/UC...
UC...
https://www.youtube.com/user/username
```

Les anciens liens `/c/...` ne sont pas garantis par l’API YouTube moderne. Dans ce cas, utiliser plutôt le lien `@handle` ou `/channel/UC...`.

## Réseaux non branchés dans ce patch

- Instagram
- Facebook
- LinkedIn
- TikTok
- X

Ils restent en manuel pour le moment. Le socle backend est prêt pour les ajouter ensuite sans casser le front.
