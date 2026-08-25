// Devil n Dove Build 370 — Operations-owned Custom Requests startup read contract.
// The contract forces the normal dashboard/list path, verifies required read tables without
// creating or altering schema, and does not move any Custom Requests mutation authority.

import { getDb } from '../../_lib/adminAudit.js';
import { onRequestGet as legacyGet } from '../custom-requests.js';

export const BUILD = 370;
export const CONTRACT_ID = 'operations-custom-requests-read';
export const OWNER = 'operations';
export const COMPATIBILITY_ROUTE = '/api/admin/custom-requests';

const REQUIRED_TABLES = Object.freeze([
  'custom_requests',
  'custom_request_quote_drafts',
  'custom_request_job_drafts',
  'custom_request_product_drafts',
  'custom_request_reply_templates',
  'custom_request_payment_candidates',
  'custom_request_quote_share_links',
  'custom_request_quote_line_items',
  'custom_request_quote_revisions',
  'custom_request_payment_request_drafts',
  'custom_request_order_drafts',
  'custom_request_payment_links',
  'custom_request_payment_link_approval_gates',
  'custom_request_payment_checkout_records',
  'custom_request_order_status_links',
  'custom_request_marketplace_export_packs',
  'custom_request_fulfillment_prompts',
  'custom_request_order_stage_events',
  'custom_request_public_proof_candidates',
  'marketplace_channel_presets',
  'custom_request_payment_provider_tests',
  'custom_request_reference_uploads',
  'custom_request_conversion_events',
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableReady(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return rows(result).length > 0;
  } catch {
    return false;
  }
}

async function schemaReadiness(db) {
  const checks = await Promise.all(REQUIRED_TABLES.map(async (table) => ({
    table,
    ready: await tableReady(db, table),
  })));
  const missingTables = checks.filter((item) => !item.ready).map((item) => item.table);
  return Object.freeze({
    schema_ready: missingTables.length === 0,
    missing_tables: Object.freeze(missingTables),
    checked_tables: REQUIRED_TABLES,
  });
}

function normalListRequest(request) {
  const url = new URL(request.url);
  url.pathname = COMPATIBILITY_ROUTE;
  url.search = '';
  return new Request(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) {
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      error_code: 'database_binding_missing',
      error: 'Database binding is not configured.',
    }, 500);
  }

  try {
    const readContext = { ...context, request: normalListRequest(context.request) };
    const response = await legacyGet(readContext);
    const data = await response.json().catch(() => null);

    if (!response.ok || data?.ok === false) {
      return json({
        ok: false,
        build: BUILD,
        contract: CONTRACT_ID,
        owner: OWNER,
        request_time_schema_mutation: false,
        mutation_ownership_moved: false,
        error_code: data?.error_code || 'custom_requests_child_read_failed',
        error: data?.error || `Custom Requests read failed (${response.status}).`,
      }, response.status || 500);
    }

    const readiness = await schemaReadiness(db);
    return json({
      ...data,
      ok: true,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      schema_ready: readiness.schema_ready,
      missing_tables: readiness.missing_tables,
      checked_tables: readiness.checked_tables,
      compatibility_post_authority: COMPATIBILITY_ROUTE,
      compatibility_post_mutation_ownership_moved: false,
      marketplace_csv_legacy_get_outside_contract: true,
    });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      error_code: 'custom_requests_contract_threw',
      error: String(error?.message || error || 'Custom Requests read contract failed.'),
    }, 500);
  }
}
