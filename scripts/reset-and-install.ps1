# Reset + install ASMS — chạy trong PowerShell tại thư mục gốc dự án (d:\PJ\asms).
# Đảm bảo Docker Desktop đang chạy và file .env đã được điền đầy đủ.
#
# Usage:
#   powershell scripts/reset-and-install.ps1           # reset mềm (giữ uploads)
#   powershell scripts/reset-and-install.ps1 -Hard     # xóa luôn uploads
#   powershell scripts/reset-and-install.ps1 -SkipSeed # bỏ seed demo (chỉ auth + định nghĩa)
#
# Tương thích cả Windows PowerShell 5 và PowerShell 7 (pwsh).
#
# Mô tả các bước:
#   1) Tắt toàn bộ container, xóa volume DB (giữ uploads nếu không -Hard).
#   2) Khởi động lại bằng docker compose.
#   3) Đợi backend sẵn sàng (healthcheck).
#   4) Chạy prisma migrate deploy.
#   5) Bootstrap auth + định nghĩa + workflows.
#   6) (Mặc định) Seed dữ liệu demo — KHÁCH HÀNG, HĐ, vật tư, SP, bàn giao, BH, ...
#   7) Import ma trận phân quyền từ config/role-permissions-vtx.template.json.
#   8) Verify backend health + login OK.
#
# Lần tiếp theo (không reset) chỉ cần chạy 2 lệnh:
#   docker compose up -d
#   docker compose exec backend npm run seed:demo    # chỉ khi DB mới
#
param(
    [switch]$Hard,
    [switch]$SkipSeed
)

# Tự phát hiện PowerShell 7 (pwsh) hay Windows PowerShell 5 (powershell)
$psCmd = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }
Write-Host "Sử dụng: $psCmd (tự phát hiện)" -ForegroundColor DarkGray

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $ProjectRoot

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "[ERR] $msg" -ForegroundColor Red; throw $msg }

# 0. Kiểm tra .env
if (-not (Test-Path ".env")) {
    Write-Err "Chưa có file .env. Hãy copy từ .env.example và điền thông tin (xem mục §09 trong tài liệu)."
}

# 0a. Kiểm tra image local có tồn tại
$envContent = Get-Content ".env"
$frontendImage = ($envContent | Select-String '^FRONTEND_IMAGE=(.+)$').Matches[0].Groups[1].Value
$backendImage = ($envContent | Select-String '^BACKEND_IMAGE=(.+)$').Matches[0].Groups[1].Value
foreach ($img in @($frontendImage, $backendImage)) {
    $exists = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -eq $img }
    if (-not $exists) {
        Write-Err "Image '$img' chưa có trong Docker local. Chạy 'docker load -i <ten-file>.tar' (xem §08) hoặc 'docker build -t $img .' (xem tài liệu dev)."
    }
}
Write-Ok "Images OK: $frontendImage, $backendImage"

# 1. Reset
Write-Step "Bước 1 — Dừng + xóa container, volume database"
if ($Hard) {
    docker compose down -v
    if (Test-Path "backend/uploads") { Remove-Item -Recurse -Force "backend/uploads" }
    Write-Ok "Đã xóa volume DB và thư mục uploads."
} else {
    docker compose down -v
    Write-Ok "Đã xóa volume DB (giữ uploads)."
}

# 2. Up
Write-Step "Bước 2 — Khởi chạy hệ thống (docker compose up -d)"
docker compose up -d | Out-Null
Write-Ok "3 container đang chạy: asms_postgres, asms_backend, asms_frontend."

# 3. Wait backend healthy
Write-Step "Bước 3 — Đợi backend sẵn sàng (tối đa 60 giây)"
$ready = $false
for ($i = 1; $i -le 30; $i++) {
    Start-Sleep 2
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:4001/api/v1/health" -TimeoutSec 3 -ErrorAction Stop
        if ($health.success -and $health.data.status -eq "ok") {
            Write-Ok "Backend health OK sau $(( $i * 2 )) giây."
            $ready = $true
            break
        }
    } catch {
        # chưa sẵn sàng
    }
}
if (-not $ready) { Write-Err "Backend chưa sẵn sàng sau 60 giây. Kiểm tra: docker compose logs backend" }

# 4. Migrate
Write-Step "Bước 4 — Chạy prisma migrate deploy"
docker compose exec -T backend npx prisma migrate deploy | Out-Null
Write-Ok "Schema đã đồng bộ."

# 5. Bootstrap auth
Write-Step "Bước 5 — Bootstrap auth + định nghĩa + workflows"
docker compose exec -T backend npm run bootstrap:auth | Out-Null
Write-Ok "Đã tạo 5 user mẫu (admin/manager/technician/viewer/sales @demo.local) + định nghĩa + workflows."

# 6. Seed demo (customers, contracts, materials, ...)
if (-not $SkipSeed) {
    Write-Step "Bước 6 — Seed dữ liệu mô phỏng (khách hàng, hợp đồng, vật tư, sản phẩm, ...)"
    docker compose exec -T backend npm run seed:demo | Out-Null
    Write-Ok "Đã nạp bộ dữ liệu demo đầy đủ."
} else {
    Write-Host "[SKIP] Bỏ seed:demo (do -SkipSeed). CSDL chỉ có user + định nghĩa + workflows." -ForegroundColor Yellow
}

# 7. Import role permissions
$templateFile = "config/role-permissions-vtx.template.json"
if (Test-Path $templateFile) {
    Write-Step "Bước 7 — Import ma trận phân quyền ($templateFile)"
    node scripts/import-role-permissions.mjs $templateFile | Out-Null
    Write-Ok "Đã cập nhật phân quyền cho 5 vai trò."
} else {
    Write-Host "[SKIP] Không tìm thấy $templateFile — bỏ qua bước import role permissions." -ForegroundColor Yellow
}

# 8. Verify
Write-Step "Bước 8 — Verify"
$login = Invoke-RestMethod -Uri "http://localhost:4001/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@demo.local","password":"Password123!"}'
if ($login.success) {
    Write-Ok "Đăng nhập OK với admin@demo.local / Password123!"
} else {
    Write-Err "Đăng nhập thất bại: $($login.message)"
}

$customers = Invoke-RestMethod -Uri "http://localhost:4001/api/v1/customers" -Headers @{Authorization = "Bearer $($login.data.token)"}
Write-Host "Số khách hàng trong DB: $($customers.data.Count)" -ForegroundColor Gray
if ($customers.data.Count -gt 0) {
    Write-Ok "Dữ liệu mẫu đã sẵn sàng để dùng thử."
} else {
    Write-Host "[CẢNH BÁO] Bảng customers trống — hãy tạo khách hàng đầu tiên hoặc chạy lại bước 6." -ForegroundColor Yellow
}

Write-Host "`n=== HOÀN TẤT ===" -ForegroundColor Green
Write-Host "Mở trình duyệt: http://localhost:8080/" -ForegroundColor Cyan
Write-Host "Tài khoản demo: admin@demo.local / Password123!" -ForegroundColor Cyan
Write-Host "`nĐổi mật khẩu admin NGAY sau khi đăng nhập lần đầu (xem tài liệu §11.1)." -ForegroundColor Yellow
