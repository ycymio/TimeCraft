@echo off
REM TimeCraft Start Script - Runs both frontend and backend on Windows

title TimeCraft Application

echo === Starting TimeCraft Application ===
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo ❌ Dependencies not found. Please run setup-vm.bat first.
    pause
    exit /b 1
)

echo 🚀 Starting backend server on port 3001...
start "TimeCraft Backend" cmd /k "node server.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo 🚀 Starting frontend development server on port 5173...
start "TimeCraft Frontend" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting up...
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:3001
echo.
echo Two command windows have been opened for the servers.
echo Close both windows to stop the application.
echo.
pause
