import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { pool, query } from "./pool";
import { normalizeEmail } from "../utils/normalization";

const states = [
  { name: "Under Review", slug: "under_review", color: "#f59e0b", sortOrder: 10 },
  {
    name: "Contacted Awaiting Approval",
    slug: "contacted_awaiting_approval",
    color: "#2563eb",
    sortOrder: 20
  },
  { name: "Approved", slug: "approved", color: "#16a34a", sortOrder: 30 },
  { name: "No Reply", slug: "no_reply", color: "#dc2626", sortOrder: 40 }
];

async function seedStates(): Promise<void> {
  for (const state of states) {
    await query(
      `insert into request_states (name, slug, color, sort_order, is_system)
       values ($1, $2, $3, $4, true)
       on conflict (slug) do update
       set name = excluded.name,
           color = excluded.color,
           sort_order = excluded.sort_order,
           is_system = true,
           updated_at = now()`,
      [state.name, state.slug, state.color, state.sortOrder]
    );
  }
}

async function seedSettings(): Promise<void> {
  const settings: Array<[string, unknown]> = [
    ["min_age", 18],
    ["max_age", 100],
    ["default_state", "under_review"]
  ];

  for (const [key, value] of settings) {
    await query(
      `insert into app_settings (key, value)
       values ($1, $2::jsonb)
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [key, JSON.stringify(value)]
    );
  }
}

async function seedAdmin(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin seed.");
    return;
  }

  const email = normalizeEmail(env.ADMIN_EMAIL);
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await query(
    `insert into admin_users (email, password_hash, role, is_active)
     values ($1, $2, 'admin', true)
     on conflict (email) do update
     set password_hash = excluded.password_hash,
         is_active = true,
         updated_at = now()`,
    [email, passwordHash]
  );
}

async function main(): Promise<void> {
  await seedStates();
  await seedSettings();
  await seedAdmin();
  console.log("Seed complete.");
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
