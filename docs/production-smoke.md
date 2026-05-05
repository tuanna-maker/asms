# Production smoke test (after deploy)

Chạy ngay sau khi frontend + backend + DB migration đã lên production (hoặc staging cutover).

## Prerequisites
- Biết URL frontend và API backend (HTTPS khuyến nghị).
- `NODE_ENV=production` trên API; không bật `AUTH_ALLOW_PUBLIC_REGISTRATION`.
- Ít nhất một tài khoản `admin` đã được tạo (`bootstrap:auth` một lần hoặc `POST /users` từ admin hiện có).

## API (curl)

Thay `API` bằng origin backend, không có trailing slash.

1. Health  
   `GET {API}/api/v1/health` → `200`, `success: true`.

2. Register bị khóa  
   `POST {API}/api/v1/auth/register` → `403`, `success: false`.

3. Login  
   `POST {API}/api/v1/auth/login` với JSON `email`, `password` → `200`, có `token` và `refreshToken`.

4. Auth required  
   `GET {API}/api/v1/customers` không header → `401`.

5. Một reads có JWT  
   `GET {API}/api/v1/customers` với `Authorization: Bearer <token>` → `200`, `success: true`.

6. Refresh  
   `POST {API}/api/v1/auth/refresh` body `{ "refreshToken": "..." }` → `200`, token mới.

## UI (browser)
- Login / logout, session giữ được sau reload (token trong storage).
- Mở lần lượt: Customers, Contracts, Materials (kho + điều chuyển), Reports — không lỗi trắng màn / loop 401 vô hạn.
- Viewer: chỉ đọc, không tạo/sửa nơi không được phép (theo RBAC).

## Fail nhanh
- Bất kỳ bước nào trả HTML thay JSON → kiểm tra `VITE_API_URL` và reverse proxy `/api`.

## References
- UAT chi tiết: [`docs/uat-checklist.md`](uat-checklist.md)
- Mapping API: [`docs/frontend-backend-mapping.md`](frontend-backend-mapping.md)
