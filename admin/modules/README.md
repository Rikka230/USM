# Admin modules

This folder contains the admin dashboard JavaScript modules.

Current safe split:

- `legacy-admin.js`: full previous admin dashboard logic, moved as-is to avoid behavior changes.

Next split phases:

- `firebase.js`: Firebase initialization and exports.
- `auth.js`: login, auth state and logout.
- `ui.js`: shared UI helpers.
- `media.js`: uploads, image optimization and cropper.
- `players.js`: roster management.
- `services.js`: services management.
- `settings.js`: global settings, founder and agency content.
- `presse.js`: press videos and articles.
- `social.js`: social links.
- `marquee.js`: decorative marquee images.

The public visual interface must not change during these refactors.
