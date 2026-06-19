import { Router } from "express";
import { adminRoutes } from "./adminRoutes";
import { authRoutes } from "./authRoutes";
import { registrationRoutes } from "./registrationRoutes";

export const routes = Router();

routes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

routes.use("/registrations", registrationRoutes);
routes.use("/auth", authRoutes);
routes.use("/admin", adminRoutes);

