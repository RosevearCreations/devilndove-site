#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'functions/api/_lib/notificationOutbox.js'
MIGRATION = ROOT / 'migrations/dev/20260829_release461_notification_runtime_schema_authority.sql'
RELEASE = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE)\b', re.I)
helper = HELPER.read_text(encoding='utf-8')
assert not DDL.search(helper), 'request-time notification schema DDL remains in notificationOutbox.js'
assert 'INSERT INTO notification_cooldown_rules' not in helper, 'runtime cooldown-rule seeding remains in notificationOutbox.js'
for token in (
    'getNotificationRuntimeSchemaReadiness',
    'PRAGMA table_info(${tableName})',
    'notification_schema_unavailable',
    'requireNotificationRuntimeSchema(db)',
    'notification_outbox',
    'notification_dispatch_log',
    'notification_exclusions',
    'notification_cooldown_rules',
    'customer_engagement_runs',
):
    assert token in helper, f'missing read-only notification readiness contract: {token}'

migration = MIGRATION.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b', migration, re.I), 'notification authority must remain additive/non-destructive'
for token in (
    'CREATE TABLE IF NOT EXISTS notification_outbox',
    'CREATE TABLE IF NOT EXISTS notification_dispatch_log',
    'CREATE TABLE IF NOT EXISTS notification_exclusions',
    'CREATE TABLE IF NOT EXISTS notification_cooldown_rules',
    'CREATE TABLE IF NOT EXISTS customer_engagement_runs',
    'idx_notification_outbox_status',
    'idx_notification_outbox_kind',
    'idx_notification_dispatch_log_outbox',
    'idx_notification_exclusions_lookup',
    "('checkout_recovery', 24",
    "('review_request', 72",
    "('back_in_stock', 24",
    "('gift_card_issued', 1",
    "('gift_card_purchase_confirmation', 1",
    'PRAGMA foreign_key_check',
):
    assert token in migration, f'missing notification migration authority: {token}'

release = json.loads(RELEASE.read_text(encoding='utf-8'))
assert int(release.get('release', 0)) == 461, 'Release 461 must be the current Development release authority'
assert int((release.get('development_infrastructure') or {}).get('d1', {}).get('schema_current_through_release') or 0) in (460, 461), 'Release 461 source gate must preserve honest D1 pending-or-converged state'
policy = release.get('release_policy') or {}
assert policy.get('production_promotion') == 'closed'
assert policy.get('provider_publication') == 'closed'
assert policy.get('provider_execution') == 'closed'
assert policy.get('provider_live_authorization') == 'closed'
assert policy.get('request_time_schema_mutation') == 'forbidden'

print('RELEASE 461 NOTIFICATION RUNTIME SCHEMA SOURCE GATE: PASS')
print('D1 mutation: NONE')
print('Provider execution/authorization/publication: CLOSED')
print('Separate live Production mutation: NONE')