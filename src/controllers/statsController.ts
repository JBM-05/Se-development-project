import { Request, Response } from "express";
import * as statsService from "../services/statsService";

export async function show(_req: Request, res: Response): Promise<void> {
  res.json(await statsService.getStats());
}

