import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  listSubscriptionsController,
  subscribeController,
  unsubscribeController,
} from "./controller";
import { subscribeSchema } from "./schema";

const router = Router();
const M = "khach-hang.loyalty";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listSubscriptionsController);
router.post("/", requireModulePermission(M, "create"), validateBody(subscribeSchema), subscribeController);
router.delete("/:anniversaryId", requireModulePermission(M, "delete"), unsubscribeController);

export default router;
