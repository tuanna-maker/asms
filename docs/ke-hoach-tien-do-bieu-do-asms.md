# Quản lý tiến độ ASMS — Biểu đồ % (chỉ UC)

| Thuộc tính | Nội dung |
|---|---|
| **Phiên bản** | 1.3 |
| **Ngày** | 24/06/2026 |
| **Thời gian triển khai** | **05/05/2026 → 20/06/2026** (47 ngày) |
| **Bản HTML** | [ASMS_quan-ly-tien-do-bieu-do.html](./ASMS_quan-ly-tien-do-bieu-do.html) |
| **Phạm vi** | 152 UC · 15 phân hệ |
| **Tiêu chí** | UC hoạt động (pass / manual / no_data) = hoàn thành |

## Tổng quan

| Chỉ số | Giá trị |
|--------|--------:|
| Tiến độ UC | **100%** |
| UC đạt | **152/152** |

## Roadmap triển khai (05/05/2026 – 20/06/2026)

| Thời gian | Giai đoạn | Đầu ra chính | UC |
|-----------|-----------|--------------|---:|
| 05/05 – 11/05 | Nền tảng & bảo mật | Đăng nhập, phiên, RBAC, cài đặt hệ thống | 18 |
| 12/05 – 20/05 | Quy trình & hợp đồng | Workflow, hợp đồng, tab điều khoản | 34 |
| 21/05 – 30/05 | Vận hành | Bàn giao, HL, bảo hành, phản ánh | 38 |
| 31/05 – 07/06 | Danh mục & master data | Sản phẩm, vật tư, khách hàng CRM | 29 |
| 08/06 – 14/06 | Điều hành tổng thể | Dashboard 11 tab, báo cáo xuất file | 20 |
| 15/06 – 20/06 | Tài liệu, thông báo & kiểm thử | Tài liệu, thông báo, smoke test 152 UC | 13 |

## Tiến độ từng phân hệ

| Phân hệ | UC đạt | Tiến độ |
|---------|-------:|--------:|
| Xác thực | 7/7 | **100%** |
| Dashboard | 11/11 | **100%** |
| Quy trình | 13/13 | **100%** |
| Hợp đồng | 14/14 | **100%** |
| HĐ — Điều khoản | 7/7 | **100%** |
| Bàn giao & HL | 12/12 | **100%** |
| Bảo hành / SC | 8/8 | **100%** |
| Phản ánh | 18/18 | **100%** |
| Khách hàng | 9/9 | **100%** |
| Sản phẩm | 12/12 | **100%** |
| Vật tư | 8/8 | **100%** |
| Báo cáo | 9/9 | **100%** |
| Tài liệu | 8/8 | **100%** |
| Cài đặt | 11/11 | **100%** |
| Thông báo | 5/5 | **100%** |

Sinh tự động: `node scripts/generate-progress-charts-doc.mjs`
