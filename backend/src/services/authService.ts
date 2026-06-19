import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { getAdminByEmail } from "../repositories/adminRepository";
import { unauthorized } from "../utils/errors";
import { normalizeEmail } from "../utils/normalization";
import { LoginInput } from "../validators/authValidator";

export async function login(input: LoginInput): Promise<{
  accessToken: string;
  admin: { id: string; email: string; role: string };
}> {
  const email = normalizeEmail(input.email);
  const admin = await getAdminByEmail(email);
  if (!admin || !admin.is_active) {
    throw unauthorized("Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(input.password, admin.password_hash);
  if (!passwordMatches) {
    throw unauthorized("Invalid email or password.");
  }

  const accessToken = jwt.sign({ sub: admin.id }, env.JWT_SECRET, { expiresIn: "8h" });
  return {
    accessToken,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role
    }
  };
}

