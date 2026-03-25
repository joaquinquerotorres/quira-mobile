/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    /** Evita OOM en suites grandes (Ionic + muchos tests por archivo). */
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  }
})
