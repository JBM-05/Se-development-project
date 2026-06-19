import { PoolClient } from "pg";
import { query, withTransaction } from "../db/pool";
import { notFound } from "../utils/errors";
import { ListRequestsQuery } from "../validators/requestValidator";
import { createActionLog } from "./actionLogRepository";

export type RegistrationRequestRow = {
  id: string;
  request_number: string;
  full_name: string;
  age: number;
  major: string;
  phone: string;
  normalized_phone: string;
  email: string;
  normalized_email: string;
  city: string;
  state_id: string;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type RequestListRow = RegistrationRequestRow & {
  state_name: string;
  state_slug: string;
  state_color: string;
};

export type RequestDetail = RequestListRow & {
  notes: Array<{
    id: string;
    body: string;
    created_at: Date;
    admin: {
      id: string;
      email: string;
    };
  }>;
  action_logs: Array<{
    id: string;
    actor_type: string;
    action: string;
    metadata: Record<string, unknown>;
    created_at: Date;
    admin: {
      id: string;
      email: string;
    } | null;
  }>;
};

export type CreateRegistrationRecordInput = {
  fullName: string;
  age: number;
  major: string;
  phone: string;
  normalizedPhone: string;
  email: string;
  normalizedEmail: string;
  city: string;
  stateId: string;
};

export async function findDuplicateRegistration(
  normalizedPhone: string,
  normalizedEmail: string
): Promise<{ phone: boolean; email: boolean }> {
  const result = await query<{ normalized_phone: string; normalized_email: string }>(
    `select normalized_phone, normalized_email
     from registration_requests
     where normalized_phone = $1 or normalized_email = $2`,
    [normalizedPhone, normalizedEmail]
  );
  return {
    phone: result.rows.some((row) => row.normalized_phone === normalizedPhone),
    email: result.rows.some((row) => row.normalized_email === normalizedEmail)
  };
}

async function nextRequestNumber(client: PoolClient, year: number): Promise<string> {
  const prefix = `REQ-${year}-`;
  const result = await client.query<{ next_number: string }>(
    `select coalesce(max(substring(request_number from 10)::integer), 0) + 1 as next_number
     from registration_requests
     where request_number like $1`,
    [`${prefix}%`]
  );
  return `${prefix}${String(Number(result.rows[0].next_number)).padStart(4, "0")}`;
}

export async function createRegistrationRecord(
  input: CreateRegistrationRecordInput
): Promise<RegistrationRequestRow> {
  return withTransaction(async (client) => {
    const year = new Date().getUTCFullYear();
    const requestNumber = await nextRequestNumber(client, year);
    const result = await client.query<RegistrationRequestRow>(
      `insert into registration_requests
       (request_number, full_name, age, major, phone, normalized_phone, email, normalized_email, city, state_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning *`,
      [
        requestNumber,
        input.fullName,
        input.age,
        input.major,
        input.phone,
        input.normalizedPhone,
        input.email,
        input.normalizedEmail,
        input.city,
        input.stateId
      ]
    );
    const row = result.rows[0];
    await createActionLog(
      {
        requestId: row.id,
        actorType: "visitor",
        action: "registration_created",
        metadata: { requestNumber: row.request_number }
      },
      client
    );
    return row;
  });
}

function buildRequestFilters(filters: ListRequestsQuery, startIndex = 1): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let index = startIndex;

  if (filters.archived === "false") {
    clauses.push("r.archived_at is null");
  } else if (filters.archived === "true") {
    clauses.push("r.archived_at is not null");
  }

  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    clauses.push(
      `(lower(r.full_name) like $${index} or lower(r.phone) like $${index} or lower(r.email) like $${index} or lower(r.request_number) like $${index})`
    );
    index += 1;
  }

  if (filters.state) {
    params.push(filters.state);
    clauses.push(`(s.id::text = $${index} or s.slug = $${index})`);
    index += 1;
  }

  for (const [column, value] of [
    ["r.major", filters.major],
    ["r.city", filters.city]
  ] as const) {
    if (value) {
      params.push(value);
      clauses.push(`${column} = $${index}`);
      index += 1;
    }
  }

  if (filters.from) {
    params.push(filters.from);
    clauses.push(`r.created_at >= $${index}`);
    index += 1;
  }

  if (filters.to) {
    params.push(filters.to);
    clauses.push(`r.created_at <= $${index}`);
  }

  return {
    where: clauses.length ? `where ${clauses.join(" and ")}` : "",
    params
  };
}

const sortColumns: Record<ListRequestsQuery["sortBy"], string> = {
  createdAt: "r.created_at",
  fullName: "r.full_name",
  age: "r.age",
  major: "r.major",
  city: "r.city",
  state: "s.sort_order",
  requestNumber: "r.request_number"
};

export async function listRequests(filters: ListRequestsQuery): Promise<{
  data: RequestListRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const { where, params } = buildRequestFilters(filters);
  const offset = (filters.page - 1) * filters.pageSize;
  const sortColumn = sortColumns[filters.sortBy];
  const sortDir = filters.sortDir === "asc" ? "asc" : "desc";

  const countResult = await query<{ count: string }>(
    `select count(*)::text as count
     from registration_requests r
     join request_states s on s.id = r.state_id
     ${where}`,
    params
  );

  const dataResult = await query<RequestListRow>(
    `select r.*, s.name as state_name, s.slug as state_slug, s.color as state_color
     from registration_requests r
     join request_states s on s.id = r.state_id
     ${where}
     order by ${sortColumn} ${sortDir}, r.created_at desc
     limit $${params.length + 1} offset $${params.length + 2}`,
    [...params, filters.pageSize, offset]
  );

  const total = Number(countResult.rows[0].count);
  return {
    data: dataResult.rows,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize)
    }
  };
}

export async function listRequestsForExport(filters: ListRequestsQuery): Promise<RequestListRow[]> {
  const { where, params } = buildRequestFilters(filters);
  const result = await query<RequestListRow>(
    `select r.*, s.name as state_name, s.slug as state_slug, s.color as state_color
     from registration_requests r
     join request_states s on s.id = r.state_id
     ${where}
     order by r.created_at desc`,
    params
  );
  return result.rows;
}

export async function getRequestDetail(id: string): Promise<RequestDetail> {
  const requestResult = await query<RequestListRow>(
    `select r.*, s.name as state_name, s.slug as state_slug, s.color as state_color
     from registration_requests r
     join request_states s on s.id = r.state_id
     where r.id = $1`,
    [id]
  );
  const request = requestResult.rows[0];
  if (!request) {
    throw notFound("Registration request not found.");
  }

  const notesResult = await query<RequestDetail["notes"][number]>(
    `select n.id, n.body, n.created_at, json_build_object('id', a.id, 'email', a.email) as admin
     from request_notes n
     join admin_users a on a.id = n.admin_id
     where n.request_id = $1
     order by n.created_at desc`,
    [id]
  );

  const logsResult = await query<RequestDetail["action_logs"][number]>(
    `select l.id, l.actor_type, l.action, l.metadata, l.created_at,
            case when a.id is null then null else json_build_object('id', a.id, 'email', a.email) end as admin
     from request_action_logs l
     left join admin_users a on a.id = l.actor_admin_id
     where l.request_id = $1
     order by l.created_at desc`,
    [id]
  );

  return {
    ...request,
    notes: notesResult.rows,
    action_logs: logsResult.rows
  };
}

export async function changeRequestState(
  requestId: string,
  stateId: string,
  adminId: string
): Promise<RequestListRow> {
  return withTransaction(async (client) => {
    const currentResult = await client.query<RequestListRow>(
      `select r.*, s.name as state_name, s.slug as state_slug, s.color as state_color
       from registration_requests r
       join request_states s on s.id = r.state_id
       where r.id = $1`,
      [requestId]
    );
    const current = currentResult.rows[0];
    if (!current) {
      throw notFound("Registration request not found.");
    }

    const stateResult = await client.query("select id, slug from request_states where id = $1", [stateId]);
    if (!stateResult.rows[0]) {
      throw notFound("State not found.");
    }

    const updatedResult = await client.query<RequestListRow>(
      `update registration_requests r
       set state_id = $2, updated_at = now()
       from request_states s
       where r.id = $1 and s.id = $2
       returning r.*, s.name as state_name, s.slug as state_slug, s.color as state_color`,
      [requestId, stateId]
    );
    const updated = updatedResult.rows[0];
    await createActionLog(
      {
        requestId,
        actorAdminId: adminId,
        actorType: "admin",
        action: "request_state_changed",
        metadata: {
          fromStateId: current.state_id,
          toStateId: stateId
        }
      },
      client
    );
    return updated;
  });
}

export async function addRequestNote(requestId: string, adminId: string, body: string): Promise<void> {
  await withTransaction(async (client) => {
    const requestResult = await client.query("select id from registration_requests where id = $1", [requestId]);
    if (!requestResult.rows[0]) {
      throw notFound("Registration request not found.");
    }
    await client.query("insert into request_notes (request_id, admin_id, body) values ($1, $2, $3)", [
      requestId,
      adminId,
      body
    ]);
    await createActionLog(
      {
        requestId,
        actorAdminId: adminId,
        actorType: "admin",
        action: "request_note_created",
        metadata: {}
      },
      client
    );
  });
}

export async function setRequestArchived(
  requestId: string,
  archived: boolean,
  adminId: string
): Promise<RequestListRow> {
  return withTransaction(async (client) => {
    const result = await client.query<RequestListRow>(
      `update registration_requests r
       set archived_at = case when $2 then coalesce(archived_at, now()) else null end,
           updated_at = now()
       from request_states s
       where r.id = $1 and s.id = r.state_id
       returning r.*, s.name as state_name, s.slug as state_slug, s.color as state_color`,
      [requestId, archived]
    );
    const row = result.rows[0];
    if (!row) {
      throw notFound("Registration request not found.");
    }
    await createActionLog(
      {
        requestId,
        actorAdminId: adminId,
        actorType: "admin",
        action: archived ? "request_archived" : "request_unarchived",
        metadata: {}
      },
      client
    );
    return row;
  });
}

