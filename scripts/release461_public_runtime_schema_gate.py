from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] if Path(__file__).resolve().parent.name == 'scripts' else Path.cwd()

ROUTES = [
    ROOT / 'functions/api/checkout-recovery-lead.js',
    ROOT / 'functions/api/custom-request-consent.js',
    ROOT / 'functions/api/custom-request.js',
    ROOT / 'functions/api/custom-request-reference-upload.js',
]
HELPER = ROOT / 'functions/api/_lib/publicRuntimeSchemaReadiness.js'
MIGRATION = ROOT / 'migrations/dev/20260829_release461_public_runtime_schema_authority.sql'
RELEASE = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE)\b', re.I)
LEGACY_ENSURE = re.compile(r'\b(?:ensureTable|ensureSchema|ensureColumn)\s*\(', re.I)


def text(path: Path) -> str:
    if not path.exists():
        raise AssertionError(f'missing required file: {path.relative_to(ROOT)}')
    return path.read_text(encoding='utf-8')


def assert_no_request_ddl(path: Path) -> None:
    body = text(path)
    assert not DDL.search(body), f'request-time DDL remains in {path.relative_to(ROOT)}'
    assert not LEGACY_ENSURE.search(body), f'legacy schema ensure helper remains in {path.relative_to(ROOT)}'
    assert 'publicRuntimeSchemaReadiness.js' in body, f'readiness helper missing from {path.relative_to(ROOT)}'


for route in ROUTES:
    assert_no_request_ddl(route)

helper = text(HELPER)
assert not DDL.search(helper), 'readiness helper must be read-only'
for token in (
    'PRAGMA table_info(${tableName})',
    'PRAGMA index_list(${tableName})',
    'checkout_recovery_leads',
    'custom_request_fulfillment_prompts',
    'custom_requests',
    'custom_candle_soap_product_specs',
    'custom_request_reference_uploads',
    'media_consent_records',
    'browser_session_token',
    'customer_email',
):
    assert token in helper, f'missing readiness authority token: {token}'

recovery = text(ROUTES[0])
assert 'checkout_recovery_schema_unavailable' in recovery
assert 'hasCheckoutRecoverySchema' in recovery
assert 'ON CONFLICT(browser_session_token, customer_email)' in recovery

consent = text(ROUTES[1])
assert 'custom_request_consent_schema_unavailable' in consent
assert 'hasCustomRequestConsentSchema' in consent
assert "prompt_status='responded'" in consent

intake = text(ROUTES[2])
assert 'custom_request_schema_unavailable' in intake
assert 'hasCustomRequestIntakeSchema' in intake

upload = text(ROUTES[3])
assert 'custom_request_reference_schema_unavailable' in upload
assert 'hasCustomRequestReferenceUploadSchema' in upload

migration = text(MIGRATION)
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b', migration, re.I), 'Release 461 migration must remain additive/non-destructive'
for token in (
    'CREATE TABLE IF NOT EXISTS checkout_recovery_leads',
    'CREATE TABLE IF NOT EXISTS custom_request_fulfillment_prompts',
    'CREATE TABLE IF NOT EXISTS custom_requests',
    'CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs',
    'CREATE TABLE IF NOT EXISTS custom_request_reference_uploads',
    'CREATE TABLE IF NOT EXISTS media_consent_records',
    'idx_checkout_recovery_session_email',
    'idx_checkout_recovery_status_updated',
    'idx_custom_fulfillment_prompts_request',
    'idx_custom_fulfillment_prompts_token',
    'release461_checkout_recovery_required_columns',
    'release461_custom_consent_required_columns',
    'release461_custom_requests_required_columns',
    'release461_custom_specs_required_columns',
    'release461_reference_upload_required_columns',
    'release461_media_consent_required_columns',
    'PRAGMA foreign_key_check',
):
    assert token in migration, f'missing Release 461 migration token: {token}'

release = json.loads(text(RELEASE))
assert release['environment'] == 'development'
assert release['branch'] == 'dev'
assert int(release['release']) == 460, 'Release 461 remains a source/D1 candidate until Development migration acceptance'
policy = release['release_policy']
assert policy['production_promotion'] == 'closed'
assert policy['provider_publication'] == 'closed'
assert policy['provider_execution'] == 'closed'
assert policy['provider_live_authorization'] == 'closed'
assert policy['request_time_schema_mutation'] == 'forbidden'
assert release['current_release_database_state']['historical_migration_replay'] is False
assert release['current_release_evidence']['production_mutation'] is False
assert release['current_release_evidence']['provider_live_authorization_enabled'] is False

print('RELEASE 461 PUBLIC RUNTIME SCHEMA SOURCE GATE: PASS')
