import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
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

router.use(requireAuth);

const readRoles = ["admin", "manager"];
const writeRoles = ["admin"];

router.get("/", requireRoles(readRoles), listUsersController);
router.get("/:id", requireRoles(readRoles), getUserDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createUserSchema), createUserController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateUserSchema), updateUserController);
router.delete("/:id", requireRoles(writeRoles), deleteUserController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
