import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
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
      },
      '/rows': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/subtasks': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/files': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      },
    }
  }
})