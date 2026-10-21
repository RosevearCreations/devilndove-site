// Release 467 Build 427: independent manual evidence review readiness; no provider verification is claimed.
export function independentClosureReadiness427(source) {
  const holds = [];
  const r = source?.review;
  if (source?.ok !== true || source?.build !== 426 || source?.read_only !== true ||
      source?.local_only !== true || source?.provider_called !== false ||
      source?.automatic_closure !== false || source?.us_shipping_suspended !== true ||
      !r || r.build !== 426 || r.read_only !== true || r.local_only !== true)
    holds.push('BUILD_426_SOURCE_UNTRUSTED');
  if (r?.continuity?.scan_complete !== true ||
      r?.continuity?.acceptance_record_current !== true ||
      !Number.isSafeInteger(r?.continuity?.latest_acceptance_receipt) ||
      r.continuity.latest_acceptance_receipt < 1)
    holds.push('ACCEPTANCE_CONTINUITY_HOLD');
  if (!/^[0-9a-f]{8}$/.test(String(r?.continuity?.current_source_signature || '')))
    holds.push('ACCEPTANCE_SIGNATURE_MISSING');
  if (r?.manual_closure_gate?.authorized !== false ||
      r?.manual_closure_gate?.separate_human_decision_required !== true ||
      r?.manual_closure_gate?.external_provider_verification_required !== true)
    holds.push('CLOSURE_GUARD_UNTRUSTED');
  if (r?.provenance?.independent_provider_evidence_verified !== false ||
      r?.provenance?.local_owner_receipts_only !== true)
    holds.push('INDEPENDENT_PROVIDER_EVIDENCE_BOUNDARY_UNTRUSTED');
  if (!Array.isArray(r?.holds) ||
      !r.holds.includes('INDEPENDENT_PROVIDER_EVIDENCE_NOT_VERIFIED') ||
      !r.holds.includes('EXPLICIT_SEPARATE_HUMAN_CLOSURE_DECISION_REQUIRED'))
    holds.push('MANDATORY_REVIEW_HOLDS_MISSING');
  return {
    build: 427, status: 'HOLD_FOR_INDEPENDENT_HUMAN_REVIEW',
    holds: [...new Set([...holds,
      'PROVIDER_EVIDENCE_MUST_BE_INDEPENDENTLY_VERIFIED',
      'MANUAL_CLOSURE_DECISION_NOT_RECORDED'])],
    read_only: true, local_only: true,
    reviewed_acceptance_receipt: r?.continuity?.latest_acceptance_receipt || 0,
    source_signature: r?.continuity?.current_source_signature || null,
    independent_provider_verified: false, human_closure_authorized: false,
    provider_called: false, publication_performed: false, notifications_sent: false,
    automatic_closure: false, automatic_reopen: false, owner_reassignment_performed: false,
    us_shipping_suspended: true
  };
}
