import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  base: '/4_BlaBlaNotes/',
  server: {
    port: 5173,
    strictPort: false
  },
    build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
})
