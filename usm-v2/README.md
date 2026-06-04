# USM v2 — Astro + React + Three.js

Refonte du site USM Football : front **Astro** (SSG) + îlots **React** + **Three.js/WebGL**, et **admin** reconstruite avec **shadcn/ui**. Version isolée déployée sur un site Hosting de **staging** dédié, sans toucher la production.

- **Staging** : https://usm-v2-staging.web.app (site Firebase `usm-v2-staging`)
- **Prod (inchangée)** : https://www.usmfootball.com
- **Backend partagé** : Firebase Auth + Firestore + Storage + Cloud Functions du projet `usm-football-b56ba`.

## Commandes

```bash
npm install        # dépendances
npm run dev        # serveur de dev Astro
npm run build      # build statique -> dist/  (lit Firestore au build, cf. Jalon 2)
npm run preview    # prévisualise dist/
firebase deploy --only hosting:staging   # déploie sur le site staging
```

## Architecture (voir le plan + USM_Memory)
- `src/pages` : pages Astro, i18n fr/en/es/pt (`/` = fr).
- `src/components/front` : sections Astro. `src/components/webgl` : R3F. `src/components/admin` : React/shadcn.
- `src/lib` : `firebase-build.ts` (lecture Firestore au build, Admin SDK), `firebase-client.ts` (admin), `image.ts`, `i18n.ts`, `seo.ts`.

## CI / « Publier »
Workflow `.github/workflows/usm-v2-staging.yml` (build + deploy staging). Requiert le **secret GitHub `FIREBASE_SERVICE_ACCOUNT_USM`** (clé de compte de service JSON) — utilisé pour la lecture Firestore au build ET le déploiement. Tant qu'il est absent, le déploiement CI est sauté.

⚠️ **Compatibilité données** : la v2 écrit le **même schéma Firestore** que la prod (mêmes champs/chemins/crop) pour coexister pendant la transition.
