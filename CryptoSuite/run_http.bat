@echo off
title CryptoSuite - HTTP Mode

echo ==========================================
echo   CRYPTOSUITE - HTTP MODE
echo ==========================================
echo.

echo [*] Starting HTTP Server...
echo [*] Access your application:
echo     http://cryptosuite.com:5000
echo     http://localhost:5000
echo.

cd /d "E:\DecodeLabs Internship Projects\CryptoSuite"
python backend\app.py

pause