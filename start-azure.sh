#!/bin/bash

# Azure Cloud Deployment Script for TimeCraft
# This script configures and starts TimeCraft for Azure cloud access

echo "=== TimeCraft Azure Cloud Setup ==="
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

# Install dependencies
echo ""
echo "=== Installing Dependencies ==="
npm install

# Set environment variables for production
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=5173
export BACKEND_PORT=3001

echo ""
echo "=== Starting TimeCraft for Azure Cloud ==="
echo ""

# Function to kill background processes on script exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo "🚀 Starting backend server on port $BACKEND_PORT..."
node server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend development server with external access
echo "🚀 Starting frontend server on port $PORT..."
echo "   Configured for host: forsteri.southeastasia.cloudapp.azure.com"
npm run dev -- --host 0.0.0.0 --port $PORT &
FRONTEND_PID=$!

echo ""
echo "✅ TimeCraft is now running on Azure Cloud!"
echo ""
echo "🌐 Access URLs:"
echo "   External: http://forsteri.southeastasia.cloudapp.azure.com:5173"
echo "   Local: http://localhost:5173"
echo "   Backend: http://forsteri.southeastasia.cloudapp.azure.com:3001"
echo ""
echo "🔧 Make sure Azure firewall allows ports 5173 and 3001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for processes
wait
