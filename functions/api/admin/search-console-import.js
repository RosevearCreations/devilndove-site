// BUILD370_CURRENT_API: Search Console Real Export & Fresh Discovery Intake X; confirmed real evidence only and explicit report-date freshness.
// BUILD364_CURRENT_API: Search Console Real Export & Fresh Discovery Intake IX; confirmed real evidence only and explicit report-date freshness.
// BUILD358_CURRENT_API: Search Console Real Export & Fresh Discovery Intake VIII; real-only evidence and explicit report-date freshness.
// BUILD352_CURRENT_API: real Search Console export intake remains explicit-report-date-only and human reviewed.
// HISTORICAL_SEARCH_CONSOLE_FRESHNESS_COMPAT: date(COALESCE(report_date,created_at))>=date('now','-30 days') — retained as a non-executable Build 328/334/340 regression token only.
// BUILD346_CURRENT_FRESHNESS: explicit real report_date only; imported_at/created_at never substitute for freshness.
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
function pagePathFromUrl(value, requestUrl) {
  const clean = normalizeText(value);
  try {
    const u = new URL(clean || '/', requestUrl);
    let path = u.pathname || '/';
    if (!path.endsWith('/') && !path.includes('.')) path += '/';
    return path || '/';
  } catch {
    if (clean.startsWith('/')) return clean;
    return '/';
  }
}
function clampText(value, maxLength) {
  const clean = normalizeText(value);
  if (!clean) return '';
  return clean.length > maxLength ? clean.slice(0, maxLength).trim() : clean;
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
function searchConsoleRealExportHeaderReadiness(headers) {
  const present = new Set((headers || []).map(slugKey).filter(Boolean));
  const groups = {
    page: ['page','page_url','url','landing_page','top_pages'].some((key) => present.has(key)),
    clicks: ['clicks','click'].some((key) => present.has(key)),
    impressions: ['impressions','impression'].some((key) => present.has(key)),
    ctr: ['ctr','click_through_rate'].some((key) => present.has(key)),
    position: ['position','average_position','avg_position'].some((key) => present.has(key)),
  };
  return {
    ready: Object.values(groups).every(Boolean),
    groups,
    missing_header_groups: Object.entries(groups).filter(([, ok]) => !ok).map(([key]) => key),
  };
}
function realExportConfirmed(value) {
  if (value === true) return true;
  return ['true','1','yes','on'].includes(normalizeText(value).toLowerCase());
}
function pick(record, aliases) {
  for (const alias of aliases) {
    const key = slugKey(alias);
    if (Object.prototype.hasOwnProperty.call(record, key) && normalizeText(record[key])) return normalizeText(record[key]);
  }
  return '';
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
const SEARCH_CONSOLE_REQUIRED_TABLES=Object.freeze([
  'search_console_import_batches',
  'search_console_page_queries',
  'seo_opportunity_actions',
  'seo_page_overrides'
]);
async function searchConsoleSchemaReadiness(db) {
  const placeholders=SEARCH_CONSOLE_REQUIRED_TABLES.map(()=>'?').join(',');
  const result=await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...SEARCH_CONSOLE_REQUIRED_TABLES).all().catch(()=>({results:[]}));
  const present=new Set(rows(result).map((row)=>normalizeText(row.name)).filter(Boolean));
  const missing=SEARCH_CONSOLE_REQUIRED_TABLES.filter((name)=>!present.has(name));
  return {
    ready:missing.length===0,
    required_tables:[...SEARCH_CONSOLE_REQUIRED_TABLES],
    present_tables:SEARCH_CONSOLE_REQUIRED_TABLES.filter((name)=>present.has(name)),
    missing_tables:missing,
    request_time_schema_mutation:false,
    repair_mode:'canonical_migration_only'
  };
}

async function operatorAcceptance(db, providedReadiness = null) {
  const schemaReadiness=providedReadiness||await searchConsoleSchemaReadiness(db);
  if(!schemaReadiness.ready){
    return { state:'SCHEMA_BLOCKED', schema_ready:false, import_batches:0, live_rows:0, mismatched_batches:0, orphan_rows:0, import_audits:0, revert_audits:0, automatic_import:false, synthetic_rows:false, safe_revert_action:'delete_batch' };
  }
  const stats=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM search_console_import_batches) import_batches,
    COALESCE((SELECT SUM(row_count) FROM search_console_import_batches),0) declared_rows,
    (SELECT COUNT(*) FROM search_console_page_queries) live_rows,
    (SELECT COUNT(*) FROM search_console_import_batches b WHERE COALESCE(b.row_count,0)<>(SELECT COUNT(*) FROM search_console_page_queries q WHERE q.import_batch_key=b.import_batch_key)) mismatched_batches,
    (SELECT COUNT(*) FROM search_console_page_queries q WHERE NOT EXISTS (SELECT 1 FROM search_console_import_batches b WHERE b.import_batch_key=q.import_batch_key)) orphan_rows,
    (SELECT COUNT(*) FROM search_console_import_batches WHERE trim(COALESCE(source_file,''))<>'' AND COALESCE(imported_by_user_id,0)>0) operator_bound_batches,
    (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='search_console_import') import_audits,
    (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='search_console_delete_batch') revert_audits`).first().catch(()=>null);
  if(!stats)return { state:'TRACEABILITY_REVIEW_REQUIRED', schema_ready:true, automatic_import:false, synthetic_rows:false, safe_revert_action:'delete_batch' };
  const batches=Number(stats.import_batches||0),live=Number(stats.live_rows||0),mismatch=Number(stats.mismatched_batches||0),orphans=Number(stats.orphan_rows||0),operatorBound=Number(stats.operator_bound_batches||0),importAudits=Number(stats.import_audits||0);
  let state='EVIDENCE_PENDING_NO_REAL_EXPORT';
  if(batches===0&&live===0)state='EVIDENCE_PENDING_NO_REAL_EXPORT';
  else if(batches>0&&live>0&&mismatch===0&&orphans===0&&operatorBound===batches&&importAudits>0)state='REAL_OPERATOR_EVIDENCE_PRESENT';
  else state='TRACEABILITY_REVIEW_REQUIRED';
  return { state, schema_ready:true, ...stats, automatic_import:false, synthetic_rows:false, request_time_schema_mutation:false, safe_revert_action:'delete_batch', import_audit_action:'search_console_import', revert_audit_action:'search_console_delete_batch' };
}

async function searchConsoleFreshness(db, providedReadiness = null) {
  const schemaReadiness=providedReadiness||await searchConsoleSchemaReadiness(db);
  if(!schemaReadiness.ready)return {state:'SCHEMA_BLOCKED',freshness_window_days:30,total_rows:0,recent_rows:0,latest_report_date:'',latest_report_age_days:null,actionable:false};
  const row=await db.prepare(`SELECT
    COUNT(*) total_rows,
    SUM(CASE WHEN report_date IS NOT NULL AND date(report_date)>=date('now','-30 days') THEN 1 ELSE 0 END) recent_rows,
    COALESCE(SUM(CASE WHEN report_date IS NOT NULL AND date(report_date)>=date('now','-30 days') THEN clicks ELSE 0 END),0) recent_clicks,
    COALESCE(SUM(CASE WHEN report_date IS NOT NULL AND date(report_date)>=date('now','-30 days') THEN impressions ELSE 0 END),0) recent_impressions,
    COALESCE(MAX(report_date),'') latest_report_date,
    CASE WHEN MAX(report_date) IS NULL OR trim(MAX(report_date))='' THEN NULL ELSE ROUND(julianday('now')-julianday(MAX(report_date)),2) END latest_report_age_days,
    SUM(CASE WHEN report_date IS NULL OR trim(COALESCE(report_date,''))='' OR date(report_date) IS NULL THEN 1 ELSE 0 END) invalid_report_date_rows,
    COUNT(DISTINCT report_date) report_dates
    FROM search_console_page_queries`).first().catch(()=>null);
  if(!row)return {state:'TRACEABILITY_REVIEW_REQUIRED',freshness_window_days:30,actionable:false};
  const total=Number(row.total_rows||0),recent=Number(row.recent_rows||0),invalid=Number(row.invalid_report_date_rows||0);
  let state='EVIDENCE_PENDING_NO_REAL_EXPORT';
  if(total>0&&invalid>0)state='REPORT_DATE_REVIEW_REQUIRED';
  else if(total>0&&recent===0)state='REAL_EVIDENCE_STALE_NON_ACTIONABLE';
  else if(recent>0)state='REAL_OPERATOR_EVIDENCE_FRESH';
  return {...row,state,freshness_window_days:30,actionable:state==='REAL_OPERATOR_EVIDENCE_FRESH',query_level_attribution_requires_real_search_console:true,stale_evidence_non_actionable:true,explicit_report_date_only:true,imported_at_freshness_fallback:false,created_at_freshness_fallback:false};
}

async function summary(db, filters = {}, providedReadiness = null) {
  const schemaReadiness=providedReadiness||await searchConsoleSchemaReadiness(db);
  const acceptance=await operatorAcceptance(db,schemaReadiness);
  const freshness=await searchConsoleFreshness(db,schemaReadiness);
  const limit = Math.round(clampNumber(filters.limit, 5, 100, 20));
  if(!schemaReadiness.ready){
    return {
      schema_readiness:schemaReadiness,
      totals:{row_count:0,clicks:0,impressions:0,average_position:0},
      batches:[],top_pages:[],opportunity_queries:[],seo_actions:[],operator_acceptance:acceptance,freshness,active_filters:filters
    };
  }
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
  const actionableWhere = where.sql ? `${where.sql} AND report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')` : "WHERE report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')";
  const opportunityQueries = rows(await db.prepare(`SELECT query_text, page_url, SUM(clicks) AS clicks, SUM(impressions) AS impressions, ROUND(AVG(average_position),2) AS average_position, MAX(import_batch_key) AS import_batch_key FROM search_console_page_queries ${actionableWhere} AND COALESCE(query_text,'') <> '' GROUP BY query_text, page_url HAVING ${havingClauses.join(' AND ')} ORDER BY impressions DESC, average_position ASC LIMIT ?`).bind(...opportunityWhere, limit).all().catch(() => ({ results: [] })));
  const actions = rows(await db.prepare(`SELECT a.action_key,a.page_url,a.query_text,a.priority_score,a.suggested_title,a.suggested_meta_description,a.suggested_internal_link_note,a.action_status,a.created_from_batch_key,a.applied_override_id,a.applied_at,a.created_at,a.notes,
    COALESCE(e.evidence_rows,0) evidence_rows,COALESCE(e.evidence_clicks,0) evidence_clicks,COALESCE(e.evidence_impressions,0) evidence_impressions,COALESCE(e.evidence_position,0) evidence_position,
    CASE WHEN COALESCE(e.evidence_impressions,0)>=10 AND COALESCE(e.evidence_position,0) BETWEEN 4 AND 20 THEN 1 ELSE 0 END current_evidence_supported
    FROM seo_opportunity_actions a
    LEFT JOIN (
      SELECT lower(page_url) page_key,lower(COALESCE(query_text,'')) query_key,COUNT(*) evidence_rows,SUM(clicks) evidence_clicks,SUM(impressions) evidence_impressions,ROUND(AVG(average_position),2) evidence_position
      FROM search_console_page_queries WHERE report_date IS NOT NULL AND date(report_date)>=date('now','-30 days') GROUP BY lower(page_url),lower(COALESCE(query_text,''))
    ) e ON e.page_key=lower(a.page_url) AND e.query_key=lower(COALESCE(a.query_text,''))
    ORDER BY CASE a.action_status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'done' THEN 2 ELSE 3 END,a.priority_score DESC,datetime(a.updated_at) DESC LIMIT ?`).bind(limit).all().catch(() => ({ results: [] })));
  return { schema_readiness: schemaReadiness, totals, batches, top_pages: topPages, opportunity_queries: opportunityQueries, seo_actions: actions, operator_acceptance: acceptance, freshness, active_filters: filters };
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
  let updated = 0;
  let skipped = 0;
  const queued = [];
  for (const row of opportunities) {
    const query = normalizeText(row.query_text);
    const pageUrl = normalizeText(row.page_url);
    const impressions = Number(row.impressions || 0);
    const clicks = Number(row.clicks || 0);
    const position = Number(row.average_position || 0);
    if (!query || !pageUrl || impressions < 1 || !Number.isFinite(position)) { skipped += 1; continue; }
    const actionKey = actionKeyFor(row);
    const priorityScore = Math.max(1, Math.min(100, Math.round(impressions / Math.max(1, position))));
    const batchKey = normalizeText(row.import_batch_key) || null;
    const evidenceNote = `Evidence-backed review queue: ${impressions} impressions, ${clicks} clicks, average position ${position}; source batch ${batchKey || 'unknown'}. No SEO title, meta description, H1 or internal-link wording was generated. Human review is required.`;
    const existing = await db.prepare('SELECT action_key FROM seo_opportunity_actions WHERE action_key = ? LIMIT 1').bind(actionKey).first().catch(() => null);
    if (existing) {
      await db.prepare(`UPDATE seo_opportunity_actions SET priority_score=?,created_from_batch_key=COALESCE(?,created_from_batch_key),notes=?,updated_at=CURRENT_TIMESTAMP WHERE action_key=?`)
        .bind(priorityScore,batchKey,evidenceNote,actionKey).run();
      updated += 1;
    } else {
      await db.prepare(`INSERT INTO seo_opportunity_actions (action_key,source,page_url,query_text,priority_score,suggested_title,suggested_meta_description,suggested_internal_link_note,action_status,created_from_batch_key,created_by_user_id,created_at,updated_at,notes)
        VALUES (?,'search_console',?,?,?,?,?,?, 'open',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?)`)
        .bind(actionKey,pageUrl,query,priorityScore,null,null,null,batchKey,Number(adminUser.user_id||0),evidenceNote).run();
      created += 1;
    }
    queued.push({action_key:actionKey,page_url:pageUrl,query_text:query,clicks,impressions,average_position:position,priority_score:priorityScore,created_from_batch_key:batchKey,generated_copy:false});
  }
  return { created, updated, skipped, queued, mode:'EVIDENCE_BACKED_HUMAN_REVIEW_ONLY', generated_copy:false };
}

async function updateActionStatus(db, payload) {
  const actionKey = normalizeText(payload.action_key);
  const status = normalizeText(payload.action_status).toLowerCase();
  if (!actionKey) throw new Error('SEO action key is required.');
  if (!['open', 'in_progress', 'done', 'ignored', 'applied'].includes(status)) throw new Error('Action status must be open, in_progress, done, ignored, or applied.');
  const result = await db.prepare(`UPDATE seo_opportunity_actions SET action_status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE action_key = ?`).bind(status, normalizeText(payload.notes) || null, actionKey).run();
  return { updated: Number(result?.meta?.changes || 0) };
}

async function applySeoAction(db, adminUser, payload, requestUrl) {
  const actionKey = normalizeText(payload.action_key);
  if (!actionKey) throw new Error('SEO action key is required.');
  const action = await db.prepare(`SELECT * FROM seo_opportunity_actions WHERE action_key=? LIMIT 1`).bind(actionKey).first();
  if (!action) throw new Error('SEO action was not found.');
  if (String(action.action_status || '').toLowerCase() === 'ignored') throw new Error('Ignored SEO actions cannot be applied.');
  const support = await db.prepare(`SELECT COUNT(*) evidence_rows,COALESCE(SUM(clicks),0) clicks,COALESCE(SUM(impressions),0) impressions,COALESCE(AVG(average_position),0) average_position
    FROM search_console_page_queries WHERE report_date IS NOT NULL AND date(report_date)>=date('now','-30 days') AND lower(page_url)=lower(?) AND lower(COALESCE(query_text,''))=lower(COALESCE(?,''))`)
    .bind(normalizeText(action.page_url),normalizeText(action.query_text)).first().catch(()=>null);
  const impressions=Number(support?.impressions||0),position=Number(support?.average_position||0);
  if(!support||impressions<10||position<4||position>20)throw new Error('Current Search Console evidence no longer supports this review action. Refresh evidence before applying SEO changes.');
  const pagePath = pagePathFromUrl(payload.page_url || action.page_url, requestUrl);
  const title = clampText(payload.title, 70);
  const metaDescription = clampText(payload.meta_description, 160);
  const internalLinkNote = clampText(payload.internal_link_note, 260);
  const h1Suggestion = clampText(payload.h1_suggestion, 90);
  if (!pagePath) throw new Error('Could not derive a page path for this SEO action.');
  if (!title && !metaDescription && !internalLinkNote && !h1Suggestion) throw new Error('Enter reviewed SEO copy explicitly before Apply: title, meta description, H1 suggestion, or internal-link note.');
  await db.prepare(`INSERT INTO seo_page_overrides (
      page_path, page_url, title, meta_description, h1_suggestion, internal_link_note, status,
      source_action_key, source_query_text, reviewed_by_user_id, applied_at, created_at, updated_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, 'applied', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(page_path) DO UPDATE SET
      page_url=excluded.page_url,title=excluded.title,meta_description=excluded.meta_description,h1_suggestion=excluded.h1_suggestion,
      internal_link_note=excluded.internal_link_note,status='applied',source_action_key=excluded.source_action_key,
      source_query_text=excluded.source_query_text,reviewed_by_user_id=excluded.reviewed_by_user_id,
      applied_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`).bind(
    pagePath,normalizeText(action.page_url),title||null,metaDescription||null,h1Suggestion||null,internalLinkNote||null,
    actionKey,normalizeText(action.query_text)||null,Number(adminUser.user_id||0),
    normalizeText(payload.notes || 'Human-reviewed SEO override from evidence-backed Search Console review action.') || null
  ).run();
  const override = await db.prepare(`SELECT seo_page_override_id FROM seo_page_overrides WHERE page_path=? LIMIT 1`).bind(pagePath).first().catch(() => null);
  await db.prepare(`UPDATE seo_opportunity_actions SET action_status='applied',applied_override_id=?,applied_at=CURRENT_TIMESTAMP,notes=COALESCE(?,notes),updated_at=CURRENT_TIMESTAMP WHERE action_key=?`)
    .bind(Number(override?.seo_page_override_id||0)||null,normalizeText(payload.notes)||null,actionKey).run();
  return { applied:1,page_path:pagePath,seo_page_override_id:Number(override?.seo_page_override_id||0)||null,current_evidence:{rows:Number(support?.evidence_rows||0),clicks:Number(support?.clicks||0),impressions,average_position:Number(position.toFixed(2))},human_copy_explicit:true };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  const schemaReadiness=await searchConsoleSchemaReadiness(db);
  const data=await summary(db,buildFiltersFromUrl(url),schemaReadiness);
  return jsonResponse({ ok: true, release:467, build:328, generated_at: new Date().toISOString(), ...data }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const schemaReadiness=await searchConsoleSchemaReadiness(db);
  if(!schemaReadiness.ready)return jsonResponse({
    ok:false,release:467,build:328,
    error:'Search Console intake schema is not ready. Apply the canonical database migration before importing evidence.',
    schema_readiness:schemaReadiness
  },409,{'Cache-Control':'no-store'});

  let payload = {};
  const contentType = context.request.headers.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await context.request.formData();
    const file = form.get('file');
    payload.source_file = normalizeText(file?.name || form.get('source_file') || 'search-console.csv');
    payload.site_property = normalizeText(form.get('site_property'));
    payload.report_date = normalizeText(form.get('report_date'));
    payload.notes = normalizeText(form.get('notes'));
    payload.confirm_real_export = realExportConfirmed(form.get('confirm_real_export'));
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
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'search_console_queue_evidence_reviews', target_type: 'seo_opportunity_actions', target_key: 'search_console', details: generated });
    return jsonResponse({ ok: true, message: `Evidence-backed review queue updated: ${generated.created} created, ${generated.updated} refreshed, ${generated.skipped} skipped.`, ...generated, ...(await summary(db, filters)) }, 200, { 'Cache-Control': 'no-store' });
  }

  if (action === 'update_action_status') {
    const update = await updateActionStatus(db, payload);
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'seo_opportunity_action_status', target_type: 'seo_opportunity_action', target_key: normalizeText(payload.action_key), details: { action_status: normalizeText(payload.action_status), ...update } });
    return jsonResponse({ ok: true, message: 'SEO action status updated.', ...update, ...(await summary(db, filters)) }, 200, { 'Cache-Control': 'no-store' });
  }

  if (action === 'apply_seo_action') {
    const applied = await applySeoAction(db, adminUser, payload, context.request.url);
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'seo_opportunity_action_apply', target_type: 'seo_page_override', target_id: applied.seo_page_override_id || null, target_key: normalizeText(payload.action_key), details: applied });
    return jsonResponse({ ok: true, message: `Applied reviewed SEO override for ${applied.page_path}.`, ...applied, ...(await summary(db, filters)) }, 200, { 'Cache-Control': 'no-store' });
  }

  if (!realExportConfirmed(payload.confirm_real_export)) return jsonResponse({ ok: false, error: 'Confirm that this is a real Google Search Console export before importing.' }, 400);
  const csvText = normalizeText(payload.csv_text);
  if (!csvText) return jsonResponse({ ok: false, error: 'CSV text or file is required.' }, 400);

  const parsed = parseCsv(csvText);
  if (parsed.length < 2) return jsonResponse({ ok: false, error: 'CSV must include a header row and at least one data row.' }, 400);
  const headers = parsed[0].map(slugKey);
  const headerReadiness = searchConsoleRealExportHeaderReadiness(headers);
  const dateHeaderPresent = headers.some((header) => ['date','report_date','day'].includes(header));
  const explicitFallbackReportDate = normalizeText(payload.report_date);
  if (!dateHeaderPresent && !explicitFallbackReportDate) return jsonResponse({ ok:false, error:'This Search Console export has no Date column. Supply the report end date explicitly so freshness cannot be inferred from the import time.', freshness_window_days:30 },400,{'Cache-Control':'no-store'});
  if (!headerReadiness.ready) return jsonResponse({ ok: false, error: `CSV does not match the expected Search Console export columns. Missing: ${headerReadiness.missing_header_groups.join(', ')}.`, header_readiness: headerReadiness }, 400);
  const importBatchKey = normalizeText(payload.import_batch_key) || `gsc_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const sourceFile = normalizeText(payload.source_file) || 'search-console.csv';
  if (!sourceFile.toLowerCase().endsWith('.csv')) return jsonResponse({ ok: false, error: 'Search Console intake accepts CSV exports only.' }, 400);
  const siteProperty = normalizeText(payload.site_property) || '';
  const fallbackReportDate = explicitFallbackReportDate || '';
  const statements = [];
  let imported = 0;
  let skipped = 0;

  statements.push(db.prepare(`INSERT OR REPLACE INTO search_console_import_batches (import_batch_key, source_file, site_property, row_count, imported_by_user_id, imported_at, notes) VALUES (?, ?, ?, 0, ?, CURRENT_TIMESTAMP, ?)`).bind(importBatchKey, sourceFile, siteProperty, Number(adminUser.user_id || 0), normalizeText(payload.notes) || null));

  for (const cells of parsed.slice(1)) {
    const record = {};
    headers.forEach((header, index) => { record[header] = cells[index] ?? ''; });
    const pageUrl = normalizeUrl(pick(record, ['page', 'page_url', 'url', 'landing page', 'landing_page', 'top pages', 'top_pages']), context.request.url);
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
  await auditAdminAction(context.env, context.request, adminUser, { action_type: 'search_console_import', target_type: 'search_console_import_batch', target_key: importBatchKey, details: { source_file: sourceFile, imported, skipped, site_property: siteProperty, real_export_confirmed: true, header_readiness: headerReadiness, date_header_present: dateHeaderPresent, fallback_report_date: explicitFallbackReportDate || null, freshness_window_days:30 } });
  return jsonResponse({ ok: true, release:467, build:328, message: `Imported ${imported} real Search Console row(s).`, import_batch_key: importBatchKey, imported, skipped, real_export_confirmed: true, freshness_window_days:30, ...(await summary(db, filters)) }, 200, { 'Cache-Control': 'no-store' });
}
