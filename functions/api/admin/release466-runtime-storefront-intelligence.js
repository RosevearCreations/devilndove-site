import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value) { return String(value || '').trim(); }
function boundedDays(value, fallback = 28) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(90, Math.round(n))) : fallback;
}
function percentile(values, percentileValue = 0.75) {
  const clean = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  const index = Math.max(0, Math.min(clean.length - 1, Math.ceil(clean.length * percentileValue) - 1));
  return Number(clean[index].toFixed(4));
}
function metricState(name, value) {
  if (value == null || !Number.isFinite(Number(value))) return 'not_observed';
  const n = Number(value);
  if (name === 'LCP_ms') return n <= 2500 ? 'good' : (n <= 4000 ? 'needs_improvement' : 'poor');
  if (name === 'INP_ms') return n <= 200 ? 'good' : (n <= 500 ? 'needs_improvement' : 'poor');
  if (name === 'CLS') return n <= 0.1 ? 'good' : (n <= 0.25 ? 'needs_improvement' : 'poor');
  return 'observed';
}
function parseDetails(value) {
  try { const parsed = JSON.parse(String(value || '{}')); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; }
}

async function tableSet(db, names) {
  const placeholders = names.map(() => '?').join(',');
  const found = rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...names).all());
  return new Set(found.map((row) => text(row.name)));
}

async function runtimeIntelligence(db, days) {
  const modifier = `-${days} days`;
  const summary = await db.prepare(`SELECT
      COUNT(*) AS total_count,
      SUM(CASE WHEN incident_code='client_js_error' THEN 1 ELSE 0 END) AS js_errors,
      SUM(CASE WHEN incident_code='client_unhandled_rejection' THEN 1 ELSE 0 END) AS unhandled_rejections,
      SUM(CASE WHEN incident_code='client_resource_error' THEN 1 ELSE 0 END) AS resource_errors,
      COUNT(DISTINCT COALESCE(json_extract(details_json,'$.page_path'),'')) AS affected_pages
    FROM runtime_incidents
    WHERE incident_scope='client_runtime' AND datetime(created_at)>=datetime('now',?)`).bind(modifier).first().catch(() => null);

  const recent = rows(await db.prepare(`SELECT runtime_incident_id,incident_code,severity,message,details_json,created_at
      FROM runtime_incidents
      WHERE incident_scope='client_runtime' AND datetime(created_at)>=datetime('now',?)
      ORDER BY datetime(created_at) DESC,runtime_incident_id DESC LIMIT 40`).bind(modifier).all().catch(() => ({ results: [] })));

  const rumRows = rows(await db.prepare(`SELECT details_json,created_at FROM runtime_incidents
      WHERE incident_scope='real_user_performance' AND incident_code='rum_web_vitals'
        AND datetime(created_at)>=datetime('now',?)
      ORDER BY datetime(created_at) DESC LIMIT 800`).bind(modifier).all().catch(() => ({ results: [] })));
  const samples = rumRows.map((row) => ({ created_at: row.created_at, ...parseDetails(row.details_json) }));
  const byMetric = { LCP_ms: [], INP_ms: [], CLS: [], FCP_ms: [], TTFB_ms: [] };
  for (const sample of samples) {
    const metrics = sample.metrics && typeof sample.metrics === 'object' ? sample.metrics : {};
    for (const key of Object.keys(byMetric)) if (Number.isFinite(Number(metrics[key]))) byMetric[key].push(Number(metrics[key]));
  }
  const p75 = Object.fromEntries(Object.entries(byMetric).map(([key, values]) => [key, percentile(values, 0.75)]));
  const states = Object.fromEntries(['LCP_ms', 'INP_ms', 'CLS'].map((key) => [key, metricState(key, p75[key])]));
  const coreStates = Object.values(states);
  const overall = coreStates.includes('poor') ? 'poor' : (coreStates.includes('needs_improvement') ? 'needs_improvement' : (coreStates.every((value) => value === 'good') ? 'good' : 'not_enough_data'));

  return {
    window_days: days,
    client_errors: {
      total_count: Number(summary?.total_count || 0),
      js_errors: Number(summary?.js_errors || 0),
      unhandled_rejections: Number(summary?.unhandled_rejections || 0),
      resource_errors: Number(summary?.resource_errors || 0),
      affected_pages: Number(summary?.affected_pages || 0),
      recent: recent.map((row) => {
        const details = parseDetails(row.details_json);
        return {
          runtime_incident_id: Number(row.runtime_incident_id || 0), incident_code: row.incident_code, severity: row.severity,
          message: row.message, page_path: text(details.page_path) || '/', source: text(details.source), created_at: row.created_at,
        };
      }),
    },
    rum: {
      sample_count: samples.length,
      percentile: 75,
      p75,
      states,
      overall,
      good_thresholds: { LCP_ms: 2500, INP_ms: 200, CLS: 0.1 },
      poor_thresholds: { LCP_ms: 4000, INP_ms: 500, CLS: 0.25 },
    },
  };
}

async function searchConsoleIntelligence(db, days, available) {
  const required = ['search_console_import_batches', 'search_console_page_queries'];
  const schemaReady = required.every((name) => available.has(name));
  if (!schemaReady) {
    return { schema_ready: false, missing_tables: required.filter((name) => !available.has(name)), ingestion: 'Search Console CSV/API staging unavailable until canonical baseline contains the required tables.' };
  }
  const modifier = `-${days} days`;
  const totals = await db.prepare(`SELECT COUNT(*) AS row_count,COALESCE(SUM(clicks),0) AS clicks,COALESCE(SUM(impressions),0) AS impressions,
      CASE WHEN SUM(impressions)>0 THEN ROUND(1.0*SUM(clicks)/SUM(impressions),5) ELSE 0 END AS ctr,
      CASE WHEN SUM(impressions)>0 THEN ROUND(SUM(average_position*impressions)/SUM(impressions),2) ELSE 0 END AS weighted_position,
      MAX(report_date) AS latest_report_date
    FROM search_console_page_queries
    WHERE date(COALESCE(report_date,created_at))>=date('now',?)`).bind(modifier).first().catch(() => null);
  const latestBatch = await db.prepare(`SELECT import_batch_key,source_file,site_property,row_count,imported_at FROM search_console_import_batches ORDER BY datetime(imported_at) DESC LIMIT 1`).first().catch(() => null);
  const opportunities = rows(await db.prepare(`SELECT query_text,page_url,SUM(clicks) AS clicks,SUM(impressions) AS impressions,
      ROUND(AVG(average_position),2) AS average_position,
      CASE WHEN SUM(impressions)>0 THEN ROUND(1.0*SUM(clicks)/SUM(impressions),5) ELSE 0 END AS ctr
    FROM search_console_page_queries
    WHERE date(COALESCE(report_date,created_at))>=date('now',?) AND COALESCE(query_text,'')<>''
    GROUP BY query_text,page_url
    HAVING SUM(impressions)>=10 AND AVG(average_position) BETWEEN 4 AND 20
    ORDER BY impressions DESC,average_position ASC LIMIT 30`).bind(modifier).all().catch(() => ({ results: [] })));
  const lowCtr = rows(await db.prepare(`SELECT page_url,SUM(clicks) AS clicks,SUM(impressions) AS impressions,
      CASE WHEN SUM(impressions)>0 THEN ROUND(1.0*SUM(clicks)/SUM(impressions),5) ELSE 0 END AS ctr,
      ROUND(AVG(average_position),2) AS average_position
    FROM search_console_page_queries
    WHERE date(COALESCE(report_date,created_at))>=date('now',?)
    GROUP BY page_url
    HAVING SUM(impressions)>=20 AND (1.0*SUM(clicks)/SUM(impressions))<0.02 AND AVG(average_position)<=20
    ORDER BY impressions DESC LIMIT 20`).bind(modifier).all().catch(() => ({ results: [] })));
  return {
    schema_ready: true,
    window_days: days,
    totals: {
      row_count: Number(totals?.row_count || 0), clicks: Number(totals?.clicks || 0), impressions: Number(totals?.impressions || 0),
      ctr: Number(totals?.ctr || 0), weighted_position: Number(totals?.weighted_position || 0), latest_report_date: totals?.latest_report_date || null,
    },
    latest_batch: latestBatch || null,
    striking_distance_queries: opportunities,
    low_ctr_pages: lowCtr,
    ingestion: 'Existing admin Search Console import remains the staging authority; direct Google API authorization is optional future external configuration.',
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  const db = getDb(env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401, { 'Cache-Control': 'no-store' });
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500, { 'Cache-Control': 'no-store' });
  const url = new URL(request.url);
  const days = boundedDays(url.searchParams.get('days'), 28);
  try {
    const names = ['runtime_incidents', 'search_console_import_batches', 'search_console_page_queries', 'seo_opportunity_actions', 'seo_page_overrides'];
    const available = await tableSet(db, names);
    if (!available.has('runtime_incidents')) return jsonResponse({ ok: false, schema_ready: false, missing_tables: ['runtime_incidents'] }, 409, { 'Cache-Control': 'no-store' });
    const [runtime, search] = await Promise.all([
      runtimeIntelligence(db, days),
      searchConsoleIntelligence(db, days, available),
    ]);
    return jsonResponse({
      ok: true,
      release: 466,
      build: 2,
      requested_by: { user_id: adminUser.user_id, email: adminUser.email, display_name: adminUser.display_name },
      runtime,
      search_console: search,
      release465_source_budget: {
        max_js_bytes: 600000, max_css_bytes: 500000, max_html_bytes: 500000,
        max_runtime_source_bytes: 18000000, max_runtime_source_files: 1800, max_inline_data_uri_bytes: 650000,
        comparison_policy: 'Source-size budget and field Web Vitals are displayed together but not mathematically combined.',
      },
      synthetic_monitor: { authority: 'scripts/release466_storefront_synthetic_monitor.py', production_mutation: false },
      production_seo_crawler: { authority: 'scripts/release466_production_seo_crawler.py', production_mutation: false },
      direct_search_console_api: { configured_by_build: false, authorization_required: true },
    }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Runtime/storefront intelligence could not be loaded.', schema_ready: false }, 500, { 'Cache-Control': 'no-store' });
  }
}
