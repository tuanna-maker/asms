import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createTaskSchema, updateTaskSchema } from "./schema";
import {
  createTaskController,
  deleteTaskController,
  getTaskDetailController,
  listTasksController,
  updateTaskController,
} from "./controller";

const router = Router();
const M = "cong-viec";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listTasksController);
router.get("/:id", requireModulePermission(M, "read"), getTaskDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createTaskSchema), createTaskController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateTaskSchema), updateTaskController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteTaskController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
