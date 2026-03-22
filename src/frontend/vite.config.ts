/// <reference types="vitest/config" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appBasePath = process.env.VITE_APP_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base: appBasePath,
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5127',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5127',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
