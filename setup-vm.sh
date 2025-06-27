#!/bin/bash

# TimeCraft Project Setup Script for Virtual Machine
# This script will help you set up and run the TimeCraft time tracking app

echo "=== TimeCraft VM Setup ==="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js first:"
    echo "- Ubuntu/Debian: sudo apt update && sudo apt install nodejs npm"
    echo "- CentOS/RHEL: sudo yum install nodejs npm"
    echo "- Or download from: https://nodejs.org/"
    exit 1
else
    echo "✅ Node.js found: $(node --version)"
    echo "✅ npm found: $(npm --version)"
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo ""
echo "=== Installing Dependencies ==="
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully"
echo ""
echo "=== Project is ready to run! ==="
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To start the backend server:"
echo "  node server.js"
echo ""
echo "The app will be available at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:3001"
echo ""
