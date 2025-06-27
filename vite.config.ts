import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs (equivalent to 0.0.0.0)
    port: 5173,
    strictPort: true,
    open: false, // Don't auto-open browser in VM
    cors: true, // Enable CORS for cross-origin requests
    hmr: {
      port: 24678 // Use a different port for HMR to avoid conflicts
    }
  },
  preview: {
    host: true, // Listen on all local IPs
    port: 4173,
    strictPort: true,
    cors: true
  },
  base: './' // Use relative paths for assets
})
