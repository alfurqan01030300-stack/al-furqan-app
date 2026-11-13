import fs from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';

function furqanVersionPlugin(buildVersion: string): Plugin {
  return {
    name: 'furqan-app-version',
    buildStart() {
      try {
        const pubDir = path.resolve(__dirname, 'public');
        if (fs.existsSync(pubDir)) {
          fs.writeFileSync(
            path.join(pubDir, 'version.json'),
            JSON.stringify({ version: buildVersion, builtAt: new Date().toISOString() }, null, 2)
          );
        }
      } catch (err) {
        console.warn('Could not write public/version.json:', err);
      }
    },
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.end(JSON.stringify({ version: buildVersion, builtAt: new Date().toISOString() }));
      });
    },
    writeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        fs.writeFileSync(
          path.join(distDir, 'version.json'),
          JSON.stringify({ version: buildVersion, builtAt: new Date().toISOString() }, null, 2)
        );
        const swPath = path.join(distDir, 'sw.js');
        if (fs.existsSync(swPath)) {
          const swContent = fs.readFileSync(swPath, 'utf-8');
          fs.writeFileSync(swPath, swContent.replace(/__SW_VERSION__/g, buildVersion));
        }
      } catch (err) {
        console.warn('Could not stamp dist/version.json or dist/sw.js:', err);
      }
    },
  };
}

export default defineConfig(() => {
  const buildVersion = process.env.npm_package_version
    ? `${process.env.npm_package_version}-${Date.now()}`
    : `${Date.now()}`;

  return {
    define: {
      __APP_VERSION__: JSON.stringify(buildVersion),
    },
    plugins: [
      react(),
      tailwindcss(),
      furqanVersionPlugin(buildVersion),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
