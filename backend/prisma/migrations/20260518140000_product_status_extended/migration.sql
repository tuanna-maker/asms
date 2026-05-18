-- Extend ProductStatus enum for detailed manufacturing pipeline
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'produced';
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'inspection_submitted';
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'inspecting';
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'inspection_passed';
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'decision_approved';
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'equip_decided';
