import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@zan-vn/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@zan-vn/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@zan-vn/lib': path.resolve(__dirname, '../../packages/lib/src'),
      '@zan-vn/vn-engine': path.resolve(__dirname, '../../packages/vn-engine/src'),
    },
  },
  server: {
    port: 5174,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
