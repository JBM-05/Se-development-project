import { Router } from "express";
import { registrationRateLimit } from "../middleware/rateLimits";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import * as registrationController from "../controllers/registrationController";
import { registrationSchema } from "../validators/registrationValidator";

export const registrationRoutes = Router();

registrationRoutes.post(
  "/",
  registrationRateLimit,
  validateBody(registrationSchema),
  asyncHandler(registrationController.create)
);
