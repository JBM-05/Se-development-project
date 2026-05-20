import { Request, Response } from "express";
import {
  addNoteSchema,
  archiveSchema,
  changeStateSchema,
  listRequestsQuerySchema
} from "../validators/requestValidator";
import * as requestService from "../services/requestService";
import { getRouteParam } from "../utils/requestParams";

export async function list(req: Request, res: Response): Promise<void> {
  const filters = listRequestsQuerySchema.parse(req.query);
  res.json(await requestService.getRequests(filters));
}

export async function detail(req: Request, res: Response): Promise<void> {
  res.json(await requestService.getRequest(getRouteParam(req, "id")));
}

export async function changeState(req: Request, res: Response): Promise<void> {
  const input = changeStateSchema.parse(req.body);
  res.json(await requestService.updateRequestState(getRouteParam(req, "id"), req.admin!.id, input));
}

export async function addNote(req: Request, res: Response): Promise<void> {
  const input = addNoteSchema.parse(req.body);
  res.status(201).json(await requestService.createNote(getRouteParam(req, "id"), req.admin!.id, input));
}

export async function archive(req: Request, res: Response): Promise<void> {
  const input = archiveSchema.parse(req.body);
  res.json(await requestService.archiveRequest(getRouteParam(req, "id"), req.admin!.id, input));
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  const filters = listRequestsQuerySchema.parse({ ...req.query, page: 1, pageSize: 100 });
  const csv = await requestService.exportRequests(filters, req.admin!.id);
  res.header("content-type", "text/csv; charset=utf-8");
  res.attachment("registration-requests.csv");
  res.send(csv);
}
