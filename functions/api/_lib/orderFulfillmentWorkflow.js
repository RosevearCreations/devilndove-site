// Release 467 Build 82 — pure Orders / Fulfilment workflow derivation.
// This helper classifies existing order/payment/status-history facts and recommends reviewed next steps.
// It never sends customer communications, changes D1/R2, or calls payment/shipping providers.

export const ORDER_FULFILLMENT_STAGE_IDS = Object.freeze([
  'awaiting_payment',
  'paid',
  'preparing',
  'making',
  'packing',
  'evidence',
  'ready',
  'fulfilled',
  'returned',
  'refunded',
  'cancelled',
  'review',
]);

export const ORDER_FULFILLMENT_WRITE_STATUSES = Object.freeze([
  'preparing',
  'making',
  'packing',
  'evidence',
  'ready',
  'fulfilled',
  'returned',
]);

const PAID_PAYMENT_STATUSES = new Set(['paid', 'completed', 'captured', 'partially_refunded']);
const CLOSED_ORDER_STATUSES = new Set(['cancelled', 'canceled', 'refunded']);
const STATUS_TO_STAGE = Object.freeze({
  draft: 'awaiting_payment',
  pending: 'awaiting_payment',
  processing: 'paid',
  paid: 'paid',
  preparing: 'preparing',
  making: 'making',
  packing: 'packing',
  evidence: 'evidence',
  ready: 'ready',
  fulfilled: 'fulfilled',
  completed: 'fulfilled',
  returned: 'returned',
  refunded: 'refunded',
  cancelled: 'cancelled',
  canceled: 'cancelled',
});

function text(value) { return String(value ?? '').trim(); }
function lower(value) { return text(value).toLowerCase(); }
function n(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function bool(value) { return value === true; }

export function fulfillmentReadyLabel(fulfillmentType) {
  const type = lower(fulfillmentType || 'shipping');
  if (type === 'pickup') return 'Pickup ready';
  if (type === 'digital') return 'Delivery ready';
  if (type === 'mixed') return 'Shipping / pickup ready';
  return 'Shipping ready';
}

export function normalizeFulfillmentStage(order = {}) {
  const status = lower(order.order_status || order.latest_history_status);
  const payment = lower(order.derived_payment_status || order.payment_status);
  if (payment === 'refunded' || status === 'refunded') return 'refunded';
  if (CLOSED_ORDER_STATUSES.has(status)) return STATUS_TO_STAGE[status] || 'cancelled';
  return STATUS_TO_STAGE[status] || 'review';
}

function action(newStatus, label, options = {}) {
  return {
    new_status: newStatus,
    label,
    note_required: bool(options.note_required),
    customer_update_recommended: options.customer_update_recommended !== false,
  };
}

export function allowedFulfillmentTransitions(order = {}) {
  const stage = normalizeFulfillmentStage(order);
  const payment = lower(order.derived_payment_status || order.payment_status);
  const fulfillment = lower(order.fulfillment_type || 'shipping');
  const paymentReady = PAID_PAYMENT_STATUSES.has(payment);
  const actions = [];
  const blockers = [];

  if (['refunded', 'cancelled'].includes(stage)) {
    return { stage, actions, blockers, terminal: true };
  }

  if (!paymentReady && !['fulfilled', 'returned'].includes(stage)) {
    blockers.push('Payment must be confirmed before fulfilment work advances.');
    return { stage, actions, blockers, terminal: false };
  }

  switch (stage) {
    case 'awaiting_payment':
    case 'paid':
      actions.push(action('preparing', 'Start preparing'));
      break;
    case 'preparing':
      if (fulfillment === 'digital') {
        actions.push(action('evidence', 'Review delivery evidence', { note_required: true }));
      } else {
        actions.push(action('making', 'Start making'));
        actions.push(action('packing', 'Start packing'));
      }
      break;
    case 'making':
      actions.push(action('packing', 'Start packing'));
      break;
    case 'packing':
      actions.push(action('evidence', 'Review evidence', { note_required: true }));
      break;
    case 'evidence':
      actions.push(action('ready', `Mark ${fulfillmentReadyLabel(fulfillment).toLowerCase()}`));
      break;
    case 'ready':
      actions.push(action('fulfilled', 'Mark fulfilled'));
      break;
    case 'fulfilled':
      actions.push(action('returned', 'Record returned', { note_required: true }));
      break;
    case 'returned':
      blockers.push(payment === 'refunded'
        ? 'Refund evidence is present. Use the existing refund/payment owner to keep provider and accounting records synchronized before changing financial status.'
        : 'Returned items do not trigger a refund automatically. Refunds remain in the existing payment/refund owner.');
      break;
    default:
      blockers.push('The stored order status is outside the reviewed Build 82 fulfilment path. Review it in Orders before continuing.');
  }
  return { stage, actions, blockers, terminal: false };
}

function communicationFor(order, stage) {
  const orderNumber = text(order.order_number) || `#${n(order.order_id) || '—'}`;
  const name = text(order.customer_name) || 'there';
  const ready = fulfillmentReadyLabel(order.fulfillment_type);
  const map = {
    awaiting_payment: {
      subject: `Order ${orderNumber} — payment confirmation`,
      body: `Hi ${name}, we have your order ${orderNumber}. We will begin preparing it as soon as payment is confirmed.`,
    },
    paid: {
      subject: `Order ${orderNumber} — payment received`,
      body: `Hi ${name}, payment for order ${orderNumber} is confirmed. We are getting it ready for the next production or packing step.`,
    },
    preparing: {
      subject: `Order ${orderNumber} — preparation started`,
      body: `Hi ${name}, we have started preparing order ${orderNumber}. We will update you again when it reaches the next fulfilment milestone.`,
    },
    making: {
      subject: `Order ${orderNumber} — in progress`,
      body: `Hi ${name}, order ${orderNumber} is currently being made. We will continue to update you as it moves toward packing and readiness.`,
    },
    packing: {
      subject: `Order ${orderNumber} — packing`,
      body: `Hi ${name}, order ${orderNumber} is being packed and checked before it is marked ready.`,
    },
    evidence: {
      subject: `Order ${orderNumber} — final checks`,
      body: `Hi ${name}, order ${orderNumber} is in final evidence and quality review before it is marked ready.`,
    },
    ready: {
      subject: `Order ${orderNumber} — ${ready}`,
      body: `Hi ${name}, order ${orderNumber} is ${ready.toLowerCase()}. We will use the order details on file for the final handoff.`,
    },
    fulfilled: {
      subject: `Order ${orderNumber} — fulfilled`,
      body: `Hi ${name}, order ${orderNumber} has been marked fulfilled. Thank you for supporting Devil n Dove.`,
    },
    returned: {
      subject: `Order ${orderNumber} — return recorded`,
      body: `Hi ${name}, we have recorded the return for order ${orderNumber}. Any refund is handled separately through the payment/refund workflow.`,
    },
    refunded: {
      subject: `Order ${orderNumber} — refund status`,
      body: `Hi ${name}, the recorded payment status for order ${orderNumber} is refunded. Please contact us if anything does not match your records.`,
    },
    cancelled: {
      subject: `Order ${orderNumber} — cancelled`,
      body: `Hi ${name}, order ${orderNumber} is recorded as cancelled. Any payment or refund action is handled separately through the payment provider workflow.`,
    },
    review: {
      subject: `Order ${orderNumber} — status review`,
      body: `Hi ${name}, order ${orderNumber} is under manual status review. We will confirm the next step once the order record is reconciled.`,
    },
  };
  return {
    ...(map[stage] || map.review),
    channel: 'email_or_direct_contact',
    send_automatically: false,
    customer_email: text(order.customer_email),
  };
}

export function buildFulfillmentWorkflowOrder(order = {}) {
  const transition = allowedFulfillmentTransitions(order);
  const stage = transition.stage;
  const fulfillmentType = lower(order.fulfillment_type || 'shipping');
  const paid = n(order.paid_total_cents);
  const total = n(order.total_cents);
  const outstanding = Math.max(0, total - paid);
  return {
    order_id: n(order.order_id),
    order_number: text(order.order_number),
    customer_name: text(order.customer_name),
    customer_email: text(order.customer_email),
    order_status: lower(order.order_status || 'pending'),
    payment_status: lower(order.payment_status || 'pending'),
    derived_payment_status: lower(order.derived_payment_status || order.payment_status || 'pending'),
    fulfillment_type: fulfillmentType || 'shipping',
    currency: text(order.currency) || 'CAD',
    total_cents: total,
    paid_total_cents: paid,
    outstanding_cents: outstanding,
    workflow_stage: stage,
    workflow_stage_label: stage === 'ready' ? fulfillmentReadyLabel(fulfillmentType) : stage.replaceAll('_', ' '),
    workflow_actions: transition.actions,
    blockers: transition.blockers,
    terminal: transition.terminal,
    customer_communication: communicationFor(order, stage),
    audit: {
      latest_status: lower(order.latest_history_status || order.order_status || ''),
      latest_at: order.latest_history_at || order.updated_at || order.created_at || null,
      latest_note: text(order.latest_history_note),
      history_count: n(order.history_count),
    },
    created_at: order.created_at || null,
    updated_at: order.updated_at || null,
  };
}

export function buildFulfillmentWorkflow(rows = []) {
  const orders = (Array.isArray(rows) ? rows : []).map(buildFulfillmentWorkflowOrder);
  const counts = {};
  for (const id of ORDER_FULFILLMENT_STAGE_IDS) counts[id] = 0;
  for (const order of orders) counts[order.workflow_stage] = (counts[order.workflow_stage] || 0) + 1;
  return {
    orders,
    summary: {
      total_orders: orders.length,
      active_orders: orders.filter((o) => !o.terminal && !['fulfilled', 'returned'].includes(o.workflow_stage)).length,
      ready: counts.ready || 0,
      fulfilled: counts.fulfilled || 0,
      returned: counts.returned || 0,
      refunded: counts.refunded || 0,
      review: counts.review || 0,
      blocked: orders.filter((o) => o.blockers.length > 0).length,
      stage_counts: counts,
    },
    boundaries: {
      customer_message_send: false,
      provider_shipping_execution: false,
      payment_execution: false,
      refund_execution: false,
      accounting_posting: false,
      request_time_schema_mutation: false,
      audit_authority: 'order_status_history',
      financial_status_owner: 'existing payment/refund workflow',
    },
  };
}
