USM - Correctif banderole décorative publique V2

Fichier à envoyer sur GitHub main :
- contact-brevo.js à la racine du repo, en remplacement du fichier existant.

Ce correctif V2 corrige le précédent :
- initialise/récupère Firebase de façon robuste ;
- initialise App Check si nécessaire ;
- lit Firestore sans limit(...), mais en testant les filtres probables active/visible/enabled/published pour respecter les règles ;
- injecte aussi un CSS minimal de sécurité pour que les images soient visibles même si les classes existantes ne matchent pas.

Après upload :
firebase deploy --only hosting

Test navigateur après déploiement :
localStorage.removeItem('site_marquee');
localStorage.removeItem('site_marquee_public_full');
location.reload();
