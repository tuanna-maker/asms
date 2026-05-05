import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";

import { getReportsController } from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "viewer", "sales"];

router.get("/", requireRoles(readRoles), getReportsController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

