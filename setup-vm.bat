@echo off
REM TimeCraft Project Setup Script for Windows VM
REM This script will help you set up and run the TimeCraft time tracking app

echo === TimeCraft VM Setup ===
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js first from: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js found:
    node --version
    echo ✅ npm found:
    npm --version
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo.
echo === Installing Dependencies ===
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully
echo.
echo === Project is ready to run! ===
echo.
echo To start the development server:
echo   npm run dev
echo.
echo To start the backend server:
echo   node server.js
echo.
echo The app will be available at:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:3001
echo.
pause
