import { Request, Response } from "express";
import {
  createStateSchema,
  deleteStateSchema,
  updateStateSchema
} from "../validators/stateValidator";
import * as stateRepository from "../repositories/stateRepository";
import { getRouteParam } from "../utils/requestParams";

export async function list(_req: Request, res: Response): Promise<void> {
  res.json({ data: await stateRepository.listStates() });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createStateSchema.parse(req.body);
  res.status(201).json(await stateRepository.createState(input));
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateStateSchema.parse(req.body);
  res.json(await stateRepository.updateState(getRouteParam(req, "id"), input));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const input = deleteStateSchema.parse(req.body ?? {});
  await stateRepository.deleteState(getRouteParam(req, "id"), input);
  res.status(204).send();
}
