<#
.SYNOPSIS
    ASMS One-Click Installer - Full setup with just Docker.
    Copy project folder to new machine, open Docker, run this file.

.DESCRIPTION
    This script automates the entire setup:
      1) Check Docker Desktop is running
      2) Create required directories
      3) Load Docker images from .tar (if available) or build from source
      4) Start PostgreSQL + Backend + Frontend containers
      5) Prisma migrate deploy
      6) Bootstrap auth + workflows + seed demo + RBAC
      7) Verify login

    Requirements: Docker Desktop only. No Git, Node, or npm needed.

    After install, use these for day-to-day:
      scripts/start.ps1    (start)
      scripts/stop.ps1     (stop)

.EXAMPLE
    1. Copy project folder to C:\asms
    2. Open Docker Desktop, wait for whale icon to turn green
    3. Run:
       powershell -ExecutionPolicy Bypass -File C:\asms\scripts\install.ps1
#>

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# ============================================================
# Helpers
# ============================================================
function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) {
    Write-Host "[ERR] $msg" -ForegroundColor Red
    throw $msg
}

# ============================================================
# Banner
# ============================================================
Write-Host ""
Write-Host "  ==============================================" -ForegroundColor Cyan
Write-Host "     ASMS - One-Click Installer" -ForegroundColor Cyan
Write-Host "  ==============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# 0. Detect Docker Compose version
# ============================================================
$null = docker compose version 2>$null
if ($LASTEXITCODE -eq 0) { $cdp = "v2" }
else {
    $null = docker-compose version 2>$null
    if ($LASTEXITCODE -eq 0) { $cdp = "v1" }
}

# ============================================================
# 1. Check Docker Desktop running
# ============================================================
Write-Step "Kiem tra Docker Desktop"
$null = docker info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  Docker Desktop chua chay hoac chua cai dat." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Huong dan:" -ForegroundColor Yellow
    Write-Host "  1. Tai Docker Desktop: https://docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "  2. Cai dat va khoi dong Docker Desktop" -ForegroundColor White
    Write-Host "  3. Doi icon ca voi o khay he thong chuyen XANH" -ForegroundColor White
    Write-Host "  4. Chay lai file nay" -ForegroundColor White
    Write-Host ""
    Write-Err "Docker Desktop can dang chay."
}
Write-Ok "Docker Desktop: chay"
Write-Host "  Docker Compose: $cdp" -ForegroundColor Gray

# ============================================================
# 2. Check .env
# ============================================================
Write-Step "Kiem tra cau hinh .env"
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Warn ".env chua co. Tao tu .env.example..."
        Copy-Item ".env.example" ".env"
        Write-Host ""
        Write-Host "  VUI LONG MO FILE .env VA DIEN THONG TIN:" -ForegroundColor Yellow
        Write-Host "  - JWT_SECRET: chuoi ngau nhien >= 32 ky tu" -ForegroundColor Gray
        Write-Host "    Sinh: node -e `"console.log(require('crypto').randomBytes(48).toString('base64url'))`"" -ForegroundColor Gray
        Write-Host "  - POSTGRES_PASSWORD: mat khau manh" -ForegroundColor Gray
        Write-Host "  - CORS_ORIGINS: dia chi may (VD: http://localhost:8080)" -ForegroundColor Gray
        Write-Host ""
        Write-Err "Da tao .env tu .env.example. Vui long mo file, dien day du, va chay lai."
    } else {
        Write-Err ".env va .env.example deu khong tim thay. Copy day du thu muc du an."
    }
}

# Check JWT_SECRET length
$envRaw = Get-Content ".env" -Raw
$jwtMatch = [regex]::Match($envRaw, 'JWT_SECRET=(.+)')
$jwtSecret = $jwtMatch.Groups[1].Value.Trim()
if ($jwtSecret.Length -lt 32) {
    Write-Host ""
    Write-Host "  JWT_SECRET phai co it nhat 32 ky tu. Sinh nhanh:" -ForegroundColor Yellow
    Write-Host "    node -e `"console.log(require('crypto').randomBytes(48).toString('base64url'))`"" -ForegroundColor Gray
    Write-Host ""
    Write-Err "JWT_SECRET qua ngan. Mo .env, sua dong JWT_SECRET, va chay lai."
}
Write-Ok ".env OK"

# ============================================================
# 3. Create directories
# ============================================================
Write-Step "Tao thu muc can thiet"
$uploads = Join-Path $ProjectRoot "backend\uploads"
$docs    = Join-Path $uploads "documents"
$wf      = Join-Path $uploads "workflow"
foreach ($d in @($uploads, $docs, $wf)) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
    }
}
Write-Ok "backend/uploads/* OK"

# ============================================================
# 4. Load Docker images
# ============================================================
Write-Step "Load Docker images"

$feTar = $null; $beTar = $null

# Find .tar files
foreach ($f in Get-ChildItem -Path $ProjectRoot -Filter "*.tar" -File) {
    $n = $f.Name.ToLower()
    if ($n -match "frontend" -and $n -match "fastdeploy") { $feTar = $f.FullName }
    if ($n -match "backend"  -and $n -match "fastdeploy") { $beTar = $f.FullName }
}
if (-not $feTar) { $feTar = Get-ChildItem -Path $ProjectRoot -Filter "*frontend*.tar" -File | Select-Object -First 1 -ExpandProperty FullName }
if (-not $beTar) { $beTar = Get-ChildItem -Path $ProjectRoot -Filter "*backend*.tar"  -File | Select-Object -First 1 -ExpandProperty FullName }

# Image names from .env
$feMatch = [regex]::Match($envRaw, 'FRONTEND_IMAGE=(.+)')
$beMatch = [regex]::Match($envRaw, 'BACKEND_IMAGE=(.+)')
$feImg   = if ($feMatch.Success) { $feMatch.Groups[1].Value.Trim() } else { "asms-frontend:latest" }
$beImg   = if ($beMatch.Success) { $beMatch.Groups[1].Value.Trim() } else { "asms-backend:latest" }

# Load .tar if available
if ($feTar -and (Test-Path $feTar)) {
    Write-Host "  Load frontend from: $feTar" -ForegroundColor Gray
    docker load -i $feTar 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Ok "Frontend loaded from tar" }
    else { Write-Warn "Load frontend failed" }
}
if ($beTar -and (Test-Path $beTar)) {
    Write-Host "  Load backend from: $beTar" -ForegroundColor Gray
    docker load -i $beTar 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Ok "Backend loaded from tar" }
    else { Write-Warn "Load backend failed" }
}

# Check if image exists, build if not
$feExists = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -eq $feImg }
$beExists = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -eq $beImg }

if (-not $feExists) {
    Write-Host "  Build frontend from source..." -ForegroundColor Yellow
    docker build -t $feImg . -f Dockerfile 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Ok "Frontend built: $feImg" }
    else { Write-Err "Build frontend failed." }
} else {
    Write-Ok "Frontend image: $feImg (already exists)"
}

if (-not $beExists) {
    Write-Host "  Build backend from source..." -ForegroundColor Yellow
    docker build -t $beImg ./backend -f backend/Dockerfile 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Ok "Backend built: $beImg" }
    else { Write-Err "Build backend failed." }
} else {
    Write-Ok "Backend image: $beImg (already exists)"
}

# ============================================================
# 5. Stop old containers + reset DB volume
# ============================================================
Write-Step "Xoa container cu"
if ($cdp -eq "v2") { docker compose down -v 2>$null }
else               { docker-compose down -v 2>$null }
Write-Ok "Container cu da xoa"

# ============================================================
# 6. Start all containers
# ============================================================
Write-Step "Khoi dong PostgreSQL + Backend + Frontend"
if ($cdp -eq "v2") { docker compose up -d 2>$null }
else               { docker-compose up -d 2>$null }
if ($LASTEXITCODE -ne 0) { Write-Err "docker compose up failed." }
Write-Ok "3 container dang chay"

# ============================================================
# 7. Wait for backend healthy
# ============================================================
Write-Step "Doi backend san sang"
$bePortMatch = [regex]::Match($envRaw, 'BACKEND_PORT=(\d+)')
$bePort = if ($bePortMatch.Success) { $bePortMatch.Groups[1].Value } else { "4001" }
$healthUrl = "http://localhost:${bePort}/api/v1/health"

$backendReady = $false
for ($i = 1; $i -le 45; $i++) {
    Start-Sleep 2
    try {
        $h = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3 -ErrorAction Stop
        if ($h.success -and $h.data.status -eq "ok") {
            Write-Ok "Backend ready sau $(( $i * 2 )) giay."
            $backendReady = $true
            break
        }
    } catch { }
}

if (-not $backendReady) {
    Write-Warn "Backend chua ready sau 90s. Xem log:"
    Write-Host "  docker compose logs -f backend" -ForegroundColor Gray
}

# ============================================================
# 8. Prisma migrate deploy
# ============================================================
Write-Step "Dong bo schema database (Prisma migrate)"
if ($cdp -eq "v2") { docker compose exec -T backend npx prisma migrate deploy 2>$null }
else               { docker-compose exec -T backend npx prisma migrate deploy 2>$null }
Write-Ok "Schema da dong bo"

# ============================================================
# 9. Bootstrap auth + workflows
# ============================================================
Write-Step "Tao tai khoan + workflows"
if ($cdp -eq "v2") { docker compose exec -T backend npm run bootstrap:auth 2>$null }
else               { docker-compose exec -T backend npm run bootstrap:auth 2>$null }
Write-Ok "5 tai khoan mau da tao"

# ============================================================
# 10. Seed demo data
# ============================================================
Write-Step "Nap du lieu mau"
if ($cdp -eq "v2") { docker compose exec -T backend npm run seed:demo 2>$null }
else               { docker-compose exec -T backend npm run seed:demo 2>$null }
Write-Ok "Du lieu mau da nap"

# ============================================================
# 11. Import RBAC
# ============================================================
$rbacFile = Join-Path $ProjectRoot "config\role-permissions-vtx.template.json"
if (Test-Path $rbacFile) {
    Write-Step "Nap ma tran phan quyen RBAC"
    node scripts/import-role-permissions.mjs $rbacFile 2>$null
    Write-Ok "RBAC da import"
}

# ============================================================
# 12. Verify login
# ============================================================
Write-Step "Xac minh dang nhap"
try {
    $login = Invoke-RestMethod -Uri "http://localhost:${bePort}/api/v1/auth/login" `
        -Method POST -ContentType "application/json" `
        -Body '{"email":"admin@demo.local","password":"Password123!"}' -TimeoutSec 5
    if ($login.success) {
        Write-Ok "Dang nhap thanh cong"
    } else {
        Write-Warn "Dang nhap that bai: $($login.message)"
    }
} catch {
    Write-Warn "Khong the kiem tra login: $($_.Exception.Message)"
}

# ============================================================
# Done
# ============================================================
$fePortMatch2 = [regex]::Match($envRaw, 'FRONTEND_PORT=(\d+)')
$fePort = if ($fePortMatch2.Success) { $fePortMatch2.Groups[1].Value } else { "8080" }

Write-Host ""
Write-Host "  ==============================================" -ForegroundColor Green
Write-Host "     CAI DAT HOAN TAT" -ForegroundColor Green
Write-Host "  ==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Mo trinh duyet:" -ForegroundColor Yellow
Write-Host "    http://localhost:$fePort/" -ForegroundColor White
Write-Host ""
Write-Host "  Tai khoan mau:" -ForegroundColor Yellow
Write-Host "    admin@demo.local     / Password123!" -ForegroundColor White
Write-Host "    manager@demo.local  / Password123!" -ForegroundColor White
Write-Host "    technician@demo.local / Password123!" -ForegroundColor White
Write-Host "    viewer@demo.local   / Password123!" -ForegroundColor White
Write-Host "    sales@demo.local    / Password123!" -ForegroundColor White
Write-Host ""
Write-Host "  Lenh su dung sau nay:" -ForegroundColor Yellow
Write-Host "    scripts\start.ps1         Bat he thong" -ForegroundColor Gray
Write-Host "    scripts\stop.ps1          Tat he thong" -ForegroundColor Gray
Write-Host "    scripts\fast-deploy.ps1    Deploy lai (reset)" -ForegroundColor Gray
Write-Host ""
