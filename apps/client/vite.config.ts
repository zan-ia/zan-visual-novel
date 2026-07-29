import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Zan VN — Visual Novels Interativas',
        short_name: 'Zan VN',
        description: 'Visual novels interativas com IA narrativa',
        theme_color: '#0f0f23',
        background_color: '#0f0f23',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/library',
        scope: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/v1\/vns/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-vns',
              expiration: { maxAgeSeconds: 60 * 60 * 24 }, // 24h
            },
          },
          {
            urlPattern: /\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-uploads',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30d
            },
          },
          {
            urlPattern: /\/assets\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-minio',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^\/api\/v1\/(saves|credits|auth)/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@zan-vn/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@zan-vn/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@zan-vn/lib': path.resolve(__dirname, '../../packages/lib/src'),
      '@zan-vn/vn-engine': path.resolve(__dirname, '../../packages/vn-engine/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/uploads': 'http://localhost:3001',
      '/assets': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
