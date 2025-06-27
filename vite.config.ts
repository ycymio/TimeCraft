import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections (useful for VM access)
    port: 5173,
    strictPort: true,
    open: false // Don't auto-open browser in VM
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  }
})
