# Restart nhanh ASMS — giữ nguyên dữ liệu (volume DB + uploads).
# Tương thích cả Windows PowerShell 5 và PowerShell 7.
#
# Usage: powershell scripts/restart.ps1
#
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "=== Tắt & bật lại containers (giữ data) ===" -ForegroundColor Cyan
docker compose down
docker compose up -d | Out-Null
Write-Host "Đợi backend sẵn sàng..." -ForegroundColor Cyan
for ($i = 1; $i -le 30; $i++) {
    Start-Sleep 2
    try {
        $h = Invoke-RestMethod -Uri "http://localhost:4001/api/v1/health" -TimeoutSec 3 -ErrorAction Stop
        if ($h.success) {
            Write-Host "[OK] Backend sẵn sàng sau $($i*2)s." -ForegroundColor Green
            Write-Host "Mở: http://localhost:8080/" -ForegroundColor Cyan
            exit 0
        }
    } catch { }
}
Write-Host "[ERR] Backend chưa sẵn sàng. Kiểm tra: docker compose logs backend" -ForegroundColor Red
exit 1
