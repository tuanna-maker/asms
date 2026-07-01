import rateLimit from "express-rate-limit";

import { env } from "../config/env";

type AuthRateLimitOptions = {
  windowMs: number;
  max: number;
  /** Overrides default envelope when rate limit exceeded */
  rateLimitMessage?: string;
};

export function createAuthRateLimiter(options: AuthRateLimitOptions) {
  const message =
    options.rateLimitMessage ??
    "Too many authentication attempts, please try again later.";
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      data: null,
      message,
    },
  });
}

export function createGlobalRateLimiter() {
  return rateLimit({
    windowMs: Number(env.GLOBAL_RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(env.GLOBAL_RATE_LIMIT_MAX) || 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      data: null,
      message: "Too many requests, please try again later.",
    },
  });
}
