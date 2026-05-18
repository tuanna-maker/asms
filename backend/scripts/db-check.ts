/**
 * Kiểm tra kết nối PostgreSQL (dùng khi gặp lỗi "Can't reach database server").
 *
 * Usage: `cd backend && pnpm run db:check`
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { normalizeDatabaseUrl } from "../src/lib/db-url";

const url = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
if (!url) {
  console.error("DATABASE_URL chưa cấu hình trong backend/.env");
  process.exit(1);
}

const host = new URL(url.replace(/^postgresql:/, "postgres:"));
console.log(`Đang thử kết nối ${host.hostname}:${host.port || "5432"}${host.pathname}...`);

const prisma = new PrismaClient({ datasources: { db: { url } } });

void prisma
  .$queryRaw<[{ ok: number }]>`SELECT 1 as ok`
  .then((r) => {
    console.log("Kết nối OK:", r);
    process.exit(0);
  })
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Kết nối thất bại:", msg.split("\n")[0]);
    console.error("\nGợi ý:");
    console.error("  • Kiểm tra VPN / firewall tới server DB");
    console.error("  • DB local: bật Docker Desktop rồi docker compose -f docker-compose.local-db.yml up -d");
    console.error("  • Đổi DATABASE_URL trong backend/.env sang localhost:5433 nếu dùng Docker local");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
