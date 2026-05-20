/**
 * Nạp dữ liệu mô phỏng đầy đủ (khách hàng quân khu, HĐ, vật tư, SP, bàn giao, BH,
 * điều chuyển, đề tài, công việc, huấn luyện, CRM, tài liệu) để trình diễn giao diện.
 *
 * Yêu cầu: PostgreSQL đã migrate, biến môi trường DATABASE_URL.
 *
 * Usage:
 *   cd backend && npm run seed:demo
 */
import "dotenv/config";

import { seedAuthUsers } from "../src/config/seed-auth";
import { seedDataDefinitions } from "../src/config/seed-definitions";
import { seedContractClauses } from "../src/config/seed-contract-clauses";
import { seedWorkflows } from "../src/config/seed-workflows";
import { seedDemoBusinessData } from "../src/config/seed-demo-data";

void (async () => {
  await seedAuthUsers();
  await seedDataDefinitions();
  await seedContractClauses();
  await seedWorkflows();
  await seedDemoBusinessData();
  // eslint-disable-next-line no-console
  console.log("seed:demo — hoàn tất (auth + định nghĩa dữ liệu + bộ dữ liệu trình diễn).");
  process.exit(0);
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
