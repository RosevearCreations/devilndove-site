// Release 467 Build 210 — read-only Custom Work projection including structured Intake 2.0 fields.
// This endpoint adds no mutation authority. Existing Custom Requests, Orders and Gift Card
// write routes remain authoritative and are reached only by explicit existing workflows.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';

export const BUILD = 151;
export const CONTRACT_ID = 'operations-custom-work-build151-read';
export const OWNER = 'operations';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }

async function tableReady(db, table) {
  try { return rows(await db.prepare(`PRAGMA table_info(${table})`).all()).length > 0; }
  catch { return false; }
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin authentication required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const required = ['custom_requests','custom_request_quote_drafts','custom_request_payment_request_drafts','custom_request_order_drafts','orders','gift_cards','gift_card_redemptions'];
  const readiness = Object.fromEntries(await Promise.all(required.map(async (table) => [table, await tableReady(db, table)])));
  const missing = required.filter((table) => !readiness[table]);

  try {
    const requestRows = rows(await db.prepare(`
      SELECT custom_request_id,request_key,name,email,phone,request_type,product_interest,deadline_date,budget_cents,
             quantity,project_intent,intended_use,organization_name,event_context_structured,supplied_item,
             desired_material,desired_finish,personalization_text,requested_capability_key,tolerance_size_notes,help_choose_method,
             message,attachment_urls_json,consent_to_contact,status,admin_notes,reference_upload_count,created_at,updated_at
      FROM custom_requests
      ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'reviewing' THEN 1 WHEN 'quote_needed' THEN 2 WHEN 'quoted' THEN 3 WHEN 'accepted' THEN 4 ELSE 5 END,
               datetime(updated_at) DESC
      LIMIT 80
    `).all());

    const quoteRows = readiness.custom_request_quote_drafts ? rows(await db.prepare(`
      SELECT custom_request_id,custom_request_quote_draft_id,quote_status,title,requested_deadline,quote_total_cents,updated_at
      FROM custom_request_quote_drafts ORDER BY datetime(updated_at) DESC LIMIT 160
    `).all()) : [];
    const paymentRows = readiness.custom_request_payment_request_drafts ? rows(await db.prepare(`
      SELECT custom_request_id,custom_request_payment_request_draft_id,payment_request_status,request_type,amount_cents,due_date,updated_at
      FROM custom_request_payment_request_drafts ORDER BY datetime(updated_at) DESC LIMIT 160
    `).all()) : [];
    const orderDraftRows = readiness.custom_request_order_drafts ? rows(await db.prepare(`
      SELECT custom_request_id,custom_request_order_draft_id,order_draft_status,order_id,total_cents,updated_at
      FROM custom_request_order_drafts ORDER BY datetime(updated_at) DESC LIMIT 160
    `).all()) : [];
    const pickupOrders = readiness.orders ? rows(await db.prepare(`
      SELECT order_id,order_number,customer_name,customer_email,order_status,payment_status,total_cents,currency,notes,created_at,updated_at
      FROM orders
      WHERE lower(COALESCE(fulfillment_type,''))='pickup'
        AND lower(COALESCE(order_status,'')) NOT IN ('complete','completed','cancelled','canceled','refunded')
      ORDER BY datetime(updated_at) DESC LIMIT 40
    `).all()) : [];

    let giftCards = { active: 0, pending_activation: 0, remaining_cents: 0, recent_redemptions: 0 };
    if (readiness.gift_cards) {
      const summary = await db.prepare(`
        SELECT SUM(CASE WHEN lower(COALESCE(status,''))='active' THEN 1 ELSE 0 END) AS active,
               SUM(CASE WHEN lower(COALESCE(status,''))='pending_activation' THEN 1 ELSE 0 END) AS pending_activation,
               SUM(CASE WHEN lower(COALESCE(status,''))='active' THEN COALESCE(remaining_amount_cents,0) ELSE 0 END) AS remaining_cents
        FROM gift_cards
      `).first().catch(() => null);
      giftCards = { ...giftCards, active: Number(summary?.active || 0), pending_activation: Number(summary?.pending_activation || 0), remaining_cents: Number(summary?.remaining_cents || 0) };
    }
    if (readiness.gift_card_redemptions) {
      const recent = await db.prepare(`SELECT COUNT(*) AS n FROM gift_card_redemptions WHERE datetime(created_at)>=datetime('now','-30 days')`).first().catch(() => null);
      giftCards.recent_redemptions = Number(recent?.n || 0);
    }

    const latestByRequest = (list) => {
      const map = new Map();
      for (const row of list) { const id = Number(row.custom_request_id || 0); if (id && !map.has(id)) map.set(id, row); }
      return map;
    };
    const quotes = latestByRequest(quoteRows), payments = latestByRequest(paymentRows), orderDrafts = latestByRequest(orderDraftRows);
    const custom_work = requestRows.map((row) => ({ ...row, latest_quote: quotes.get(Number(row.custom_request_id || 0)) || null, latest_payment_request: payments.get(Number(row.custom_request_id || 0)) || null, latest_order_draft: orderDrafts.get(Number(row.custom_request_id || 0)) || null }));

    return json({
      ok: true,
      build: 210,
      contract: CONTRACT_ID,
      owner: OWNER,
      requested_by: { user_id: Number(adminUser.user_id || 0), email: adminUser.email || '', display_name: adminUser.display_name || '' },
      schema_ready: missing.length === 0,
      missing_tables: missing,
      checked_tables: required,
      custom_work,
      pickup_orders: pickupOrders,
      gift_cards: giftCards,
      request_time_schema_mutation: false,
      mutation_authority_moved: false,
      provider_execution: false,
      provider_publication: false,
      event_offline_stock_authority: false,
      event_unique_stock_requires_live_revalidation: true,
      structured_intake_2: true,
      manufacturing_route_authority: 'BUILD_211_NOT_YET_STARTED',
      connectivity_contract: 'READ_ONLY_LIVE_AUTHORITY_WITH_VISIBLE_OFFLINE_STATE'
    });
  } catch (error) {
    return json({ ok: false, build: BUILD, contract: CONTRACT_ID, request_time_schema_mutation: false, error: String(error?.message || error || 'Custom Work read failed.') }, 500);
  }
}
