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
    // Disable HMR for cloud deployments to avoid WebSocket connection issues
    // HMR (Hot Module Replacement) attempts to connect to localhost:24678 
    // which fails when accessing from external clients
    hmr: false
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
