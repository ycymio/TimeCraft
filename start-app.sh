#!/bin/bash

# TimeCraft Start Script - Runs the frontend application

echo "=== Starting TimeCraft Application ==="
echo ""

# Function to kill background processes on script exit
cleanup() {
    echo ""
    echo "Stopping server..."
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not found. Please run setup-vm.sh first."
    exit 1
fi

# Start frontend development server
echo "🚀 Starting frontend development server on port 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Server is starting up..."
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for processes
wait
