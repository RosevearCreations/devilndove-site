#!/usr/bin/env python3
"""Builds 403-410 Commerce modularity sanity.

Source-only. No Cloudflare resource is contacted.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


# 403 canonical notification authority.
notification_migration = read('database_notification_runtime_parity.sql')
notification_readiness = read('functions/api/_lib/notificationSchemaReadiness.js')
for table in [
    'notification_outbox', 'notification_dispatch_log', 'notification_exclusions',
    'notification_cooldown_rules', 'customer_engagement_runs',
    'notification_automation_settings', 'gift_card_delivery_audit',
]:
    assert f'CREATE TABLE IF NOT EXISTS {table}' in notification_migration
assert 'CREATE TABLE IF NOT EXISTS notification_dispatch_logs' not in notification_migration
for column in [
    'related_order_id','related_payment_id','related_product_id','payload_json','metadata_json',
    'attempt_count','last_attempt_at','next_attempt_at','provider_message_id','error_text',
]:
    assert column in notification_migration
assert 'export const BUILD = 403' in notification_readiness
assert 'request_time_schema_mutation: false' in notification_readiness
assert 'request_time_default_seeding: false' in notification_readiness
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO']:
    assert forbidden not in notification_readiness

# 404 Gift Card card-state write: migration-gated and canonical notification insert.
gift_readiness = read('functions/api/_lib/giftCardSchemaReadiness.js')
gift_actions = read('functions/api/admin/gift-card-actions.js')
gift_action_contract = read('functions/api/admin/contracts/operations-gift-card-action-write.js')
assert 'export const BUILD = 404' in gift_readiness
assert 'database_gift_card_runtime_parity.sql' in gift_readiness
assert 'const BUILD = 404' in gift_actions
assert 'requireGiftCardSchema' in gift_actions
assert 'requireNotificationSchema' in gift_actions
assert 'metadata_json' in gift_actions
assert 'destination' in gift_actions
for forbidden in ['CREATE TABLE', 'ALTER TABLE']:
    assert forbidden not in gift_actions
assert 'export const BUILD = 404' in gift_action_contract
assert "operations-gift-card-action-write" in gift_action_contract

# 405 templates/resends: no request-time schema/default creation.
templates = read('functions/api/admin/gift-card-delivery-templates.js')
template_contract = read('functions/api/admin/contracts/operations-gift-card-template-write.js')
assert 'const BUILD = 405' in templates
assert 'requireGiftCardSchema' in templates
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT OR IGNORE']:
    assert forbidden not in templates
assert 'export const BUILD = 405' in template_contract
assert 'requestTimeDefaultSeeding: false' in template_contract

# 406 provider/send: Gift Card + canonical notification readiness, provider adapters retained.
provider_send = read('functions/api/admin/gift-card-delivery-send.js')
provider_contract = read('functions/api/admin/contracts/operations-gift-card-provider-send-write.js')
assert 'const BUILD = 406' in provider_send
assert 'requireNotificationSchema' in provider_send
assert "notification_schema:'canonical-build-403'" in provider_send
assert "fetch('https://api.resend.com/emails'" in provider_send
assert "fetch('https://api.sendgrid.com/v3/mail/send'" in provider_send
assert "fetch('https://api.postmarkapp.com/email'" in provider_send
for forbidden in ['CREATE TABLE', 'ALTER TABLE']:
    assert forbidden not in provider_send
assert 'export const BUILD = 406' in provider_contract
assert 'providerBehaviorChanged: false' in provider_contract

# 407 abuse + real Gift Card UI consumer migration.
abuse = read('functions/api/admin/gift-card-abuse.js')
abuse_contract = read('functions/api/admin/contracts/operations-gift-card-abuse-write.js')
gift_ui = read('public/js/admin-gift-cards.js')
gift_read = read('functions/api/admin/contracts/operations-gift-cards-read.js')
assert 'const BUILD = 407' in abuse
assert 'gift_card_lookup_lockout_id' in abuse
for forbidden in ['CREATE TABLE', 'ALTER TABLE']:
    assert forbidden not in abuse
assert 'export const BUILD = 407' in abuse_contract
for route in [
    '/api/admin/contracts/operations-gift-card-action-write',
    '/api/admin/contracts/operations-gift-card-template-write',
    '/api/admin/contracts/operations-gift-card-provider-send-write',
    '/api/admin/contracts/operations-gift-card-abuse-write',
]:
    assert route in gift_ui
    assert route in gift_read
for legacy_write in [
    "post('/api/admin/gift-card-actions'", "post('/api/admin/gift-card-delivery-templates'",
    "post('/api/admin/gift-card-delivery-send'", "post('/api/admin/gift-card-abuse'",
]:
    assert legacy_write not in gift_ui
assert "ddGiftCardMutationUiBuild = '407'" in gift_ui

# 408 Orders status/fulfillment consumer routing and removal of Gift Card DDL fallback.
order_status = read('functions/api/admin/update-order-status.js')
status_contract = read('functions/api/admin/contracts/operations-order-status-write.js')
fulfillment_contract = read('functions/api/admin/contracts/operations-order-fulfillment-write.js')
order_bridge = read('public/js/admin-order-contract-bridge.js')
orders_page = read('admin/orders/index.html')
assert 'const BUILD = 408' in order_status
assert 'requireGiftCardSchema' in order_status
for forbidden in ['CREATE TABLE', 'ALTER TABLE']:
    assert forbidden not in order_status
assert 'export const IMPLEMENTATION_BUILD = 408' in status_contract
assert 'requestTimeSchemaRepairRemoved: true' in status_contract
assert 'export const IMPLEMENTATION_BUILD = 408' in fulfillment_contract
assert 'mutationConsumerMoved: true' in fulfillment_contract
assert '/api/admin/contracts/operations-order-status-write' in order_bridge
assert '/api/admin/contracts/operations-order-fulfillment-write' in order_bridge
assert '/api/admin/contracts/operations-payment-action-write' in order_bridge
assert '/public/js/admin-order-contract-bridge.js?v=408' in orders_page
assert orders_page.index('admin-order-contract-bridge.js?v=408') < orders_page.index('admin-order-detail.js')

# 409 provider mutation gate is fail-closed; mature provider code remains unchanged.
payment_contract = read('functions/api/admin/contracts/operations-payment-action-write.js')
payment_impl = read('functions/api/admin/payment-actions.js')
payment_gate_doc = read('docs/architecture/BUILD409_PAYMENT_PROVIDER_INTEGRATION_GATE.md')
assert 'export const BUILD = 409' in payment_contract
assert "PAYMENT_PROVIDER_MUTATIONS_ENABLED" in payment_contract
assert "provider_sync_confirmed" in payment_contract
assert "sync_provider: action === 'refund' && providerEnabled && providerConfirmed ? 1 : 0" in payment_contract
assert 'provider_mutation_gate_closed' in payment_contract
assert "fetch('https://api.stripe.com/v1/refunds'" in payment_impl
assert 'paypal.com' in payment_impl
assert 'local-only' in payment_gate_doc

# 410 invariant: top-level Commerce runtime remains transportless and does not own mutations.
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
applicator = read('scripts/build410_apply_development_parity_overlays.py')
assert 'createsNetworkTransport: false' in runtime
assert 'ownsOperationsMutations: false' in runtime
assert 'operationsMutationOwnership: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime

# Build 410 Development applicator must preserve data while reconciling known legacy shapes.
assert "DATABASE = 'devilndove-dev'" in applicator
assert "PROJECT = 'devilndove-site-dev'" in applicator
assert 'MEMBERSHIP_CANONICAL_COLUMNS' in applicator
assert 'rebuild_membership_policy_table' in applicator
assert 'recover_membership_partial_swap' in applicator
assert "pragma_table_info('membership_tier_policies')" in applicator
assert "pragma_index_list('membership_tier_policies')" in applicator
assert 'MEMBERSHIP_SHADOW' in applicator
assert 'MEMBERSHIP_BACKUP' in applicator
assert 'VERIFY MEMBERSHIP SHADOW ROW COUNT' in applicator
assert 'RETIRE MEMBERSHIP LEGACY BACKUP AFTER VERIFIED SEED' in applicator
assert "first_existing(columns, 'tier_code', 'code')" in applicator
assert "source_expr(columns, ('policy_id', 'id'), 'rowid')" in applicator
assert 'NOTIFICATION_COMPAT_COLUMNS' in applicator
assert 'ALIGN LEGACY notification_outbox COLUMNS' in applicator

print('BUILDS 403-410 COMMERCE MODULARITY: PASS')
print('No Cloudflare resource was contacted.')
