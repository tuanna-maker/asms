-- Trường header phiếu (HĐ, trạng thái, ngày…) cấu hình theo quy trình
ALTER TABLE "workflow_definitions" ADD COLUMN IF NOT EXISTS "entity_field_schema" JSONB;
