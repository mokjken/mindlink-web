@echo off
TITLE MindLink Launcher
CLS

ECHO ==========================================
ECHO      MindLink - Digital Twin Launcher
ECHO ==========================================
ECHO.

:: Check for Node.js
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] Node.js is not installed!
    ECHO Please download it from https://nodejs.org/
    PAUSE
    EXIT /B
)

ECHO [1/3] Checking dependencies...

:: Install Root Deps
IF NOT EXIST "node_modules" (
    ECHO Installing Frontend dependencies...
    call npm install
) ELSE (
    ECHO Frontend dependencies found.
)

:: Install Backend Deps
IF NOT EXIST "backend\node_modules" (
    ECHO Installing Backend dependencies...
    cd backend
    call npm install
    cd ..
) ELSE (
    ECHO Backend dependencies found.
)

ECHO.
ECHO [2/3] Starting MindLink...
ECHO This will open two windows/processes.
ECHO Access the app at: http://localhost:3000
ECHO.

:: Run the app
npm run dev

PAUSE
