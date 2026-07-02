# ASMS - Khoi dong Docker local
# Chu y: Docker Desktop phai dang chay (bieu tuong ca voi xanh)

$ProjectRoot = $PSScriptRoot | Split-Path
Set-Location $ProjectRoot

$cdp = $null
$null = docker compose version 2>$null
if ($LASTEXITCODE -eq 0) { $cdp = "v2" }
else {
    $null = docker-compose version 2>$null
    if ($LASTEXITCODE -eq 0) { $cdp = "v1" }
}

if (-not $cdp) {
    Write-Host "[ERR] Docker khong tim thay. Mo Docker Desktop va doi ca voi chuyen xanh." -ForegroundColor Red
    exit 1
}

Write-Host "Docker Compose: $cdp" -ForegroundColor Gray
Write-Host "Khoi dong ASMS..." -ForegroundColor Cyan

if ($cdp -eq "v2") { docker compose up -d 2>$null }
else               { docker-compose up -d 2>$null }

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "ASMS dang chay:" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:8080/" -ForegroundColor Cyan
    Write-Host "  Backend : http://localhost:4001/api/v1" -ForegroundColor Cyan
} else {
    Write-Host "[ERR] Khoi dong that bai." -ForegroundColor Red
}
