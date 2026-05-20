import { Request } from "express";
import { validationError } from "./errors";

export function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw validationError("Route parameter is invalid.", {
      [name]: ["Route parameter is required."]
    });
  }
  return value;
}

