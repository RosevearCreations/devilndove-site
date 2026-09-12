// Release 467 Build 111 — pure Orders-to-Fulfilment reconciliation derivation.
// Reconciles existing Build 82 workflow, Finance readiness, Product/Inventory/Production readiness,
// and bounded order-item/status-history evidence. It performs no reads, writes, provider calls, or messaging.

export const ORDER_FULFILLMENT_RECONCILIATION_STATES = Object.freeze(['ready', 'review', 'blocked', 'closed']);

const HARD_FINANCE_STATES = new Set([
  'refund_review', 'currency_mismatch', 'order_total_mismatch', 'paid_amount_mismatch',
  'outstanding_amount_mismatch', 'payment_status_mismatch',
]);
const REVIEW_FINANCE_STATES = new Set(['accounting_unverified', 'accounting_record_missing']);
const HARD_PRODUCT_STATES = new Set(['resource_shortage', 'finished_stock_shortfall', 'product_missing', 'production_blocked', 'gap_unverified']);
const REVIEW_PRODUCT_STATES = new Set(['buildability_review', 'production_preview_required', 'production_preview_ready_for_review', 'capacity_unverified']);
const BUILD82_PRE_FULFILMENT_STAGES = new Set(['preparing', 'making', 'packing', 'evidence', 'ready']);

function text(value) { return String(value ?? '').trim(); }
function lower(value) { return text(value).toLowerCase(); }
function n(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function unique(values) { return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean))); }
function issue(code, detail, owner, href) { return { code, detail, owner, href }; }
function productIds(profile = {}) {
  return text(profile.product_ids_csv).split(',').map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value > 0);
}

function productEvidenceForOrder(profile, productRowsById) {
  return productIds(profile).map((productId) => productRowsById.get(productId)).filter(Boolean);
}

export function reconcileFulfillmentOrder({ workflow = {}, finance = null, profile = {}, productRowsById = new Map() } = {}) {
  const blockers = [];
  const reviews = [];
  const evidence = [];
  const stage = lower(workflow.workflow_stage || 'review');
  const orderStatus = lower(workflow.order_status || 'pending');
  const auditStatus = lower(workflow.audit?.latest_status || '');
  const fulfillmentType = lower(workflow.fulfillment_type || 'shipping');
  const physicalUnits = Math.max(0, n(profile.physical_units));
  const digitalUnits = Math.max(0, n(profile.digital_units));
  const unresolvedUnits = Math.max(0, n(profile.unresolved_product_units));
  const products = productEvidenceForOrder(profile, productRowsById);

  if (workflow.terminal || ['cancelled', 'refunded'].includes(stage)) {
    evidence.push('The existing Orders workflow identifies this order as terminal.');
  }

  if (auditStatus && orderStatus && auditStatus !== orderStatus) {
    blockers.push(issue('status_history_drift', `Order status is ${orderStatus} but the latest status-history event is ${auditStatus}.`, 'Orders', '/admin/orders/'));
  } else if (auditStatus) {
    evidence.push('Current order status agrees with the latest status-history event.');
  }

  for (const detail of Array.isArray(workflow.blockers) ? workflow.blockers : []) {
    blockers.push(issue('workflow_blocker', text(detail), 'Orders / payments', '/admin/order-fulfillment-care/'));
  }

  const financeState = lower(finance?.settlement_state || '');
  if (!finance) {
    reviews.push(issue('finance_evidence_missing', 'No Finance settlement reconciliation row was returned for this order.', 'Finance', '/admin/order-finance-settlement-readiness/'));
  } else if (HARD_FINANCE_STATES.has(financeState)) {
    blockers.push(issue(`finance_${financeState}`, text(finance.detail) || `Finance settlement state is ${financeState}.`, 'Finance', '/admin/order-finance-settlement-readiness/'));
  } else if (REVIEW_FINANCE_STATES.has(financeState)) {
    reviews.push(issue(`finance_${financeState}`, text(finance.detail) || `Finance settlement state is ${financeState}.`, 'Finance', '/admin/order-finance-settlement-readiness/'));
  } else if (finance.settlement_supported === true) {
    evidence.push('Order and Accounting settlement evidence agree for review purposes.');
  }

  if (fulfillmentType === 'digital' && physicalUnits > 0) {
    blockers.push(issue('digital_fulfilment_has_physical_units', `${physicalUnits} physical unit(s) are attached to an order marked digital fulfilment.`, 'Orders', '/admin/orders/'));
  }
  if (['shipping', 'pickup'].includes(fulfillmentType) && physicalUnits === 0 && digitalUnits > 0) {
    reviews.push(issue('physical_fulfilment_has_only_digital_units', `The order is marked ${fulfillmentType} but its item profile is digital-only.`, 'Orders', '/admin/orders/'));
  }
  if (fulfillmentType === 'mixed' && (physicalUnits === 0 || digitalUnits === 0)) {
    reviews.push(issue('mixed_fulfilment_single_mode', 'The order is marked mixed fulfilment but the current item profile contains only one fulfilment mode.', 'Orders', '/admin/orders/'));
  }
  if (unresolvedUnits > 0) {
    blockers.push(issue('unresolved_product_units', `${unresolvedUnits} unit(s) do not resolve to a positive Product ID, so Product/Inventory evidence cannot be reconciled safely.`, 'Orders / Products', '/admin/orders/'));
  }
  if (physicalUnits > 0) evidence.push(`${physicalUnits} physical unit(s) are represented in the bounded order-item profile.`);
  if (digitalUnits > 0) evidence.push(`${digitalUnits} digital/non-shipping unit(s) are represented in the bounded order-item profile.`);

  for (const product of products) {
    const readinessState = lower(product.readiness_state || '');
    const productionState = lower(product.production_release_state || '');
    const name = text(product.name || product.demand_product_name || `Product ${product.product_id}`);
    const legacyStatuses = Array.isArray(product.unclassified_statuses) ? product.unclassified_statuses.map(lower).filter(Boolean) : [];
    const onlyBuild82StageDrift = readinessState === 'demand_unverified' && legacyStatuses.length > 0 && legacyStatuses.every((value) => BUILD82_PRE_FULFILMENT_STAGES.has(value));

    if (onlyBuild82StageDrift) {
      reviews.push(issue('legacy_inventory_stage_taxonomy', `${name}: the older inventory-readiness taxonomy treats current Build 82 fulfilment stage(s) ${legacyStatuses.join(', ')} as unclassified. Treat that shared Product readiness as review evidence, not a reservation or automatic blocker.`, 'Inventory readiness', '/admin/order-inventory-fulfillment-readiness/'));
    } else if (HARD_PRODUCT_STATES.has(readinessState)) {
      blockers.push(issue(`inventory_${readinessState}`, `${name}: ${text(product.detail) || readinessState}.`, 'Inventory readiness', '/admin/order-inventory-fulfillment-readiness/'));
    } else if (REVIEW_PRODUCT_STATES.has(readinessState) || readinessState === 'demand_unverified') {
      reviews.push(issue(`inventory_${readinessState || 'review'}`, `${name}: ${text(product.detail) || readinessState || 'Inventory readiness needs review'}.`, 'Inventory readiness', '/admin/order-inventory-fulfillment-readiness/'));
    } else if (product.readiness_supported === true) {
      evidence.push(`${name}: shared Product/Inventory readiness is currently supported; no reservation is implied.`);
    }

    if (HARD_PRODUCT_STATES.has(productionState)) {
      blockers.push(issue(`production_${productionState}`, `${name}: Production readiness is ${productionState}.`, 'Production readiness', '/admin/order-production-release-readiness/'));
    } else if (REVIEW_PRODUCT_STATES.has(productionState)) {
      reviews.push(issue(`production_${productionState}`, `${name}: Production readiness is ${productionState}; operator review remains required.`, 'Production readiness', '/admin/order-production-release-readiness/'));
    } else if (productionState === 'no_production_required') {
      evidence.push(`${name}: current shared finished-stock evidence reports no production required.`);
    }
  }

  if (physicalUnits > 0 && productIds(profile).length > products.length) {
    reviews.push(issue('shared_product_readiness_missing', 'One or more Product IDs on this order have no current shared Inventory/Production readiness row. Missing readiness is not inferred as safe.', 'Inventory / Production', '/admin/order-inventory-fulfillment-readiness/'));
  }

  const evidenceEvents = Math.max(0, n(profile.evidence_event_count));
  const evidenceNotePresent = n(profile.evidence_note_present) > 0;
  if (['ready', 'fulfilled', 'returned'].includes(stage) && physicalUnits > 0) {
    if (evidenceEvents <= 0) blockers.push(issue('evidence_stage_missing', 'The order has reached readiness/fulfilment without a recorded evidence-review status-history event.', 'Orders', '/admin/order-fulfillment-care/'));
    else if (!evidenceNotePresent) blockers.push(issue('evidence_note_missing', 'Evidence review exists but no non-empty evidence audit note was found.', 'Orders', '/admin/order-fulfillment-care/'));
    else evidence.push('Evidence-review history and a non-empty audit note are present before final handoff.');
  }

  if (stage === 'fulfilled' && n(profile.fulfilled_event_count) <= 0) {
    reviews.push(issue('fulfilled_history_missing', 'The current order is fulfilled but no fulfilled status-history event was found in the bounded reconciliation evidence.', 'Orders', '/admin/order-fulfillment-care/'));
  }
  if (stage === 'returned') {
    if (n(profile.returned_event_count) <= 0) reviews.push(issue('returned_history_missing', 'The order is returned but no returned status-history event was found.', 'Orders', '/admin/order-fulfillment-care/'));
    if (n(profile.returned_note_present) <= 0) blockers.push(issue('returned_note_missing', 'A return requires a non-empty audit note, but none was found in status history.', 'Orders', '/admin/order-fulfillment-care/'));
  }

  const closed = workflow.terminal || ['cancelled', 'refunded'].includes(stage) || (stage === 'fulfilled' && blockers.length === 0 && reviews.length === 0);
  const reconciliationState = closed ? 'closed' : blockers.length ? 'blocked' : reviews.length ? 'review' : 'ready';
  const owners = unique([...blockers, ...reviews].map((row) => `${row.owner}|${row.href}`)).map((value) => {
    const [owner, href] = value.split('|');
    return { owner, href };
  });

  return {
    order_id: n(workflow.order_id),
    order_number: text(workflow.order_number),
    workflow_stage: stage,
    workflow_stage_label: text(workflow.workflow_stage_label),
    fulfillment_type: fulfillmentType,
    reconciliation_state: reconciliationState,
    transition_supported: reconciliationState === 'ready',
    blockers,
    reviews,
    evidence,
    exception_owners: owners,
    item_profile: {
      line_count: n(profile.line_count),
      total_units: n(profile.total_units),
      physical_units: physicalUnits,
      digital_units: digitalUnits,
      unresolved_product_units: unresolvedUnits,
      product_ids: productIds(profile),
    },
    history_evidence: {
      evidence_event_count: evidenceEvents,
      evidence_note_present: evidenceNotePresent,
      ready_event_count: n(profile.ready_event_count),
      fulfilled_event_count: n(profile.fulfilled_event_count),
      returned_event_count: n(profile.returned_event_count),
      returned_note_present: n(profile.returned_note_present) > 0,
    },
    shared_product_readiness_note: 'Inventory and Production readiness are shared Product-level evidence across open demand. Build 111 never treats them as an order-specific stock reservation or production authorization.',
    next_action: blockers[0] || reviews[0] || null,
  };
}

export function buildOrderFulfillmentReconciliation({ workflowOrders = [], financeRows = [], profiles = [], productReadinessRows = [] } = {}) {
  const financeByOrder = new Map((Array.isArray(financeRows) ? financeRows : []).map((row) => [n(row.order_id), row]));
  const profilesByOrder = new Map((Array.isArray(profiles) ? profiles : []).map((row) => [n(row.order_id), row]));
  const productRowsById = new Map((Array.isArray(productReadinessRows) ? productReadinessRows : []).map((row) => [n(row.product_id), row]));
  const orders = (Array.isArray(workflowOrders) ? workflowOrders : []).map((workflow) => reconcileFulfillmentOrder({
    workflow,
    finance: financeByOrder.get(n(workflow.order_id)) || null,
    profile: profilesByOrder.get(n(workflow.order_id)) || {},
    productRowsById,
  }));
  const count = (state) => orders.filter((row) => row.reconciliation_state === state).length;
  return {
    orders,
    summary: {
      total_orders: orders.length,
      ready: count('ready'),
      review: count('review'),
      blocked: count('blocked'),
      closed: count('closed'),
      transition_supported: orders.filter((row) => row.transition_supported).length,
      blocker_count: orders.reduce((sum, row) => sum + row.blockers.length, 0),
      review_count: orders.reduce((sum, row) => sum + row.reviews.length, 0),
    },
    boundaries: {
      existing_build82_write_contract_preserved: true,
      new_order_mutation: false,
      inventory_reservation: false,
      inventory_deduction: false,
      production_execution: false,
      customer_message_send: false,
      payment_execution: false,
      refund_execution: false,
      accounting_posting: false,
      provider_execution: false,
      request_time_schema_mutation: false,
    },
  };
}
