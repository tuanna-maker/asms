import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createClauseController,
  createClauseGroupController,
  deleteClauseController,
  deleteClauseGroupController,
  getClauseUsageController,
  listClauseGroupsController,
  listClausesController,
  reorderClauseGroupsController,
  reorderClausesController,
  setClauseGroupMembersController,
  updateClauseController,
  updateClauseGroupController,
} from "./controller";
import {
  createClauseSchema,
  createGroupSchema,
  reorderClausesSchema,
  reorderGroupsSchema,
  setGroupMembersSchema,
  updateClauseSchema,
  updateGroupSchema,
} from "./schema";

const M = "hop-dong.dieu-khoan";

export const contractClausesRouter = Router();
contractClausesRouter.use(requireAuth);

contractClausesRouter.get("/", requireModulePermission(M, "read"), listClausesController);
contractClausesRouter.put(
  "/reorder",
  requireModulePermission(M, "update"),
  validateBody(reorderClausesSchema),
  reorderClausesController,
);
contractClausesRouter.get("/:id/usage", requireModulePermission(M, "read"), getClauseUsageController);
contractClausesRouter.post(
  "/",
  requireModulePermission(M, "create"),
  validateBody(createClauseSchema),
  createClauseController,
);
contractClausesRouter.put(
  "/:id",
  requireModulePermission(M, "update"),
  validateBody(updateClauseSchema),
  updateClauseController,
);
contractClausesRouter.delete("/:id", requireModulePermission(M, "delete"), deleteClauseController);

export const contractClauseGroupsRouter = Router();
contractClauseGroupsRouter.use(requireAuth);

contractClauseGroupsRouter.get("/", requireModulePermission(M, "read"), listClauseGroupsController);
contractClauseGroupsRouter.put(
  "/reorder",
  requireModulePermission(M, "update"),
  validateBody(reorderGroupsSchema),
  reorderClauseGroupsController,
);
contractClauseGroupsRouter.post(
  "/",
  requireModulePermission(M, "create"),
  validateBody(createGroupSchema),
  createClauseGroupController,
);
contractClauseGroupsRouter.put(
  "/:id/members",
  requireModulePermission(M, "update"),
  validateBody(setGroupMembersSchema),
  setClauseGroupMembersController,
);
contractClauseGroupsRouter.put(
  "/:id",
  requireModulePermission(M, "update"),
  validateBody(updateGroupSchema),
  updateClauseGroupController,
);
contractClauseGroupsRouter.delete("/:id", requireModulePermission(M, "delete"), deleteClauseGroupController);
