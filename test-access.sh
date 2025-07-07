#!/bin/bash

# Quick Test Script for Azure Access (PM2 Version)
echo "=== TimeCraft Azure Access Test (PM2) ==="
echo ""

# Check if PM2 processes are running
echo "1. Checking PM2 processes..."
if command -v pm2 &> /dev/null; then
    echo "PM2 Status:"
    pm2 status | grep -E "timecraft-frontend" || echo "No TimeCraft processes found"
else
    echo "❌ PM2 is not installed"
fi

echo ""
echo "2. Checking if ports are in use..."
if netstat -tlnp 2>/dev/null | grep -q ":5173"; then
    echo "✅ Port 5173 is active"
else
    echo "❌ Port 5173 is not active - start the application first"
fi

echo ""
echo "3. Testing local access..."
if curl -s --connect-timeout 5 http://localhost:5173 > /dev/null; then
    echo "✅ Local access (localhost:5173) works"
else
    echo "❌ Local access failed"
fi

echo ""
echo "4. Testing public IP access..."
if curl -s --connect-timeout 5 http://20.6.81.42:5173 > /dev/null; then
    echo "✅ Public IP access (20.6.81.42:5173) works"
else
    echo "❌ Public IP access failed - check firewall"
fi

echo ""
echo "5. Testing domain access..."
if curl -s --connect-timeout 5 http://forsteri.southeastasia.cloudapp.azure.com:5173 > /dev/null; then
    echo "✅ Domain access works"
else
    echo "❌ Domain access failed - check DNS/firewall"
fi

echo ""
echo "6. Current Vite configuration:"
if [ -f "vite.config.ts" ]; then
    echo "allowedHosts setting:"
    grep -A 5 -B 5 "allowedHosts" vite.config.ts || echo "No allowedHosts found"
else
    echo "❌ vite.config.ts not found"
fi

echo ""
echo "=== Test Complete ==="
echo "If any tests failed, check:"
echo "1. Application is running (./start-azure.sh or start-azure.bat)"
echo "2. PM2 processes are active (pm2 status)"
echo "3. Azure firewall allows port 5173"
echo "4. vite.config.ts has allowedHosts: true"
