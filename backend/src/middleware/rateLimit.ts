import rateLimit from "express-rate-limit";

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
