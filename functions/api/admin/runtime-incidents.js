import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function normalizeSeverity(value) {
  const clean = normalizeText(value).toLowerCase();
  if (['critical', 'error', 'warning', 'info'].includes(clean)) return clean;
  return '';
}

function parseIds(value) {
  if (Array.isArray(value)) return value.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
  return String(value || '')
    .split(',')
    .map((id) => Number(String(id).trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
}

async function ensureRuntimeIncidentSchema(db) {
  const warnings = [];
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS runtime_incidents (
        runtime_incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_scope TEXT,
        incident_code TEXT,
        severity TEXT DEFAULT 'warning',
        endpoint_path TEXT,
        request_method TEXT,
        message TEXT,
        details_json TEXT,
        related_user_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        review_status TEXT DEFAULT 'open',
        admin_note TEXT,
        reviewed_by_user_id INTEGER,
        reviewed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const columns = normalizeResults(await db.prepare(`PRAGMA table_info(runtime_incidents)`).all())
      .map((row) => String(row.name || '').toLowerCase());
    const required = [
      ['review_status', "ALTER TABLE runtime_incidents ADD COLUMN review_status TEXT DEFAULT 'open'"],
      ['admin_note', 'ALTER TABLE runtime_incidents ADD COLUMN admin_note TEXT'],
      ['reviewed_by_user_id', 'ALTER TABLE runtime_incidents ADD COLUMN reviewed_by_user_id INTEGER'],
      ['reviewed_at', 'ALTER TABLE runtime_incidents ADD COLUMN reviewed_at TEXT']
    ];
    for (const [column, sql] of required) {
      if (!columns.includes(column)) {
        await db.prepare(sql).run();
      }
    }
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_runtime_incidents_review_status_created ON runtime_incidents(review_status, severity, created_at DESC)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_runtime_incidents_grouping ON runtime_incidents(severity, incident_scope, incident_code, endpoint_path, created_at DESC)`).run();
  } catch (error) {
    warnings.push(`runtime_incident_schema_guard_failed: ${error?.message || error}`);
  }
  return warnings;
}

function buildFilters(url) {
  const scope = normalizeText(url.searchParams.get('scope')).toLowerCase();
  const code = normalizeText(url.searchParams.get('code')).toLowerCase();
  const path = normalizeText(url.searchParams.get('path')).toLowerCase();
  const severity = normalizeSeverity(url.searchParams.get('severity'));
  const reviewStatus = normalizeText(url.searchParams.get('review_status') || 'open').toLowerCase();
  const days = Math.max(1, Math.min(Number(url.searchParams.get('days') || 7), 90));
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 40), 100));

  const clauses = [`datetime(COALESCE(created_at, datetime('now'))) >= datetime('now', ?)`];
  const bindings = [`-${days} days`];

  if (scope) {
    clauses.push('LOWER(COALESCE(incident_scope, "")) = ?');
    bindings.push(scope);
  }
  if (code) {
    clauses.push('LOWER(COALESCE(incident_code, "")) = ?');
    bindings.push(code);
  }
  if (path) {
    clauses.push('LOWER(COALESCE(endpoint_path, "")) = ?');
    bindings.push(path);
  }
  if (severity) {
    clauses.push('LOWER(COALESCE(severity, "warning")) = ?');
    bindings.push(severity);
  }
  if (reviewStatus && reviewStatus !== 'all') {
    clauses.push('LOWER(COALESCE(review_status, "open")) = ?');
    bindings.push(reviewStatus);
  }

  return { scope, code, path, severity, review_status: reviewStatus, days, limit, clauses, bindings };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(request.url);
  const wantsGrouped = ['1', 'true', 'yes'].includes(normalizeText(url.searchParams.get('group')).toLowerCase());
  const filters = buildFilters(url);
  const warnings = await ensureRuntimeIncidentSchema(db);

  try {
    const whereSql = filters.clauses.join(' AND ');
    const summaryRow = await db.prepare(`
      SELECT
        COUNT(*) AS total_count,
        SUM(CASE WHEN LOWER(COALESCE(severity,'')) = 'critical' THEN 1 ELSE 0 END) AS critical_count,
        SUM(CASE WHEN LOWER(COALESCE(severity,'')) = 'error' THEN 1 ELSE 0 END) AS error_count,
        SUM(CASE WHEN LOWER(COALESCE(severity,'')) = 'warning' THEN 1 ELSE 0 END) AS warning_count,
        SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) = 'open' THEN 1 ELSE 0 END) AS open_count,
        SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('resolved','ignored') THEN 1 ELSE 0 END) AS closed_count
      FROM runtime_incidents
      WHERE ${whereSql}
    `).bind(...filters.bindings).first().catch(() => null);

    const groups = wantsGrouped ? normalizeResults(await db.prepare(`
      SELECT
        LOWER(COALESCE(severity,'warning')) AS severity,
        COALESCE(incident_scope,'') AS incident_scope,
        COALESCE(incident_code,'') AS incident_code,
        COALESCE(endpoint_path,'') AS endpoint_path,
        COUNT(*) AS incident_count,
        MAX(created_at) AS last_seen_at,
        MIN(created_at) AS first_seen_at
      FROM runtime_incidents
      WHERE ${whereSql}
      GROUP BY LOWER(COALESCE(severity,'warning')), COALESCE(incident_scope,''), COALESCE(incident_code,''), COALESCE(endpoint_path,'')
      ORDER BY incident_count DESC, datetime(MAX(created_at)) DESC
      LIMIT ?
    `).bind(...filters.bindings, filters.limit).all()) : [];

    const rows = normalizeResults(await db.prepare(`
      SELECT
        runtime_incident_id,
        incident_scope,
        incident_code,
        severity,
        endpoint_path,
        request_method,
        message,
        details_json,
        related_user_id,
        ip_address,
        user_agent,
        COALESCE(review_status,'open') AS review_status,
        admin_note,
        reviewed_by_user_id,
        reviewed_at,
        created_at
      FROM runtime_incidents
      WHERE ${whereSql}
      ORDER BY datetime(created_at) DESC, runtime_incident_id DESC
      LIMIT ?
    `).bind(...filters.bindings, filters.limit).all());

    return jsonResponse({
      ok: true,
      requested_by: { user_id: adminUser.user_id, email: adminUser.email, display_name: adminUser.display_name },
      warnings,
      filters: {
        scope: filters.scope,
        code: filters.code,
        path: filters.path,
        severity: filters.severity,
        review_status: filters.review_status,
        days: filters.days,
        limit: filters.limit,
        group: wantsGrouped
      },
      summary: {
        total_count: Number(summaryRow?.total_count || 0),
        critical_count: Number(summaryRow?.critical_count || 0),
        error_count: Number(summaryRow?.error_count || 0),
        warning_count: Number(summaryRow?.warning_count || 0),
        open_count: Number(summaryRow?.open_count || 0),
        closed_count: Number(summaryRow?.closed_count || 0)
      },
      groups: groups.map((row) => ({
        severity: row.severity || 'warning',
        incident_scope: row.incident_scope || '',
        incident_code: row.incident_code || '',
        endpoint_path: row.endpoint_path || '',
        incident_count: Number(row.incident_count || 0),
        first_seen_at: row.first_seen_at || null,
        last_seen_at: row.last_seen_at || null
      })),
      incidents: rows.map((row) => ({
        runtime_incident_id: Number(row.runtime_incident_id || 0),
        incident_scope: row.incident_scope || '',
        incident_code: row.incident_code || '',
        severity: row.severity || 'warning',
        endpoint_path: row.endpoint_path || '',
        request_method: row.request_method || '',
        message: row.message || '',
        details_json: row.details_json || '',
        related_user_id: row.related_user_id == null ? null : Number(row.related_user_id),
        ip_address: row.ip_address || '',
        user_agent: row.user_agent || '',
        review_status: row.review_status || 'open',
        admin_note: row.admin_note || '',
        reviewed_by_user_id: row.reviewed_by_user_id == null ? null : Number(row.reviewed_by_user_id),
        reviewed_at: row.reviewed_at || null,
        created_at: row.created_at || null
      }))
    }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to load runtime incidents.' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const warnings = await ensureRuntimeIncidentSchema(db);
  let body = {};
  try { body = await request.json(); } catch { body = {}; }

  const action = normalizeText(body.action).toLowerCase();
  const ids = parseIds(body.runtime_incident_ids || body.ids || body.runtime_incident_id);
  const adminNote = normalizeText(body.admin_note || body.note);
  const allowedStatuses = new Set(['open', 'reviewing', 'resolved', 'ignored']);
  const statusByAction = {
    reopen: 'open',
    reviewing: 'reviewing',
    mark_reviewing: 'reviewing',
    resolve: 'resolved',
    resolved: 'resolved',
    ignore: 'ignored',
    ignored: 'ignored'
  };
  const nextStatus = statusByAction[action] || normalizeText(body.review_status).toLowerCase();

  if (!ids.length) return jsonResponse({ ok: false, error: 'Select at least one incident.' }, 400);
  if (!allowedStatuses.has(nextStatus)) return jsonResponse({ ok: false, error: 'Unsupported runtime incident status.' }, 400);

  const placeholders = ids.map(() => '?').join(',');
  try {
    await db.prepare(`
      UPDATE runtime_incidents
      SET review_status = ?,
          admin_note = CASE WHEN ? = '' THEN admin_note ELSE ? END,
          reviewed_by_user_id = ?,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE runtime_incident_id IN (${placeholders})
    `).bind(nextStatus, adminNote, adminNote, Number(adminUser.user_id || 0), ...ids).run();

    await auditAdminAction(env, request, adminUser, {
      action_type: `runtime_incident_${nextStatus}`,
      target_type: 'runtime_incidents',
      target_key: ids.join(','),
      details: { runtime_incident_ids: ids, review_status: nextStatus, admin_note: adminNote }
    });

    return jsonResponse({ ok: true, warnings, updated_count: ids.length, review_status: nextStatus });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to update runtime incidents.' }, 500);
  }
}
