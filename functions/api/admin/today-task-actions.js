// Devil n Dove Build 393 — Today Tasks completed/ignored/snoozed mutation implementation.
// Schema creation/repair moved to database_today_task_actions_runtime_parity.sql.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = 393;
const MIGRATION_AUTHORITY = 'database_today_task_actions_runtime_parity.sql';
const REQUIRED_COLUMNS = Object.freeze([
  'today_task_action_id',
  'task_key',
  'task_label',
  'action_status',
  'notes',
  'snooze_until',
  'created_by_user_id',
  'created_at',
]);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function clean(value, limit = 240) {
  const text = normalizeText(value);
  return text.length > limit ? text.slice(0, limit).trim() : text;
}
async function schemaReadiness(db) {
  try {
    const result = await db.prepare('PRAGMA table_info(today_task_actions)').all();
    const columns = new Set((Array.isArray(result?.results) ? result.results : [])
      .map((row) => String(row?.name || '').trim())
      .filter(Boolean));
    const missing = REQUIRED_COLUMNS.filter((name) => !columns.has(name));
    return Object.freeze({
      schema_ready: columns.size > 0 && missing.length === 0,
      missing_tables: columns.size ? Object.freeze([]) : Object.freeze(['today_task_actions']),
      missing_columns: Object.freeze(missing.map((name) => `today_task_actions.${name}`)),
    });
  } catch {
    return Object.freeze({
      schema_ready: false,
      missing_tables: Object.freeze(['today_task_actions']),
      missing_columns: Object.freeze([]),
    });
  }
}

export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, build: BUILD, error: 'Database binding is missing.' }, 500);

  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, build: BUILD, error: 'Unauthorized.' }, 401);

  const readiness = await schemaReadiness(db);
  if (!readiness.schema_ready) {
    return json({
      ok: false,
      build: BUILD,
      owner: 'operations',
      error_code: 'today_task_action_schema_not_ready',
      error: 'Today Tasks action schema is not ready. Apply the migration authority before retrying the write.',
      ...readiness,
      migration_authority: MIGRATION_AUTHORITY,
      request_time_schema_mutation: false,
    }, 503);
  }

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, build: BUILD, error: 'Invalid JSON body.' }, 400);
  }

  const actionStatus = ['completed', 'ignored', 'snoozed'].includes(clean(body.action_status, 40))
    ? clean(body.action_status, 40)
    : 'completed';
  const key = clean(body.task_key, 160);
  if (!key) return json({ ok: false, build: BUILD, error: 'task_key is required.' }, 400);

  const snoozeHours = Math.max(1, Math.min(168, Number(body.snooze_hours || 24) || 24));
  const snoozeUntil = actionStatus === 'snoozed'
    ? clean(body.snooze_until || new Date(Date.now() + snoozeHours * 60 * 60 * 1000).toISOString(), 60)
    : null;

  await db.prepare(`
    INSERT INTO today_task_actions (
      task_key, task_label, action_status, notes, snooze_until, created_by_user_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    key,
    clean(body.task_label || '', 240),
    actionStatus,
    clean(body.notes || '', 800),
    snoozeUntil,
    Number(user.user_id || 0) || null,
  ).run();

  return json({
    ok: true,
    build: BUILD,
    owner: 'operations',
    migration_authority: MIGRATION_AUTHORITY,
    request_time_schema_mutation: false,
    message: actionStatus === 'snoozed' ? `Task snoozed until ${snoozeUntil}.` : `Task ${actionStatus}.`,
    task_key: key,
    action_status: actionStatus,
    snooze_until: snoozeUntil,
  });
}
