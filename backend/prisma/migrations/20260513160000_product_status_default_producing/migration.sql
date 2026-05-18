-- Đổi default cho cột status của bảng products sang 'producing'.
ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'producing';
