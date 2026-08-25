#!/usr/bin/env python3
"""Builds 393-402 consolidated local regression.

Source-only plus local SQLite smoke. No Cloudflare resource is contacted.
"""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def run_local(script: str, expected: str) -> None:
    result = subprocess.run(
        [sys.executable, str(ROOT / script)],
        cwd=ROOT,
        text=True,
        encoding='utf-8',
        errors='replace',
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    print(result.stdout, end='' if result.stdout.endswith('\n') else '\n')
    assert result.returncode == 0, f'{script} failed with {result.returncode}'
    assert expected in result.stdout, f'{script} did not emit {expected!r}'


# 393 Today Tasks mutation schema authority.
today_migration = read('database_today_task_actions_runtime_parity.sql')
today_impl = read('functions/api/admin/today-task-actions.js')
today_contract = read('functions/api/admin/contracts/operations-today-task-action-write.js')
assert '-- Devil n Dove Build 393' in today_migration
assert 'CREATE TABLE IF NOT EXISTS today_task_actions' in today_migration
assert 'request_time_schema_mutation: false' in today_impl
assert 'database_today_task_actions_runtime_parity.sql' in today_impl
for forbidden in ['CREATE TABLE', 'ALTER TABLE']:
    assert forbidden not in today_impl
assert 'export const BUILD = 392' in today_contract
assert 'export const IMPLEMENTATION_BUILD = 393' in today_contract
assert "export const MIGRATION_AUTHORITY = 'database_today_task_actions_runtime_parity.sql'" in today_contract
assert 'schemaOwnershipBuild: 393' in today_contract
assert 'requestTimeSchemaRepairRemoved: true' in today_contract
assert 'requestTimeSchemaMutation: false' in today_contract

# 394 Membership assignment authority and real consumer migration.
assignment = read('functions/api/admin/contracts/operations-membership-assignment-write.js')
access_ui = read('public/js/admin-access-tiers.js')
assert 'export const BUILD = 394' in assignment
assert "export const CONTRACT_ID = 'operations-membership-assignment-write'" in assignment
assert "actions: Object.freeze(['assign', 'remove'])" in assignment
assert 'consumerMoved: true' in assignment
assert '/api/admin/contracts/operations-membership-assignment-write' in access_ui

# 395 Membership policy migration + write authority; GET remains the proven 362 read.
policy_migration = read('database_membership_tier_policy_runtime_parity.sql')
policy_contract = read('functions/api/admin/contracts/operations-membership-policy-write.js')
policy_endpoint = read('functions/api/admin/tier-policies.js')
policy_ui = read('public/js/admin-tier-policy.js')
assert '-- Devil n Dove Build 395' in policy_migration
assert 'CREATE TABLE IF NOT EXISTS membership_tier_policies' in policy_migration
for code in ['bronze', 'silver', 'gold']:
    assert f"('{code}'" in policy_migration
assert 'export const BUILD = 395' in policy_contract
assert "export const CONTRACT_ID = 'operations-membership-policy-write'" in policy_contract
assert '/api/admin/contracts/operations-membership-policy-write' in policy_ui
get_section = policy_endpoint.split('export async function onRequestGet', 1)[1].split('export async function onRequestPost', 1)[0]
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO']:
    assert forbidden not in get_section

# 396-398 Customer Documents audit/read/mutation boundary.
audit396 = read('docs/architecture/BUILD396_CUSTOMER_DOCUMENTS_READ_AUDIT.md')
customer_migration = read('database_customer_documents_runtime_parity.sql')
customer_read = read('functions/api/_lib/customerDocumentsReadService.js')
customer_contract = read('functions/api/admin/contracts/operations-customer-documents-read.js')
customer_service = read('public/js/modules/commerce-operations/operations-customer-documents-read-service.mjs')
customer_endpoint = read('functions/api/admin/customer-documents.js')
audit398 = read('docs/architecture/BUILD398_CUSTOMER_DOCUMENTS_MUTATION_AUDIT.md')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
customer_page = read('admin/customer-documents/index.html')
assert 'Build 396' in audit396
assert 'CREATE TABLE IF NOT EXISTS customer_documents' in customer_migration
assert 'CREATE TABLE IF NOT EXISTS customer_document_sequences' in customer_migration
assert 'request_time_schema_mutation: false' in customer_read
assert "export const CONTRACT_ID = 'operations-customer-documents-read'" in customer_read
assert 'onRequestPost' not in customer_contract
assert "export const BUILD = 397" in customer_service
assert 'registry.registerService(SERVICE_ID, SERVICE, OWNER)' in customer_service
assert "const BUILD = 397;" in runtime
assert "'/admin/customer-documents/'" in runtime
assert "operations-customer-documents-read" in runtime
assert '/public/js/admin.js?v=397' in customer_page
assert 'Build 398' in audit398
# Build 414 strengthens the mutation boundary: the compatibility POST no longer performs
# request-time DDL and uses the shared Build 397 readiness authority before any write.
assert 'const BUILD = 414;' in customer_endpoint
assert 'readCustomerDocumentsSchemaReadiness' in customer_endpoint
assert 'requireWriteSchema' in customer_endpoint
assert 'database_customer_documents_runtime_parity.sql' in customer_endpoint
assert 'request_time_schema_mutation:false' in customer_endpoint.replace(' ', '')
for forbidden in ['CREATE TABLE', 'ALTER TABLE']:
    assert forbidden not in customer_endpoint

# 399 current Accounting parity authority.
accounting_migration = read('database_accounting_runtime_parity.sql')
accounting_reader = read('functions/api/_lib/accountingEvidenceCheckReadService.js')
for table in [
    'accounting_order_records', 'accounting_payment_applications',
    'accounting_hst_gst_reviews', 'accounting_period_closures',
    'accountant_export_packages', 'accounting_evidence_attachments',
]:
    assert f'CREATE TABLE IF NOT EXISTS {table}' in accounting_migration
assert 'hst_gst_review_records' not in accounting_reader
assert 'accountant_export_manifests' not in accounting_reader
assert 'accounting_hst_gst_reviews' in accounting_reader
assert 'accountant_export_packages' in accounting_reader

# 400 singular/plural notification ledgers remain deliberately distinct.
audit400 = read('docs/architecture/BUILD400_AGGREGATE_NOTIFICATION_AUTHORITY_AUDIT.md')
assert '`notification_dispatch_log` — singular' in audit400
assert '`notification_dispatch_logs` — plural' in audit400
assert 'must not be collapsed mechanically' in audit400
assert 'Build 403' in audit400

# 401 and 402 are executable local audits/smokes.
assert (ROOT / 'scripts/build401_active_runtime_table_parity_audit.py').exists()
assert (ROOT / 'scripts/build402_fresh_install_parity_smoke.py').exists()
run_local('scripts/build401_active_runtime_table_parity_audit.py', 'BUILD 401 ACTIVE RUNTIME TABLE PARITY AUDIT: PASS')
run_local('scripts/build402_fresh_install_parity_smoke.py', 'BUILD 402 FRESH INSTALL PARITY SMOKE: PASS')

print('BUILDS 393-402 MODULARITY + PARITY BATCH: PASS')
print('No Cloudflare resource was contacted.')
