-- Add per-contract per-product spec values as JSONB object
ALTER TABLE "contract_products"
ADD COLUMN "spec_values" JSONB NOT NULL DEFAULT '{}';
