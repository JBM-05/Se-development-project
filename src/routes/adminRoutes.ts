import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as requestController from "../controllers/adminRequestController";
import * as stateController from "../controllers/stateController";
import * as statsController from "../controllers/statsController";

export const adminRoutes = Router();

adminRoutes.use(asyncHandler(requireAuth));

adminRoutes.get("/requests/export.csv", asyncHandler(requestController.exportCsv));
adminRoutes.get("/requests", asyncHandler(requestController.list));
adminRoutes.get("/requests/:id", asyncHandler(requestController.detail));
adminRoutes.patch("/requests/:id/state", asyncHandler(requestController.changeState));
adminRoutes.post("/requests/:id/notes", asyncHandler(requestController.addNote));
adminRoutes.patch("/requests/:id/archive", asyncHandler(requestController.archive));

adminRoutes.get("/states", asyncHandler(stateController.list));
adminRoutes.post("/states", asyncHandler(stateController.create));
adminRoutes.patch("/states/:id", asyncHandler(stateController.update));
adminRoutes.delete("/states/:id", asyncHandler(stateController.remove));

adminRoutes.get("/stats", asyncHandler(statsController.show));

