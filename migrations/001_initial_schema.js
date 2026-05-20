exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  const timestamps = {
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  };

  pgm.createTable("admin_users", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    email: { type: "text", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    role: { type: "text", notNull: true, default: "admin" },
    is_active: { type: "boolean", notNull: true, default: true },
    ...timestamps
  });

  pgm.createTable("request_states", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    name: { type: "text", notNull: true },
    slug: { type: "text", notNull: true, unique: true },
    color: { type: "text", notNull: true },
    sort_order: { type: "integer", notNull: true, default: 0 },
    is_system: { type: "boolean", notNull: true, default: false },
    ...timestamps
  });

  pgm.createTable("registration_requests", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    request_number: { type: "text", notNull: true, unique: true },
    full_name: { type: "text", notNull: true },
    age: { type: "integer", notNull: true },
    major: { type: "text", notNull: true },
    phone: { type: "text", notNull: true },
    normalized_phone: { type: "text", notNull: true, unique: true },
    email: { type: "text", notNull: true },
    normalized_email: { type: "text", notNull: true, unique: true },
    city: { type: "text", notNull: true },
    state_id: {
      type: "uuid",
      notNull: true,
      references: "request_states(id)",
      onDelete: "restrict"
    },
    archived_at: { type: "timestamptz" },
    ...timestamps
  });

  pgm.createTable("request_notes", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    request_id: {
      type: "uuid",
      notNull: true,
      references: "registration_requests(id)",
      onDelete: "cascade"
    },
    admin_id: {
      type: "uuid",
      notNull: true,
      references: "admin_users(id)",
      onDelete: "restrict"
    },
    body: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("request_action_logs", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    request_id: {
      type: "uuid",
      references: "registration_requests(id)",
      onDelete: "set null"
    },
    actor_admin_id: {
      type: "uuid",
      references: "admin_users(id)",
      onDelete: "set null"
    },
    actor_type: { type: "text", notNull: true },
    action: { type: "text", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: "{}" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("app_settings", {
    key: { type: "text", primaryKey: true },
    value: { type: "jsonb", notNull: true },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createIndex("registration_requests", ["state_id", "archived_at", "created_at"]);
  pgm.createIndex("registration_requests", ["major"]);
  pgm.createIndex("registration_requests", ["city"]);
  pgm.createIndex("request_notes", ["request_id", "created_at"]);
  pgm.createIndex("request_action_logs", ["request_id", "created_at"]);
  pgm.createIndex("request_action_logs", ["actor_admin_id", "created_at"]);

  pgm.addConstraint("request_action_logs", "request_action_logs_actor_type_check", {
    check: "actor_type in ('system', 'visitor', 'admin')"
  });
};

exports.down = (pgm) => {
  pgm.dropTable("app_settings");
  pgm.dropTable("request_action_logs");
  pgm.dropTable("request_notes");
  pgm.dropTable("registration_requests");
  pgm.dropTable("request_states");
  pgm.dropTable("admin_users");
};
