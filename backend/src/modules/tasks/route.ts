import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  updateTaskSchema,
} from "./schema";
import {
  createTaskController,
  deleteTaskController,
  getTaskDetailController,
  listTasksController,
  updateTaskController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician"];
const writeRoles = ["admin", "manager", "technician"];

router.get("/", requireRoles(readRoles), listTasksController);
router.get("/:id", requireRoles(readRoles), getTaskDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createTaskSchema), createTaskController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateTaskSchema), updateTaskController);
router.delete("/:id", requireRoles(writeRoles), deleteTaskController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

