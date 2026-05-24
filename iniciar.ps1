$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

function Start-Backend {
    Write-Host "Iniciando Backend (API :3001)..." -ForegroundColor Cyan
    Set-Location $backendDir
    npx.cmd tsx src/index.ts
}

function Start-Frontend {
    Write-Host "Iniciando Frontend (Web :5173)..." -ForegroundColor Cyan
    Set-Location $frontendDir
    npx.cmd vite --host
}

function Start-Both {
    Write-Host "Iniciando HVAC-R CRM..." -ForegroundColor Green
    $beJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npx.cmd tsx src/index.ts
    } -ArgumentList $backendDir

    Start-Sleep 3

    $feJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npx.cmd vite --host
    } -ArgumentList $frontendDir

    Write-Host "`nBackend:  http://localhost:3001" -ForegroundColor Yellow
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
    Write-Host "`nPresiona Ctrl+C para detener ambos`n" -ForegroundColor Gray

    Read-Host "Presiona Enter para salir"
    Stop-Job $beJob, $feJob
    Remove-Job $beJob, $feJob
}

function Run-Seed {
    Write-Host "Sembrando base de datos..." -ForegroundColor Cyan
    Set-Location $backendDir
    npx.cmd tsx src/seed.ts
}

$menu = @"
============================================
  HVAC-R CRM - Sistema de Gestión
============================================

  1. Iniciar Backend (API :3001)
  2. Iniciar Frontend (Web :5173)
  3. Iniciar Ambos
  4. Sembrar BD (seed)
  5. Salir

"@

do {
    Clear-Host
    Write-Host $menu
    $op = Read-Host "Selecciona una opcion"

    switch ($op) {
        "1" { Start-Backend }
        "2" { Start-Frontend }
        "3" { Start-Both }
        "4" { Run-Seed; pause }
        "5" { break }
        default { Write-Host "Opcion invalida"; pause }
    }
} while ($op -ne "5")
