import assert from 'node:assert/strict';
import {
  deriveSocialOAuthAcceptance,
  queueItemHasHumanApproval,
  socialQueueTargetsForProvider,
} from '../functions/api/_lib/socialOAuthAcceptance.js';

const readyPinterest = deriveSocialOAuthAcceptance({
  selected_provider: 'pinterest',
  development_host: true,
  explicit_operator_switch: true,
  selected_provider_authorization_open: true,
  encryption_authority_ready: true,
  provider_configuration_ready: true,
  intended_account_configured: true,
  identity_lookup_configuration_ready: true,
  connection_present: true,
  connection_healthy: true,
  intended_account_verification: 'verified',
  provider_publication_closed: true,
  queue_rows: [{
    social_post_queue_id: 91,
    target_platforms_json: '["pinterest"]',
    approval_status: 'approved',
    post_status: 'ready',
    privacy_status: 'approved',
    approved_for_public_post: 1,
  }],
});
assert.equal(readyPinterest.status, 'ready_for_controlled_publication_acceptance');
assert.equal(readyPinterest.queue.human_approved_queue_items, 1);
assert.equal(readyPinterest.queue.selected_queue_item_id, 91);
assert.equal(readyPinterest.execution_boundary.provider_execution, false);
assert.equal(readyPinterest.execution_boundary.provider_publication, false);
assert.equal(readyPinterest.execution_boundary.automatic_publication, false);
assert.equal(readyPinterest.execution_boundary.production_oauth_authorization, false);

const noProvider = deriveSocialOAuthAcceptance({ development_host: true });
assert.equal(noProvider.status, 'closed_no_provider_selected');

const production = deriveSocialOAuthAcceptance({ selected_provider: 'x', development_host: false });
assert.equal(production.status, 'production_closed');
assert.equal(production.execution_boundary.production_oauth_authorization, false);

const externalHold = deriveSocialOAuthAcceptance({
  selected_provider: 'youtube',
  development_host: true,
  explicit_operator_switch: false,
  selected_provider_authorization_open: false,
});
assert.equal(externalHold.status, 'hold_external');

const needsOAuth = deriveSocialOAuthAcceptance({
  selected_provider: 'x',
  development_host: true,
  explicit_operator_switch: true,
  selected_provider_authorization_open: true,
  encryption_authority_ready: true,
  provider_configuration_ready: true,
  intended_account_configured: true,
  identity_lookup_configuration_ready: true,
  connection_present: false,
  connection_healthy: false,
  intended_account_verification: 'not_connected',
});
assert.equal(needsOAuth.status, 'oauth_authorization_required');

const needsHumanReview = deriveSocialOAuthAcceptance({
  selected_provider: 'tiktok',
  development_host: true,
  explicit_operator_switch: true,
  selected_provider_authorization_open: true,
  encryption_authority_ready: true,
  provider_configuration_ready: true,
  intended_account_configured: true,
  identity_lookup_configuration_ready: true,
  connection_present: true,
  connection_healthy: true,
  intended_account_verification: 'verified',
  queue_rows: [{
    social_post_queue_id: 12,
    target_platforms_json: '["tiktok"]',
    approval_status: 'needs_review',
    post_status: 'draft',
    privacy_status: 'approved',
    approved_for_public_post: 1,
  }],
});
assert.equal(needsHumanReview.status, 'draft_human_review_required');
assert.equal(needsHumanReview.queue.human_approval_present, false);

assert.deepEqual(socialQueueTargetsForProvider('meta'), ['facebook', 'instagram']);
const metaFacebook = {
  target_platforms_json: '["facebook"]',
  approval_status: 'approved',
  post_status: 'ready',
  privacy_status: 'no_private_media',
  approved_for_public_post: 0,
};
assert.equal(queueItemHasHumanApproval(metaFacebook, 'meta'), true);

const privacyBlocked = {
  target_platforms_json: '["instagram"]',
  approval_status: 'approved',
  post_status: 'ready',
  privacy_status: 'blocked',
  approved_for_public_post: 0,
};
assert.equal(queueItemHasHumanApproval(privacyBlocked, 'meta'), false);

const wrongProvider = {
  target_platforms_json: '["pinterest"]',
  approval_status: 'approved',
  post_status: 'ready',
  privacy_status: 'approved',
  approved_for_public_post: 1,
};
assert.equal(queueItemHasHumanApproval(wrongProvider, 'x'), false);

console.log('RELEASE 467 BUILD 85 SOCIALS/OAUTH ACCEPTANCE RUNTIME: PASS');
console.log('Selected-provider OAuth: DEVELOPMENT ONLY');
console.log('Intended-account verification: REQUIRED');
console.log('Human-approved draft evidence: REQUIRED');
console.log('Provider publication / automatic publication: CLOSED');
