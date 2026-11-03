import { createServer } from 'vite';
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'node:stream';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'dist');
const vite = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const [{ default: App }, { default: LegalPage }, { SITE_URL }] = await Promise.all([
    vite.ssrLoadModule('/src/App.tsx'),
    vite.ssrLoadModule('/src/LegalPages.tsx'),
    vite.ssrLoadModule('/src/site.ts'),
  ]);
  const template = await readFile(path.join(output, 'index.html'), 'utf8');
  const routes = [
    { path: '/', file: 'index.html', title: 'Titoss : générateur de palettes de couleurs', description: 'Crée gratuitement des palettes de couleurs harmonieuses avec Titoss : 5 méthodes, codes HEX, RGB et HSL, aperçu et vérification du contraste.', robots: 'index, follow', tab: 'gen' },
    { path: '/bibliotheque', file: 'bibliotheque.html', title: 'Bibliothèque de palettes de couleurs | Titoss', description: 'Explore 100 palettes de couleurs prêtes à l’emploi, enregistre tes préférées et ouvre-les dans le générateur Titoss.', robots: 'index, follow', tab: 'lib' },
    { path: '/mes-palettes', file: 'mes-palettes.html', title: 'Mes palettes | Titoss', description: 'Retrouve tes palettes enregistrées et tes favoris sur cet appareil.', robots: 'noindex, follow', tab: 'mine' },
    { path: '/avis', file: 'avis.html', title: 'Avis sur Titoss', description: 'Partage ton avis sur le générateur de palettes de couleurs Titoss.', robots: 'noindex, follow', tab: 'fb' },
    { path: '/mentions-legales', file: 'mentions-legales.html', title: 'Mentions légales | Titoss', description: 'Consulte les mentions légales du site Titoss.', robots: 'noindex, follow', legal: 'mentions-legales' },
    { path: '/confidentialite', file: 'confidentialite.html', title: 'Politique de confidentialité | Titoss', description: 'Consulte la politique de confidentialité et le traitement des données de Titoss.', robots: 'noindex, follow', legal: 'confidentialite' },
  ];

  const render = (element) => new Promise((resolve, reject) => {
    let markup = '';
    const destination = new Writable({
      write(chunk, encoding, callback) {
        markup += chunk.toString();
        callback();
      },
    });
    destination.on('finish', () => resolve(markup));
    destination.on('error', reject);
    let stream;
    stream = renderToPipeableStream(element, {
      onAllReady() {
        stream.pipe(destination);
      },
      onShellError: reject,
      onError(error) {
        console.error(error);
      },
    });
  });

  for (const route of routes) {
    const pageUrl = SITE_URL + route.path;
    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${pageUrl}$2`);
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${route.description}$2`);
    html = html.replace(/(<meta name="robots" content=")[^"]*(")/, `$1${route.robots}$2`);
    html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${route.title}$2`);
    html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${route.description}$2`);
    html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${pageUrl}$2`);
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${SITE_URL}/og-image.png$2`);
    html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${route.title}$2`);
    html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${route.description}$2`);
    html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${SITE_URL}/og-image.png$2`);

    if (route.legal) {
      const legalMarkup = await render(React.createElement(LegalPage, { page: route.legal }));
      html = html.replace('<div id="root"></div>', `<div id="root">${legalMarkup}</div>`);
      html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
    } else {
      const appMarkup = await render(React.createElement(App, { initialTab: route.tab }));
      html = html.replace('<div id="root"></div>', `<div id="root">${appMarkup}</div>`);
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Titoss',
        url: pageUrl,
        description: route.description,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Tout système disposant d’un navigateur web',
        inLanguage: 'fr',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      };
      html = html.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>`,
      );
    }

    await writeFile(path.join(output, route.file), html);
  }

  await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc></url>\n  <url><loc>${SITE_URL}/bibliotheque</loc></url>\n</urlset>\n`);
} finally {
  await vite.close();
}
