import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    strictPort: true,
    open: false, // Don't auto-open browser in VM
    cors: true, // Enable CORS for cross-origin requests
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'forsteri.southeastasia.cloudapp.azure.com',
      '.cloudapp.azure.com' // Allow all Azure cloudapp subdomains
    ],
    hmr: {
      port: 24678, // Use a different port for HMR to avoid conflicts
      host: 'localhost'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    cors: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'forsteri.southeastasia.cloudapp.azure.com',
      '.cloudapp.azure.com'
    ]
  },
  base: './' // Use relative paths for assets
})
