import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function validationError(message: string, fields: FieldErrors): AppError {
  return new AppError(400, "VALIDATION_ERROR", message, { fields });
}

export function notFound(message = "Resource not found."): AppError {
  return new AppError(404, "NOT_FOUND", message);
}

export function unauthorized(message = "Authentication is required."): AppError {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "You do not have permission to perform this action."): AppError {
  return new AppError(403, "FORBIDDEN", message);
}

export function conflict(code: string, message: string, details?: unknown): AppError {
  return new AppError(409, code, message, details);
}

export function zodFieldErrors(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    fields[key] = fields[key] ?? [];
    fields[key].push(issue.message);
  }
  return fields;
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ZodError) {
    const appError = validationError("Request data is invalid.", zodFieldErrors(error));
    res.status(appError.status).json({
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details as object)
      }
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && typeof error.details === "object" ? error.details : {})
      }
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred."
    }
  });
}
