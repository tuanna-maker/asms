import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createScheduleSessionSchema,
  createTraineeSchema,
  createTrainingCourseSchema,
  updateScheduleSessionSchema,
  updateTraineeSchema,
  updateTrainingCourseSchema,
} from "./schema";

import {
  addScheduleSessionController,
  addTraineeController,
  createTrainingCourseController,
  deleteScheduleSessionController,
  deleteTraineeController,
  deleteTrainingCourseController,
  getTrainingCourseDetailController,
  listTrainingCoursesController,
  updateScheduleSessionController,
  updateTraineeController,
  updateTrainingCourseController,
} from "./controller";

const router = Router();
const M = "dao-tao";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listTrainingCoursesController);
router.get("/:id", requireModulePermission(M, "read"), getTrainingCourseDetailController);
router.post("/", requireModulePermission(M, "create"), validateBody(createTrainingCourseSchema), createTrainingCourseController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateTrainingCourseSchema), updateTrainingCourseController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteTrainingCourseController);

router.post("/:id/trainees", requireModulePermission(M, "update"), validateBody(createTraineeSchema), addTraineeController);
router.put(
  "/:id/trainees/:traineeId",
  requireModulePermission(M, "update"),
  validateBody(updateTraineeSchema),
  updateTraineeController,
);
router.delete("/:id/trainees/:traineeId", requireModulePermission(M, "delete"), deleteTraineeController);
router.post(
  "/:id/sessions",
  requireModulePermission(M, "create"),
  validateBody(createScheduleSessionSchema),
  addScheduleSessionController,
);
router.put(
  "/:id/sessions/:sessionId",
  requireModulePermission(M, "update"),
  validateBody(updateScheduleSessionSchema),
  updateScheduleSessionController,
);
router.delete("/:id/sessions/:sessionId", requireModulePermission(M, "delete"), deleteScheduleSessionController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
