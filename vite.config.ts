import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // Don't inject dev SW — avoids confusion with HMR in dev
        devOptions: { enabled: false },
        includeAssets: ['pwa-192.png', 'pwa-512.png', 'favicon.ico'],
        manifest: {
          name: 'Pizza & Movie Night',
          short_name: 'Movie Night',
          description: 'Family movie night tracker — pizza included 🍕🎬',
          theme_color: '#1a1a2e',
          background_color: '#1a1a2e',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['entertainment', 'lifestyle'],
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              // Maskable icon (Android adaptive icons need safe-zone padding)
              // Using same image — works fine, just won't be edge-to-edge on Android
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Cache all static assets (JS, CSS, HTML, SVG, fonts)
          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2,ttf,eot}'],

          // SPA routing — serve index.html for all navigation requests
          navigateFallback: 'index.html',

          // Don't intercept Vercel API routes or Firebase WebSocket connections
          navigateFallbackDenylist: [/^\/api\//, /^\/__\//, /^\/firestore\//],

          runtimeCaching: [
            // ── TMDB poster images ──────────────────────────────────────────
            // These never change for a given URL path, so CacheFirst is ideal
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tmdb-images-v1',
                expiration: {
                  maxEntries: 500,       // up to 500 posters
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },

            // ── Google Fonts stylesheets ────────────────────────────────────
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },

            // ── Google Fonts files ──────────────────────────────────────────
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-files',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },

            // ── TMDB API (search/movie lookups) ─────────────────────────────
            // NetworkFirst: try fresh data, fall back to cache if offline
            {
              urlPattern: /^https:\/\/api\.themoviedb\.org\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tmdb-api-v1',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
                cacheableResponse: { statuses: [0, 200] },
              },
            },

            // ── Vercel API routes ───────────────────────────────────────────
            // Never cache — these are server-side functions (email, etc.)
            {
              urlPattern: /^https?:\/\/[^/]+\/api\/.*/i,
              handler: 'NetworkOnly',
            },

            // NOTE: Firebase Firestore + Auth use WebSockets + IndexedDB internally.
            // The Firestore offline persistence (initializeFirestore with persistentLocalCache)
            // already handles Firestore caching — the service worker should NOT interfere.
          ],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
            'ui-vendor': ['motion', 'lucide-react', 'sonner'],
          },
        },
      },
    },
  };
});
