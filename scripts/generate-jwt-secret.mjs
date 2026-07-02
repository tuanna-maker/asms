#!/usr/bin/env node
/**
 * Sinh JWT_SECRET ngẫu nhiên ≥ 48 bytes (base64url) cho file .env.
 *
 * Usage:
 *   node scripts/generate-jwt-secret.mjs
 *
 * Kết quả in ra stdout — copy dán vào dòng JWT_SECRET=... trong .env
 */
import { randomBytes } from "node:crypto";

const secret = randomBytes(48).toString("base64url");
const length = secret.length;
console.log(secret);
console.error(`[INFO] Length: ${length} chars (≥ 32 required, khuyến nghị ≥ 48)`);
if (length < 32) {
  console.error("[ERR] Quá ngắn, thử lại.");
  process.exit(1);
}
