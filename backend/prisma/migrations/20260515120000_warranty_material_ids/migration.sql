-- Vật tư thay thế ghi trên phiếu bảo hành/sửa chữa (BOM của SP đã chọn)
ALTER TABLE "warranties" ADD COLUMN "material_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
