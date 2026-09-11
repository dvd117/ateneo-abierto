import { defineConfig } from 'vite';
import { prerender } from './scripts/vite-prerender';

export default defineConfig({
  plugins: [prerender()],
  test: {
    environment: 'node'
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
