<#
.SYNOPSIS
    ASMS Fast Deploy - Build + Save + Deploy BE + FE + DB bang 1 lenh.

.DESCRIPTION
    Che do Local : Build -> Save .tar -> Load & Up ngay tren may nay
    Che do Remote: Build -> Save .tar -> SCP len server -> SSH deploy

    Vi du:
      powershell scripts/fast-deploy.ps1                           # local, day du
      powershell scripts/fast-deploy.ps1 -SkipBuild               # local, dung .tar co san
      powershell scripts/fast-deploy.ps1 -Remote -ServerIP 192.168.1.50 -ServerUser admin  # remote

.PARAMETER Remote
    Che do deploy len may chu tu xa qua SSH.

.PARAMETER SkipBuild
    Bo qua buoc build. Dung khi da co .tar san.

.PARAMETER SkipSeed
    Bo qua seed du lieu demo sau khi deploy.

.PARAMETER Hard
    Xoa ca volume DB va thu muc uploads truoc khi up.

.PARAMETER SkipBackup
    Khong backup DB truoc khi reset.

.PARAMETER ServerIP
    Dia chi IP may chu remote (VD: 192.168.1.50).

.PARAMETER ServerUser
    Tai khoan SSH tren may chu remote (VD: administrator).

.PARAMETER RemotePath
    Duong dan thu muc tren may chu remote. Mac dinh: C:\asms

.PARAMETER FrontendImage
    Ten + tag frontend image. Mac dinh: asms-frontend:latest

.PARAMETER BackendImage
    Ten + tag backend image. Mac dinh: asms-backend:latest
#>

param(
    [switch] $Remote,
    [switch] $SkipBuild,
    [switch] $SkipSeed,
    [switch] $Hard,
    [switch] $SkipBackup,

    [string] $ServerIP,
    [string] $ServerUser,
    [string] $RemotePath = "C:\asms",

    [string] $FrontendImage = "asms-frontend:latest",
    [string] $BackendImage  = "asms-backend:latest"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
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
# Detect docker compose v2 (plugin) or v1 (standalone)
# ============================================================
$cdp = $null
$v2 = docker compose version 2>$null
if ($LASTEXITCODE -eq 0) { $cdp = "v2" }
else {
    $v1 = docker-compose version 2>$null
    if ($LASTEXITCODE -eq 0) { $cdp = "v1" }
}
if (-not $cdp) { Write-Err "Docker not found. Install Docker Desktop and restart." }
Write-Host "Docker Compose: $cdp" -ForegroundColor DarkGray

function Invoke-Dcp($args) {
    if ($cdp -eq "v2") { docker compose $args 2>$null } else { docker-compose $args 2>$null }
}

# ============================================================
# 0. Prerequisites check
# ============================================================
Write-Step "Prerequisites check"

# Docker running
$null = docker info 2>$null
if ($LASTEXITCODE -ne 0) { Write-Err "Docker Desktop is not running. Open Docker Desktop and wait for the whale icon to turn green." }

# .env
if (-not (Test-Path ".env")) {
    Write-Err ".env not found. Copy .env.example -> .env and fill in values (see doc section 09)."
}
Write-Ok ".env OK"

# uploads directories
$uploadsDir = Join-Path $ProjectRoot "backend\uploads"
if (-not (Test-Path $uploadsDir)) {
    New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null
    New-Item -ItemType Directory -Path "$uploadsDir\documents" -Force | Out-Null
    New-Item -ItemType Directory -Path "$uploadsDir\workflow" -Force | Out-Null
}
Write-Ok "Uploads directories OK"

# Load .env content
$envRaw = Get-Content ".env" -Raw

# JWT_SECRET length check
$jwtMatch = [regex]::Match($envRaw, 'JWT_SECRET=(.+)')
$jwtSecret = $jwtMatch.Groups[1].Value.Trim()
if ($jwtSecret.Length -lt 32) {
    Write-Err "JWT_SECRET must be at least 32 characters. Generate: node -e `"console.log(require('crypto').randomBytes(48).toString('base64url'))`""
}

# Image names from .env if not overridden
$feMatch = [regex]::Match($envRaw, 'FRONTEND_IMAGE=(.+)')
$beMatch = [regex]::Match($envRaw, 'BACKEND_IMAGE=(.+)')
if ($feMatch.Success -and $feMatch.Groups[1].Value.Trim()) { $FrontendImage = $feMatch.Groups[1].Value.Trim() }
if ($beMatch.Success -and $beMatch.Groups[1].Value.Trim()) { $BackendImage  = $beMatch.Groups[1].Value.Trim() }

# Ports
$fePortMatch = [regex]::Match($envRaw, 'FRONTEND_PORT=(\d+)')
$bePortMatch = [regex]::Match($envRaw, 'BACKEND_PORT=(\d+)')
$fePort = if ($fePortMatch.Success) { $fePortMatch.Groups[1].Value } else { "8080" }
$bePort = if ($bePortMatch.Success) { $bePortMatch.Groups[1].Value } else { "4001" }

Write-Host "Frontend image: $FrontendImage" -ForegroundColor DarkGray
Write-Host "Backend  image: $BackendImage"   -ForegroundColor DarkGray
Write-Host "Frontend port: $fePort"          -ForegroundColor DarkGray
Write-Host "Backend  port: $bePort"           -ForegroundColor DarkGray

# ============================================================
# 1. Build Docker Images
# ============================================================
if (-not $SkipBuild) {
    Write-Step "Step 1 - Build Docker Images"

    # Frontend (root Dockerfile -> nginx SPA)
    Write-Host "  Building: $FrontendImage" -ForegroundColor Gray
    docker build -t $FrontendImage . -f Dockerfile
    if ($LASTEXITCODE -ne 0) { Write-Err "Frontend build failed." }
    Write-Ok "Frontend: $FrontendImage"

    # Backend (backend/Dockerfile -> Node.js)
    Write-Host "  Building: $BackendImage" -ForegroundColor Gray
    docker build -t $BackendImage ./backend -f backend/Dockerfile
    if ($LASTEXITCODE -ne 0) { Write-Err "Backend build failed." }
    Write-Ok "Backend: $BackendImage"
} else {
    Write-Host "[SKIP] Build step (using existing .tar)" -ForegroundColor Yellow
}

# ============================================================
# 2. Save Images to .tar
# ============================================================
Write-Step "Step 2 - Save Images to .tar"
$feTar = "asms-frontend-fastdeploy.tar"
$beTar = "asms-backend-fastdeploy.tar"

Write-Host "  Save $FrontendImage -> $feTar" -ForegroundColor Gray
docker save -o $feTar $FrontendImage
if ($LASTEXITCODE -ne 0) { Write-Err "Save frontend .tar failed." }

Write-Host "  Save $BackendImage -> $beTar" -ForegroundColor Gray
docker save -o $beTar $BackendImage
if ($LASTEXITCODE -ne 0) { Write-Err "Save backend .tar failed." }

$feSize = [math]::Round((Get-Item $feTar).Length / 1MB, 1)
$beSize = [math]::Round((Get-Item $beTar).Length / 1MB, 1)
Write-Ok "Frontend .tar: $feSize MB"
Write-Ok "Backend  .tar: $beSize MB"

# ============================================================
# 3. Deploy
# ============================================================
if ($Remote) {
    # ----------------------------------------------------
    # Remote deploy: SCP -> SSH -> load & up on server
    # ----------------------------------------------------
    if (-not $ServerIP -or -not $ServerUser) {
        Write-Err "Remote mode requires -ServerIP and -ServerUser. Example: -ServerIP 192.168.1.50 -ServerUser administrator"
    }

    Write-Step "Step 3 - Deploy to remote server ($ServerIP)"

    # Ensure remote directory exists
    Write-Host "  SSH: ensure remote directory exists..." -ForegroundColor Gray
    ssh $ServerUser@$ServerIP "if not exist `"$RemotePath`" mkdir `"$RemotePath`""
    if ($LASTEXITCODE -ne 0) { Write-Err "SSH: failed to create remote directory." }

    # Files to copy
    $remoteFiles = @(
        (Resolve-Path $feTar).Path,
        (Resolve-Path $beTar).Path,
        (Resolve-Path ".env").Path,
        (Resolve-Path "docker-compose.yml").Path,
        (Resolve-Path "scripts\reset-and-install.ps1").Path,
        (Resolve-Path "config\role-permissions-vtx.template.json").Path
    )

    foreach ($f in $remoteFiles) {
        $fname = Split-Path $f -Leaf
        Write-Host "  SCP: $fname" -ForegroundColor Gray
        scp $f "${ServerUser}@${ServerIP}:${RemotePath}\${fname}"
        if ($LASTEXITCODE -ne 0) { Write-Err "SCP $fname failed." }
    }
    Write-Ok "All files copied to $ServerIP"

    # Build seed command
    if ($SkipSeed) {
        $seedCmd = "echo Skipping seed"
    } else {
        $seedCmd = "docker compose exec -T backend npm run seed:demo"
    }

    # SSH: load images + start containers + init DB
    Write-Host "  SSH: load images + start containers..." -ForegroundColor Gray
    $remoteScript = @(
        "cd $RemotePath",
        "docker load -i asms-frontend-fastdeploy.tar",
        "docker load -i asms-backend-fastdeploy.tar",
        "docker compose down -v",
        "docker compose up -d",
        "timeout /t 25 /nobreak > nul",
        "docker compose exec -T backend npx prisma migrate deploy",
        "docker compose exec -T backend npm run bootstrap:auth",
        $seedCmd
    ) -join " && "

    ssh $ServerUser@$ServerIP $remoteScript
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Remote deploy failed. SSH to server and check: docker compose logs backend"
    }

    Write-Ok "Deploy to $ServerIP completed"

} else {
    # ----------------------------------------------------
    # Local deploy
    # ----------------------------------------------------
    Write-Step "Step 3 - Deploy locally (Load + Up)"

    # 3a. Backup DB if running
    if (-not $SkipBackup) {
        $pgRunning = docker ps --format "{{.Names}}" | Where-Object { $_ -match "asms_postgres" }
        if ($pgRunning) {
            $ts = Get-Date -Format "yyyyMMdd_HHmmss"
            $backupDir = Join-Path $ProjectRoot "backups"
            if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
            $backupFile = Join-Path $backupDir "asms_backup_${ts}.sql"
            Write-Host "  Backup DB -> $backupFile" -ForegroundColor Gray
            docker compose exec -T postgres pg_dump -U asms -d asms > $backupFile 2>$null
            if ($LASTEXITCODE -eq 0) {
                $bs = [math]::Round((Get-Item $backupFile).Length / 1MB, 1)
                Write-Ok "DB backup: $backupFile ($bs MB)"
            } else {
                Write-Warn "DB backup failed (DB may be empty)"
            }
        }
    }

    # 3b. Load images
    Write-Host "  Load $feTar" -ForegroundColor Gray
    docker load -i $feTar | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Err "Load frontend image failed." }
    Write-Ok "Loaded: $FrontendImage"

    Write-Host "  Load $beTar" -ForegroundColor Gray
    docker load -i $beTar | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Err "Load backend image failed." }
    Write-Ok "Loaded: $BackendImage"

    # 3c. Reset containers
    Write-Host "  Reset containers..." -ForegroundColor Gray
    Invoke-Dcp "down -v"
    if ($Hard) {
        if (Test-Path $uploadsDir) {
            Remove-Item -Recurse -Force $uploadsDir
            New-Item -ItemType Directory -Path "$uploadsDir\documents" -Force | Out-Null
            New-Item -ItemType Directory -Path "$uploadsDir\workflow" -Force | Out-Null
        }
        Write-Ok "Hard reset done (DB volume + uploads deleted)."
    } else {
        Write-Ok "DB volume deleted (uploads kept)."
    }

    # 3d. Up
    Write-Host "  docker compose up -d" -ForegroundColor Gray
    Invoke-Dcp "up -d"
    Write-Ok "3 containers running: asms_postgres, asms_backend, asms_frontend"

    # 3e. Wait for backend healthy
    Write-Step "Step 4 - Wait for backend to be healthy"
    $healthUrl = "http://localhost:${bePort}/api/v1/health"
    $ready = $false
    for ($i = 1; $i -le 30; $i++) {
        Start-Sleep 2
        try {
            $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3 -ErrorAction Stop
            if ($health.success -and $health.data.status -eq "ok") {
                Write-Ok "Backend healthy after $(( $i * 2 )) seconds."
                $ready = $true
                break
            }
        } catch { }
    }
    if (-not $ready) {
        Write-Warn "Backend not healthy after 60s. Check: docker compose logs backend"
    }

    # 3f. Prisma migrate
    Write-Step "Step 5 - Prisma migrate deploy"
    Invoke-Dcp "exec -T backend npx prisma migrate deploy" | Out-Null
    Write-Ok "Schema synchronized."

    # 3g. Bootstrap auth
    Write-Step "Step 6 - Bootstrap auth + workflows"
    Invoke-Dcp "exec -T backend npm run bootstrap:auth" | Out-Null
    Write-Ok "5 sample users created."

    # 3h. Seed demo data
    if (-not $SkipSeed) {
        Write-Step "Step 7 - Seed demo data"
        Invoke-Dcp "exec -T backend npm run seed:demo" | Out-Null
        Write-Ok "Demo data loaded."
    } else {
        Write-Host "[SKIP] Seed demo data." -ForegroundColor Yellow
    }

    # 3i. Import RBAC
    $rbacFile = Join-Path $ProjectRoot "config\role-permissions-vtx.template.json"
    if (Test-Path $rbacFile) {
        Write-Step "Step 8 - Import RBAC permissions"
        node scripts/import-role-permissions.mjs $rbacFile | Out-Null
        Write-Ok "RBAC matrix imported."
    }

    # 3j. Verify login
    Write-Step "Step 9 - Verify login"
    try {
        $login = Invoke-RestMethod -Uri "http://localhost:${bePort}/api/v1/auth/login" `
            -Method POST -ContentType "application/json" `
            -Body '{"email":"admin@demo.local","password":"Password123!"}' -TimeoutSec 5
        if ($login.success) {
            Write-Ok "Login OK: admin@demo.local / Password123!"
        } else {
            Write-Warn "Login failed: $($login.message)"
        }
    } catch {
        Write-Warn "Could not verify login: $($_.Exception.Message)"
    }
}

# ============================================================
# 4. Cleanup temp .tar files
# ============================================================
if (-not $Remote) {
    Write-Step "Cleanup temp files"
    Remove-Item $feTar, $beTar -ErrorAction SilentlyContinue
    Write-Ok "Deleted: $feTar, $beTar"
}

# ============================================================
# Summary
# ============================================================
Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "  DEPLOY COMPLETE" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
if ($Remote) {
    Write-Host "  Server : $ServerIP" -ForegroundColor Cyan
}
Write-Host "  Frontend: http://localhost:$fePort/"          -ForegroundColor Cyan
Write-Host "  Backend : http://localhost:$bePort/api/v1"   -ForegroundColor Cyan
Write-Host "  DB      : postgres:5432 (inside container only)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Demo accounts:" -ForegroundColor Yellow
Write-Host "    admin@demo.local     / Password123!" -ForegroundColor White
Write-Host "    manager@demo.local  / Password123!" -ForegroundColor White
Write-Host "    technician@demo.local / Password123!" -ForegroundColor White
Write-Host "    viewer@demo.local   / Password123!" -ForegroundColor White
Write-Host "    sales@demo.local    / Password123!" -ForegroundColor White
Write-Host ""
Write-Host "  Post-deploy commands:" -ForegroundColor Yellow
Write-Host "    docker compose up -d                  # Start" -ForegroundColor Gray
Write-Host "    docker compose down                  # Stop" -ForegroundColor Gray
Write-Host "    docker compose logs -f backend        # View logs" -ForegroundColor Gray
Write-Host "    scripts/fast-deploy.ps1 -Hard         # Full reset" -ForegroundColor Gray
