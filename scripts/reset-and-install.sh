#!/usr/bin/env bash
# Reset & install ASMS — chạy trong bash tại thư mục gốc dự án (/opt/asms).
# Đảm bảo Docker đang chạy và file .env đã được điền đầy đủ.
#
# Usage:
#   bash scripts/reset-and-install.sh           # reset mềm (giữ uploads)
#   bash scripts/reset-and-install.sh --hard    # xóa luôn uploads
#   bash scripts/reset-and-install.sh --skip-seed # bỏ seed demo
#
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

HARD=0
SKIP_SEED=0
for arg in "$@"; do
    case "$arg" in
        --hard) HARD=1 ;;
        --skip-seed) SKIP_SEED=1 ;;
        *) echo "[ERR] Unknown arg: $arg"; exit 1 ;;
    esac
done

color() { printf "\033[%sm%s\033[0m\n" "$1" "$2"; }
step()   { color "1;36" ""; color "1;36" "=== $1 ==="; }
ok()     { color "0;32" "[OK] $1"; }
err()    { color "0;31" "[ERR] $1"; exit 1; }
warn()   { color "0;33" "[WARN] $1"; }

# 0. Kiểm tra .env
[ -f .env ] || err "Chưa có file .env. Hãy copy từ .env.example và điền thông tin (xem tài liệu §09)."

# 0a. Kiểm tra image local có tồn tại
FRONTEND_IMAGE=$(grep '^FRONTEND_IMAGE=' .env | cut -d= -f2-)
BACKEND_IMAGE=$(grep '^BACKEND_IMAGE=' .env | cut -d= -f2-)
for img in "$FRONTEND_IMAGE" "$BACKEND_IMAGE"; do
    if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -qx "$img"; then
        err "Image '$img' chưa có trong Docker local. Chạy 'docker load -i <ten-file>.tar' (xem §08) hoặc 'docker build -t $img .'"
    fi
done
ok "Images OK: $FRONTEND_IMAGE, $BACKEND_IMAGE"

# 1. Reset
step "Bước 1 — Dừng & xóa container, volume database"
if [ "$HARD" = "1" ]; then
    docker compose down -v
    rm -rf backend/uploads
    ok "Đã xóa volume DB và thư mục uploads."
else
    docker compose down -v
    ok "Đã xóa volume DB (giữ uploads)."
fi

# 2. Up
step "Bước 2 — Khởi chạy hệ thống"
docker compose up -d >/dev/null
ok "3 container đang chạy: asms_postgres, asms_backend, asms_frontend."

# 3. Wait backend healthy
step "Bước 3 — Đợi backend sẵn sàng (tối đa 60 giây)"
READY=0
for i in $(seq 1 30); do
    sleep 2
    if curl -s -f http://localhost:4001/api/v1/health >/dev/null 2>&1; then
        ok "Backend health OK sau $((i*2)) giây."
        READY=1
        break
    fi
done
[ "$READY" = "1" ] || err "Backend chưa sẵn sàng sau 60 giây. Kiểm tra: docker compose logs backend"

# 4. Migrate
step "Bước 4 — Chạy prisma migrate deploy"
docker compose exec -T backend npx prisma migrate deploy >/dev/null
ok "Schema đã đồng bộ."

# 5. Bootstrap auth
step "Bước 5 — Bootstrap auth + định nghĩa + workflows"
docker compose exec -T backend npm run bootstrap:auth >/dev/null
ok "Đã tạo 5 user mẫu (admin/manager/technician/viewer/sales @demo.local) + định nghĩa + workflows."

# 6. Seed demo
if [ "$SKIP_SEED" = "0" ]; then
    step "Bước 6 — Seed dữ liệu mô phỏng (khách hàng, hợp đồng, vật tư, sản phẩm, ...)"
    docker compose exec -T backend npm run seed:demo >/dev/null
    ok "Đã nạp bộ dữ liệu demo đầy đủ."
else
    warn "Bỏ seed:demo (do --skip-seed). CSDL chỉ có user + định nghĩa + workflows."
fi

# 7. Import role permissions
TEMPLATE="config/role-permissions-vtx.template.json"
if [ -f "$TEMPLATE" ]; then
    step "Bước 7 — Import ma trận phân quyền ($TEMPLATE)"
    node scripts/import-role-permissions.mjs "$TEMPLATE" >/dev/null
    ok "Đã cập nhật phân quyền cho 5 vai trò."
else
    warn "Không tìm thấy $TEMPLATE — bỏ qua bước import role permissions."
fi

# 8. Verify
step "Bước 8 — Verify"
LOGIN=$(curl -s -X POST http://localhost:4001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@demo.local","password":"Password123!"}')
TOKEN=$(echo "$LOGIN" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{console.log(JSON.parse(d).data.token||'')}catch{console.log('')} })")
if [ -n "$TOKEN" ]; then
    ok "Đăng nhập OK với admin@demo.local / Password123!"
else
    err "Đăng nhập thất bại: $LOGIN"
fi

CUST_COUNT=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4001/api/v1/customers | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{console.log(JSON.parse(d).data?.length||0)}catch{console.log(0)} })")
echo "Số khách hàng trong DB: $CUST_COUNT"
if [ "$CUST_COUNT" -gt 0 ]; then
    ok "Dữ liệu mẫu đã sẵn sàng để dùng thử."
else
    warn "Bảng customers trống — hãy tạo khách hàng đầu tiên hoặc chạy lại bước 6."
fi

color "0;32" ""
color "1;32" "=== HOÀN TẤT ==="
color "1;36" "Mở trình duyệt: http://localhost:8080/"
color "1;36" "Tài khoản demo: admin@demo.local / Password123!"
color "0;33" "Đổi mật khẩu admin NGAY sau khi đăng nhập lần đầu (xem tài liệu §11.1)."
