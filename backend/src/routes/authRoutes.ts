import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { loginRateLimit } from "../middleware/rateLimits";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as authController from "../controllers/authController";
import { loginSchema } from "../validators/authValidator";

export const authRoutes = Router();

authRoutes.post("/login", loginRateLimit, validateBody(loginSchema), asyncHandler(authController.login));
authRoutes.get("/me", asyncHandler(requireAuth), asyncHandler(authController.me));
