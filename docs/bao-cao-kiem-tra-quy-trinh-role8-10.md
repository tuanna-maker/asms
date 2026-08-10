# Báo cáo kiểm tra lại: CRUD Quy trình & Role

| | |
|---|---|
| **Ngày kiểm tra lần đầu** | 2026-08-10 (sáng) |
| **Ngày kiểm tra lại** | 2026-08-10 ~14:48 (UTC+7) |
| **Cách kiểm tra** | Smoke API `backend/scripts/smoke-workflow-crud-roles.ts` + rà code UI/seed |
| **Kết luận** | **ĐẠT** — CRUD QT / gắn QT / ma trận role API ổn; 2 lỗi đã sửa trước đó vẫn còn hiệu lực |

Phạm vi: module **Quy trình**, gắn QT vào data test (coaching), quyền theo role `admin` / `manager` / `technician` / `viewer` / `sales`.

Tài khoản demo: `*@demo.local` / `Password123!`.

---

## 1. Kết quả kiểm tra lại (smoke API)

### 1.1 Đăng nhập theo role

| Role | Email | HTTP | Token |
|------|-------|------|-------|
| admin | admin@demo.local | 200 | Có |
| manager | manager@demo.local | 200 | Có |
| technician | technician@demo.local | 200 | Có |
| viewer | viewer@demo.local | 200 | Có |
| sales | sales@demo.local | 200 | Có |

### 1.2 CRUD quy trình & bước (admin)

| Hạng mục | HTTP | Ghi chú |
|----------|------|--------|
| POST tạo QT (`moduleKey: coaching`) | 200 | `wfId` tạo thành công |
| PUT sửa QT | 200 | Tên cập nhật OK |
| POST thêm bước | 200 | |
| PUT sửa bước | 200 | |
| DELETE xoá bước | 200 | |
| POST thêm lại bước | 200 | Để gắn instance |
| DELETE xoá QT (sau khi huỷ phiếu running) | 200 | |

### 1.3 Gắn quy trình (attach)

| Hạng mục | HTTP | Ghi chú |
|----------|------|--------|
| GET khóa coaching | 200 | Có data test |
| POST attach `moduleKey: coaching` | 200 | Tạo instance OK |
| POST attach QT coaching với `moduleKey: training` | **400** | Đúng thiết kế — không khớp nhóm |
| DELETE QT hệ thống | **400** | «Không thể xoá quy trình hệ thống…» — đúng |

### 1.4 API quyền theo role (list / create QT)

| Role | GET list | POST create | Kỳ vọng |
|------|----------|-------------|---------|
| admin | 200 | 200 | Cho phép |
| manager | 200 | 200 | Cho phép |
| technician | 200 | 200 | Cho phép |
| viewer | **403** | **403** | Từ chối |
| sales | **403** | **403** | Từ chối |

### 1.5 Snapshot quyền module (`/api/v1/role-permissions`)

| Role | quy-trinh | ban-giao | Ghi chú |
|------|-----------|----------|---------|
| admin | CRUD đầy đủ | CRUD đầy đủ | |
| manager | R/C/U; **delete = false** | R/C/U; delete = false | |
| technician | R/C/U; **delete = false** | R/C/U; delete = false | |
| viewer | Tất cả false | Tất cả false | |
| sales | Tất cả false | Tất cả false | |

---

## 2. Lỗi từng phát hiện — trạng thái sau kiểm tra lại

| # | Lỗi (lần kiểm trước) | Nguyên nhân | Trạng thái code hiện tại | Kiểm tra lại |
|---|----------------------|-------------|--------------------------|--------------|
| 1 | Manager/technician thấy nút **Xóa** QT/bước dù `delete: false` | UI dùng `canWrite` thay vì `canDelete` | Đã sửa: `canCreate` / `canDelete` tách riêng | **Đã sửa — còn hiệu lực** |
| 2 | Chỉ login được admin; thiếu user demo role khác | Seed không ổn định / không restore `status`/`deletedAt` | Đã sửa trong seed tuần tự | **Đã sửa — 5/5 role login 200** |

### File đã sửa (vẫn còn trong repo)

- [src/pages/WorkflowListPage.tsx](../src/pages/WorkflowListPage.tsx) — Thêm theo `canCreate`, Xóa theo `canDelete`
- [src/pages/WorkflowEditorPage.tsx](../src/pages/WorkflowEditorPage.tsx) — Cập nhật theo `canUpdate`, Xóa bước theo `canDelete`
- [src/components/workflow/WorkflowStepCard.tsx](../src/components/workflow/WorkflowStepCard.tsx) — Nút Xóa bước chỉ khi `canDelete`
- [backend/src/config/seed-auth.ts](../backend/src/config/seed-auth.ts) — Seed user tuần tự + `status: "active"` + `deletedAt: null`

---

## 3. Ma trận UI kỳ vọng (sau sửa)

### Sidebar

| Role | `/quy-trinh` | `/ban-giao` | `/cai-dat` |
|------|--------------|-------------|------------|
| admin | Có | Có | Có |
| manager | Có | Có | Có |
| technician | Có | Có | Không |
| viewer | Không | Không | Không |
| sales | Không | Không | Không |

### Nút trên màn Quy trình (khớp quyền API)

| Role | Thêm QT | Sửa | Xóa QT | Xóa bước |
|------|---------|-----|--------|----------|
| admin | Có | Có | Có | Có |
| manager | Có | Có | **Không** | **Không** |
| technician | Có | Có | **Không** | **Không** |
| viewer / sales | Không vào module | — | — | — |

---

## 4. Kết luận

1. **CRUD quy trình + bước + gắn coaching + chặn module sai + chặn xoá QT hệ thống: ĐẠT.**
2. **Ma trận API theo role: ĐẠT** (viewer/sales 403; admin/manager/technician 200; delete chỉ admin theo perms).
3. **Hai lỗi UI/seed đã sửa trước đó vẫn còn trong code; kiểm tra lại login 5 role và gate `canDelete` xác nhận ổn.**

Không phát hiện lỗi mới trong lần kiểm tra lại này.

---

## 5. Quyết định xử lý mã HTTP 403 / 400 / 404 (phương án 1)

**Đã chọn phương án 1 — giữ RBAC hiện tại, không “mở quyền” để hết 403.**

| Mã | Khi nào | Xử lý |
|----|---------|--------|
| **403** | viewer / sales gọi API `quy-trinh` (list/create…) | **Không sửa** — đúng thiết kế. UI đã ẩn menu `/quy-trinh`, `/ban-giao` với viewer/sales (`use-role` + role-permissions defaults). |
| **400** | Gắn QT sai nhóm (`coaching` vs `training`); xoá QT hệ thống | **Không sửa** — bảo vệ nghiệp vụ đúng. |
| **404** | ID không tồn tại / đã soft-delete | **Không sửa** — phản hồi chuẩn REST. |
| **402** | Không dùng trong phạm vi QT | Không áp dụng |

Các lỗi thật đã xử lý trước đó (vẫn giữ):

- Nút Xóa QT/bước tách `canDelete` (tránh manager/technician bấm xoá rồi dính 403 oan).
- Seed đủ 5 user demo để kiểm tra role.

---

## 6. Cách chạy lại smoke

```bash
cd backend && pnpm exec tsx scripts/smoke-workflow-crud-roles.ts
```

Script: [backend/scripts/smoke-workflow-crud-roles.ts](../backend/scripts/smoke-workflow-crud-roles.ts).
