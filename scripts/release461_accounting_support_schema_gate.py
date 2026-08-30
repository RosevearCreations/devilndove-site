from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
gifi_helper = ROOT / 'functions/api/admin/_accountingGifi.js'
gifi_route = ROOT / 'functions/api/admin/accounting-gifi-notes.js'
attachment_helper = ROOT / 'functions/api/admin/_accountingAttachments.js'
attachment_route = ROOT / 'functions/api/admin/accounting-attachments.js'
migration = ROOT / 'migrations/dev/20260829_release461_accounting_support_schema_authority.sql'
release_marker = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE|DROP\s+INDEX)\b', re.I)

for path in (gifi_helper, gifi_route, attachment_helper, attachment_route):
    text = path.read_text(encoding='utf-8')
    assert not DDL.search(text), f'accounting runtime DDL remains in {path}'

for path, tokens in (
    (gifi_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingGifiNotesTable', 'idx_accounting_gifi_review_notes_year')),
    (attachment_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingAttachmentsTable', 'idx_accounting_attachments_expense', 'idx_accounting_attachments_vendor', 'idx_accounting_attachments_period', 'idx_accounting_attachments_scope')),
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
    'PRAGMA foreign_key_check',
):
    assert token in migration_text, f'migration is missing accounting authority token: {token}'

release_text = release_marker.read_text(encoding='utf-8')
assert re.search(r'"release"\s*:\s*460\b', release_text), 'development-release.json must remain at accepted Release 460 until manual D1 acceptance'

for path in (gifi_helper, gifi_route, attachment_helper, attachment_route):
    subprocess.run(['node', '--check', str(path)], cwd=ROOT, check=True)

print('RELEASE 461 ACCOUNTING SUPPORT SCHEMA SOURCE GATE: PASS')
