// Devil n Dove Build 404 — Gift Card write schema readiness.
// Migration authority is Build 384; request handlers never create/alter/seed schema.

export const BUILD = 404;
export const OWNER = 'operations';
export const MIGRATION_AUTHORITY = 'database_gift_card_runtime_parity.sql';

export const GIFT_CARD_TABLE_COLUMNS = Object.freeze({
  gift_cards: Object.freeze([
    'gift_card_id','code','currency','initial_amount_cents','remaining_amount_cents',
    'issued_to_email','issued_to_name','recipient_email','recipient_name',
    'purchaser_email','purchaser_name','note','recipient_note','status','expires_at',
    'last_redeemed_at','order_id','purchase_source','created_at','updated_at',
  ]),
  gift_card_redemptions: Object.freeze([
    'gift_card_redemption_id','gift_card_id','order_id','redeemed_amount_cents',
    'redeemed_by_email','created_at',
  ]),
  gift_card_admin_events: Object.freeze([
    'gift_card_admin_event_id','gift_card_id','source_gift_card_id','action_key',
    'amount_cents','note','created_by_user_id','created_at',
  ]),
  gift_card_delivery_templates: Object.freeze([
    'gift_card_delivery_template_id','template_key','subject','body','template_status',
    'created_by_user_id','created_at','updated_at',
  ]),
  gift_card_delivery_queue: Object.freeze([
    'gift_card_delivery_queue_id','gift_card_id','recipient_email','delivery_kind',
    'template_key','subject','body','delivery_status','attempt_count','queued_by_user_id',
    'queued_at','sent_at','notes',
  ]),
  gift_card_provider_send_logs: Object.freeze([
    'gift_card_provider_send_log_id','gift_card_delivery_queue_id','gift_card_id',
    'provider','recipient_email','provider_message_id','send_status','request_summary_json',
    'response_summary_json','error_text','created_by_user_id','created_at',
  ]),
  gift_card_lookup_attempts: Object.freeze([
    'gift_card_lookup_attempt_id','code_hint','email_hash','client_key','lookup_email',
    'code_suffix','ip_hash','user_agent','result_status','was_success','created_at',
  ]),
  gift_card_lookup_lockouts: Object.freeze([
    'gift_card_lookup_lockout_id','lookup_email','code_suffix','ip_hash','lockout_status',
    'lockout_reason','locked_by_user_id','locked_at','expires_at','released_at','notes',
  ]),
});

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }

export async function readGiftCardSchemaReadiness(db, options = {}) {
  const tables = Array.isArray(options.requiredTables) && options.requiredTables.length
    ? options.requiredTables
    : Object.keys(GIFT_CARD_TABLE_COLUMNS);
  const missingTables = [];
  const missingColumns = [];
  for (const table of tables) {
    const required = GIFT_CARD_TABLE_COLUMNS[table] || [];
    try {
      const info = await db.prepare(`PRAGMA table_info(${table})`).all();
      const cols = new Set(rows(info).map((row) => String(row?.name || '').trim()).filter(Boolean));
      if (!cols.size) {
        missingTables.push(table);
        continue;
      }
      for (const column of required) if (!cols.has(column)) missingColumns.push(`${table}.${column}`);
    } catch {
      missingTables.push(table);
    }
  }
  return Object.freeze({
    build: BUILD,
    owner: OWNER,
    migration_authority: MIGRATION_AUTHORITY,
    schema_ready: missingTables.length === 0 && missingColumns.length === 0,
    missing_tables: Object.freeze([...new Set(missingTables)]),
    missing_columns: Object.freeze([...new Set(missingColumns)]),
    request_time_schema_mutation: false,
    request_time_default_seeding: false,
  });
}

export async function requireGiftCardSchema(db, options = {}) {
  const readiness = await readGiftCardSchemaReadiness(db, options);
  return readiness.schema_ready
    ? Object.freeze({ ok: true, readiness })
    : Object.freeze({
        ok: false,
        readiness,
        error_code: 'gift_card_schema_not_ready',
        error: 'Gift Card schema is not ready. Apply the Build 384 migration authority before retrying this operation.',
      });
}
