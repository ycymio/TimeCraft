import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all interfaces
    port: 5173,
    strictPort: true,
    open: false, // Don't auto-open browser in VM
    cors: true, // Enable CORS for cross-origin requests
    // Allow all hosts (most permissive setting)
    allowedHosts: true,
    hmr: {
      port: 24678, // Use a different port for HMR to avoid conflicts
      host: 'localhost' // HMR should only bind to localhost
    }
  },
  preview: {
    host: '0.0.0.0', // Listen on all interfaces
    port: 4173,
    strictPort: true,
    cors: true,
    allowedHosts: true
  },
  base: './' // Use relative paths for assets
})
