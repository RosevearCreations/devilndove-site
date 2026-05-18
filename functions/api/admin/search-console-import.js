// File: /functions/api/admin/search-console-import.js
// Brief description: Admin-only Search Console CSV staging import and summary endpoint for local SEO review.

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
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_page ON search_console_page_queries(page_url, report_date)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_query ON search_console_page_queries(query_text, report_date)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_batch ON search_console_page_queries(import_batch_key)`).run().catch(() => null);
}
async function summary(db) {
  await ensureSchema(db);
  const totals = await db.prepare(`SELECT COUNT(*) AS row_count, COALESCE(SUM(clicks),0) AS clicks, COALESCE(SUM(impressions),0) AS impressions, COALESCE(AVG(average_position),0) AS average_position FROM search_console_page_queries`).first().catch(() => ({ row_count: 0, clicks: 0, impressions: 0, average_position: 0 }));
  const batches = rows(await db.prepare(`SELECT import_batch_key, source_file, site_property, row_count, imported_at, notes FROM search_console_import_batches ORDER BY datetime(imported_at) DESC LIMIT 10`).all().catch(() => ({ results: [] })));
  const topPages = rows(await db.prepare(`SELECT page_url, SUM(clicks) AS clicks, SUM(impressions) AS impressions, CASE WHEN SUM(impressions)>0 THEN ROUND(1.0*SUM(clicks)/SUM(impressions),4) ELSE 0 END AS ctr, ROUND(AVG(average_position),2) AS average_position FROM search_console_page_queries GROUP BY page_url ORDER BY clicks DESC, impressions DESC LIMIT 15`).all().catch(() => ({ results: [] })));
  const opportunityQueries = rows(await db.prepare(`SELECT query_text, page_url, SUM(clicks) AS clicks, SUM(impressions) AS impressions, ROUND(AVG(average_position),2) AS average_position FROM search_console_page_queries WHERE COALESCE(query_text,'') <> '' GROUP BY query_text, page_url HAVING impressions >= 10 AND average_position BETWEEN 4 AND 20 ORDER BY impressions DESC LIMIT 20`).all().catch(() => ({ results: [] })));
  return { totals, batches, top_pages: topPages, opportunity_queries: opportunityQueries };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  return jsonResponse({ ok: true, generated_at: new Date().toISOString(), ...(await summary(db)) }, 200, { 'Cache-Control': 'no-store' });
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
  return jsonResponse({ ok: true, message: `Imported ${imported} Search Console row(s).`, import_batch_key: importBatchKey, imported, skipped, ...(await summary(db)) }, 200, { 'Cache-Control': 'no-store' });
}
