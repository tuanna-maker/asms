import { env } from "./env";

const WEAK_SECRETS = new Set(["", "changeme", "secret", "jwt-secret", "dev", "password", "test"]);

export function validateProductionEnv(): void {
  if (env.NODE_ENV !== "production") return;

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when NODE_ENV=production");
  }

  const secret = env.JWT_SECRET.trim();
  if (!secret || secret.length < 32 || WEAK_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters and not a common placeholder when NODE_ENV=production",
    );
  }

  if (env.CORS_ORIGINS.length === 0) {
    throw new Error("CORS_ORIGINS must list at least one allowed origin in production");
  }
}
