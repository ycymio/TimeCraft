@echo off
REM TimeCraft HTTPS Setup Script for Azure Cloud (Windows)

title TimeCraft HTTPS Setup

echo === TimeCraft HTTPS Setup ===
echo This script will configure HTTPS for TimeCraft to support File System Access API
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js first from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version

REM Install @types/node if not present
echo.
echo === Installing @types/node ===
call npm install --save-dev @types/node

if %errorlevel% neq 0 (
    echo ❌ Failed to install @types/node
    pause
    exit /b 1
)

REM Create SSL directory and certificate
echo.
echo === Creating SSL Certificate ===
if not exist ssl mkdir ssl

if exist ssl\cert.pem (
    echo SSL certificate already exists
) else (
    echo Generating self-signed SSL certificate...
    openssl req -x509 -newkey rsa:2048 -keyout ssl\key.pem -out ssl\cert.pem -days 365 -nodes -subj "/CN=forsteri.southeastasia.cloudapp.azure.com" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ SSL certificate created
    ) else (
        echo ❌ Failed to create SSL certificate. Please install OpenSSL.
        echo You can download OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html
        pause
        exit /b 1
    )
)

REM Backup original vite.config.ts
if exist vite.config.ts (
    if not exist vite.config.ts.backup (
        copy vite.config.ts vite.config.ts.backup >nul
        echo ✅ Original vite.config.ts backed up
    )
)

REM Update vite.config.ts for HTTPS
echo.
echo === Updating vite.config.ts for HTTPS ===
(
echo import { defineConfig } from 'vite'
echo import react from '@vitejs/plugin-react'
echo import fs from 'fs'
echo import path from 'path'
echo.
echo // https://vite.dev/config/
echo export default defineConfig^(^{
echo   plugins: [react^(^)],
echo   server: {
echo     host: '0.0.0.0', // Listen on all interfaces
echo     port: 5173,
echo     strictPort: true,
echo     open: false, // Don't auto-open browser in VM
echo     cors: true, // Enable CORS for cross-origin requests
echo     allowedHosts: true, // Allow all hosts
echo     hmr: false, // Disable HMR for cloud deployment to avoid WebSocket issues
echo     https: {
echo       key: fs.readFileSync^(path.resolve^(__dirname, 'ssl/key.pem'^)^),
echo       cert: fs.readFileSync^(path.resolve^(__dirname, 'ssl/cert.pem'^)^),
echo     }
echo   },
echo   preview: {
echo     host: '0.0.0.0', // Listen on all interfaces
echo     port: 4173,
echo     strictPort: true,
echo     cors: true,
echo     allowedHosts: true
echo   },
echo   base: './' // Use relative paths for assets
echo }^)
) > vite.config.ts

echo ✅ vite.config.ts updated for HTTPS

REM Run normal deployment
echo.
echo === Running PM2 Deployment ===
call start-azure.bat

echo.
echo 🔒 HTTPS Configuration Complete!
echo.
echo 🌐 Access URLs:
echo    HTTPS: https://forsteri.southeastasia.cloudapp.azure.com:5173
echo    HTTP:  http://forsteri.southeastasia.cloudapp.azure.com:5173 ^(will redirect^)
echo.
echo ⚠️  Browser Security Warning:
echo    Your browser will show a security warning for the self-signed certificate.
echo    This is normal and safe for development/testing.
echo.
echo    To proceed:
echo    1. Click 'Advanced' or 'Show Details'
echo    2. Click 'Proceed to forsteri.southeastasia.cloudapp.azure.com ^(unsafe^)'
echo    3. Or click 'Continue to this website'
echo.
echo ✅ File System Access API should now work properly!
echo.
echo 📊 Management Commands:
echo    pm2 status                    # Show running processes
echo    pm2 logs                      # Show logs  
echo    pm2 restart ecosystem.config.cjs  # Restart service
echo    pm2-manage.bat                # Interactive management
echo.
pause
