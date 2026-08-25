from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


audit383 = read('docs/architecture/BUILD383_GIFT_CARD_SCHEMA_AUTHORITY_AUDIT.md')
migration = read('database_gift_card_runtime_parity.sql')
release_helper = read('scripts/build384_apply_gift_card_parity_direct.py')
public_gift_balance = read('functions/api/gift-card-balance.js')
gift_contract = read('functions/api/admin/contracts/operations-gift-cards-read.js')
gift_service = read('public/js/modules/commerce-operations/operations-gift-cards-read-service.mjs')
gift_ui = read('public/js/admin-gift-cards.js')
gift_page = read('admin/gift-cards/index.html')
gift_history = read('functions/api/admin/gift-card-delivery-history.js')
gift_actions = read('functions/api/admin/gift-card-actions.js')
gift_send = read('functions/api/admin/gift-card-delivery-send.js')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin_js = read('public/js/admin.js')
orders_read = read('functions/api/admin/orders.js')
order_status = read('functions/api/admin/update-order-status.js')
order_status_contract = read('functions/api/admin/contracts/operations-order-status-write.js')
payment_read = read('functions/api/admin/order-payments.js')
payment_actions = read('functions/api/admin/payment-actions.js')
fulfillment_contract = read('functions/api/admin/contracts/operations-order-fulfillment-write.js')
today_actions = read('functions/api/admin/today-task-actions.js')
today_action_contract = read('functions/api/admin/contracts/operations-today-task-action-write.js')

# 383 audit pins the real startup/schema authority problem.
assert 'three automatic startup GETs' in audit383
assert 'notification_outbox' in audit383
assert 'gift_card_delivery_templates' in audit383
assert 'gift_card_lookup_attempts' in audit383

# 384 migration owns all Gift Card-domain tables and seeds defaults outside GET.
for table in [
    'gift_cards', 'gift_card_redemptions', 'gift_card_admin_events',
    'gift_card_delivery_templates', 'gift_card_delivery_queue',
    'gift_card_provider_send_logs', 'gift_card_lookup_attempts',
    'gift_card_lookup_lockouts',
]:
    assert f'CREATE TABLE IF NOT EXISTS {table}' in migration
assert "('activation'" in migration
assert "('reissue'" in migration
assert 'CREATE TABLE IF NOT EXISTS notification_outbox' not in migration

# Build 384 fresh-install lookup-attempt shape must match the current public runtime.
for column in [
    'code_hint', 'email_hash', 'client_key', 'lookup_email', 'code_suffix',
    'ip_hash', 'user_agent', 'result_status', 'was_success', 'created_at',
]:
    assert column in migration
    assert column in public_gift_balance
assert 'idx_gift_card_lookup_attempts_email' in migration

# Development release helper must align legacy lookup-attempt tables before indexing.
assert 'LOOKUP_ATTEMPT_COMPAT_COLUMNS' in release_helper
assert 'LEGACY LOOKUP-ATTEMPT COLUMN ALIGNMENT' in release_helper
assert 'allow_duplicate_column=True' in release_helper
assert "ALTER TABLE gift_card_lookup_attempts ADD COLUMN" in release_helper
assert 'VERIFY LOOKUP-ATTEMPT CURRENT COLUMNS' in release_helper
assert 'compact_sql(sql)' in release_helper

# 385 owned startup contract is read-only/readiness-aware.
assert 'export const BUILD = 385' in gift_contract
assert "export const CONTRACT_ID = 'operations-gift-cards-read'" in gift_contract
assert "export const OWNER = 'operations'" in gift_contract
assert 'PRAGMA table_info' in gift_contract
assert "migration_authority: 'database_gift_card_runtime_parity.sql'" in gift_contract
assert 'request_time_schema_mutation: false' in gift_contract
assert 'request_time_default_seeding: false' in gift_contract
assert 'mutation_ownership_moved: false' in gift_contract
assert 'onRequestPost' not in gift_contract
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in gift_contract

# 386 passive service + page-specific runtime gate.
assert 'export const BUILD = 386' in gift_service
assert 'export const CONTRACT_BUILD = 385' in gift_service
assert "export const SERVICE_ID = 'operations-gift-cards-read'" in gift_service
registration = section(gift_service, 'export function ensureOperationsGiftCardsReadService')
assert 'registry.registerService(SERVICE_ID, SERVICE, OWNER)' in registration
assert 'apiFetch(' not in registration
assert 'fetch(' not in registration
assert 'const BUILD = 386;' in runtime
assert 'const ACTIVATION_BUILD = 386;' in runtime
assert "const GIFT_CARDS_RUNTIME_PAGE = '/admin/gift-cards/'" in runtime
assert "const GIFT_CARDS_REQUIRED_SERVICES = Object.freeze(['operations-gift-cards-read'])" in runtime
assert 'ensureOperationsGiftCardsReadService(registry)' in runtime
assert 'giftCardsMutationOwnership: false' in runtime
assert 'ownsGiftCardsMutations: false' in runtime
assert 'giftCardsMutationOwnershipMoved: false' in runtime
assert 'currentGiftCardsPageProven' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime
assert "entry: '../modules/commerce-operations/runtime.mjs?v=386'" in groups
assert 'OPERATIONS_GIFT_CARDS_READ_CONTRACT_BUILD = 385' in groups
assert 'RUNTIME_OPERATIONS_BUILD = 386' in groups
assert 'OPERATIONS_RUNTIME_COVERAGE_BUILD = 386' in groups
assert "'/admin/gift-cards/'" in groups
assert 'giftCardsMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert 'dd-admin-module-runtime.mjs?v=386' in admin_js
assert '/public/js/admin.js?v=386' in gift_page
assert '/public/js/admin-gift-cards.js?v=386' in gift_page
assert gift_page.index('/public/js/admin.js?v=386') < gift_page.index('/public/js/admin-gift-cards.js?v=386')

# Gift Cards automatic load uses only the owned read; write routes remain explicit click handlers.
load_section = section(gift_ui, 'async function load()', 'async function saveTemplate')
assert '/api/admin/contracts/operations-gift-cards-read' in load_section
assert '/api/admin/gift-card-delivery-templates' not in load_section
assert '/api/admin/gift-card-abuse' not in load_section
assert '/api/admin/gift-card-delivery-send' not in load_section
assert "method: 'POST'" in gift_ui

# 387 history GET no longer creates schema; mutation-side fallbacks are intentionally retained/audited.
assert 'build:387' in gift_history
assert 'request_time_schema_mutation:false' in gift_history
assert 'CREATE TABLE' not in gift_history
assert 'async function ensureTables(db)' in gift_actions
assert 'CREATE TABLE IF NOT EXISTS gift_cards' in gift_actions
assert 'CREATE TABLE IF NOT EXISTS notification_outbox' in gift_actions
assert 'CREATE TABLE IF NOT EXISTS notification_outbox' in gift_send

# 388 Orders list read stays non-mutating and uses current cents model.
orders_get = section(orders_read, 'export async function onRequestGet')
assert 'o.total_cents' in orders_get
assert 'payments p' in orders_get
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in orders_get

# 389 formal order-status authority delegates mature implementation without provider changes.
assert 'export const BUILD = 389' in order_status_contract
assert "export const CONTRACT_ID = 'operations-order-status-write'" in order_status_contract
assert "import { onRequestPost as legacyPost } from '../update-order-status.js';" in order_status_contract
assert 'return legacyPost(context)' in order_status_contract
assert 'providerBehaviorChanged: false' in order_status_contract
assert 'export async function onRequestPost' in order_status

# 390 payment read is GET-only; refund action remains provider-aware compatibility code.
assert 'export async function onRequestGet' in payment_read
assert 'onRequestPost' not in payment_read
assert "fetch('https://api.stripe.com/v1/refunds'" in payment_actions
assert 'paypal.com' in payment_actions
assert 'sync_provider' in payment_actions

# 391 fulfillment authority can only force fulfilled and delegates the status implementation.
assert 'export const BUILD = 391' in fulfillment_contract
assert "export const CONTRACT_ID = 'operations-order-fulfillment-write'" in fulfillment_contract
assert "new_status: 'fulfilled'" in fulfillment_contract
assert 'legacyStatusPost' in fulfillment_contract
assert 'mutationConsumerMoved: false' in fulfillment_contract

# 392 Today Tasks action authority formalizes the existing local action implementation.
assert 'export const BUILD = 392' in today_action_contract
assert "export const CONTRACT_ID = 'operations-today-task-action-write'" in today_action_contract
assert "import { onRequestPost as legacyPost } from '../today-task-actions.js';" in today_action_contract
assert "allowedActions: Object.freeze(['completed', 'ignored', 'snoozed'])" in today_action_contract
assert 'schemaOwnershipFollowupBuild: 393' in today_action_contract
assert 'CREATE TABLE IF NOT EXISTS today_task_actions' in today_actions

print('BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS')
print('No Cloudflare resource was contacted.')
