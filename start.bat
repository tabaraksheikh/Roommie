@echo off
setlocal
cd /d "%~dp0"
title Roommie Launcher

echo.
echo ==========================================
echo   Roommie Setup and Launch
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not available in PATH.
    echo Please install Node.js from https://nodejs.org and run this file again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not available in PATH.
    echo Please reinstall Node.js from https://nodejs.org and run this file again.
    echo.
    pause
    exit /b 1
)

if not exist ".env" (
    echo [ERROR] Missing .env file.
    echo Please make sure the project contains a valid .env configuration before starting.
    echo.
    pause
    exit /b 1
)

if not exist "backend\\uploads" (
    mkdir backend\uploads >nul 2>&1
)

echo [1/4] Checking project dependencies...
if exist "package-lock.json" (
    call npm install
) else (
    call npm install
)
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install npm dependencies.
    echo Please fix the npm error above and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Checking database connection...
call npm run db:check
if errorlevel 1 (
    echo.
    echo [ERROR] Roommie could not connect to MySQL.
    echo Make sure MySQL is installed, running, and your .env credentials are correct.
    echo.
    pause
    exit /b 1
)

echo.
echo [3/5] Initializing database schema...
call npm run db:init
if errorlevel 1 (
    echo.
    echo [ERROR] Roommie could not initialize the database schema.
    echo Please fix the database error above and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo [4/5] Starting the Roommie server...
echo The app will be available at:
echo http://localhost:3000
echo.

echo [5/5] Opening Roommie in your browser...
start "" http://localhost:3000
echo.

call npm start

pause
