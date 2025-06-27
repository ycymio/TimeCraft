@echo off
REM Azure Cloud Deployment Script for TimeCraft (Windows)
REM This script configures and starts TimeCraft for Azure cloud access

title TimeCraft Azure Cloud

echo === TimeCraft Azure Cloud Setup ===
echo Domain: forsteri.southeastasia.cloudapp.azure.com
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

REM Install dependencies
echo.
echo === Installing Dependencies ===
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Set environment variables
set NODE_ENV=production
set HOST=0.0.0.0
set PORT=5173
set BACKEND_PORT=3001

echo.
echo === Starting TimeCraft for Azure Cloud ===
echo.

echo 🚀 Starting backend server on port %BACKEND_PORT%...
start "TimeCraft Backend (Azure)" cmd /k "node server.js"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

echo 🚀 Starting frontend server on port %PORT%...
start "TimeCraft Frontend (Azure)" cmd /k "npm run dev -- --host 0.0.0.0 --port %PORT%"

echo.
echo ✅ TimeCraft is now running on Azure Cloud!
echo.
echo 🌐 Access URLs:
echo    External: http://forsteri.southeastasia.cloudapp.azure.com:5173
echo    Local: http://localhost:5173
echo    Backend: http://forsteri.southeastasia.cloudapp.azure.com:3001
echo.
echo 🔧 Make sure Azure firewall allows ports 5173 and 3001
echo.
echo Two command windows have been opened for the servers.
echo Close both windows to stop the application.
echo.
pause
