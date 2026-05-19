// File: /functions/api/admin/search-console-import.js
// Brief description: Admin-only Search Console CSV staging import, filtered summaries,
// batch revert/delete, and reviewable SEO opportunity action generation.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function slugKey(value) { return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
function safeInt(value) { const n = Number(String(value ?? '').replace(/[,%\s]/g, '')); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0; }
function safeFloat(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const pct = raw.endsWith('%');
  const n = Number(raw.replace(/[,%\s]/g, ''));
  if (!Number.isFinite(n)) return 0;
  return pct ? n / 100 : n;
}
function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}
function normalizeUrl(value, requestUrl) {
  const clean = normalizeText(value);
  if (!clean) return '';
  try {
    const u = new URL(clean, requestUrl);
    u.hash = '';
    return u.toString();
  } catch { return clean; }
}
function parseCsv(text) {
  const output = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const input = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i += 1; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); output.push(row); row = []; field = ''; continue; }
    if (ch === '\r') continue;
    field += ch;
  }
  row.push(field);
  if (row.some((cell) => normalizeText(cell))) output.push(row);
  return output;
}
function pick(record, aliases) {
  for (const alias of aliases) {
    const key = slugKey(alias);
    if (Object.prototype.hasOwnProperty.call(record, key) && normalizeText(record[key])) return normalizeText(record[key]);
  }
  return '';
}
function titleCase(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bOr\b/g, 'or')
    .replace(/\bFor\b/g, 'for')
    .replace(/\bIn\b/g, 'in');
}
function truncate(value, maxLength) {
  const clean = normalizeText(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}
function actionKeyFor(row) {
  const seed = `${normalizeText(row.page_url).toLowerCase()}|${normalizeText(row.query_text).toLowerCase()}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(index);
    hash |= 0;
  }
  return `gsc_${Math.abs(hash)}_${seed.length}`;
}
function buildFiltersFromUrl(url) {
  const params = url.searchParams;
  return {
    page_url: normalizeText(params.get('page_url')),
    query_text: normalizeText(params.get('query_text')),
    country: normalizeText(params.get('country')),
    device: normalizeText(params.get('device')),
    date_from: normalizeText(params.get('date_from')),
    date_to: normalizeText(params.get('date_to')),
    min_impressions: clampNumber(params.get('min_impressions'), 0, 100000000, 0),
    position_from: clampNumber(params.get('position_from'), 0, 100, 0),
    position_to: clampNumber(params.get('position_to'), 0, 100, 0),
    limit: Math.round(clampNumber(params.get('limit'), 5, 100, 20)),
  };
}
function buildWhere(filters = {}) {
  const clauses = [];
  const bindings = [];
  if (filters.page_url) { clauses.push('LOWER(page_url) LIKE ?'); bindings.push(`%${filters.page_url.toLowerCase()}%`); }
  if (filters.query_text) { clauses.push('LOWER(COALESCE(query_text,\'\')) LIKE ?'); bindings.push(`%${filters.query_text.toLowerCase()}%`); }
  if (filters.country) { clauses.push('LOWER(COALESCE(country,\'\')) = ?'); bindings.push(filters.country.toLowerCase()); }
  if (filters.device) { clauses.push('LOWER(COALESCE(device,\'\')) = ?'); bindings.push(filters.device.toLowerCase()); }
  if (filters.date_from) { clauses.push('date(COALESCE(report_date, created_at)) >= date(?)'); bindings.push(filters.date_from); }
  if (filters.date_to) { clauses.push('date(COALESCE(report_date, created_at)) <= date(?)'); bindings.push(filters.date_to); }
  if (Number(filters.min_impressions || 0) > 0) { clauses.push('COALESCE(impressions,0) >= ?'); bindings.push(Number(filters.min_impressions)); }
  return {
    sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    bindings,
  };
}
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS search_console_import_batches (
    search_console_import_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_batch_key TEXT NOT NULL UNIQUE,
    source_file TEXT,
    site_property TEXT,
    row_count INTEGER NOT NULL DEFAULT 0,
    imported_by_user_id INTEGER,
    imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS search_console_page_queries (
    search_console_page_query_id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_batch_key TEXT,
    report_date TEXT,
    page_url TEXT NOT NULL,
    query_text TEXT,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    ctr REAL NOT NULL DEFAULT 0,
    average_position REAL NOT NULL DEFAULT 0,
    country TEXT,
    device TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS seo_opportunity_actions (
    seo_opportunity_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_key TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'search_console',
    page_url TEXT NOT NULL,
    query_text TEXT,
    priority_score INTEGER NOT NULL DEFAULT 0,
    suggested_title TEXT,
    suggested_meta_description TEXT,
    suggested_internal_link_note TEXT,
    action_status TEXT NOT NULL DEFAULT 'open',
    created_from_batch_key TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_page ON search_console_page_queries(page_url, report_date)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_query ON search_console_page_queries(query_text, report_date)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_batch ON search_console_page_queries(import_batch_key)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_filters ON search_console_page_queries(report_date, country, device, impressions, average_position)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_seo_opportunity_actions_status ON seo_opportunity_actions(action_status, priority_score)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_seo_opportunity_actions_page ON seo_opportunity_actions(page_url)`).run().catch(() => null);
}
async function summary(db, filters = {}) {
  await ensureSchema(db);
  const limit = Math.round(clampNumber(filters.limit, 5, 100, 20));
  const where = buildWhere(filters);
  const totals = await db.prepare(`SELECT COUNT(*) AS row_count, COALESCE(SUM(clicks),0) AS clicks, COALESCE(SUM(impressions),0) AS impressions, COALESCE(AVG(average_position),0) AS average_position FROM search_console_page_queries ${where.sql}`).bind(...where.bindings).first().catch(() => ({ row_count: 0, clicks: 0, impressions: 0, average_position: 0 }));
  const batches = rows(await db.prepare(`SELECT b.import_batch_key, b.source_file, b.site_property, b.row_count, b.imported_at, b.notes, COALESCE(q.live_rows, 0) AS live_rows FROM search_console_import_batches b LEFT JOIN (SELECT import_batch_key, COUNT(*) AS live_rows FROM search_console_page_queries GROUP BY import_batch_key) q ON q.import_batch_key = b.import_batch_key ORDER BY datetime(b.imported_at) DESC LIMIT 15`).all().catch(() => ({ results: [] })));
  const topPages = rows(await db.prepare(`SELECT page_url, SUM(clicks) AS clicks, SUM(impressions) AS impressions, CASE WHEN SUM(impressions)>0 THEN ROUND(1.0*SUM(clicks)/SUM(impressions),4) ELSE 0 END AS ctr, ROUND(AVG(average_position),2) AS average_position FROM search_console_page_queries ${where.sql} GROUP BY page_url ORDER BY clicks DESC, impressions DESC LIMIT ?`).bind(...where.bindings, limit).all().catch(() => ({ results: [] })));

  const opportunityWhere = [...where.bindings];
  const havingClauses = ['impressions >= ?', 'average_position BETWEEN ? AND ?'];
  opportunityWhere.push(Math.max(1, Number(filters.min_impressions || 10)));
  const positionFrom = Number(filters.position_from || 4) || 4;
  const positionTo = Number(filters.position_to || 20) || 20;
  opportunityWhere.push(Math.min(positionFrom, positionTo), Math.max(positionFrom, positionTo));
  const opportunityQueries = rows(await db.prepare(`SELECT query_text, page_url, SUM(clicks) AS clicks, SUM(impressions) AS impressions, ROUND(AVG(average_position),2) AS average_position, MAX(import_batch_key) AS import_batch_key FROM search_console_page_queries ${where.sql ? `${where.sql} AND COALESCE(query_text,'') <> ''` : "WHERE COALESCE(query_text,'') <> ''"} GROUP BY query_text, page_url HAVING ${havingClauses.join(' AND ')} ORDER BY impressions DESC, average_position ASC LIMIT ?`).bind(...opportunityWhere, limit).all().catch(() => ({ results: [] })));
  const actions = rows(await db.prepare(`SELECT action_key, page_url, query_text, priority_score, suggested_title, suggested_meta_description, suggested_internal_link_note, action_status, created_from_batch_key, created_at, notes FROM seo_opportunity_actions ORDER BY CASE action_status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'done' THEN 2 ELSE 3 END, priority_score DESC, datetime(updated_at) DESC LIMIT ?`).bind(limit).all().catch(() => ({ results: [] })));
  return { totals, batches, top_pages: topPages, opportunity_queries: opportunityQueries, seo_actions: actions, active_filters: filters };
}
async function deleteBatch(db, importBatchKey) {
  const key = normalizeText(importBatchKey);
  if (!key) return { deleted_rows: 0, deleted_batches: 0 };
  const existing = await db.prepare('SELECT import_batch_key, row_count FROM search_console_import_batches WHERE import_batch_key = ? LIMIT 1').bind(key).first().catch(() => null);
  if (!existing) throw new Error('Search Console import batch was not found.');
  const countRow = await db.prepare('SELECT COUNT(*) AS total FROM search_console_page_queries WHERE import_batch_key = ?').bind(key).first().catch(() => ({ total: 0 }));
  await db.batch([
    db.prepare('DELETE FROM search_console_page_queries WHERE import_batch_key = ?').bind(key),
    db.prepare('DELETE FROM search_console_import_batches WHERE import_batch_key = ?').bind(key),
  ]);
  return { deleted_rows: Number(countRow?.total || 0), deleted_batches: 1 };
}
async function generateRecommendations(db, adminUser, filters = {}) {
  const data = await summary(db, { ...filters, limit: Math.min(50, Math.max(10, Number(filters.limit || 20))) });
  const opportunities = Array.isArray(data.opportunity_queries) ? data.opportunity_queries : [];
  let created = 0;
  let skipped = 0;
  const inserted = [];
  for (const row of opportunities) {
    const query = normalizeText(row.query_text);
    const pageUrl = normalizeText(row.page_url);
    if (!query || !pageUrl) { skipped += 1; continue; }
    const actionKey = actionKeyFor(row);
    const existing = await db.prepare('SELECT action_key FROM seo_opportunity_actions WHERE action_key = ? LIMIT 1').bind(actionKey).first().catch(() => null);
    if (existing) { skipped += 1; continue; }
    const queryTitle = titleCase(query);
    const priorityScore = Math.max(1, Math.min(100, Math.round(Number(row.impressions || 0) / Math.max(1, Number(row.average_position || 1)))));
    const suggestedTitle = truncate(`${queryTitle} | Devil n Dove Ontario`, 70);
    const suggestedMeta = truncate(`Review this page for ${queryTitle}. Add clearer Southern Ontario wording, helpful product details, and internal links only if the query matches the page intent.`, 155);
    const internalNote = truncate(`Add one natural internal link using words close to “${query}” from a related local, shop, collection, or blog page if it helps visitors.`, 220);
    await db.prepare(`INSERT INTO seo_opportunity_actions (action_key, source, page_url, query_text, priority_score, suggested_title, suggested_meta_description, suggested_internal_link_note, action_status, created_from_batch_key, created_by_user_id, created_at, updated_at, notes) VALUES (?, 'search_console', ?, ?, ?, ?, ?, ?, 'open', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`)
      .bind(actionKey, pageUrl, query, priorityScore, suggestedTitle, suggestedMeta, internalNote, normalizeText(row.import_batch_key) || null, Number(adminUser.user_id || 0), 'Generated from Search Console CSV opportunity review. Human review required before changing public SEO copy.')
      .run();
    created += 1;
    inserted.push({ action_key: actionKey, page_url: pageUrl, query_text: query, priority_score: priorityScore, suggested_title: suggestedTitle, suggested_meta_description: suggestedMeta, suggested_internal_link_note: internalNote });
  }
  return { created, skipped, inserted };
}
async function updateActionStatus(db, payload) {
  const actionKey = normalizeText(payload.action_key);
  const status = normalizeText(payload.action_status).toLowerCase();
  if (!actionKey) throw new Error('SEO action key is required.');
  if (!['open', 'in_progress', 'done', 'ignored'].includes(status)) throw new Error('Action status must be open, in_progress, done, or ignored.');
  const result = await db.prepare(`UPDATE seo_opportunity_actions SET action_status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE action_key = ?`).bind(status, normalizeText(payload.notes) || null, actionKey).run();
  return { updated: Number(result?.meta?.changes || 0) };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  return jsonResponse({ ok: true, generated_at: new Date().toISOString(), ...(await summary(db, buildFiltersFromUrl(url))) }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureSchema(db);

  let payload = {};
  const contentType = context.request.headers.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await context.request.formData();
    const file = form.get('file');
    payload.source_file = normalizeText(file?.name || form.get('source_file') || 'search-console.csv');
    payload.site_property = normalizeText(form.get('site_property'));
    payload.report_date = normalizeText(form.get('report_date'));
    payload.notes = normalizeText(form.get('notes'));
    payload.csv_text = file && typeof file.text === 'function' ? await file.text() : normalizeText(form.get('csv_text'));
  } else {
    payload = await context.request.json().catch(() => ({}));
  }

  const action = normalizeText(payload.action || 'import').toLowerCase();
  const filterUrl = new URL(context.request.url);
  for (const [key, value] of Object.entries(payload.filters || {})) {
    if (value != null && value !== '') filterUrl.searchParams.set(key, String(value));
  }
  const filters = buildFiltersFromUrl(filterUrl);

  if (action === 'delete_batch') {
    const deleted = await deleteBatch(db, payload.import_batch_key);
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'search_console_delete_batch', target_type: 'search_console_import_batch', target_key: normalizeText(payload.import_batch_key), details: deleted });
    return jsonResponse({ ok: true, message: `Deleted ${deleted.deleted_rows} Search Console row(s) from the selected batch.`, ...deleted, ...(await summary(db, filters)) }, 200, { 'Cache-Control': 'no-store' });
  }

  if (action === 'generate_recommendations') {
    const generated = await generateRecommendations(db, adminUser, filters);
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'search_console_generate_recommendations', target_type: 'seo_opportunity_actions', target_key: 'search_console', details: generated });
    return jsonResponse({ ok: true, message: `Created ${generated.created} SEO action item(s). ${generated.skipped} already existed or were skipped.`, ...generated, ...(await summary(db, filters)) }, 200, { 'Cache-Control': 'no-store' });
  }

  if (action === 'update_action_status') {
    const update = await updateActionStatus(db, payload);
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'seo_opportunity_action_status', target_type: 'seo_opportunity_action', target_key: normalizeText(payload.action_key), details: { action_status: normalizeText(payload.action_status), ...update } });
    return jsonResponse({ ok: true, message: 'SEO action status updated.', ...update, ...(await summary(db, filters)) }, 200, { 'Cache-Control': 'no-store' });
  }

  const csvText = normalizeText(payload.csv_text);
  if (!csvText) return jsonResponse({ ok: false, error: 'CSV text or file is required.' }, 400);

  const parsed = parseCsv(csvText);
  if (parsed.length < 2) return jsonResponse({ ok: false, error: 'CSV must include a header row and at least one data row.' }, 400);
  const headers = parsed[0].map(slugKey);
  const importBatchKey = normalizeText(payload.import_batch_key) || `gsc_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const sourceFile = normalizeText(payload.source_file) || 'search-console.csv';
  const siteProperty = normalizeText(payload.site_property) || '';
  const fallbackReportDate = normalizeText(payload.report_date) || new Date().toISOString().slice(0, 10);
  const statements = [];
  let imported = 0;
  let skipped = 0;

  statements.push(db.prepare(`INSERT OR REPLACE INTO search_console_import_batches (import_batch_key, source_file, site_property, row_count, imported_by_user_id, imported_at, notes) VALUES (?, ?, ?, 0, ?, CURRENT_TIMESTAMP, ?)`).bind(importBatchKey, sourceFile, siteProperty, Number(adminUser.user_id || 0), normalizeText(payload.notes) || null));

  for (const cells of parsed.slice(1)) {
    const record = {};
    headers.forEach((header, index) => { record[header] = cells[index] ?? ''; });
    const pageUrl = normalizeUrl(pick(record, ['page', 'page_url', 'url', 'landing page', 'landing_page']), context.request.url);
    if (!pageUrl) { skipped += 1; continue; }
    const queryText = pick(record, ['query', 'query_text', 'search query', 'top queries']);
    const reportDate = normalizeText(pick(record, ['date', 'report_date', 'day'])) || fallbackReportDate;
    const clicks = safeInt(pick(record, ['clicks', 'click']));
    const impressions = safeInt(pick(record, ['impressions', 'impression']));
    const ctr = safeFloat(pick(record, ['ctr', 'click through rate', 'click-through rate']));
    const averagePosition = safeFloat(pick(record, ['position', 'average position', 'avg position', 'average_position']));
    const country = pick(record, ['country']);
    const device = pick(record, ['device']);
    imported += 1;
    statements.push(db.prepare(`INSERT INTO search_console_page_queries (import_batch_key, report_date, page_url, query_text, clicks, impressions, ctr, average_position, country, device, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(importBatchKey, reportDate, pageUrl, queryText || null, clicks, impressions, ctr, averagePosition, country || null, device || null));
  }
  statements.push(db.prepare(`UPDATE search_console_import_batches SET row_count = ? WHERE import_batch_key = ?`).bind(imported, importBatchKey));

  if (statements.length > 1) await db.batch(statements);
  await auditAdminAction(context.env, context.request, adminUser, { action_type: 'search_console_import', target_type: 'search_console_import_batch', target_key: importBatchKey, details: { source_file: sourceFile, imported, skipped, site_property: siteProperty } });
  return jsonResponse({ ok: true, message: `Imported ${imported} Search Console row(s).`, import_batch_key: importBatchKey, imported, skipped, ...(await summary(db, filters)) }, 200, { 'Cache-Control': 'no-store' });
}
