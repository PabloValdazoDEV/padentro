import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
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

export default defineConfig({
  // https también en desarrollo: sin él, el móvil no deja compartir ni mantener la pantalla encendida.
  plugins: [react(), appName(), basicSsl()],
  base: './',
});
