// Devil n Dove Build 373 — non-mutating Custom Requests marketplace CSV export.
// Reads previously prepared export packs only. It never creates schema, seeds presets, or changes packs.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';

export const BUILD = 373;
export const CONTRACT_ID = 'operations-custom-requests-marketplace-export';
export const OWNER = 'operations';

const ALLOWED_CHANNELS = new Set(['all', 'etsy', 'facebook', 'pinterest', 'manual']);
const REQUIRED_TABLE = 'custom_request_marketplace_export_packs';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function clean(value, limit = 4000) {
  const text = String(value ?? '').trim();
  return text.length > limit ? text.slice(0, limit).trim() : text;
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(String(value || '{}'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseTags(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed) ? parsed.map((item) => clean(item, 120)).filter(Boolean).join(', ') : clean(value, 1200);
  } catch {
    return clean(value, 1200);
  }
}

async function tableExists(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return rows(result).length > 0;
  } catch {
    return false;
  }
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvResponse(filename, headers, rowsData) {
  const body = [
    headers.join(','),
    ...rowsData.map((row) => headers.map((header) => csvEscape(row[header] ?? '')).join(',')),
  ].join('\n');

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-dd-contract': CONTRACT_ID,
      'x-dd-build': String(BUILD),
      'x-dd-schema-ready': 'true',
      'x-dd-request-time-schema-mutation': 'false',
      'x-dd-mutation-ownership-moved': 'false',
    },
  });
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const requestedChannel = clean(url.searchParams.get('channel') || 'all', 40).toLowerCase();
  const channel = ALLOWED_CHANNELS.has(requestedChannel) ? requestedChannel : 'all';

  if (!(await tableExists(db, REQUIRED_TABLE))) {
    return jsonResponse({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      schema_ready: false,
      missing_tables: [REQUIRED_TABLE],
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      error_code: 'custom_requests_marketplace_export_schema_not_ready',
      error: 'Marketplace export packs are not available in the current database schema.',
    }, 409, { 'Cache-Control': 'no-store' });
  }

  try {
    const packRows = rows(await db.prepare(`
      SELECT *
      FROM custom_request_marketplace_export_packs
      ORDER BY datetime(updated_at) DESC, custom_request_marketplace_export_pack_id DESC
      LIMIT 500
    `).all());

    const headers = [
      'channel',
      'pack_key',
      'custom_request_id',
      'title',
      'description',
      'price',
      'category',
      'shipping_profile',
      'tags',
      'destination_url',
      'readiness_notes',
      'status',
      'updated_at',
    ];

    const output = [];
    for (const pack of packRows) {
      const etsy = parseJsonObject(pack.etsy_csv_row_json);
      const facebook = parseJsonObject(pack.facebook_csv_row_json);
      const pinterest = parseJsonObject(pack.pinterest_csv_row_json);
      const manual = parseJsonObject(pack.manual_csv_row_json);
      const fallbackTags = parseTags(pack.tags_json);

      const add = (name, row) => output.push({
        channel: name,
        pack_key: pack.pack_key || '',
        custom_request_id: pack.custom_request_id || '',
        title: row.title || pack.etsy_title || pack.facebook_title || pack.pinterest_title || '',
        description: row.description || pack.manual_listing_copy || '',
        price: row.price || '',
        category: row.category || row.board || '',
        shipping_profile: row.shipping_profile || '',
        tags: row.tags || fallbackTags,
        destination_url: row.destination_url || '/custom-request/',
        readiness_notes: pack.readiness_notes || 'Review final price, media consent, shipping, and channel rules before posting.',
        status: pack.pack_status || 'draft',
        updated_at: pack.updated_at || '',
      });

      if (channel === 'all' || channel === 'etsy') add('etsy', etsy);
      if (channel === 'all' || channel === 'facebook') add('facebook_marketplace', facebook);
      if (channel === 'all' || channel === 'pinterest') add('pinterest', pinterest);
      if (channel === 'all' || channel === 'manual') add('manual_listing', manual);
    }

    return csvResponse(`devilndove-marketplace-${channel}-export.csv`, headers, output);
  } catch (error) {
    return jsonResponse({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      schema_ready: true,
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      error_code: 'custom_requests_marketplace_export_failed',
      error: String(error?.message || error || 'Marketplace export failed.'),
    }, 500, { 'Cache-Control': 'no-store' });
  }
}
