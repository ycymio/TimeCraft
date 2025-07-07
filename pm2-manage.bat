@echo off
REM PM2 Management Script for TimeCraft

title TimeCraft PM2 Management

:MENU
echo.
echo === TimeCraft PM2 Management ===
echo.
echo 1. Show PM2 status
echo 2. Show logs (all)
echo 3. Show frontend logs only
echo 4. Show backend logs only
echo 5. Restart all services
echo 6. Stop all services
echo 7. Start all services
echo 8. Delete all services
echo 9. Real-time monitoring
echo 0. Exit
echo.
set /p choice=Choose an option (0-9): 

if "%choice%"=="1" goto STATUS
if "%choice%"=="2" goto LOGS_ALL
if "%choice%"=="3" goto LOGS_FRONTEND
if "%choice%"=="4" goto LOGS_BACKEND
if "%choice%"=="5" goto RESTART
if "%choice%"=="6" goto STOP
if "%choice%"=="7" goto START
if "%choice%"=="8" goto DELETE
if "%choice%"=="9" goto MONITOR
if "%choice%"=="0" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:STATUS
echo.
echo === PM2 Status ===
pm2 status
pause
goto MENU

:LOGS_ALL
echo.
echo === All Logs (Press Ctrl+C to exit) ===
pm2 logs
goto MENU

:LOGS_FRONTEND
echo.
echo === Frontend Logs (Press Ctrl+C to exit) ===
pm2 logs timecraft-frontend
goto MENU

:LOGS_BACKEND
echo.
echo === Backend Logs (Press Ctrl+C to exit) ===
pm2 logs timecraft-backend
goto MENU

:RESTART
echo.
echo === Restarting Services ===
pm2 restart ecosystem.config.js
echo Services restarted.
pause
goto MENU

:STOP
echo.
echo === Stopping Services ===
pm2 stop ecosystem.config.js
echo Services stopped.
pause
goto MENU

:START
echo.
echo === Starting Services ===
pm2 start ecosystem.config.js
echo Services started.
pause
goto MENU

:DELETE
echo.
echo === Deleting Services ===
set /p confirm=Are you sure you want to delete all PM2 services? (y/N): 
if /i "%confirm%"=="y" (
    pm2 delete ecosystem.config.js
    echo Services deleted.
) else (
    echo Operation cancelled.
)
pause
goto MENU

:MONITOR
echo.
echo === Real-time Monitoring (Press Ctrl+C to exit) ===
pm2 monit
goto MENU

:EXIT
echo.
echo Goodbye!
pause
exit
