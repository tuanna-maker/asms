import dotenv from "dotenv";

dotenv.config();

function parseCsv(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.PORT ?? "4001",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  /** Access token TTL — production default 1h; dev may use longer via env */
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? "",
  /** Comma-separated allowed origins for production CORS */
  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGINS),
  TRUST_PROXY: process.env.TRUST_PROXY !== "false",
  AUTH_RATE_LIMIT_WINDOW_MS: process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? "60000",
  AUTH_LOGIN_MAX_REQUESTS: process.env.AUTH_LOGIN_MAX_REQUESTS ?? "10",
  AUTH_REFRESH_MAX_REQUESTS: process.env.AUTH_REFRESH_MAX_REQUESTS ?? "20",
  GLOBAL_RATE_LIMIT_WINDOW_MS: process.env.GLOBAL_RATE_LIMIT_WINDOW_MS ?? "60000",
  GLOBAL_RATE_LIMIT_MAX: process.env.GLOBAL_RATE_LIMIT_MAX ?? "300",
  /** Cap for unauthenticated register when `AUTH_ALLOW_PUBLIC_REGISTRATION=true` (non-production only) */
  AUTH_REGISTER_PUBLIC_MAX_REQUESTS: process.env.AUTH_REGISTER_PUBLIC_MAX_REQUESTS ?? "5",
  /** When `true`, allows unauthenticated `POST /auth/register` outside production only. Default off. */
  AUTH_ALLOW_PUBLIC_REGISTRATION: process.env.AUTH_ALLOW_PUBLIC_REGISTRATION === "true",
};

