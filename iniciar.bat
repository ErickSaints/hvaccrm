@echo off
echo ============================================
echo   HVAC-R CRM - Sistema de Gestion
echo ============================================
echo.
echo [1] Iniciar Backend (API :3001)
echo [2] Iniciar Frontend (Web :5173)
echo [3] Iniciar Ambos
echo [4] Sembrar BD (seed)
echo [5] Salir
echo.

set /p op="Selecciona una opcion: "

if "%op%"=="1" (
    title HVAC-R Backend
    cd /d "%~dp0backend"
    npx.cmd tsx src/index.ts
)
if "%op%"=="2" (
    title HVAC-R Frontend
    cd /d "%~dp0frontend"
    npx.cmd vite --host
)
if "%op%"=="3" (
    title HVAC-R CRM
    start "Backend" cmd /c "cd /d %~dp0backend && npx.cmd tsx src/index.ts"
    timeout /t 3 /nobreak >nul
    start "Frontend" cmd /c "cd /d %~dp0frontend && npx.cmd vite --host"
    echo.
    echo Backend: http://localhost:3001
    echo Frontend: http://localhost:5173
    echo.
    pause
)
if "%op%"=="4" (
    cd /d "%~dp0backend"
    npx.cmd tsx src/seed.ts
    pause
)
if "%op%"=="5" exit /b
