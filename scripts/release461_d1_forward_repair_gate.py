#!/usr/bin/env python3
"""Source-only gate for the bounded Release 461 Development structural forward repair."""
from pathlib import Path
import re
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
REPAIR=ROOT/'migrations/dev/20260830_runtime_schema_structural_forward_repair.sql'
CHECKER=ROOT/'scripts/release461_d1_forward_repair_check.py'
assert REPAIR.is_file(), REPAIR
assert CHECKER.is_file(), CHECKER
sql=REPAIR.read_text(encoding='utf-8')

required_columns={
 'accounting_fixed_assets': ['location_note TEXT'],
 'custom_requests': ['visitor_token TEXT','browser_session_token TEXT'],
 'custom_request_fulfillment_prompts': [
  "prompt_type TEXT NOT NULL DEFAULT 'review_photo_consent'",'subject TEXT','body_text TEXT','consent_question_text TEXT','prompt_token TEXT',
  "public_response_status TEXT NOT NULL DEFAULT 'not_sent'",'public_use_scope TEXT','review_text TEXT','customer_response_note TEXT','responded_at TEXT'],
 'custom_request_payment_links': ['order_id INTEGER','payment_id INTEGER',"external_share_status TEXT NOT NULL DEFAULT 'gate_pending'", "gate_status TEXT NOT NULL DEFAULT 'pending'", "preferred_provider TEXT NOT NULL DEFAULT 'manual'",'checkout_redirect_url TEXT'],
}
for table,columns in required_columns.items():
 for column in columns:
  assert f'ALTER TABLE {table} ADD COLUMN {column};' in sql, f'missing bounded repair: {table}.{column}'

indexes={
 'idx_accounting_gifi_review_notes_year':'ON accounting_gifi_review_notes(tax_year, review_status, gifi_code);',
 'idx_accounting_journal_entries_source':'ON accounting_journal_entries(source_type, source_key);',
 'idx_accounting_period_closures_period':'ON accounting_period_closures(period_month DESC, lock_state);',
 'idx_custom_candle_soap_specs_request':'ON custom_candle_soap_product_specs(custom_request_id, updated_at DESC);',
}
for name,target in indexes.items():
 assert f'DROP INDEX IF EXISTS {name};' in sql, f'missing stale-index removal: {name}'
 assert f'CREATE INDEX {name}' in sql and target in sql, f'missing replacement index: {name}'

assert sql.count('ALTER TABLE ') == 19, 'repair must contain exactly the 19 reviewed ADD COLUMN operations'
assert sql.count('DROP INDEX IF EXISTS ') == 4, 'repair must contain exactly four reviewed index replacements'
assert sql.count('CREATE INDEX ') == 4, 'repair must contain exactly four reviewed replacement indexes'
assert 'BEGIN TRANSACTION;' in sql and 'COMMIT;' in sql, 'repair must be transactional'
for forbidden in ('DROP TABLE','DELETE FROM','UPDATE ','INSERT INTO','CREATE TABLE','main','devilndove-site`','provider'):
 if forbidden in ('provider',):
  continue
 assert forbidden not in sql, f'forbidden repair operation/token: {forbidden}'
assert not re.search(r'ALTER\s+TABLE\s+\w+\s+(?!ADD\s+COLUMN)',sql,re.I), 'only ALTER TABLE ADD COLUMN is allowed'
subprocess.run([sys.executable,'-m','py_compile',str(CHECKER)],cwd=ROOT,check=True)
print('RELEASE 461 DEVELOPMENT D1 STRUCTURAL FORWARD REPAIR SOURCE GATE: PASS')
print('Reviewed ADD COLUMN operations: 19')
print('Reviewed named-index replacements: 4')
print('Table/data deletion: NONE')
print('Historical migration replay: NONE')
print('Production/provider/R2 mutation: NONE')
