import { Router } from "express";
import { registrationRateLimit } from "../middleware/rateLimits";
import { asyncHandler } from "../utils/asyncHandler";
import * as registrationController from "../controllers/registrationController";

export const registrationRoutes = Router();

registrationRoutes.post("/", registrationRateLimit, asyncHandler(registrationController.create));

