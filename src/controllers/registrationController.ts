import { Request, Response } from "express";
import * as registrationService from "../services/registrationService";

export async function create(req: Request, res: Response): Promise<void> {
  const input = req.body;
  res.status(201).json(await registrationService.createRegistration(input));
}
