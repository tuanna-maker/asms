/**
 * One-time (or repeat-safe) seed of roles + demo users.
 * Run on staging/production when you need baseline accounts; does not run at server startup in production.
 *
 * Usage: `cd backend && npm run bootstrap:auth`
 */
import "dotenv/config";
import { seedDataDefinitions } from "../src/config/seed-definitions";
import { seedContractClauses } from "../src/config/seed-contract-clauses";
import { seedAuthUsers } from "../src/config/seed-auth";
import { seedWorkflows } from "../src/config/seed-workflows";

void (async () => {
  await seedAuthUsers();
  await seedDataDefinitions();
  await seedContractClauses();
  await seedWorkflows();
  // eslint-disable-next-line no-console
  console.log("Bootstrap complete (auth + baseline data definitions + workflows).");
  // eslint-disable-next-line no-console
  console.log("Bước tiếp theo cho lần cài đầu tiên: chạy 'npm run seed:demo' để có khách hàng, hợp đồng, vật tư mẫu.");
  // eslint-disable-next-line no-console
  console.log("Nếu dùng script tự động: 'pwsh scripts/reset-and-install.ps1' (Windows) hoặc 'bash scripts/reset-and-install.sh' (Linux).");
  process.exit(0);
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
