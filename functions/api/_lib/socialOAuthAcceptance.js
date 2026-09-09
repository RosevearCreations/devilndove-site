// Release 467 Build 85 — pure Socials / OAuth acceptance derivation.
// This module performs no D1/R2 mutation, provider execution, token handling, or publication.

export const SOCIAL_OAUTH_ACCEPTANCE_PROVIDERS = Object.freeze(['pinterest', 'meta', 'x', 'tiktok', 'youtube']);

const TARGETS = Object.freeze({
  pinterest: Object.freeze(['pinterest']),
  meta: Object.freeze(['facebook', 'instagram']),
  x: Object.freeze(['x']),
  tiktok: Object.freeze(['tiktok']),
  youtube: Object.freeze(['youtube']),
});

export function normalizeSocialOAuthAcceptanceProvider(value) {
  const key = String(value || '').trim().toLowerCase();
  return SOCIAL_OAUTH_ACCEPTANCE_PROVIDERS.includes(key) ? key : '';
}

export function socialQueueTargetsForProvider(provider) {
  return [...(TARGETS[normalizeSocialOAuthAcceptanceProvider(provider)] || [])];
}

function list(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean);
  if (typeof value === 'string') {
    try { return list(JSON.parse(value)); } catch {
      return value.split(/[\s,|]+/g).map((item) => item.trim().toLowerCase()).filter(Boolean);
    }
  }
  return [];
}

export function queueItemTargetsProvider(row, provider) {
  const wanted = new Set(socialQueueTargetsForProvider(provider));
  if (!wanted.size) return false;
  return list(row?.target_platforms_json ?? row?.target_platforms).some((item) => wanted.has(item));
}

export function queueItemHasHumanApproval(row, provider) {
  if (!queueItemTargetsProvider(row, provider)) return false;
  const approval = String(row?.approval_status || '').trim().toLowerCase();
  const post = String(row?.post_status || '').trim().toLowerCase();
  const privacy = String(row?.privacy_status || '').trim().toLowerCase();
  const publicApproved = Number(row?.approved_for_public_post || 0) === 1;
  const privacyApproved = publicApproved || privacy === 'approved' || privacy === 'no_private_media';
  return approval === 'approved' && post === 'ready' && privacyApproved;
}

export function summarizeAcceptanceQueue(rows, provider) {
  const items = Array.isArray(rows) ? rows.filter((row) => queueItemTargetsProvider(row, provider)) : [];
  const approved = items.filter((row) => queueItemHasHumanApproval(row, provider));
  return {
    targeted_queue_items: items.length,
    human_approved_queue_items: approved.length,
    human_approval_present: approved.length > 0,
    selected_queue_item_id: approved.length ? Number(approved[0]?.social_post_queue_id || 0) || null : null,
  };
}

export function deriveSocialOAuthAcceptance(input = {}) {
  const provider = normalizeSocialOAuthAcceptanceProvider(input.selected_provider);
  const queue = summarizeAcceptanceQueue(input.queue_rows, provider);
  const checks = {
    provider_selected: Boolean(provider),
    development_host: Boolean(input.development_host),
    explicit_operator_switch: Boolean(input.explicit_operator_switch),
    selected_provider_authorization_open: Boolean(input.selected_provider_authorization_open),
    encryption_authority_ready: Boolean(input.encryption_authority_ready),
    provider_configuration_ready: Boolean(input.provider_configuration_ready),
    intended_account_configured: Boolean(input.intended_account_configured),
    identity_lookup_configuration_ready: Boolean(input.identity_lookup_configuration_ready),
    connection_present: Boolean(input.connection_present),
    connection_healthy: Boolean(input.connection_healthy),
    intended_account_verified: String(input.intended_account_verification || '') === 'verified',
    human_approval_present: queue.human_approval_present,
    provider_publication_closed: input.provider_publication_closed !== false,
  };

  let status = 'hold_external';
  let next_action = 'Select one Development social provider and configure the explicit OAuth acceptance boundary.';

  if (!checks.provider_selected) {
    status = 'closed_no_provider_selected';
  } else if (!checks.development_host) {
    status = 'production_closed';
    next_action = 'Run OAuth acceptance only from the Development Preview. Production authorization remains closed.';
  } else if (!checks.explicit_operator_switch || !checks.selected_provider_authorization_open) {
    status = 'hold_external';
    next_action = 'Set the Development-only OAuth operator switch for the selected provider when external authorization is deliberately ready.';
  } else if (!checks.encryption_authority_ready || !checks.provider_configuration_ready || !checks.intended_account_configured || !checks.identity_lookup_configuration_ready) {
    status = 'configuration_required';
    next_action = 'Complete encryption, provider credential references, redirect URI, and intended-account verification configuration.';
  } else if (!checks.connection_present || !checks.connection_healthy || !checks.intended_account_verified) {
    status = 'oauth_authorization_required';
    next_action = 'Complete the selected provider OAuth authorization and verify that the returned provider identity matches the intended Devil n Dove account.';
  } else if (!checks.human_approval_present) {
    status = 'draft_human_review_required';
    next_action = 'Prepare one provider-targeted queue draft, complete privacy review, and explicitly mark it ready + approved.';
  } else {
    status = 'ready_for_controlled_publication_acceptance';
    next_action = 'OAuth and draft evidence are ready. Provider publication remains fail-closed until a separate controlled publication acceptance is explicitly authorized.';
  }

  return {
    build: 85,
    provider: provider || null,
    status,
    next_action,
    checks,
    queue,
    execution_boundary: {
      read_only_projection: true,
      d1_mutation: false,
      r2_mutation: false,
      provider_execution: false,
      provider_publication: false,
      automatic_publication: false,
      token_values_emitted: false,
      provider_subject_values_emitted: false,
      production_oauth_authorization: false,
      human_approval_required: true,
    },
  };
}
