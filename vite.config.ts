/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiTarget = process.env.HIREFLOW_API ?? 'http://localhost:5230'

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/; local dev and preview use /.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin proxy for "Live API" mode during development (HTTP + WebSocket).
    proxy: {
      '/graphql': { target: apiTarget, ws: true, changeOrigin: true },
      '/auth': { target: apiTarget, changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Load these through Vite so they share the ESM build of graphql with the tests.
    server: { deps: { inline: [/@graphql-tools/, /@urql\/exchange-execute/] } },
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: { include: ['src/**/*.{ts,tsx}'], exclude: ['src/gql/**', 'src/test/**', 'src/**/*.test.*'] },
  },
})
