import app from "./app";
import { env } from "./config/env";
import { seedAuthUsers } from "./config/seed-auth";

export async function startServer() {
  // Seed auth data only outside production.
  if (env.NODE_ENV !== "production") {
    await seedAuthUsers();
  }

  const port = Number(env.PORT) || 4000;
  return app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${port}`);
  });
}

