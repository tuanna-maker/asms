#!/usr/bin/env bash
# Backup PostgreSQL + uploads volume for production.
# Cron example: 0 2 * * * /opt/asms/scripts/backup-production.sh
set -euo pipefail

ROOT="${ASMS_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

DB_FILE="$BACKUP_DIR/asms_db_${STAMP}.sql.gz"
UPLOADS_FILE="$BACKUP_DIR/asms_uploads_${STAMP}.tar.gz"

echo "Dumping database to $DB_FILE"
pg_dump "$DATABASE_URL" | gzip -9 > "$DB_FILE"

UPLOADS_PATH="${UPLOADS_PATH:-$ROOT/backend/uploads}"
if [[ -d "$UPLOADS_PATH" ]]; then
  echo "Archiving uploads to $UPLOADS_FILE"
  tar -czf "$UPLOADS_FILE" -C "$(dirname "$UPLOADS_PATH")" "$(basename "$UPLOADS_PATH")"
else
  echo "Uploads path not found: $UPLOADS_PATH (skipped)"
fi

find "$BACKUP_DIR" -type f -name 'asms_*' -mtime +"$RETENTION_DAYS" -delete

echo "Backup complete."
