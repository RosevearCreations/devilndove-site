// Release 467 Build 426 — fail-closed, local-only provider evidence provenance review.
export function boundedReview426(data) {
  const holds = [];
  const r = data?.review;
  if (data?.ok !== true || data?.build !== 425 || data?.read_only !== true ||
      data?.local_only !== true || data?.provider_called !== false ||
      data?.automatic_closure !== false || data?.publication_performed !== false ||
      data?.us_shipping_suspended !== true || !r || r.build !== 425)
    holds.push('OWNER_ACCEPTANCE_SOURCE_UNTRUSTED');
  if (!r?.scan_complete || !Array.isArray(r?.history) || r.history.length > 100)
    holds.push('ACCEPTANCE_HISTORY_INCOMPLETE');
  if (!r?.acceptance_record_current || !Number.isSafeInteger(r?.latest_acceptance_receipt) ||
      r.latest_acceptance_receipt < 1)
    holds.push('CURRENT_ACCEPTANCE_REQUIRED');
  if (Array.isArray(r?.holds) && r.holds.length) holds.push('UPSTREAM_ACCEPTANCE_HOLD');
  if (!r?.manual_closure_audit ||
      r.manual_closure_audit.closure_authorized !== false ||
      r.manual_closure_audit.independent_provider_evidence_verified !== false ||
      r.manual_closure_audit.separate_human_closure_decision_required !== true)
    holds.push('MANUAL_CLOSURE_BOUNDARY_UNTRUSTED');
  const history = Array.isArray(r?.history) ? r.history.slice(0, 100) : [];
  const ids = new Set();
  let previous = 0;
  for (const receipt of history) {
    if (!receipt || receipt.valid !== true ||
        !Number.isSafeInteger(receipt.receipt) || receipt.receipt <= previous ||
        receipt.previous_receipt !== previous || ids.has(receipt.receipt))
      holds.push('ACCEPTANCE_CONTINUITY_BROKEN');
    if (receipt?.receipt > 0) { previous = receipt.receipt; ids.add(previous); }
  }
  if (history.length && previous !== r?.latest_acceptance_receipt)
    holds.push('LATEST_ACCEPTANCE_MISMATCH');
  if (!/^[0-9a-f]{8}$/.test(String(r?.source_signature || '')))
    holds.push('SOURCE_SIGNATURE_UNAVAILABLE');
  // Deliberately do not treat local provider-related notes as independent provider evidence.
  holds.push('INDEPENDENT_PROVIDER_EVIDENCE_NOT_VERIFIED');
  holds.push('EXPLICIT_SEPARATE_HUMAN_CLOSURE_DECISION_REQUIRED');
  return {
    build: 426, status: 'HOLD_FOR_INDEPENDENT_PROVIDER_AND_MANUAL_REVIEW',
    holds: [...new Set(holds)], read_only: true, local_only: true,
    continuity: {
      scan_complete: r?.scan_complete === true && history.length <= 100,
      recorded_receipts: history.length, latest_acceptance_receipt: r?.latest_acceptance_receipt || 0,
      acceptance_record_current: r?.acceptance_record_current === true,
      current_source_signature: r?.source_signature || null
    },
    provenance: { local_owner_receipts_only: true, independent_provider_evidence_verified: false,
      provider_evidence_reference: null, source_signature: r?.source_signature || null },
    manual_closure_gate: { authorized: false, separate_human_decision_required: true,
      external_provider_verification_required: true, automatic_closure: false },
    provider_called: false, publication_performed: false, notifications_sent: false,
    automatic_reopen: false, automatic_closure: false, owner_reassignment_performed: false,
    us_shipping_suspended: true
  };
}
