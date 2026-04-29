# Patch social admin + cache

Ce patch ajoute dans l’admin des champs pour gérer les liens USM / Christophe Mongai par réseau social, y compris X, ainsi que les compteurs d’abonnés.

## Document Firebase utilisé

`settings/social`

Le formulaire admin enregistre notamment :

- `instagram_usm`
- `instagram_christophe`
- `instagram_usm_followers`
- `instagram_christophe_followers`
- même logique pour `tiktok`, `linkedin`, `facebook`, `youtube`, `x`

Le site public affiche une bulle de choix si deux liens existent pour un même réseau. Si un seul lien existe, le clic ouvre directement ce lien.

Le chiffre “Abonnés cumulés” est recalculé automatiquement avec les champs `*_followers`.


## Correctif 3

- Évite le double comptage des abonnés quand les valeurs existent à la fois en format plat et en format imbriqué.
- Sécurise la lecture des URLs sociales : seules les URLs web exploitables sont utilisées.
- Ajoute un cache-bust sur les scripts/styles pour que la preview Firebase affiche immédiatement la version test.
