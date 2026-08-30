from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
gifi_helper = ROOT / 'functions/api/admin/_accountingGifi.js'
gifi_route = ROOT / 'functions/api/admin/accounting-gifi-notes.js'
attachment_helper = ROOT / 'functions/api/admin/_accountingAttachments.js'
attachment_route = ROOT / 'functions/api/admin/accounting-attachments.js'
fixed_assets_route = ROOT / 'functions/api/admin/accounting-fixed-assets.js'
period_helper = ROOT / 'functions/api/admin/_accountingPeriods.js'
period_route = ROOT / 'functions/api/admin/accounting-period-locks.js'
reconciliation_helper = ROOT / 'functions/api/admin/_accountingReconciliation.js'
migration = ROOT / 'migrations/dev/20260829_release461_accounting_support_schema_authority.sql'
release_marker = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE|DROP\s+INDEX)\b', re.I)

runtime_paths = (
    gifi_helper, gifi_route, attachment_helper, attachment_route,
    fixed_assets_route, period_helper, period_route, reconciliation_helper,
)
for path in runtime_paths:
    text = path.read_text(encoding='utf-8')
    assert not DDL.search(text), f'accounting runtime DDL remains in {path}'

for path, tokens in (
    (gifi_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingGifiNotesTable', 'idx_accounting_gifi_review_notes_year')),
    (attachment_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingAttachmentsTable', 'idx_accounting_attachments_expense', 'idx_accounting_attachments_vendor', 'idx_accounting_attachments_period', 'idx_accounting_attachments_scope')),
    (fixed_assets_route, ('PRAGMA table_info(accounting_fixed_assets)', 'ensureFixedAssetsTable', 'accounting_fixed_asset_id', 'business_use_percent')),
    (period_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingPeriodClosuresTable', 'idx_accounting_period_closures_period')),
    (reconciliation_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingReconciliationReviewsTable', 'idx_accounting_reconciliation_reviews_type_period')),
):
    text = path.read_text(encoding='utf-8')
    for token in tokens:
        assert token in text, f'missing read-only accounting readiness token {token} in {path}'

migration_text = migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', migration_text, re.I)
for token in (
    'CREATE TABLE IF NOT EXISTS accounting_gifi_review_notes',
    'idx_accounting_gifi_review_notes_year',
    'CREATE TABLE IF NOT EXISTS accounting_attachments',
    'attachment_status', 'attachment_scope', 'document_date', 'scope_key', 'provider_scope',
    'statement_gross_cents', 'statement_fee_cents', 'statement_net_cents', 'statement_tax_cents',
    'statement_shipping_cents', 'statement_txn_count', 'statement_period_start', 'statement_period_end', 'statement_detail_json',
    'idx_accounting_attachments_expense', 'idx_accounting_attachments_vendor', 'idx_accounting_attachments_period', 'idx_accounting_attachments_scope',
    'CREATE TABLE IF NOT EXISTS accounting_fixed_assets', 'business_use_percent',
    'CREATE TABLE IF NOT EXISTS accounting_period_closures', 'idx_accounting_period_closures_period',
    'CREATE TABLE IF NOT EXISTS accounting_reconciliation_reviews', 'statement_reference', 'difference_reason', 'detail_json',
    'expected_rate_basis_points', 'observed_rate_basis_points', 'unresolved_item_count', 'idx_accounting_reconciliation_reviews_type_period',
    'PRAGMA foreign_key_check',
):
    assert token in migration_text, f'migration is missing accounting authority token: {token}'

release_text = release_marker.read_text(encoding='utf-8')
assert re.search(r'"release"\s*:\s*460\b', release_text), 'development-release.json must remain at accepted Release 460 until manual D1 acceptance'

for path in runtime_paths:
    subprocess.run(['node', '--check', str(path)], cwd=ROOT, check=True)

print('RELEASE 461 ACCOUNTING SUPPORT SCHEMA SOURCE GATE: PASS')
