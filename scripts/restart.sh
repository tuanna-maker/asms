#!/usr/bin/env bash
# Restart nhanh ASMS — giữ nguyên dữ liệu (volume DB + uploads).
#
# Usage:
#   bash scripts/restart.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."
echo "=== Tắt & bật lại containers (giữ data) ==="
docker compose down
docker compose up -d
echo ""
echo "Đợi backend sẵn sàng..."
for i in $(seq 1 30); do
    sleep 2
    if curl -s -f http://localhost:4001/api/v1/health >/dev/null 2>&1; then
        echo "[OK] Backend sẵn sàng sau $((i*2))s."
        echo "Mở: http://localhost:8080/"
        exit 0
    fi
done
echo "[ERR] Backend chưa sẵn sàng. Kiểm tra: docker compose logs backend"
exit 1
