# ASMS - Scripts ho tro cai dat

## install.ps1 — One-Click Installer (Khuyen nghi nhat)

**Muc dich:** Cai dat day du ASMS chi voi Docker Desktop. Chi can copy thu muc du an vao may moi, mo Docker, chay 1 file.

**Tren may moi:**
1. Copy thu muc du an `asms/` vao `C:\asms`
2. Mo Docker Desktop, doi ca voi chuyen XANH
3. Chay:
```powershell
powershell -ExecutionPolicy Bypass -File C:\asms\scripts\install.ps1
```

Script tu dong:
  1) Kiem tra Docker Desktop
  2) Tao thu muc uploads
  3) Load Docker images tu .tar (neu co) hoac build tu source
  4) Xoa container cu
  5) Up PostgreSQL + Backend + Frontend
  6) Prisma migrate deploy
  7) Bootstrap auth + workflows
  8) Seed du lieu mau
  9) Import RBAC
  10) Verify login

**Sau khi cai xong:**

| Lenh | Tac dung |
|------|----------|
| `scripts\start.ps1` | Bat ASMS |
| `scripts\stop.ps1` | Tat ASMS |
| `scripts\fast-deploy.ps1` | Deploy lai (reset) |
| `scripts\fast-deploy.ps1 -Hard` | Reset sach (xoa DB + uploads) |
| `scripts\fast-deploy.ps1 -SkipBuild` | Deploy nhanh (khong build) |

## reset-and-install.ps1 / reset-and-install.sh

**Mục đích:** Xóa sạch và cài đặt lại ASMS từ đầu theo đúng quy trình trong tài liệu §10 (nhưng tự động hóa + thêm 2 bước quan trọng còn thiếu: `seed:demo` và `import-role-permissions`).

**Các bước script tự chạy:**

1. Tắt container, xóa volume DB (giữ uploads nếu không dùng `-Hard` / `--hard`)
2. `docker compose up -d`
3. Đợi backend health OK (tối đa 60s)
4. `prisma migrate deploy`
5. `npm run bootstrap:auth` — tạo 5 user demo + định nghĩa + workflows
6. `npm run seed:demo` — tạo customers, contracts, materials, products, handovers, warranties, ... (bỏ qua với `-SkipSeed` / `--skip-seed`)
7. `node scripts/import-role-permissions.mjs config/role-permissions-vtx.template.json` — nạp ma trận phân quyền
8. Verify: login OK + có customers

**Sử dụng:**

```powershell
# Windows (PowerShell 7+)
pwsh scripts/reset-and-install.ps1

# Reset cứng (xóa luôn uploads)
pwsh scripts/reset-and-install.ps1 -Hard

# Bỏ seed demo
pwsh scripts/reset-and-install.ps1 -SkipSeed
```

```bash
# Linux / macOS
bash scripts/reset-and-install.sh
bash scripts/reset-and-install.sh --hard
bash scripts/reset-and-install.sh --skip-seed
```

## restart.ps1 / restart.sh

**Mục đích:** Restart nhanh container mà **giữ nguyên dữ liệu** (volume DB + uploads).

```powershell
pwsh scripts/restart.ps1
```

```bash
bash scripts/restart.sh
```

## Tại sao cần `seed:demo` riêng?

`bootstrap:auth` chỉ tạo **user + định nghĩa + workflows + clauses**. Không tạo **customers / contracts / materials / products**. Nếu bỏ qua bước này:

- Bảng `customers` trống → mọi POST tạo hợp đồng fail với `Foreign key constraint violated: contracts_customer_id_fkey`
- Bảng `materials` trống → không tạo được vật tư demo
- Tương tự cho products, handovers, warranties, training, ...

`seed:demo` chạy thêm `seedDemoBusinessData()` để nạp bộ dữ liệu mô phỏng đầy đủ.

**Chỉ cần chạy `seed:demo` 1 lần** sau khi DB mới (lần đầu cài, hoặc sau `docker compose down -v`). Nếu chỉ restart container (`docker compose restart`) thì data vẫn còn — KHÔNG cần seed lại.
