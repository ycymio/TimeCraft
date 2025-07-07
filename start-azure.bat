@echo off
REM Azure Cloud Deployment Script for TimeCraft (Windows) - PM2 Version
REM This screcho � PM2 Management Commands:
echo    pm2 status                     # Show running processes
echo    pm2 logs                       # Show logs
echo    pm2 logs timecraft-frontend    # Frontend logs only
echo    pm2 restart ecosystem.config.cjs   # Restart all
echo    pm2 stop ecosystem.config.cjs       # Stop all
echo    pm2 delete ecosystem.config.cjs     # Delete all
echo    pm2 monit                      # Real-time monitoringPM2 to manage TimeCraft processes for Azure cloud access

title TimeCraft Azure Cloud - PM2

echo === TimeCraft Azure Cloud Setup (PM2) ===
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

REM Check if PM2 is installed
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PM2 is not installed
    echo Installing PM2...
    call npm install -g pm2
    if %errorlevel% neq 0 (
        echo ❌ Failed to install PM2
        pause
        exit /b 1
    )
)

echo ✅ PM2 version:
pm2 --version

REM Install dependencies
echo.
echo === Installing Dependencies ===
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Create logs directory
if not exist logs mkdir logs

REM Stop existing PM2 processes (if any)
echo.
echo === Stopping existing PM2 processes ===
pm2 stop ecosystem.config.cjs 2>nul
pm2 delete ecosystem.config.cjs 2>nul

REM Set environment variables
set NODE_ENV=production
set HOST=0.0.0.0
set PORT=5173

echo.
echo === Starting TimeCraft for Azure Cloud with PM2 ===
echo.

echo 🚀 Starting TimeCraft applications with PM2...
pm2 start ecosystem.config.cjs

if %errorlevel% neq 0 (
    echo ❌ Failed to start with PM2
    pause
    exit /b 1
)

REM Save PM2 configuration for auto-restart on reboot
pm2 save

echo.
echo ✅ TimeCraft is now running on Azure Cloud with PM2!
echo.
echo 🌐 Access URLs:
echo    External (Public IP): http://20.6.81.42:5173
echo    External (Domain): http://forsteri.southeastasia.cloudapp.azure.com:5173
echo    Local: http://localhost:5173
echo.
echo 🔧 Make sure Azure firewall allows port 5173
echo 🔧 Public IP: 20.6.81.42 ^| Internal IP: 10.0.0.4
echo 🔧 HMR (24678) runs on localhost only for development
echo.
echo � PM2 Management Commands:
echo    pm2 status                     # Show running processes
echo    pm2 logs                       # Show logs
echo    pm2 logs timecraft-frontend    # Frontend logs only
echo    pm2 logs timecraft-backend     # Backend logs only
echo    pm2 restart ecosystem.config.cjs   # Restart all
echo    pm2 stop ecosystem.config.cjs       # Stop all
echo    pm2 delete ecosystem.config.cjs     # Delete all
echo    pm2 monit                      # Real-time monitoring
echo.
echo PM2 is now managing your TimeCraft processes.
echo Use 'pm2 status' to check the status.
echo.
pause
