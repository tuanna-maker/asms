import type { Response } from "express";
import { Router } from "express";
import { validateBody } from "../../middleware/validate";
import { createAuthRateLimiter } from "../../middleware/rateLimit";
import { env } from "../../config/env";
import { requireAuth, requireRoles } from "../../middleware/authJwt";

import { loginSchema, registerSchema, refreshTokenSchema, logoutSchema } from "./schema";
import {
  listSessionsController,
  loginController,
  logoutAllController,
  logoutController,
  refreshController,
  registerController,
  revokeSessionController,
} from "./controller";
import { notImplementedHandler } from "../_shared/notImplemented";

const router = Router();
const windowMs = Number(env.AUTH_RATE_LIMIT_WINDOW_MS) || 60000;
const loginMax = Number(env.AUTH_LOGIN_MAX_REQUESTS) || 10;
const refreshMax = Number(env.AUTH_REFRESH_MAX_REQUESTS) || 20;

const loginRateLimiter = createAuthRateLimiter({
  windowMs,
  max: loginMax,
});

const refreshRateLimiter = createAuthRateLimiter({
  windowMs,
  max: refreshMax,
});

const registerPublicMax = Number(env.AUTH_REGISTER_PUBLIC_MAX_REQUESTS) || 5;
const registerPublicRateLimiter = createAuthRateLimiter({
  windowMs,
  max: registerPublicMax,
  rateLimitMessage: "Too many registration attempts from this IP, please try again later.",
});

router.post("/login", loginRateLimiter, validateBody(loginSchema), loginController);

if (env.NODE_ENV === "production") {
  router.post("/register", (_req, res: Response) => {
    res.status(403).json({
      success: false,
      data: null,
      message:
        "Public registration is disabled. Create users via an authenticated admin (`POST /api/v1/users`) or run a one-off bootstrap.",
    });
  });
} else if (env.AUTH_ALLOW_PUBLIC_REGISTRATION) {
  router.post(
    "/register",
    registerPublicRateLimiter,
    validateBody(registerSchema),
    registerController
  );
} else {
  router.post(
    "/register",
    requireAuth,
    requireRoles(["admin"]),
    validateBody(registerSchema),
    registerController
  );
}

router.post("/refresh", refreshRateLimiter, validateBody(refreshTokenSchema), refreshController);
router.post("/logout", validateBody(logoutSchema), logoutController);

router.get("/sessions", requireAuth, listSessionsController);
router.post("/sessions/list", requireAuth, listSessionsController);
router.delete("/sessions/:id", requireAuth, revokeSessionController);
router.post("/logout-all", requireAuth, logoutAllController);

router.all(/.*/, notImplementedHandler);

export default router;

