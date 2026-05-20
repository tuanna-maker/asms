import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";
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

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager"];

export const contractClausesRouter = Router();
contractClausesRouter.use(requireAuth);

contractClausesRouter.get("/", requireRoles(readRoles), listClausesController);
contractClausesRouter.put(
  "/reorder",
  requireRoles(writeRoles),
  validateBody(reorderClausesSchema),
  reorderClausesController,
);
contractClausesRouter.get("/:id/usage", requireRoles(readRoles), getClauseUsageController);
contractClausesRouter.post(
  "/",
  requireRoles(writeRoles),
  validateBody(createClauseSchema),
  createClauseController,
);
contractClausesRouter.put(
  "/:id",
  requireRoles(writeRoles),
  validateBody(updateClauseSchema),
  updateClauseController,
);
contractClausesRouter.delete("/:id", requireRoles(writeRoles), deleteClauseController);

export const contractClauseGroupsRouter = Router();
contractClauseGroupsRouter.use(requireAuth);

contractClauseGroupsRouter.get("/", requireRoles(readRoles), listClauseGroupsController);
contractClauseGroupsRouter.put(
  "/reorder",
  requireRoles(writeRoles),
  validateBody(reorderGroupsSchema),
  reorderClauseGroupsController,
);
contractClauseGroupsRouter.post(
  "/",
  requireRoles(writeRoles),
  validateBody(createGroupSchema),
  createClauseGroupController,
);
contractClauseGroupsRouter.put(
  "/:id/members",
  requireRoles(writeRoles),
  validateBody(setGroupMembersSchema),
  setClauseGroupMembersController,
);
contractClauseGroupsRouter.put(
  "/:id",
  requireRoles(writeRoles),
  validateBody(updateGroupSchema),
  updateClauseGroupController,
);
contractClauseGroupsRouter.delete("/:id", requireRoles(writeRoles), deleteClauseGroupController);
