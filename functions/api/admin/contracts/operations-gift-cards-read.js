// Devil n Dove Build 385 Operations-owned Gift Cards startup read contract.
// GET-only. Reads migration-owned Gift Card tables and never creates/seeds schema.
// Build 407 metadata points to the owned Gift Card mutation contracts.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';

export const BUILD = 385;
export const CONTRACT_ID = 'operations-gift-cards-read';
export const OWNER = 'operations';
export const MUTATION_AUTHORITY_BUILD = 407;

const REQUIRED_TABLES = Object.freeze([
  'gift_cards',
  'gift_card_redemptions',
  'gift_card_admin_events',
  'gift_card_delivery_templates',
  'gift_card_delivery_queue',
  'gift_card_provider_send_logs',
  'gift_card_lookup_attempts',
  'gift_card_lookup_lockouts',
]);

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function tableExists(db, tableName) {
  try {
    const info = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return rows(info).length > 0;
  } catch { return false; }
}
async function safeRows(db, sql, key, issues) {
  try { return rows(await db.prepare(sql).all()); }
  catch (error) { issues.push({ key, message: String(error?.message || error) }); return []; }
}
function emailProvider(env) { return String(env?.GIFT_CARD_EMAIL_PROVIDER || env?.EMAIL_PROVIDER || 'manual').trim().toLowerCase() || 'manual'; }
function abuseRows(attempts, lockouts) {
  return attempts.map((row) => {
    const count = Number(row.attempt_count || 0);
    const failedStatus = String(row.result_status || '').toLowerCase() !== 'ok';
    const severityScore = failedStatus ? Math.min(100, count * 18) : Math.min(30, count * 4);
    const locked = lockouts.some((lock) =>
      (row.lookup_email && String(lock.lookup_email || '').toLowerCase() === String(row.lookup_email).toLowerCase()) ||
      (row.ip_hash && String(lock.ip_hash || '') === String(row.ip_hash))
    );
    return { ...row, severity_score: severityScore, severity_label: severityScore >= 75 ? 'high' : severityScore >= 40 ? 'medium' : 'low', is_locked: locked ? 1 : 0 };
  });
}

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);

  const present = {};
  for (const table of REQUIRED_TABLES) present[table] = await tableExists(db, table);
  const missingTables = REQUIRED_TABLES.filter((table) => !present[table]);
  const issues = [];

  const templates = present.gift_card_delivery_templates ? await safeRows(db, `SELECT * FROM gift_card_delivery_templates ORDER BY template_key ASC`, 'templates', issues) : [];
  const queue = present.gift_card_delivery_queue ? await safeRows(db, `SELECT * FROM gift_card_delivery_queue ORDER BY datetime(queued_at) DESC LIMIT 200`, 'delivery_queue', issues) : [];
  const logs = present.gift_card_provider_send_logs ? await safeRows(db, `SELECT * FROM gift_card_provider_send_logs ORDER BY datetime(created_at) DESC LIMIT 120`, 'provider_logs', issues) : [];
  const attemptsRaw = present.gift_card_lookup_attempts ? await safeRows(db, `SELECT lookup_email, code_suffix, ip_hash, result_status, COUNT(*) AS attempt_count, MAX(created_at) AS last_attempt_at FROM gift_card_lookup_attempts WHERE datetime(created_at) >= datetime('now','-14 days') GROUP BY lookup_email, code_suffix, ip_hash, result_status ORDER BY attempt_count DESC, datetime(last_attempt_at) DESC LIMIT 100`, 'abuse_attempts', issues) : [];
  const lockouts = present.gift_card_lookup_lockouts ? await safeRows(db, `SELECT * FROM gift_card_lookup_lockouts WHERE lockout_status='active' ORDER BY datetime(locked_at) DESC LIMIT 100`, 'lockouts', issues) : [];
  const attempts = abuseRows(attemptsRaw, lockouts);
  const cards = present.gift_cards ? await safeRows(db, `SELECT * FROM gift_cards ORDER BY datetime(updated_at) DESC, gift_card_id DESC LIMIT 120`, 'cards', issues) : [];
  const redemptions = present.gift_card_redemptions ? await safeRows(db, `SELECT * FROM gift_card_redemptions ORDER BY datetime(created_at) DESC LIMIT 120`, 'redemptions', issues) : [];
  const adminEvents = present.gift_card_admin_events ? await safeRows(db, `SELECT * FROM gift_card_admin_events ORDER BY datetime(created_at) DESC LIMIT 120`, 'admin_events', issues) : [];
  const failed = attempts.filter((row) => String(row.result_status || '').toLowerCase() !== 'ok');
  const schemaReady = missingTables.length === 0 && issues.length === 0;

  return json({
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mutation_authority_build: MUTATION_AUTHORITY_BUILD,
    schema_ready: schemaReady,
    checked_tables: REQUIRED_TABLES,
    missing_tables: missingTables,
    query_errors: issues,
    request_time_schema_mutation: false,
    request_time_default_seeding: false,
    mutation_ownership_moved: false,
    migration_authority: 'database_gift_card_runtime_parity.sql',
    notification_migration_authority: 'database_notification_runtime_parity.sql',
    mutation_authorities: {
      card_actions: '/api/admin/contracts/operations-gift-card-action-write',
      delivery_templates: '/api/admin/contracts/operations-gift-card-template-write',
      delivery_send: '/api/admin/contracts/operations-gift-card-provider-send-write',
      abuse: '/api/admin/contracts/operations-gift-card-abuse-write',
    },
    compatibility_mutation_aliases: {
      card_actions: '/api/admin/gift-card-actions',
      delivery_templates: '/api/admin/gift-card-delivery-templates',
      delivery_send: '/api/admin/gift-card-delivery-send',
      abuse: '/api/admin/gift-card-abuse',
    },
    provider: emailProvider(context.env), templates, queue, logs, attempts, lockouts, cards, redemptions, admin_events: adminEvents,
    summary: {
      templates: templates.length,
      queued: queue.filter((row) => String(row.delivery_status || '').startsWith('queued')).length,
      sent: queue.filter((row) => row.delivery_status === 'sent').length,
      failed: queue.filter((row) => row.delivery_status === 'failed').length,
      provider_logs: logs.length,
      abuse_groups: attempts.length,
      high_risk: failed.filter((row) => Number(row.severity_score || 0) >= 75).length,
      active_lockouts: lockouts.length,
      cards: cards.length,
      redemptions: redemptions.length,
      admin_events: adminEvents.length,
    },
  });
}
