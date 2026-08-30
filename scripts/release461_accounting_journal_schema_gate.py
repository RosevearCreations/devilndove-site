#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
journal_route = ROOT / 'functions/api/admin/accounting-journal.js'
journal_read_service = ROOT / 'functions/api/_lib/accountingJournalReadService.js'
journal_migration = ROOT / 'migrations/dev/20260830_release461_accounting_journal_schema_authority.sql'
release_marker = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE|DROP\s+INDEX)\b', re.I)

for path in (journal_route, journal_read_service):
    text = path.read_text(encoding='utf-8')
    assert not DDL.search(text), f'accounting journal runtime DDL remains in {path}'

route_text = journal_route.read_text(encoding='utf-8')
for token in (
    'PRAGMA table_info(', 'PRAGMA index_list(', 'ensureJournalSchema',
    'accounting_journal_entries', 'accounting_journal_lines',
    'posted_by_user_id', 'posted_at', 'validation_message',
    'idx_accounting_journal_entries_period', 'idx_accounting_journal_entries_source',
    'idx_accounting_journal_lines_entry', 'Apply the current Development migration authority.',
    "'6900' AS ledger_code", "'Write-Off Expense' AS ledger_name",
):
    assert token in route_text, f'accounting journal route is missing authority token: {token}'
assert "COALESCE(NULLIF(ledger_code, ''), '6900') AS ledger_code" not in route_text, 'journal must not depend on nonexistent accounting_writeoffs.ledger_code'
assert "COALESCE(NULLIF(ledger_name, ''), 'Write-Off Expense') AS ledger_name" not in route_text, 'journal must not depend on nonexistent accounting_writeoffs.ledger_name'

read_text = journal_read_service.read_text(encoding='utf-8')
for token in (
    "ENTRY_TABLE = 'accounting_journal_entries'", "LINE_TABLE = 'accounting_journal_lines'",
    'request_time_schema_mutation: false', 'PRAGMA table_info(',
):
    assert token in read_text, f'journal read service is missing read-only token: {token}'

migration_text = journal_migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', migration_text, re.I)
assert not re.search(r'\bINSERT\s+INTO\b', migration_text, re.I), 'journal schema migration must not seed business rows'
for token in (
    'CREATE TABLE IF NOT EXISTS accounting_journal_entries',
    'journal_entry_id', 'period_month', 'entry_date', 'source_type', 'source_key',
    'reference_code', 'description', 'status', 'total_debit_cents', 'total_credit_cents',
    'imbalance_cents', 'notes', 'posted_by_user_id', 'posted_at', 'validation_message',
    'CREATE TABLE IF NOT EXISTS accounting_journal_lines',
    'journal_line_id', 'journal_entry_id', 'line_number', 'ledger_code', 'ledger_name',
    'line_description', 'debit_cents', 'credit_cents',
    'idx_accounting_journal_entries_period', 'idx_accounting_journal_entries_source',
    'idx_accounting_journal_lines_entry', 'PRAGMA foreign_key_check',
):
    assert token in migration_text, f'journal migration is missing authority token: {token}'

release_text = release_marker.read_text(encoding='utf-8')
assert re.search(r'"release"\s*:\s*460\b', release_text), 'development-release.json must remain at accepted Release 460 until manual D1 acceptance'

for path in (journal_route, journal_read_service):
    subprocess.run(['node', '--check', str(path)], cwd=ROOT, check=True)

print('RELEASE 461 ACCOUNTING JOURNAL SCHEMA SOURCE GATE: PASS')
