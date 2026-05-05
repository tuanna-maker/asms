import { Router } from "express";
import { notImplementedHandler } from "../_shared/notImplemented";

const router = Router();

router.post("/login", notImplementedHandler);
router.post("/register", notImplementedHandler);

// Placeholder to ensure consistent API behavior
router.all("/*", notImplementedHandler);

export default router;

