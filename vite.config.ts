import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { APP } from './app.config';

/** Inyecta el nombre de app.config.ts en index.html y genera el manifest. */
function appName(): Plugin {
  const manifest = () =>
    JSON.stringify({
      name: APP.name,
      short_name: APP.name,
      start_url: './',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#0b0614',
      theme_color: '#0b0614',
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
    });
  return {
    name: 'app-name',
    transformIndexHtml: (html) => html.replaceAll('%APP_NAME%', APP.name),
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(manifest());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest() });
    },
  };
}

/**
 * Service worker para jugar sin conexión: guarda en el móvil todos los archivos del build la primera
 * vez que se abre la web. La página se pide primero a la red (para coger versiones nuevas) y, si no hay,
 * sale de la caché; el resto de archivos llevan hash en el nombre, así que se sirven directamente de la caché.
 */
function offline(): Plugin {
  return {
    name: 'offline',
    apply: 'build',
    writeBundle(options, bundle) {
      const dir = options.dir!;
      const files = [...Object.keys(bundle), ...readdirSync('public')].filter((f) => !f.endsWith('.map'));
      // La versión cambia si cambia cualquier archivo: así el móvil descarga la nueva y borra la vieja.
      const hash = createHash('sha1');
      for (const f of files.sort()) hash.update(f).update(readFileSync(join(dir, f)));
      const version = hash.digest('hex').slice(0, 10);
      const sw = `const CACHE = 'app-${version}';
const FILES = ${JSON.stringify(['./', ...files])};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./', { cacheName: CACHE, ignoreVary: true })));
    return;
  }
  // ignoreVary: los scripts se piden con cabecera Origin y el servidor responde con "Vary: Origin";
  // sin esto la caché no los reconoce y sin conexión no cargan.
  e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit || fetch(req)));
});
`;
      writeFileSync(join(dir, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  plugins: [react(), appName(), offline()],
  base: './',
});
