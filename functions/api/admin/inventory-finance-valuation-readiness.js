// Release 467 Build 28 — read-only Inventory ↔ Finance valuation-readiness reconciliation.
// Consumes the Inventory-owned Build 311 current-cost contract plus optional cost-history provenance.
// It does not define book value, tax value, accounting inventory, fixed-asset treatment, or posting authority.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as loadInventoryCost } from './contracts/inventory-cost.js';

const RELEASE = 467;
const BUILD = 28;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const num = (value, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const text = (value) => String(value == null ? '' : value).trim();
const lower = (value) => text(value).toLowerCase();

function latestHistoryByItem(history = []) {
  const map = new Map();
  for (const row of Array.isArray(history) ? history : []) {
    const id = Math.max(0, Math.trunc(num(row?.site_item_inventory_id)));
    if (!id || map.has(id)) continue;
    map.set(id, row);
  }
  return map;
}

function classify(item = {}, latestHistory = null, historyAvailable = false) {
  const inventoryId = Math.max(0, Math.trunc(num(item.site_item_inventory_id)));
  const sourceType = lower(item.source_type);
  const isTool = sourceType === 'tool';
  const onHand = Math.max(0, num(item.on_hand_quantity));
  const unitCost = Math.max(0, Math.round(num(item.unit_cost_cents)));
  const operationalValue = Math.max(0, Math.round(num(item.inventory_value_cents, unitCost * onHand)));
  const historyCost = latestHistory ? Math.max(0, Math.round(num(latestHistory.new_unit_cost_cents))) : null;
  const historyMatches = latestHistory ? historyCost === unitCost : null;
  const provenancePresent = Boolean(
    latestHistory && (
      text(latestHistory.source_kind) ||
      text(latestHistory.source_id) ||
      text(latestHistory.source_reference) ||
      text(latestHistory.reason_note)
    )
  );

  let valuationState = 'review_supported';
  if (isTool) valuationState = 'tool_asset_review';
  else if (onHand <= 0) valuationState = 'no_on_hand_value';
  else if (unitCost <= 0) valuationState = 'unvalued_on_hand';
  else if (!historyAvailable) valuationState = 'provenance_unavailable';
  else if (!latestHistory) valuationState = 'provenance_missing';
  else if (!historyMatches) valuationState = 'current_cost_unreconciled';
  else if (!provenancePresent) valuationState = 'source_evidence_missing';

  const issues = [];
  if (valuationState === 'tool_asset_review') {
    issues.push({
      lane: 'finance_inventory',
      code: 'tool_asset_review',
      detail: 'Tool/equipment cost is excluded from stock valuation readiness and should be reviewed under the existing fixed-asset/accounting workflow.',
      owner_url: '/admin/accounting/#fixedAssetsCard',
    });
  } else if (valuationState === 'unvalued_on_hand') {
    issues.push({
      lane: 'inventory_finance',
      code: 'unvalued_on_hand',
      detail: 'Positive on-hand quantity has no positive current Inventory unit cost. Finance review fails closed instead of assuming zero value.',
      owner_url: '/admin/inventory-intelligence/',
    });
  } else if (valuationState === 'provenance_unavailable') {
    issues.push({
      lane: 'inventory_finance',
      code: 'provenance_unavailable',
      detail: 'Current Inventory cost exists, but the optional cost-history authority is unavailable. The operational value remains Inventory-owned; Finance provenance review is unverified.',
      owner_url: '/admin/inventory-intelligence/',
    });
  } else if (valuationState === 'provenance_missing') {
    issues.push({
      lane: 'inventory_finance',
      code: 'provenance_missing',
      detail: 'Current Inventory cost exists, but no cost-history evidence was returned for this on-hand item.',
      owner_url: '/admin/inventory-intelligence/',
    });
  } else if (valuationState === 'current_cost_unreconciled') {
    issues.push({
      lane: 'inventory_finance',
      code: 'current_cost_unreconciled',
      detail: `Current Inventory unit cost (${unitCost}¢) does not match the latest returned cost-history value (${historyCost}¢).`,
      owner_url: '/admin/inventory-intelligence/',
    });
  } else if (valuationState === 'source_evidence_missing') {
    issues.push({
      lane: 'inventory_finance',
      code: 'source_evidence_missing',
      detail: 'Latest cost history matches the current cost but contains no source/reason reference for Finance review.',
      owner_url: '/admin/inventory-intelligence/',
    });
  }

  return {
    site_item_inventory_id: inventoryId,
    source_type: text(item.source_type),
    external_key: text(item.external_key),
    item_name: text(item.item_name),
    category: text(item.category),
    supplier_name: text(item.supplier_name),
    supplier_sku: text(item.supplier_sku),
    currency: text(item.currency) || 'CAD',
    stock_unit_label: text(item.stock_unit_label) || 'unit',
    usage_unit_label: text(item.usage_unit_label) || 'unit',
    usage_units_per_stock_unit: Math.max(0.001, num(item.usage_units_per_stock_unit, 1)),
    on_hand_quantity: onHand,
    unit_cost_cents: unitCost,
    cost_per_usage_unit_cents: Math.max(0, num(item.cost_per_usage_unit_cents)),
    operational_inventory_value_cents: operationalValue,
    valuation_scope: isTool ? 'tool_or_equipment_review' : 'non_tool_stock',
    valuation_state: valuationState,
    operational_value_supported: !isTool && onHand > 0 && unitCost > 0,
    finance_review_supported: valuationState === 'review_supported',
    latest_cost_history: latestHistory ? {
      site_item_inventory_cost_history_id: Math.max(0, Math.trunc(num(latestHistory.site_item_inventory_cost_history_id))),
      previous_unit_cost_cents: Math.max(0, Math.round(num(latestHistory.previous_unit_cost_cents))),
      new_unit_cost_cents: historyCost,
      source_kind: text(latestHistory.source_kind),
      source_id: text(latestHistory.source_id) || null,
      source_reference: text(latestHistory.source_reference) || null,
      reason_note: text(latestHistory.reason_note) || null,
      created_at: latestHistory.created_at || null,
      matches_current_cost: historyMatches,
      provenance_present: provenancePresent,
    } : null,
    issues,
    owner_urls: {
      inventory: '/admin/inventory-intelligence/',
      finance: '/admin/accounting/',
      fixed_assets: '/admin/accounting/#fixedAssetsCard',
    },
  };
}

export async function onRequestGet(context) {
  try {
    const upstreamUrl = new URL(context.request.url);
    upstreamUrl.searchParams.set('include_history', '1');
    upstreamUrl.searchParams.set('limit', '1000');
    const upstreamRequest = new Request(upstreamUrl.toString(), {
      method: 'GET',
      headers: context.request.headers,
    });
    const upstreamResponse = await loadInventoryCost({ ...context, request: upstreamRequest });
    const upstream = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok || !upstream || upstream.ok === false) {
      return json({
        ok: false,
        release: RELEASE,
        build: BUILD,
        role: 'read_only_inventory_finance_valuation_readiness_reconciliation',
        error: upstream?.error || `Inventory cost authority returned HTTP ${upstreamResponse.status}.`,
        inventory_cost_error_code: upstream?.error_code || null,
      }, upstreamResponse.status || 500);
    }

    const latestByItem = latestHistoryByItem(upstream.history);
    const items = (Array.isArray(upstream.items) ? upstream.items : [])
      .map((item) => classify(item, latestByItem.get(Math.max(0, Math.trunc(num(item.site_item_inventory_id)))) || null, upstream.history_available === true));

    const nonToolOnHand = items.filter((item) => item.valuation_scope === 'non_tool_stock' && item.on_hand_quantity > 0);
    const reviewSupported = nonToolOnHand.filter((item) => item.finance_review_supported);
    const operationalSupported = nonToolOnHand.filter((item) => item.operational_value_supported);
    const attention = nonToolOnHand.filter((item) => !item.finance_review_supported);

    const sumValue = (rows) => rows.reduce((total, row) => total + Math.max(0, num(row.operational_inventory_value_cents)), 0);
    const summary = {
      active_inventory_items: items.length,
      non_tool_on_hand_items: nonToolOnHand.length,
      finance_review_supported_items: reviewSupported.length,
      finance_review_attention_items: attention.length,
      unvalued_on_hand_items: nonToolOnHand.filter((item) => item.valuation_state === 'unvalued_on_hand').length,
      provenance_attention_items: nonToolOnHand.filter((item) => ['provenance_unavailable','provenance_missing','current_cost_unreconciled','source_evidence_missing'].includes(item.valuation_state)).length,
      tool_asset_review_items: items.filter((item) => item.valuation_state === 'tool_asset_review' && item.on_hand_quantity > 0).length,
      supported_operational_value_cents: sumValue(operationalSupported),
      finance_review_supported_value_cents: sumValue(reviewSupported),
      finance_review_attention_value_cents: sumValue(attention.filter((item) => item.operational_value_supported)),
    };

    return json({
      ok: true,
      release: RELEASE,
      build: BUILD,
      role: 'read_only_inventory_finance_valuation_readiness_reconciliation',
      authorities: {
        inventory_cost_contract: upstream.contract || 'inventory-cost',
        inventory_cost_owner: upstream.owner || 'inventory',
        inventory_cost_authority_field: upstream.authority_field || 'site_item_inventory.unit_cost_cents',
        inventory_owner: '/admin/inventory-intelligence/',
        finance_review_owner: '/admin/accounting/',
      },
      boundaries: {
        operational_inventory_value_is_book_value: false,
        operational_inventory_value_is_tax_value: false,
        finance_review_is_accounting_posting_authorization: false,
        fixed_asset_classification_automatic: false,
        inventory_cost_mutation: false,
        inventory_quantity_mutation: false,
        accounting_posting: false,
        provider_execution: false,
        request_time_schema_mutation: false,
      },
      semantics: {
        operational_inventory_value_cents: 'Inventory-owned current unit cost multiplied by current on-hand quantity for non-tool stock. It is operational review evidence, not book/tax/accounting value.',
        finance_review_supported: 'Positive on-hand non-tool stock has a positive current Inventory cost and matching latest cost-history provenance with a source/reason reference.',
        unvalued_on_hand: 'Positive on-hand stock has no positive current Inventory cost. Finance review fails closed; zero value is not assumed.',
        tool_asset_review: 'Tools/equipment are excluded from stock valuation readiness and routed to the existing fixed-asset/accounting review workflow.',
      },
      inventory_cost_schema_ready: upstream.schema_ready !== false,
      inventory_cost_history_available: upstream.history_available === true,
      inventory_cost_history_rows_returned: Math.max(0, num(upstream.history_count)),
      summary,
      items,
    });
  } catch (error) {
    return json({
      ok: false,
      release: RELEASE,
      build: BUILD,
      role: 'read_only_inventory_finance_valuation_readiness_reconciliation',
      error: error?.message || 'Inventory/Finance valuation readiness could not load.',
    }, 500);
  }
}
