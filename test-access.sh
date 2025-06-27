#!/bin/bash

# Quick Test Script for Azure Access
echo "=== TimeCraft Azure Access Test ==="
echo ""

# Check if the application is running
echo "1. Checking if ports are in use..."
if netstat -tlnp 2>/dev/null | grep -q ":5173"; then
    echo "✅ Port 5173 is active"
else
    echo "❌ Port 5173 is not active - start the application first"
fi

if netstat -tlnp 2>/dev/null | grep -q ":3001"; then
    echo "✅ Port 3001 is active"
else
    echo "❌ Port 3001 is not active - start the backend first"
fi

echo ""
echo "2. Testing local access..."
if curl -s --connect-timeout 5 http://localhost:5173 > /dev/null; then
    echo "✅ Local access (localhost:5173) works"
else
    echo "❌ Local access failed"
fi

echo ""
echo "3. Testing public IP access..."
if curl -s --connect-timeout 5 http://20.6.81.42:5173 > /dev/null; then
    echo "✅ Public IP access (20.6.81.42:5173) works"
else
    echo "❌ Public IP access failed - check firewall"
fi

echo ""
echo "4. Testing domain access..."
if curl -s --connect-timeout 5 http://forsteri.southeastasia.cloudapp.azure.com:5173 > /dev/null; then
    echo "✅ Domain access works"
else
    echo "❌ Domain access failed - check DNS/firewall"
fi

echo ""
echo "5. Current Vite configuration:"
if [ -f "vite.config.ts" ]; then
    echo "allowedHosts setting:"
    grep -A 5 -B 5 "allowedHosts" vite.config.ts || echo "No allowedHosts found"
else
    echo "❌ vite.config.ts not found"
fi

echo ""
echo "=== Test Complete ==="
echo "If any tests failed, check:"
echo "1. Application is running (npm run start:azure)"
echo "2. Azure firewall allows ports 5173 and 3001"
echo "3. vite.config.ts has allowedHosts: true"
