import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { unauthorized } from "../utils/errors";
import { getAdminById } from "../repositories/adminRepository";

export type AuthAdmin = {
  id: string;
  email: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      admin?: AuthAdmin;
    }
  }
}

type TokenPayload = {
  sub: string;
};

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized();
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const admin = await getAdminById(payload.sub);

    if (!admin || !admin.is_active) {
      throw unauthorized("Invalid or inactive admin account.");
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(unauthorized("Invalid or expired token."));
      return;
    }
    next(error);
  }
}

