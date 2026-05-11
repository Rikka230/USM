USM - Correctif banderole décorative publique

Fichier à envoyer sur GitHub main :
- contact-brevo.js à la racine du repo, en remplacement du fichier existant.

Pourquoi seulement ce fichier ?
- index.html charge déjà contact-brevo.js après main.js.
- Le correctif est ajouté à la fin de contact-brevo.js pour éviter de devoir modifier index.html.
- Le formulaire Brevo existant est conservé.

Après upload :
firebase deploy --only hosting

Test navigateur après déploiement :
localStorage.removeItem('site_marquee');
location.reload();
