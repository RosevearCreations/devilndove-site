// Release 467 Build 16 — customer-safe custom request journey authority.
// This module contains presentation-only lifecycle semantics. It performs no I/O or mutation.

export const CUSTOM_REQUEST_JOURNEY = Object.freeze([
  { key: 'request', label: 'Request received' },
  { key: 'review_proof', label: 'Review & proof' },
  { key: 'quote', label: 'Quote' },
  { key: 'making', label: 'Making' },
  { key: 'fulfillment', label: 'Pickup / shipping' },
  { key: 'complete', label: 'Complete' }
]);

const ORDER_STAGE_MESSAGES = Object.freeze({
  planning: {
    label: 'Planning',
    message: 'We are confirming the plan, materials, timing, and any final details needed before making begins.'
  },
  making: {
    label: 'Making',
    message: 'Your custom piece is in the making stage. We are working from the reviewed request and approved quote.'
  },
  curing_finishing: {
    label: 'Curing / finishing',
    message: 'The main making work is complete and your piece is curing, setting, finishing, or receiving final quality checks.'
  },
  ready: {
    label: 'Ready',
    message: 'Your custom piece is ready. We are confirming the reviewed pickup or Canada shipping handoff details.'
  },
  shipped_pickup: {
    label: 'Pickup / shipping',
    message: 'Your order has reached its reviewed pickup or Canada shipping handoff stage.'
  },
  complete: {
    label: 'Complete',
    message: 'Your custom request is complete. Thank you for supporting Devil n Dove handmade work.'
  }
});

export function normalizeOrderStage(value) {
  const key = String(value || 'planning').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(ORDER_STAGE_MESSAGES, key) ? key : 'planning';
}

export function customerStageMessage(stageValue) {
  const key = normalizeOrderStage(stageValue);
  return { key, ...ORDER_STAGE_MESSAGES[key] };
}

export function buildCustomerJourney({ requestStatus = '', quoteStatus = '', orderStage = '', orderStatus = '' } = {}) {
  const request = String(requestStatus || '').toLowerCase();
  const quote = String(quoteStatus || '').toLowerCase();
  const stage = normalizeOrderStage(orderStage);
  const order = String(orderStatus || '').toLowerCase();

  let currentIndex = 0;
  if (['reviewing', 'quote_needed'].includes(request)) currentIndex = 1;
  if (['quoted', 'accepted'].includes(request) || ['shared', 'accepted', 'approved'].includes(quote)) currentIndex = 2;
  if (['planning', 'making', 'curing_finishing'].includes(stage)) currentIndex = Math.max(currentIndex, 3);
  if (['ready', 'shipped_pickup'].includes(stage)) currentIndex = 4;
  if (stage === 'complete' || ['complete', 'completed', 'fulfilled'].includes(order)) currentIndex = 5;

  return CUSTOM_REQUEST_JOURNEY.map((step, index) => ({
    ...step,
    state: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'
  }));
}
