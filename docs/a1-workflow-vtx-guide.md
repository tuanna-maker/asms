# Hướng dẫn A1 — Quy trình VTX (Bàn giao / Huấn luyện / Bảo hành)

## Mục đích

Chuẩn hóa field/form quy trình theo spec VTX trước go-live production.

## Các bước khi VTX gửi spec

1. **Nhận tài liệu** quy trình (sơ đồ bước, field từng bước, SLA, vai trò phê duyệt).
2. **Cấu hình trên staging** qua UI `/quy-trinh/{module}` hoặc seed:
   - Module keys: `handover`, `coaching`, `warranty`, `contract`, `product`, `training`
3. **Kiểm tra runtime** trên phiếu thật (BG/BH/HL).
4. **Export** cấu hình workflow ID đã chốt để ghi vào runbook production.
5. **UAT lại** BG/BH/HL sau khi cập nhật (xem [uat-signoff-production.md](./uat-signoff-production.md)).

## Seed baseline (đã có trong repo)

```bash
cd backend
npm run bootstrap:auth
```

Tạo workflow mặc định + điều khoản + definitions. **Không** ghi đè workflow đã chỉnh trên staging nếu đã UAT — chỉ chạy lần đầu hoặc môi trường mới.

## Checklist field động (BH-06, BG-12)

- [ ] Mỗi bước có `fieldSchema` đúng loại (text, number, date, select, file)
- [ ] Bước bắt buộc đính kèm tài liệu (`requireDocument`) nếu VTX yêu cầu
- [ ] SLA từng bước khớp cam kết hợp đồng
- [ ] Vai trò phê duyệt khớp ma trận A2

## Liên kết

- [cutover-runbook.md](./cutover-runbook.md)
- [ASMS_phuong-an-trien-khai.html](./ASMS_phuong-an-trien-khai.html)
