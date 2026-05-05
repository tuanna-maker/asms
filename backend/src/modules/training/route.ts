import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
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

const readRoles = ["admin", "manager", "technician"];
const adminManagerRoles = ["admin", "manager"];

router.use(requireAuth);

router.get("/", requireRoles(readRoles), listTrainingCoursesController);

router.get("/:id", requireRoles(readRoles), getTrainingCourseDetailController);
router.post(
  "/",
  requireRoles(adminManagerRoles),
  validateBody(createTrainingCourseSchema),
  createTrainingCourseController
);
router.put(
  "/:id",
  requireRoles(readRoles),
  validateBody(updateTrainingCourseSchema),
  updateTrainingCourseController
);
router.delete("/:id", requireRoles(readRoles), deleteTrainingCourseController);

router.post(
  "/:id/trainees",
  requireRoles(readRoles),
  validateBody(createTraineeSchema),
  addTraineeController
);
router.put("/:id/trainees/:traineeId", requireRoles(readRoles), validateBody(updateTraineeSchema), updateTraineeController);
router.delete("/:id/trainees/:traineeId", requireRoles(readRoles), deleteTraineeController);
router.post(
  "/:id/sessions",
  requireRoles(readRoles),
  validateBody(createScheduleSessionSchema),
  addScheduleSessionController
);
router.put("/:id/sessions/:sessionId", requireRoles(readRoles), validateBody(updateScheduleSessionSchema), updateScheduleSessionController);
router.delete("/:id/sessions/:sessionId", requireRoles(readRoles), deleteScheduleSessionController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

