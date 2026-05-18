import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  listSubscriptionsController,
  subscribeController,
  unsubscribeController,
} from "./controller";
import { subscribeSchema } from "./schema";

const router = Router();
router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "sales", "viewer"];

router.get("/", requireRoles(readRoles), listSubscriptionsController);
router.post("/", requireRoles(readRoles), validateBody(subscribeSchema), subscribeController);
router.delete("/:anniversaryId", requireRoles(readRoles), unsubscribeController);

export default router;
