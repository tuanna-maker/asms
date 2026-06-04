import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createUserSchema, updateUserSchema } from "./schema";
import {
  createUserController,
  deleteUserController,
  getUserDetailController,
  listUsersController,
  updateUserController,
} from "./controller";

const router = Router();
const M = "cai-dat.nguoi-dung";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listUsersController);
router.get("/:id", requireModulePermission(M, "read"), getUserDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createUserSchema), createUserController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateUserSchema), updateUserController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteUserController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
