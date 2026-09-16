// Release 467 Build 161 — read-only bounded universal Admin search.
// Searches existing business authorities by name/SKU/reference without creating a second data authority.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = 161;
const MAX_PER_SOURCE = 6;
const MAX_RESULTS = 30;
const SOURCES = Object.freeze([
  { area:'Products', kind:'Product', table:'products', id:'product_id', title:['name','sku','slug'], detail:['sku','slug','product_number','status'], search:['name','sku','slug','product_number'], href:'/admin/products/' },
  { area:'Inventory & Tools', kind:'Inventory', table:'site_item_inventory', id:'site_item_inventory_id', title:['item_name','name','display_name','source_key'], detail:['sku','supplier_sku','source_key','resource_kind','item_type'], search:['item_name','name','display_name','sku','supplier_sku','source_key','resource_kind','item_type'], href:'/admin/inventory-operations/' },
  { area:'Projects', kind:'Creative project', table:'creative_projects', id:'creative_project_id', title:['project_title','name','title','creative_project_key'], detail:['creative_project_key','project_status','governance_status'], search:['project_title','name','title','creative_project_key','project_status'], href:'/admin/creative-process/' },
  { area:'Orders & Finance', kind:'Order', table:'orders', id:'order_id', title:['order_number','customer_name'], detail:['order_number','customer_name','customer_email','order_status','payment_status'], search:['order_number','customer_name','customer_email','order_status','payment_status'], href:'/admin/orders/' },
  { area:'Custom Work', kind:'Custom request', table:'custom_requests', id:'custom_request_id', title:['name','product_interest','request_type','request_key'], detail:['request_key','email','product_interest','request_type','status'], search:['request_key','name','email','product_interest','request_type','status'], href:'/admin/custom-request/' },
  { area:'Content', kind:'Content project', table:'content_projects', id:'content_project_id', title:['project_title','title','name','content_project_key'], detail:['content_project_key','project_status','review_status','source_type'], search:['project_title','title','name','content_project_key','project_status','review_status'], href:'/admin/content-studio/' },
  { area:'Media', kind:'Media asset', table:'media_assets', id:'media_asset_id', title:['original_filename','title','label','object_key'], detail:['object_key','mime_type','storage_provider'], search:['original_filename','title','label','object_key','mime_type'], href:'/admin/media-content-studio/' },
]);

const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const ident = (value) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(value || '')) ? String(value) : '';

async function schema(db) {
  const existing = new Set(rows(await db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view')").all()).map((row) => String(row?.name || '')));
  const out = new Map();
  for (const source of SOURCES) {
    if (!existing.has(source.table)) continue;
    try {
      const columns = new Set(rows(await db.prepare(`PRAGMA table_info(${ident(source.table)})`).all()).map((row) => String(row?.name || '')));
      out.set(source.table, columns);
    } catch {}
  }
  return out;
}

function firstText(row, fields) {
  for (const field of fields) {
    const value = normalizeText(row?.[field]);
    if (value) return value;
  }
  return '';
}

async function searchSource(db, source, columns, q, perSource) {
  if (!columns?.has(source.id)) return [];
  const searchColumns = source.search.filter((field) => columns.has(field) && ident(field));
  if (!searchColumns.length) return [];
  const projection = [...new Set([source.id, ...source.title, ...source.detail].filter((field) => columns.has(field) && ident(field)))];
  const where = searchColumns.map((field) => `LOWER(COALESCE(CAST(${field} AS TEXT),'')) LIKE ?`).join(' OR ');
  const sql = `SELECT ${projection.join(', ')} FROM ${ident(source.table)} WHERE ${where} ORDER BY ${ident(source.id)} DESC LIMIT ?`;
  const like = `%${q.toLowerCase()}%`;
  const result = await db.prepare(sql).bind(...searchColumns.map(() => like), perSource).all();
  return rows(result).map((row) => {
    const id = Number(row?.[source.id] || 0);
    const label = firstText(row, source.title) || `${source.kind} ${id || ''}`.trim();
    const details = [];
    for (const field of source.detail) {
      const value = columns.has(field) ? normalizeText(row?.[field]) : '';
      if (value && value !== label && !details.includes(value)) details.push(value);
    }
    return {
      area: source.area,
      kind: source.kind,
      id,
      label,
      detail: details.slice(0, 3).join(' • '),
      reference: firstText(row, source.detail),
      href: `${source.href}?dd_focus_kind=${encodeURIComponent(source.kind.toLowerCase().replace(/[^a-z0-9]+/g,'-'))}&dd_focus_id=${encodeURIComponent(id || '')}&dd_search=${encodeURIComponent(q)}`,
    };
  });
}

export async function onRequestGet({ request, env }) {
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok:false, error:'Unauthorized.' }, 401, { 'Cache-Control':'no-store' });
  const db = getDb(env);
  if (!db) return jsonResponse({ ok:false, error:'Database binding is not configured.' }, 500, { 'Cache-Control':'no-store' });
  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get('q')).slice(0, 100);
  const requested = Number(url.searchParams.get('limit') || MAX_RESULTS);
  const totalLimit = Math.max(5, Math.min(MAX_RESULTS, Number.isFinite(requested) ? requested : MAX_RESULTS));
  if (q.length < 2) return jsonResponse({ ok:true, release:467, build:BUILD, query:q, results:[], search_required:true, min_query_length:2 }, 200, { 'Cache-Control':'no-store' });

  try {
    const columnMap = await schema(db);
    const settled = await Promise.allSettled(SOURCES.map((source) => searchSource(db, source, columnMap.get(source.table), q, MAX_PER_SOURCE)));
    const results = settled.flatMap((entry) => entry.status === 'fulfilled' ? entry.value : []).slice(0, totalLimit);
    return jsonResponse({
      ok:true,
      release:467,
      build:BUILD,
      query:q,
      results,
      diagnostics:{ source_count:SOURCES.length, available_source_count:columnMap.size, failed_source_count:settled.filter((entry) => entry.status === 'rejected').length, bounded:true, read_only:true },
    }, 200, { 'Cache-Control':'no-store' });
  } catch (error) {
    return jsonResponse({ ok:false, error:error?.message || 'Universal search is unavailable.' }, 500, { 'Cache-Control':'no-store' });
  }
}
