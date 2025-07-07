#!/bin/bash

# TimeCraft HTTPS Setup Script for Azure Cloud
echo "=== TimeCraft HTTPS Setup ==="
echo "This script will configure HTTPS for TimeCraft to support File System Access API"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js first from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install @types/node if not present
echo ""
echo "=== Installing @types/node ==="
npm install --save-dev @types/node

# Create SSL directory and certificate
echo ""
echo "=== Creating SSL Certificate ==="
mkdir -p ssl

if [ -f "ssl/cert.pem" ]; then
    echo "SSL certificate already exists"
else
    echo "Generating self-signed SSL certificate..."
    openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
      -subj "/CN=forsteri.southeastasia.cloudapp.azure.com" 2>/dev/null
    echo "✅ SSL certificate created"
fi

# Backup original vite.config.ts
if [ -f "vite.config.ts" ] && [ ! -f "vite.config.ts.backup" ]; then
    cp vite.config.ts vite.config.ts.backup
    echo "✅ Original vite.config.ts backed up"
fi

# Update vite.config.ts for HTTPS
echo ""
echo "=== Updating vite.config.ts for HTTPS ==="
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all interfaces
    port: 5173,
    strictPort: true,
    open: false, // Don't auto-open browser in VM
    cors: true, // Enable CORS for cross-origin requests
    allowedHosts: true, // Allow all hosts
    hmr: false, // Disable HMR for cloud deployment to avoid WebSocket issues
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/cert.pem')),
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
EOF

echo "✅ vite.config.ts updated for HTTPS"

# Run normal deployment
echo ""
echo "=== Running PM2 Deployment ==="
chmod +x start-azure.sh
./start-azure.sh

echo ""
echo "🔒 HTTPS Configuration Complete!"
echo ""
echo "🌐 Access URLs:"
echo "   HTTPS: https://forsteri.southeastasia.cloudapp.azure.com:5173"
echo "   HTTP:  http://forsteri.southeastasia.cloudapp.azure.com:5173 (will redirect)"
echo ""
echo "⚠️  Browser Security Warning:"
echo "   Your browser will show a security warning for the self-signed certificate."
echo "   This is normal and safe for development/testing."
echo ""
echo "   To proceed:"
echo "   1. Click 'Advanced' or 'Show Details'"
echo "   2. Click 'Proceed to forsteri.southeastasia.cloudapp.azure.com (unsafe)'"
echo "   3. Or click 'Continue to this website'"
echo ""
echo "✅ File System Access API should now work properly!"
echo ""
echo "📊 Management Commands:"
echo "   pm2 status                    # Show running processes"
echo "   pm2 logs                      # Show logs"
echo "   pm2 restart ecosystem.config.cjs  # Restart service"
echo "   ./pm2-manage.sh               # Interactive management"
echo ""
