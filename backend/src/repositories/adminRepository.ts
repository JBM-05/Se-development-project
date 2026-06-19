import { query } from "../db/pool";

export type AdminUser = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  const result = await query<AdminUser>("select * from admin_users where email = $1", [email]);
  return result.rows[0] ?? null;
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  const result = await query<AdminUser>("select * from admin_users where id = $1", [id]);
  return result.rows[0] ?? null;
}

