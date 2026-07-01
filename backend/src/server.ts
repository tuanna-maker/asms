import app from "./app";
import { env } from "./config/env";
import { validateProductionEnv } from "./config/validateEnv";
import { seedAuthUsers } from "./config/seed-auth";
import { seedDataDefinitions } from "./config/seed-definitions";
import { ensureDefaultSystemSettings } from "./modules/system-settings/service";
import { ensureRolePermissionsSeeded } from "./modules/role-permissions/service";
import { ensureNotificationPreferencesForAllUsers } from "./modules/notification-preferences/service";
import { startNotificationCron } from "./jobs/notify";
import prisma from "./lib/prisma";

async function connectDatabase(retries = 5, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      // eslint-disable-next-line no-console
      console.log("PostgreSQL connected");
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
      // eslint-disable-next-line no-console
      console.warn(`PostgreSQL attempt ${attempt}/${retries} failed: ${msg}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export async function startServer() {
  validateProductionEnv();

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL chưa cấu hình trong backend/.env");
  }

  await connectDatabase();

  // Seed auth data only outside production.
  if (env.NODE_ENV !== "production") {
    await seedAuthUsers();
  }

  await seedDataDefinitions();
  await ensureDefaultSystemSettings();
  await ensureRolePermissionsSeeded();
  await ensureNotificationPreferencesForAllUsers();
  await startNotificationCron();

  const port = Number(env.PORT) || 4000;
  // anniversary-subscriptions routes mounted via v1 router
  return app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${port}`);
  });
}

