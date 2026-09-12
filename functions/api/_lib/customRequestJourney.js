// Release 467 Build 109 — customer-safe custom request journey and follow-through authority.
// Presentation-only lifecycle semantics. No I/O, mutation, publication, or provider execution.

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
    message: 'We are confirming the plan, materials, timing, and any final details needed before making begins.',
    next_step: 'No action is needed unless we contact you for a reviewed detail or approval.'
  },
  making: {
    label: 'Making',
    message: 'Your custom piece is in the making stage. We are working from the reviewed request and approved quote.',
    next_step: 'Reviewed progress photos may appear here when they are suitable for customer viewing.'
  },
  curing_finishing: {
    label: 'Curing / finishing',
    message: 'The main making work is complete and your piece is curing, setting, finishing, or receiving final quality checks.',
    next_step: 'We will move the order to ready only after the reviewed finishing or cure requirements are complete.'
  },
  ready: {
    label: 'Ready',
    message: 'Your custom piece is ready. We are confirming the reviewed pickup or Canada shipping handoff details.',
    next_step: 'Follow the reviewed pickup or Canada shipping instructions already provided for this order.'
  },
  shipped_pickup: {
    label: 'Pickup / shipping',
    message: 'Your order has reached its reviewed pickup or Canada shipping handoff stage.',
    next_step: 'Keep this private status link for the reviewed handoff record. Canada-only shipping remains authoritative.'
  },
  complete: {
    label: 'Complete',
    message: 'Your custom request is complete. Thank you for supporting Devil n Dove handmade work.',
    next_step: 'You may share feedback or a finished-piece photo if you wish. Nothing is approved for public use without explicit consent and review.'
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

export function customerFollowThrough({ orderStage = '', orderStatus = '', fulfillmentType = '', proofConsent = {} } = {}) {
  const stage = normalizeOrderStage(orderStage);
  const status = String(orderStatus || '').trim().toLowerCase();
  const fulfillment = String(fulfillmentType || '').trim().toLowerCase();
  const complete = stage === 'complete' || ['complete', 'completed', 'fulfilled'].includes(status);
  const pickup = fulfillment.includes('pickup');
  const publicReadyCount = Number(proofConsent?.public_ready_count || 0);
  const privatePhotoCount = Number(proofConsent?.private_photo_count || 0);
  return {
    stage,
    complete,
    fulfillment_mode: pickup ? 'local_pickup' : 'canada_shipping',
    handoff_message: pickup
      ? (complete ? 'Local pickup handoff is complete.' : 'Local pickup remains the reviewed fulfilment path for this order.')
      : (complete ? 'Canada shipping fulfilment is complete.' : 'Shipping remains limited to Canada and follows the reviewed order plan.'),
    review_prompt: complete ? {
      state: 'optional',
      title: 'Share a review',
      message: 'If you would like to share feedback about your finished order, we would be grateful. Feedback is not published automatically.'
    } : null,
    photo_prompt: complete ? {
      state: 'optional',
      title: 'Share a finished-piece photo',
      message: 'You may share a finished-piece photo if you wish. A photo remains private unless explicit public-use consent is separately recorded and reviewed.'
    } : null,
    consent_status: publicReadyCount > 0 ? 'public_permission_available' : privatePhotoCount > 0 ? 'private_only' : 'not_recorded',
    public_ready_count: publicReadyCount,
    private_photo_count: privatePhotoCount,
    publication_authorized: false,
    moderation_required: true
  };
}
