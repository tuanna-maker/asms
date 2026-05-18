import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.PORT ?? "4001",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  AUTH_RATE_LIMIT_WINDOW_MS: process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? "60000",
  AUTH_LOGIN_MAX_REQUESTS: process.env.AUTH_LOGIN_MAX_REQUESTS ?? "10",
  AUTH_REFRESH_MAX_REQUESTS: process.env.AUTH_REFRESH_MAX_REQUESTS ?? "20",
  /** Cap for unauthenticated register when `AUTH_ALLOW_PUBLIC_REGISTRATION=true` (non-production only) */
  AUTH_REGISTER_PUBLIC_MAX_REQUESTS: process.env.AUTH_REGISTER_PUBLIC_MAX_REQUESTS ?? "5",
  /** When `true`, allows unauthenticated `POST /auth/register` outside production only. Default off. */
  AUTH_ALLOW_PUBLIC_REGISTRATION: process.env.AUTH_ALLOW_PUBLIC_REGISTRATION === "true",
};

