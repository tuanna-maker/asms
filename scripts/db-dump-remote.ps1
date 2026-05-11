# Dump PostgreSQL từ DATABASE_URL trong file env (mặc định: .env ở root repo).
# Yêu cầu: Docker. Không cần cài pg_dump trên Windows.
# Output: backups/asms_remote_<timestamp>.dump (định dạng custom, phù hợp pg_restore)
param(
  [string]$SourceEnvFile = (Join-Path (Split-Path $PSScriptRoot -Parent) ".env"),
  [string]$OutDir = (Join-Path (Split-Path $PSScriptRoot -Parent) "backups")
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $SourceEnvFile)) {
  Write-Error "Không thấy file env: $SourceEnvFile"
}

$url = $null
Get-Content $SourceEnvFile | ForEach-Object {
  if ($_ -match '^\s*DATABASE_URL\s*=\s*(.+)\s*$') {
    $url = $Matches[1].Trim().Trim('"').Trim("'")
  }
}
if (-not $url) {
  Write-Error "Không tìm thấy DATABASE_URL trong $SourceEnvFile"
}

# pg_dump / libpq không chấp nhận ?schema=public (Prisma) — bỏ query string cho tiện ích client
if ($url -match "^([^?]+)(\?.*)$") {
  $url = $Matches[1]
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$leaf = "asms_remote_$stamp.dump"
$finalPath = Join-Path $OutDir $leaf
$containerTmp = "pgdump.dump" # tên cố định trong volume (tránh lỗi quoting PowerShell ↔ sh)

# Tránh lỗi quoting URL đặc biệt: đưa vào env file tạm cho container; file ra luôn tên cố định trong volume rồi đổi tên trên host
$tmpEnv = [System.IO.Path]::GetTempFileName()
try {
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($tmpEnv, "PGURL=$url", $utf8)
  Write-Host "Đang pg_dump (Docker) -> $finalPath"
  docker run --rm `
    --env-file $tmpEnv `
    -v "${OutDir}:/out" `
    postgres:16-alpine `
    sh -c 'pg_dump "$PGURL" -Fc -f /out/pgdump.dump'
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Remove-Item -LiteralPath $tmpEnv -Force -ErrorAction SilentlyContinue
}

$tmpOut = Join-Path $OutDir $containerTmp
if (Test-Path $tmpOut) {
  Move-Item -LiteralPath $tmpOut -Destination $finalPath -Force
}
Write-Host "Xong. File: $finalPath"
