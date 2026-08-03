# SSH tunnel: localhost:5433 -> VPS Postgres 127.0.0.1:5432
# Chay o terminal rieng, giu cua so mo. Sau do chay: pnpm dev:all
#
# Dung: pwsh scripts/db-tunnel.ps1
#       pwsh scripts/db-tunnel.ps1 -LocalPort 5433

param(
  [string]$Host = '14.225.217.232',
  [string]$User = 'root',
  [int]$LocalPort = 5433,
  [int]$RemotePort = 5432
)

Write-Host "Mo tunnel: localhost:$LocalPort -> ${User}@${Host}:127.0.0.1:$RemotePort"
Write-Host "Nhap mat khau SSH khi duoc hoi. Giu terminal nay mo."
Write-Host ""
Write-Host "DATABASE_URL (backend/.env): postgresql://USER:PASS@localhost:$LocalPort/asms?schema=public"
Write-Host ""

ssh -N -L "${LocalPort}:127.0.0.1:${RemotePort}" "${User}@${Host}"
