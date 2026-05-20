import { PoolClient } from "pg";
import { query, withTransaction } from "../db/pool";
import { notFound } from "../utils/errors";
import { assertStateCanBeDeleted } from "../utils/stateRules";
import { CreateStateInput, DeleteStateInput, UpdateStateInput } from "../validators/stateValidator";

export type RequestState = {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
};

export async function listStates(): Promise<RequestState[]> {
  const result = await query<RequestState>(
    "select * from request_states order by sort_order asc, name asc"
  );
  return result.rows;
}

export async function getStateById(id: string): Promise<RequestState | null> {
  const result = await query<RequestState>("select * from request_states where id = $1", [id]);
  return result.rows[0] ?? null;
}

export async function getStateBySlug(slug: string): Promise<RequestState | null> {
  const result = await query<RequestState>("select * from request_states where slug = $1", [slug]);
  return result.rows[0] ?? null;
}

export async function createState(input: CreateStateInput): Promise<RequestState> {
  const result = await query<RequestState>(
    `insert into request_states (name, slug, color, sort_order, is_system)
     values ($1, $2, $3, $4, false)
     returning *`,
    [input.name, input.slug, input.color, input.sortOrder]
  );
  return result.rows[0];
}

export async function updateState(id: string, input: UpdateStateInput): Promise<RequestState> {
  const current = await getStateById(id);
  if (!current) {
    throw notFound("State not found.");
  }

  const result = await query<RequestState>(
    `update request_states
     set name = coalesce($2, name),
         color = coalesce($3, color),
         sort_order = coalesce($4, sort_order),
         updated_at = now()
     where id = $1
     returning *`,
    [id, input.name ?? null, input.color ?? null, input.sortOrder ?? null]
  );
  return result.rows[0];
}

async function countRequestsForState(client: PoolClient, stateId: string): Promise<number> {
  const result = await client.query<{ count: string }>(
    "select count(*)::text as count from registration_requests where state_id = $1",
    [stateId]
  );
  return Number(result.rows[0].count);
}

export async function deleteState(id: string, input: DeleteStateInput): Promise<void> {
  await withTransaction(async (client) => {
    const stateResult = await client.query<RequestState>("select * from request_states where id = $1", [id]);
    const state = stateResult.rows[0];
    if (!state) {
      throw notFound("State not found.");
    }
    const linkedCount = await countRequestsForState(client, id);
    assertStateCanBeDeleted({
      isSystem: state.is_system,
      linkedCount,
      stateId: id,
      transferToStateId: input.transferToStateId
    });

    if (linkedCount > 0 && input.transferToStateId) {
      const transferResult = await client.query<RequestState>(
        "select * from request_states where id = $1",
        [input.transferToStateId]
      );
      if (!transferResult.rows[0]) {
        throw notFound("Transfer state not found.");
      }
      await client.query("update registration_requests set state_id = $1, updated_at = now() where state_id = $2", [
        input.transferToStateId,
        id
      ]);
    }

    await client.query("delete from request_states where id = $1", [id]);
  });
}
