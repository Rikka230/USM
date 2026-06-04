// Build de minification du front USM (esbuild).
// Génère des fichiers *.min.js / *.min.css À LA RACINE pour préserver les
// chemins relatifs (imports CDN Firebase dans main.js, url('Assets/...') dans le CSS).
// bundle:false -> chaque fichier est minifié individuellement, les imports
// `https://www.gstatic.com/firebasejs/...` de main.js sont conservés tels quels.
//
// Usage : npm run build   (À LANCER AVANT `firebase deploy`)

import { build } from 'esbuild';

const JS_ENTRIES = ['main.js', 'pjax.js', 'contact-brevo.js'];

async function run() {
  // JS : minification individuelle, imports externes préservés.
  await build({
    entryPoints: JS_ENTRIES,
    outdir: '.',
    outExtension: { '.js': '.min.js' },
    bundle: false,
    minify: true,
    legalComments: 'none',
    charset: 'utf8',
    logLevel: 'info',
  });

  // CSS : minification, url('Assets/...') conservés (sortie à la racine).
  await build({
    entryPoints: ['style.css'],
    outfile: 'style.min.css',
    bundle: false,
    minify: true,
    loader: { '.css': 'css' },
    legalComments: 'none',
    charset: 'utf8',
    logLevel: 'info',
  });

  console.log('Build terminé : main.min.js, pjax.min.js, contact-brevo.min.js, style.min.css');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
