import { Router } from "express";

import { requireAuth } from "../../middleware/authJwt";

import {
  listNotificationsController,
  markAllReadController,
  markReadController,
  unreadCountController,
} from "./controller";

const router = Router();

router.use(requireAuth);

router.get("/", listNotificationsController);
router.get("/unread-count", unreadCountController);
router.post("/read-all", markAllReadController);
router.post("/:id/read", markReadController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
