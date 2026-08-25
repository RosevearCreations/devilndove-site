from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


def number(text, pattern):
    match = re.search(pattern, text)
    assert match, pattern
    return int(match.group(1))


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

# 383 audit pins the original startup/schema authority problem.
assert 'three automatic startup GETs' in audit383
assert 'notification_outbox' in audit383
assert 'gift_card_delivery_templates' in audit383
assert 'gift_card_lookup_attempts' in audit383

# 384 migration remains the Gift Card-domain schema/default authority.
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

for column in [
    'code_hint', 'email_hash', 'client_key', 'lookup_email', 'code_suffix',
    'ip_hash', 'user_agent', 'result_status', 'was_success', 'created_at',
]:
    assert column in migration
    assert column in public_gift_balance
assert 'idx_gift_card_lookup_attempts_email' in migration
assert 'LOOKUP_ATTEMPT_COMPAT_COLUMNS' in release_helper
assert 'LEGACY LOOKUP-ATTEMPT COLUMN ALIGNMENT' in release_helper
assert 'allow_duplicate_column=True' in release_helper
assert 'ALTER TABLE gift_card_lookup_attempts ADD COLUMN' in release_helper
assert 'VERIFY LOOKUP-ATTEMPT CURRENT COLUMNS' in release_helper
assert 'compact_sql(sql)' in release_helper

# 385 owned startup contract stays GET-only/readiness-aware even when later mutation
# contracts replace the compatibility aliases advertised by its metadata.
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

# 386 passive service + Gift Card page boundary remain durable under later work.
assert 'export const BUILD = 386' in gift_service
assert 'export const CONTRACT_BUILD = 385' in gift_service
assert "export const SERVICE_ID = 'operations-gift-cards-read'" in gift_service
registration = section(gift_service, 'export function ensureOperationsGiftCardsReadService')
assert 'registry.registerService(SERVICE_ID, SERVICE, OWNER)' in registration
assert 'apiFetch(' not in registration
assert 'fetch(' not in registration
assert number(runtime, r'const BUILD = (\d+);') >= 386
assert number(runtime, r'const ACTIVATION_BUILD = (\d+);') >= 386
assert "const GIFT_CARDS_RUNTIME_PAGE = '/admin/gift-cards/'" in runtime
assert "const GIFT_CARDS_REQUIRED_SERVICES = Object.freeze(['operations-gift-cards-read'])" in runtime
assert 'ensureOperationsGiftCardsReadService(registry)' in runtime
assert 'giftCardsMutationOwnership: false' in runtime
assert 'ownsGiftCardsMutations: false' in runtime
assert 'currentGiftCardsPageProven' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime
runtime_entry = number(groups, r"entry: '../modules/commerce-operations/runtime\.mjs\?v=(\d+)'")
assert runtime_entry >= 386
assert 'OPERATIONS_GIFT_CARDS_READ_CONTRACT_BUILD = 385' in groups
assert number(groups, r'RUNTIME_OPERATIONS_BUILD = (\d+);') >= 386
assert number(groups, r'OPERATIONS_RUNTIME_COVERAGE_BUILD = (\d+);') >= 386
assert "'/admin/gift-cards/'" in groups
assert 'giftCardsMutationOwnershipMovedByTopLevelRuntime: false' in groups
admin_cache = number(admin_js, r'dd-admin-module-runtime\.mjs\?v=(\d+)')
assert admin_cache >= 386
assert '/public/js/admin.js?v=386' in gift_page
assert '/public/js/admin-gift-cards.js?v=386' in gift_page
assert gift_page.index('/public/js/admin.js?v=386') < gift_page.index('/public/js/admin-gift-cards.js?v=386')

# Gift Cards automatic load remains read-only. Later Builds 404-407 may migrate
# explicit write consumers to owned contracts; the historical read proof is unchanged.
load_section = section(gift_ui, 'async function load()', 'async function saveTemplate')
assert '/api/admin/contracts/operations-gift-cards-read' in load_section
assert "method: 'POST'" in gift_ui

# 387 delivery-history GET remains schema-clean. Mutation endpoints may either retain
# the original compatibility fallback or advance to migration-owned readiness.
assert 'build:387' in gift_history
assert 'request_time_schema_mutation:false' in gift_history
assert 'CREATE TABLE' not in gift_history
if 'const BUILD = 404' in gift_actions:
    assert 'requireGiftCardSchema' in gift_actions
    assert 'CREATE TABLE' not in gift_actions
    assert 'ALTER TABLE' not in gift_actions
    assert 'request_time_schema_mutation:false' in gift_actions.replace(' ', '') or 'request_time_schema_mutation: false' in gift_actions
else:
    assert 'async function ensureTables(db)' in gift_actions
    assert 'CREATE TABLE IF NOT EXISTS gift_cards' in gift_actions
if 'const BUILD = 406' in gift_send:
    assert 'requireGiftCardSchema' in gift_send
    assert 'requireNotificationSchema' in gift_send
    assert 'CREATE TABLE' not in gift_send
    assert 'ALTER TABLE' not in gift_send
else:
    assert 'CREATE TABLE IF NOT EXISTS notification_outbox' in gift_send

# 388 Orders list read stays non-mutating and uses current cents model.
orders_get = section(orders_read, 'export async function onRequestGet')
assert 'o.total_cents' in orders_get
assert 'payments p' in orders_get
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in orders_get

# 389 status authority remains public Build 389; Build 408 may advance implementation.
assert 'export const BUILD = 389' in order_status_contract
assert "export const CONTRACT_ID = 'operations-order-status-write'" in order_status_contract
assert 'providerBehaviorChanged: false' in order_status_contract
assert 'export async function onRequestPost' in order_status
if 'IMPLEMENTATION_BUILD = 408' in order_status_contract:
    assert 'requestTimeSchemaRepairRemoved: true' in order_status_contract
    assert 'CREATE TABLE' not in order_status
    assert 'requireGiftCardSchema' in order_status
else:
    assert "import { onRequestPost as legacyPost } from '../update-order-status.js';" in order_status_contract
    assert 'return legacyPost(context)' in order_status_contract

# 390 payment read remains GET-only and provider implementation remains explicit.
assert 'export async function onRequestGet' in payment_read
assert 'onRequestPost' not in payment_read
assert "fetch('https://api.stripe.com/v1/refunds'" in payment_actions
assert 'paypal.com' in payment_actions
assert 'sync_provider' in payment_actions

# 391 fulfillment remains a fulfilled-only boundary; later Build 408 may move consumer.
assert 'export const BUILD = 391' in fulfillment_contract
assert "export const CONTRACT_ID = 'operations-order-fulfillment-write'" in fulfillment_contract
assert "new_status: 'fulfilled'" in fulfillment_contract
if 'IMPLEMENTATION_BUILD = 408' in fulfillment_contract:
    assert 'mutationConsumerMoved: true' in fulfillment_contract
    assert 'implementationPost' in fulfillment_contract
else:
    assert 'legacyStatusPost' in fulfillment_contract
    assert 'mutationConsumerMoved: false' in fulfillment_contract

# 392 remains public Today Tasks action authority while 393 may advance implementation.
assert 'export const BUILD = 392' in today_action_contract
assert "export const CONTRACT_ID = 'operations-today-task-action-write'" in today_action_contract
assert "allowedActions: Object.freeze(['completed', 'ignored', 'snoozed'])" in today_action_contract
if 'IMPLEMENTATION_BUILD = 393' in today_action_contract:
    assert 'requestTimeSchemaRepairRemoved: true' in today_action_contract
    assert 'schemaOwnershipBuild: 393' in today_action_contract
    assert 'CREATE TABLE IF NOT EXISTS today_task_actions' not in today_actions
    assert 'ALTER TABLE today_task_actions' not in today_actions
    assert 'request_time_schema_mutation: false' in today_actions
else:
    assert 'schemaOwnershipFollowupBuild: 393' in today_action_contract
    assert 'CREATE TABLE IF NOT EXISTS today_task_actions' in today_actions

print('BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS')
print('No Cloudflare resource was contacted.')
