#!/bin/bash

# Azure Cloud Deployment Script for TimeCraft - PM2 Version
# This script uses PM2 to manage TimeCraft processes for Azure cloud access

echo "=== TimeCraft Azure Cloud Setup (PM2) ==="
echo "Domain: forsteri.southeastasia.cloudapp.azure.com"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed"
    echo "Installing PM2..."
    npm install -g pm2
fi

echo "✅ PM2 version: $(pm2 --version)"

# Install dependencies
echo ""
echo "=== Installing Dependencies ==="
npm install

# Create logs directory
mkdir -p logs

# Stop existing PM2 processes (if any)
echo ""
echo "=== Stopping existing PM2 processes ==="
pm2 stop ecosystem.config.cjs 2>/dev/null || true
pm2 delete ecosystem.config.cjs 2>/dev/null || true

# Set environment variables for production
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=5173
export BACKEND_PORT=3001

echo ""
echo "=== Starting TimeCraft for Azure Cloud with PM2 ==="
echo ""

echo "🚀 Starting TimeCraft applications with PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration for auto-restart on reboot
pm2 save

echo ""
echo "✅ TimeCraft is now running on Azure Cloud with PM2!"
echo ""
echo "🌐 Access URLs:"
echo "   External (Public IP): http://20.6.81.42:5173"
echo "   External (Domain): http://forsteri.southeastasia.cloudapp.azure.com:5173"
echo "   Local: http://localhost:5173"
echo ""
echo "🔧 Make sure Azure firewall allows port 5173"
echo "🔧 Public IP: 20.6.81.42 | Internal IP: 10.0.0.4"
echo "🔧 HMR (24678) runs on localhost only for development"
echo ""
echo "📊 PM2 Management Commands:"
echo "   pm2 status                    # Show running processes"
echo "   pm2 logs                      # Show logs"
echo "   pm2 logs timecraft-frontend   # Frontend logs only"
echo "   pm2 restart ecosystem.config.cjs  # Restart all"
echo "   pm2 stop ecosystem.config.cjs     # Stop all"
echo "   pm2 delete ecosystem.config.cjs   # Delete all"
echo "   pm2 monit                     # Real-time monitoring"
echo ""
echo "PM2 is now managing your TimeCraft processes."
echo "Use 'pm2 status' to check the status."
echo ""
