import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Set the output directory to Spring Boot static resources folder
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      // proxy for development
      '/api': {
        target: 'http://localhost:8080', // Spring Boot server port
        changeOrigin: true,
      },
      '/columns': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/tasks': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})