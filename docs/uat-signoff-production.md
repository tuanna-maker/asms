# UAT Production — Biên bản nghiệm thu 5 vai trò

> Bổ sung cho [uat-checklist.md](./uat-checklist.md). Dùng trên **staging mirror production** trước cutover.

## Thông tin phiên UAT

| Trường | Giá trị |
|--------|---------|
| Môi trường | Staging / Pre-prod |
| URL | |
| Phiên bản build | |
| Ngày bắt đầu | |
| Ngày kết thúc | |
| Đại diện VTX | |
| Đại diện triển khai | |

## Tài khoản kiểm thử

| Vai trò | Email | Pass UAT | Người ký | Ngày |
|---------|-------|:--------:|----------|------|
| admin | | ☐ | | |
| manager | | ☐ | | |
| technician | | ☐ | | |
| sales | | ☐ | | |
| viewer | | ☐ | | |

> Sau `bootstrap:auth` trên staging: đổi mật khẩu ngay; không dùng `Password123!` trên production.

## Smoke tự động (chạy trước UAT thủ công)

```bash
# API smoke theo vai trò
node scripts/uat-role-smoke.mjs

# Toàn bộ UC API
node scripts/uc-smoke-test.mjs

# Dashboard đồng bộ dữ liệu
node scripts/dashboard-audit.mjs
```

Kỳ vọng: exit code `0` cho cả ba lệnh.

## Checklist theo vai trò (tóm tắt)

### admin
- [ ] Đăng nhập / đăng xuất / quản lý phiên
- [ ] Cài đặt: user, role, phân quyền, audit, hệ thống
- [ ] CRUD đầy đủ trên HĐ, BG, BH, SP, VT, KH, PA

### manager
- [ ] Menu đúng ma trận (có báo cáo, không vật tư vận hành nếu matrix quy định)
- [ ] Phê duyệt quy trình HĐ/BG/BH
- [ ] Xem nhật ký audit

### technician
- [ ] Không truy cập HĐ (menu + API 403)
- [ ] Thao tác BG, BH, VT theo matrix
- [ ] Không thấy nút tạo nơi không có quyền

### sales
- [ ] HĐ, KH, CRM, báo cáo, tài liệu
- [ ] Không truy cập VT/BH vận hành (theo matrix)
- [ ] CRM 360°: doanh thu, chi phí, HĐ, phản ánh

### viewer
- [ ] Chỉ đọc — không nút Tạo/Sửa/Xóa
- [ ] API ghi trả 403

## Đầu vào VTX (blocker nghiệp vụ)

| Mã | Trạng thái | Ghi chú |
|----|:----------:|---------|
| A1 — Quy trình BG/HL/BH | ☐ Nhận ☐ Triển khai | Xem [a1-workflow-vtx-guide.md](./a1-workflow-vtx-guide.md) |
| A2 — Excel phân quyền | ☐ Nhận ☐ Import | `node scripts/import-role-permissions.mjs config/role-permissions-vtx.template.json` |

## Kết luận

| Kết quả | ☐ Đạt — cho phép go-live | ☐ Chưa đạt — xử lý issue |
|---------|--------------------------|---------------------------|

**Danh sách issue còn lại:**

1.
2.

**Chữ ký phê duyệt go-live:**

| Vai trò | Họ tên | Chữ ký | Ngày |
|---------|--------|--------|------|
