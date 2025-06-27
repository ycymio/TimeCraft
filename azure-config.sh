#!/bin/bash

# Azure IP Configuration Script
# This script sets up the correct IP addresses for TimeCraft

# Azure VM Information
export AZURE_PUBLIC_IP="20.6.81.42"
export AZURE_INTERNAL_IP="10.0.0.4"
export AZURE_DOMAIN="forsteri.southeastasia.cloudapp.azure.com"

# Port Configuration
export FRONTEND_PORT="5173"
export BACKEND_PORT="3001"
export HMR_PORT="24678"

echo "=== Azure IP Configuration ==="
echo "Public IP: $AZURE_PUBLIC_IP"
echo "Internal IP: $AZURE_INTERNAL_IP"
echo "Domain: $AZURE_DOMAIN"
echo "Frontend Port: $FRONTEND_PORT"
echo "Backend Port: $BACKEND_PORT"
echo ""

echo "=== Access URLs ==="
echo "Frontend (Public IP): http://$AZURE_PUBLIC_IP:$FRONTEND_PORT"
echo "Frontend (Domain): http://$AZURE_DOMAIN:$FRONTEND_PORT"
echo "Backend (Public IP): http://$AZURE_PUBLIC_IP:$BACKEND_PORT"
echo "Backend (Domain): http://$AZURE_DOMAIN:$BACKEND_PORT"
echo ""

# Export for use in other scripts
echo "Environment variables set successfully!"
echo "You can now run: npm run start:azure"
