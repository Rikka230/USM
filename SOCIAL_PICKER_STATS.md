# Social picker + impact digital live

Ce patch ajoute un sélecteur au clic sur les icônes de réseaux sociaux.
Chaque réseau peut proposer deux destinations : `USM` et `Christophe Mongai`.

## Document Firebase utilisé

Collection : `settings`
Document : `social`

## Liens pris en charge

Format recommandé :

```json
{
  "instagram_usm": "https://...",
  "instagram_christophe": "https://...",
  "linkedin_usm": "https://...",
  "linkedin_christophe": "https://...",
  "tiktok_usm": "https://...",
  "tiktok_christophe": "https://...",
  "facebook_usm": "https://...",
  "facebook_christophe": "https://...",
  "youtube_usm": "https://...",
  "youtube_christophe": "https://...",
  "x_usm": "https://...",
  "x_christophe": "https://..."
}
```

Compatibilité conservée : si un ancien champ existe déjà, par exemple `instagram`, il est utilisé comme lien `USM`.

## Abonnés cumulés calculés automatiquement

Le chiffre `Impact Digital` est calculé depuis le même document `settings/social`.

Format recommandé :

```json
{
  "instagram_usm_followers": 120000,
  "instagram_christophe_followers": 45000,
  "tiktok_usm_followers": 80000,
  "tiktok_christophe_followers": 30000,
  "youtube_usm_followers": 15000,
  "x_usm_followers": 12000
}
```

Le site additionne automatiquement les valeurs disponibles.
Si aucun compteur n'est trouvé dans `settings/social`, le site garde le chiffre `stat3` du document `settings/general`.

## Notes

- Les icônes sans lien configuré sont masquées.
- L’icône X est ajoutée automatiquement par JavaScript dans la barre desktop, le footer et la barre mobile.
- Le cache social utilise une nouvelle clé `site_social_picker_v1`, donc le navigateur refetch les données après ce patch.
