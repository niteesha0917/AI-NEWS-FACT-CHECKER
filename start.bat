@echo off
title Veritas AI Launcher
color 0A
echo.
echo  ██╗   ██╗███████╗██████╗ ██╗████████╗ █████╗ ███████╗     █████╗ ██╗
echo  ██║   ██║██╔════╝██╔══██╗██║╚══██╔══╝██╔══██╗██╔════╝    ██╔══██╗██║
echo  ██║   ██║█████╗  ██████╔╝██║   ██║   ███████║███████╗    ███████║██║
echo  ╚██╗ ██╔╝██╔══╝  ██╔══██╗██║   ██║   ██╔══██║╚════██║    ██╔══██║██║
echo   ╚████╔╝ ███████╗██║  ██║██║   ██║   ██║  ██║███████║    ██║  ██║██║
echo    ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝
echo.
echo  Trust, Verified. AI-Powered News Fact-Checker
echo  ================================================
echo.

:: Set PATH to include Node.js
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"
set "NPM=%NODE_PATH%\npm.cmd"
set "NODE=%NODE_PATH%\node.exe"

:: Check Node.js
"%NODE%" --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found at %NODE_PATH%
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('"%NODE%" --version') do set NODE_VER=%%v
echo  Node.js %NODE_VER% detected
echo.

:: Backend setup
echo [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
call "%NPM%" install --silent 2>&1
if errorlevel 1 (
    echo [WARNING] Backend install had issues, continuing...
) else (
    echo  Backend dependencies OK
)

:: Frontend setup  
echo [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call "%NPM%" install --silent 2>&1
if errorlevel 1 (
    echo [WARNING] Frontend install had issues, continuing...
) else (
    echo  Frontend dependencies OK
)

echo.
echo [3/4] Starting Backend server (port 5000)...
cd /d "%~dp0backend"
start "Veritas Backend :5000" cmd /k "set PATH=%NODE_PATH%;%PATH% && node server.js"

echo Waiting for backend to initialize...
timeout /t 3 >nul

echo [4/4] Starting Frontend dev server (port 5173)...
cd /d "%~dp0frontend"
start "Veritas Frontend :5173" cmd /k "set PATH=%NODE_PATH%;%PATH% && "%NPM%" run dev"

echo.
echo  ================================================
echo   Veritas AI is starting up!
echo  ================================================
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo   Health   : http://localhost:5000/api/health
echo  ================================================
echo.
echo  Opening browser in 5 seconds...
timeout /t 5 >nul
start http://localhost:5173
echo.
echo  Both servers are running. Close their windows to stop.
pause
