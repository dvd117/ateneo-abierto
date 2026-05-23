import { defineConfig } from 'vite';

export default defineConfig({
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
