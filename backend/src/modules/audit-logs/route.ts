import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";

import { listAuditLogsController } from "./controller";

const router = Router();
const M = "cai-dat.nhat-ky";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listAuditLogsController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
