#!/bin/sh
set -e

echo "Running database migrations..."
# Chạy migrate 1 lần. Nếu fail → thoát với exit code 1 thay vì boot backend với DB trống
# (lỗi cũ: || true + continue khiến server.js cố seedAuthUsers vào bảng chưa tồn tại → crash loop).
npx prisma migrate deploy

echo "Starting backend..."
exec node dist/main.js
