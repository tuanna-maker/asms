# ASMS - Dung Docker local

$ProjectRoot = $PSScriptRoot | Split-Path
Set-Location $ProjectRoot

$null = docker compose version 2>$null
if ($LASTEXITCODE -eq 0) { docker compose down 2>$null }
else                     { docker-compose down 2>$null }

if ($LASTEXITCODE -eq 0) {
    Write-Host "ASMS da dung. Chay scripts/start.ps1 de bat lai." -ForegroundColor Yellow
} else {
    Write-Host "[ERR] Dung that bai." -ForegroundColor Red
}
