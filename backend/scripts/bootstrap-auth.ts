/**
 * One-time (or repeat-safe) seed of roles + demo users.
 * Run on staging/production when you need baseline accounts; does not run at server startup in production.
 *
 * Usage: `cd backend && npm run bootstrap:auth`
 */
import "dotenv/config";
import { seedDataDefinitions } from "../src/config/seed-definitions";
import { seedAuthUsers } from "../src/config/seed-auth";

void (async () => {
  await seedAuthUsers();
  await seedDataDefinitions();
  // eslint-disable-next-line no-console
  console.log("Bootstrap complete (auth + baseline data definitions).");
  process.exit(0);
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
