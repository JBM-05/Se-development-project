import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import * as requestController from "../controllers/adminRequestController";
import * as stateController from "../controllers/stateController";
import * as statsController from "../controllers/statsController";
import {
  addNoteSchema,
  archiveSchema,
  changeStateSchema
} from "../validators/requestValidator";
import {
  createStateSchema,
  deleteStateSchema,
  updateStateSchema
} from "../validators/stateValidator";

export const adminRoutes = Router();

adminRoutes.use(asyncHandler(requireAuth));

adminRoutes.get("/requests/export.csv", asyncHandler(requestController.exportCsv));
adminRoutes.get("/requests", asyncHandler(requestController.list));
adminRoutes.get("/requests/:id", asyncHandler(requestController.detail));
adminRoutes.patch(
  "/requests/:id/state",
  validateBody(changeStateSchema),
  asyncHandler(requestController.changeState)
);
adminRoutes.post(
  "/requests/:id/notes",
  validateBody(addNoteSchema),
  asyncHandler(requestController.addNote)
);
adminRoutes.patch(
  "/requests/:id/archive",
  validateBody(archiveSchema),
  asyncHandler(requestController.archive)
);

adminRoutes.get("/states", asyncHandler(stateController.list));
adminRoutes.post("/states", validateBody(createStateSchema), asyncHandler(stateController.create));
adminRoutes.patch("/states/:id", validateBody(updateStateSchema), asyncHandler(stateController.update));
adminRoutes.delete("/states/:id", validateBody(deleteStateSchema), asyncHandler(stateController.remove));

adminRoutes.get("/stats", asyncHandler(statsController.show));
