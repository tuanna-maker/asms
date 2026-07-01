# Cutover Runbook — Go-Live Production ASMS

> Thực hiện **ngoài giờ** với rollback plan. Tham chiếu [release-readiness.md](./release-readiness.md).

## Trước cutover (T-24h)

- [ ] UAT 5/5 vai trò ký trong [uat-signoff-production.md](./uat-signoff-production.md)
- [ ] A1/A2 VTX đã import (`import-role-permissions.mjs`)
- [ ] Backup staging đã drill restore
- [ ] `.env` production: `NODE_ENV=production`, `JWT_SECRET` ≥32 ký tự, `CORS_ORIGINS` đúng domain
- [ ] **Không** có `seed:demo` trên production

## Cutover (T0)

### 1. Deploy image

```bash
docker compose pull   # hoặc build local
docker compose up -d
```

Entrypoint backend tự chạy `prisma migrate deploy`.

### 2. Bootstrap auth (lần đầu)

```bash
docker exec -it asms_backend npm run bootstrap:auth
```

Tạo user admin + workflow baseline. **Đổi mật khẩu admin ngay.**

### 3. Tạo user thật

Qua UI Cài đặt → Người dùng hoặc API `/users`.

### 4. Smoke post-deploy

```bash
API_BASE=https://asms.example.com/api/v1 node scripts/post-deploy-smoke.mjs
```

Hoặc thủ công: [production-smoke.md](./production-smoke.md).

### 5. HTTPS

Mount `nginx.prod.conf` + cert TLS. Xác nhận redirect HTTP→HTTPS và HSTS.

## Sau cutover (Hypercare 2–4 tuần)

| Hạng mục | Tần suất |
|----------|----------|
| Health `/api/v1/health` | Uptime check 1 phút |
| Log 5xx | Hàng ngày |
| Backup `backup-production.sh` | Hàng ngày, retention 30 ngày |
| Disk uploads + DB | Cảnh báo >80% |

## Rollback

1. `docker compose down`
2. Restore DB từ backup gần nhất
3. Restore `uploads/` tar
4. Deploy image tag trước đó
5. Ghi incident + thông báo VTX

## Lệnh tham khảo

```bash
# Backup thủ công
DATABASE_URL=... ./scripts/backup-production.sh

# Kiểm tra migrate
docker exec asms_backend npx prisma migrate status
```
