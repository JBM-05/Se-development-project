import { Request, Response } from "express";
import { loginSchema } from "../validators/authValidator";
import * as authService from "../services/authService";

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  res.json(await authService.login(input));
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ admin: req.admin });
}

