import { Request, Response } from "express";
import { registrationSchema } from "../validators/registrationValidator";
import * as registrationService from "../services/registrationService";

export async function create(req: Request, res: Response): Promise<void> {
  const input = registrationSchema.parse(req.body);
  res.status(201).json(await registrationService.createRegistration(input));
}

