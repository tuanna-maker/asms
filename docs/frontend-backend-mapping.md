# Frontend-Backend Mapping

Tài liệu liên quan: [BRD-ASMS.md](BRD-ASMS.md) (nghiệp vụ tổng thể), [SRS-ASMS.md](SRS-ASMS.md) (đặc tả API, RBAC, traceability), [BRD-chuc-nang-tung-man-ASMS.md](BRD-chuc-nang-tung-man-ASMS.md) (theo từng màn).

## Shared Conventions
- API prefix: `/api/v1`
- Response envelope: `{ success, data, message? }`
- Date handling:
  - Backend: ISO DateTime
  - Frontend input: `YYYY-MM-DD`
  - Frontend display: `DD/MM/YYYY`
- ID handling:
  - Backend internal ID: `id`
  - Frontend visible code: `code` (mapped to UI `id` fields in many pages)

## Module Mapping

### Customers
- Endpoint: `GET /api/v1/customers`
- FE list row:
  - `id <- code`
  - `contact <- contactName`
  - `contracts <- contractsCount`

### Research projects
- List: `GET /api/v1/research-projects` (?search, ?status)
- Detail: `GET /api/v1/research-projects/:id` (`id` = UUID hoặc `code`)
- Create: `POST` body `code`, `name`, `startDate`, `endDate`, optional `department`, `fundingSource`, `description`, `managerId`
- Update: `PUT` partial; `tasks` trong detail từ bảng `tasks` (map trạng thái sang UI)
- FE danh sách: `id` hiển thị dùng `code`; link chi tiết `/de-tai/:code`

### CRM activities
- Base: `GET/POST /api/v1/crm-activities`, `PUT/DELETE /api/v1/crm-activities/:id`
- Query: `?customerId=` (optional, id or customer code)
- Create body: `customerId`, `type` (`call`|`email`|`meeting`|`note`), `title`, `status` (`scheduled`|`done`), `activityAt` (ISO datetime)
- FE `ActivityItem`: `customerId <- customer.code`, `user <- createdBy.fullName`, time hiển thị từ `activityAt`

### Contracts
- List: `GET /api/v1/contracts` — query `eligibleFor=handover|training`: chỉ HĐ chưa có handover/training active (cùng điều kiện cho cả hai)
- Detail: `GET /api/v1/contracts/:id` — thêm `linkedHandover`, `linkedTraining` (summary: id, code, status, workflowName); không dùng `workflowId` / `stepPayloads` trên create/update UI mới
- Create/Update: `POST/PUT /api/v1/contracts` — body không gửi `workflowId`, `stepPayloads` (cột DB legacy giữ read-only)
- Ràng buộc: tối đa 1 handover + 1 training course active (`deletedAt` null) / `contractId`
- FE list row:
  - `id <- code`
  - `customer <- customer.name`
  - `value <- Number(value)`
  - `status: draft -> active` (UI compatibility)
- FE sheet HĐ: tab Bàn giao → `ContractHandoverSection` (`POST/PUT handovers`, `workflowId`); tab Huấn luyện → `ContractTrainingSection` (`POST/PUT training`, `workflowId`)

### Users (Settings)
- List: `GET /api/v1/users`
- Detail: `GET /api/v1/users/:id` (`id` or `email`)
- Create: `POST /api/v1/users`
- Update: `PUT /api/v1/users/:id`
- Delete: `DELETE /api/v1/users/:id` (soft delete)
- FE settings row:
  - `name <- fullName`
  - `role <- role.code`
  - `lastLogin <- lastLoginAt`

### Handovers
- List: `GET /api/v1/handovers` (`status`, `customerId`, `contractId`, `search`)
- Detail: `GET /api/v1/handovers/:id` (`id` or `code`)
- Create/Update/Delete: `POST/PUT/DELETE /api/v1/handovers` — body có `workflowId`, `stepPayloads`; tối đa 1 handover active / `contractId`
- FE handover row:
  - `id <- code`
  - `contract <- contract.code`
  - `customer <- customer.name`
  - `date <- startDate/dueDate`

### Products
- List: `GET /api/v1/products`
- Create: `POST /api/v1/products`
- FE product row:
  - `id <- id` (internal) and `code` shown as military code
  - `status/category/version/manufacturer/unit/yearReleased <- same`

### Warranties
- Endpoint: `GET /api/v1/warranties`
- FE ticket row:
  - `id <- code`
  - `customer <- customer.name`
  - `device <- product.name`
  - `status: completed -> completed, others -> processing`
  - `sla <- slaHours + "h"`

### Materials
- Endpoint: `GET /api/v1/materials`
- FE material row:
  - `id <- code`
  - `type <- type`
  - `quantity/available/unit/warehouse <- same`
- Transfers:
  - List: `GET /api/v1/materials/transfers`
  - Create: `POST /api/v1/materials/transfers`
  - FE transfer row:
    - `id <- code`
    - `material <- material.name`
    - `from <- fromWarehouse`
    - `to <- destination`
    - `date <- transferDate`

### Tasks
- Endpoint: `GET /api/v1/tasks`
- FE task row:
  - `id <- code`
  - `assignee <- assignee.fullName`
  - `projectCode <- project.code`
  - `status delayed -> in_progress` (UI compatibility)

### Documents
- Endpoint: `GET /api/v1/documents`
- FE document row:
  - `id <- code`
  - `owner <- owner.fullName`
  - `size <- fileSize`
  - `uploadedAt <- ISO date sliced to YYYY-MM-DD`

### Reports
- Query chung: `year` (tương thích cũ) hoặc `from`/`to` (ISO date; ưu tiên khoảng ngày nếu có).
- Endpoints:
  - `GET /api/v1/reports` — summary, `customer_breakdown`, `contracts_list`, `trends`, `unit_performance`, `summary_delta`
  - `GET /api/v1/reports/by-product-line` — `{ items: [{ category, produced, delivered, warrantyCount }] }`
  - `GET /api/v1/reports/feedback/by-customer` — Warranty group theo KH
  - `GET /api/v1/reports/feedback/by-product-line` — Warranty group theo `Product.category`
  - `GET /api/v1/reports/material-defects` — heuristic BOM; hỗ trợ `year`/`from`/`to`, `limit`
- FE `/bao-cao`: `ReportsPageShell`, filter bar, 5 tab + sub-tab Phản ánh; hooks `useReports`, `useReportsByProductLine`, `useReportsFeedbackByCustomer`, `useReportsFeedbackByProductLine`, `useMaterialDefects`
- Export FE: `src/lib/report-export.ts` (xlsx + print PDF) theo tab active

### Training
- Courses:
  - List: `GET /api/v1/training`
  - Detail: `GET /api/v1/training/:id`
  - CRUD: `POST/PUT/DELETE /api/v1/training` — create/update có `workflowId`; tối đa 1 course active / `contractId`
- Trainees:
  - `POST /api/v1/training/:id/trainees`
  - `PUT /api/v1/training/:id/trainees/:traineeId`
  - `DELETE /api/v1/training/:id/trainees/:traineeId`
- Sessions:
  - `POST /api/v1/training/:id/sessions`
  - `PUT /api/v1/training/:id/sessions/:sessionId`
  - `DELETE /api/v1/training/:id/sessions/:sessionId`
