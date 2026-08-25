// Devil n Dove Build 403 — shared notification schema readiness.
// Read/write callers use this to fail closed instead of creating/altering schema at request time.

export const BUILD = 403;
export const OWNER = 'platform-notifications';
export const MIGRATION_AUTHORITY = 'database_notification_runtime_parity.sql';

export const REQUIRED_TABLE_COLUMNS = Object.freeze({
  notification_outbox: Object.freeze([
    'notification_outbox_id','notification_kind','channel','destination',
    'related_order_id','related_payment_id','related_product_id',
    'payload_json','metadata_json','status','attempt_count','last_attempt_at',
    'next_attempt_at','provider_message_id','error_text','created_at','updated_at',
  ]),
  notification_dispatch_log: Object.freeze([
    'notification_dispatch_log_id','notification_outbox_id','notification_kind',
    'destination','status','provider_message_id','error_text','created_at',
  ]),
  notification_exclusions: Object.freeze([
    'notification_exclusion_id','notification_kind','destination','product_id',
    'order_id','reason','is_active','created_at','updated_at',
  ]),
  notification_cooldown_rules: Object.freeze([
    'notification_cooldown_rule_id','notification_kind','cooldown_hours','is_enabled',
    'created_at','updated_at',
  ]),
  customer_engagement_runs: Object.freeze([
    'customer_engagement_run_id','run_type','actor_user_id','summary_json','created_at',
  ]),
  notification_automation_settings: Object.freeze([
    'notification_automation_setting_id','notification_kind','is_enabled',
    'send_after_hours','max_age_days','order_statuses_json','payment_statuses_json',
    'notes','created_at','updated_at',
  ]),
});

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export async function readNotificationSchemaReadiness(db, options = {}) {
  const requiredTables = Array.isArray(options.requiredTables) && options.requiredTables.length
    ? options.requiredTables
    : Object.keys(REQUIRED_TABLE_COLUMNS);

  const missingTables = [];
  const missingColumns = [];
  const checkedTables = [];

  for (const table of requiredTables) {
    const required = REQUIRED_TABLE_COLUMNS[table] || [];
    try {
      const result = await db.prepare(`PRAGMA table_info(${table})`).all();
      const columns = new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
      checkedTables.push(table);
      if (!columns.size) {
        missingTables.push(table);
        continue;
      }
      for (const column of required) {
        if (!columns.has(column)) missingColumns.push(`${table}.${column}`);
      }
    } catch {
      missingTables.push(table);
    }
  }

  return Object.freeze({
    build: BUILD,
    owner: OWNER,
    migration_authority: MIGRATION_AUTHORITY,
    schema_ready: missingTables.length === 0 && missingColumns.length === 0,
    checked_tables: Object.freeze([...checkedTables]),
    missing_tables: Object.freeze([...new Set(missingTables)]),
    missing_columns: Object.freeze([...new Set(missingColumns)]),
    request_time_schema_mutation: false,
    request_time_default_seeding: false,
  });
}

export async function requireNotificationSchema(db, options = {}) {
  const readiness = await readNotificationSchemaReadiness(db, options);
  if (readiness.schema_ready) return Object.freeze({ ok: true, readiness });
  return Object.freeze({
    ok: false,
    readiness,
    error_code: 'notification_schema_not_ready',
    error: 'Notification schema is not ready. Apply the migration authority before retrying this operation.',
  });
}
