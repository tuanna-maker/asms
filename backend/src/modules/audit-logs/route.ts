import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";

import { listAuditLogsController } from "./controller";

const router = Router();

router.use(requireAuth);

router.get("/", requireRoles(["admin"]), listAuditLogsController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
