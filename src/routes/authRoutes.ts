import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { loginRateLimit } from "../middleware/rateLimits";
import { requireAuth } from "../middleware/auth";
import * as authController from "../controllers/authController";

export const authRoutes = Router();

authRoutes.post("/login", loginRateLimit, asyncHandler(authController.login));
authRoutes.get("/me", asyncHandler(requireAuth), asyncHandler(authController.me));

