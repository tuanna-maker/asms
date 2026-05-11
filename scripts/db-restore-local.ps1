# Restore custom-format dump (-Fc) into local Postgres (docker-compose.local-db.yml).
param(
  [Parameter(Mandatory = $true)]
  [string]$DumpPath,
  [string]$PostgresUser = "asms",
  [string]$PostgresDb = "asms",
  [string]$ContainerName = "asms_postgres_local"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $DumpPath)) {
  Write-Error "Dump file not found: $DumpPath"
}

$leaf = Split-Path $DumpPath -Leaf
Write-Host "docker cp -> container..."
docker cp $DumpPath "${ContainerName}:/tmp/$leaf"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "pg_restore (exit code 1 may be OK if warnings only)..."
docker exec $ContainerName pg_restore -U $PostgresUser -d $PostgresDb --clean --if-exists --no-owner --no-acl "/tmp/$leaf"
$code = $LASTEXITCODE
docker exec $ContainerName rm -f "/tmp/$leaf"

if ($code -ne 0 -and $code -ne 1) {
  Write-Error "pg_restore failed with exit code $code"
}
Write-Host "Restore done."
