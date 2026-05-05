import { Router } from "express";
import { requireAuth } from "../../middleware/authJwt";
import { notImplementedHandler } from "../_shared/notImplemented";

const router = Router();

router.use(requireAuth);
router.all("/*", notImplementedHandler);

export default router;

