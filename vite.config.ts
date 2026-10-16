import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 3000,
    proxy: {
      ...[4, 6, 7, 8, 9, 10, 11, 12, 13, 14].reduce((acc, n) => {
        acc[`/api-bdix-${n}`] = {
          target: `http://172.16.50.${n}`,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(new RegExp(`^/api-bdix-${n}`), '')
        };
        return acc;
      }, {} as Record<string, any>),
      ...[200, 201, 202, 203, 204].reduce((acc, n) => {
        acc[`/api-icc-${n}`] = {
          target: `http://10.16.100.${n}`,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(new RegExp(`^/api-icc-${n}`), '')
        };
        return acc;
      }, {} as Record<string, any>),
      '/api-icc': {
        target: 'http://10.16.100.244',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api-icc/, '')
      }
    }
  }
});
