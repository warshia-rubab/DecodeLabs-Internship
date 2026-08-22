@echo off
title Password Checker - Launcher
color 0A

echo ============================================
echo  Starting Password Checker...
echo ============================================
echo.

:: Change to the directory where this .bat file is located
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Kill any previous process using Port 3000 (fixes port already in use errors)
echo [INFO] Cleaning up port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>nul

:: Start the backend server in a new window
echo [INFO] Starting Backend Server...
start "Password Checker - Backend" cmd /k "node server.js"

:: Wait 2 seconds for the server to boot up
timeout /t 2 /nobreak >nul

:: Open the frontend in your default browser
echo [INFO] Opening Frontend Interface...
start "" "index.html"

echo.
echo ============================================
echo  Project Launched Successfully!
echo  Backend is running on: http://localhost:3000
echo  Keep this window open or close it safely.
echo ============================================
timeout /t 5 /nobreak >nul
exit