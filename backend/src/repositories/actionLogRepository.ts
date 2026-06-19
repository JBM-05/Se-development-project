import { PoolClient } from "pg";
import { query } from "../db/pool";

type CreateActionLogInput = {
  requestId?: string | null;
  actorAdminId?: string | null;
  actorType: "system" | "visitor" | "admin";
  action: string;
  metadata?: Record<string, unknown>;
};

export async function createActionLog(input: CreateActionLogInput, client?: PoolClient): Promise<void> {
  const sql = `insert into request_action_logs
    (request_id, actor_admin_id, actor_type, action, metadata)
    values ($1, $2, $3, $4, $5)`;
  const params = [
    input.requestId ?? null,
    input.actorAdminId ?? null,
    input.actorType,
    input.action,
    input.metadata ?? {}
  ];

  if (client) {
    await client.query(sql, params);
    return;
  }
  await query(sql, params);
}

