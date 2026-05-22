-- SLA theo trạng thái trên hợp đồng + SLA mặc định trên danh mục định nghĩa
ALTER TABLE "contracts" ADD COLUMN "status_sla_hours" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "data_definitions" ADD COLUMN "sla_hours" INTEGER;
