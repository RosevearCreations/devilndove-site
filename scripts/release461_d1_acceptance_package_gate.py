#!/usr/bin/env python3
from pathlib import Path
import json
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_SCRIPT = ROOT / 'scripts/release461_d1_acceptance_manifest.py'
WORKFLOW = ROOT / '.github/workflows/development-d1-release461-acceptance.yml'
RELEASE_MARKER = ROOT / 'development-release.json'

assert MANIFEST_SCRIPT.is_file(), MANIFEST_SCRIPT
assert WORKFLOW.is_file(), WORKFLOW

subprocess.run([sys.executable, '-m', 'py_compile', str(MANIFEST_SCRIPT)], cwd=ROOT, check=True)
with tempfile.TemporaryDirectory() as tmp:
    manifest_path = Path(tmp) / 'manifest.json'
    subprocess.run(
        [sys.executable, str(MANIFEST_SCRIPT), 'manifest', '--output', str(manifest_path)],
        cwd=ROOT,
        check=True,
    )
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))

assert manifest['release'] == 461
assert manifest['migration_count'] >= 15, manifest['migration_count']
assert manifest['table_count'] > 0
assert manifest['index_count'] > 0
paths = [row['path'] for row in manifest['migrations']]
assert paths == sorted(paths), 'Release 461 migrations must be listed deterministically'
for required in (
    'migrations/dev/20260829_release461_public_runtime_schema_authority.sql',
    'migrations/dev/20260829_release461_notification_runtime_schema_authority.sql',
    'migrations/dev/20260829_release461_content_automation_publication_authority.sql',
    'migrations/dev/20260829_release461_accounting_support_schema_authority.sql',
    'migrations/dev/20260830_release461_accounting_statement_import_schema_authority.sql',
    'migrations/dev/20260830_release461_accounting_expense_runtime_schema_authority.sql',
    'migrations/dev/20260830_release461_accounting_general_ledger_schema_authority.sql',
    'migrations/dev/20260830_release461_accounting_journal_schema_authority.sql',
    'migrations/dev/20260830_release461_accounting_close_workflow_schema_authority.sql',
    'migrations/dev/20260830_release461_accounting_overhead_provider_schema_authority.sql',
):
    assert required in paths, f'missing Release 461 acceptance migration: {required}'

workflow = WORKFLOW.read_text(encoding='utf-8')
for token in (
    'workflow_dispatch:',
    'default: preflight',
    '- preflight',
    '- apply',
    'expected_sha:',
    'apply_confirmation:',
    'APPLY-RELEASE-461-TO-DEVELOPMENT',
    'DEV_D1_DATABASE_NAME: devilndove-dev',
    'EXPECTED_DEV_D1_DATABASE_ID: dbc1615b-dcbe-4951-973b-b47c99c73bfa',
    'python scripts/release461_aggregate_source_gate.py',
    'release461_d1_acceptance_manifest.py manifest',
    'release461_d1_acceptance_manifest.py check',
    'release461_d1_acceptance_manifest.py list',
    'SELECT type,name,tbl_name,sql FROM sqlite_master',
    '--require-converged',
    'SELECT COUNT(*) AS fk_violations FROM pragma_foreign_key_check',
    'development-release.json promotion: NOT performed by this workflow',
    'Separate live Production mutation: NONE',
):
    assert token in workflow, f'missing acceptance workflow safety token: {token}'

# This workflow must remain manual-only. Ignore comments before testing triggers.
workflow_no_comments = '\n'.join(line.split('#', 1)[0] for line in workflow.splitlines())
for forbidden_trigger in ('\n  push:', '\n  pull_request:', '\n  schedule:', '\n  repository_dispatch:'):
    assert forbidden_trigger not in workflow_no_comments, f'automatic Release 461 D1 trigger is forbidden: {forbidden_trigger.strip()}'

# The apply step must remain behind the explicit apply mode and confirmation phrase.
assert "if: env.ACCEPTANCE_MODE == 'apply'" in workflow
apply_position = workflow.find('Apply Release 461 migrations in deterministic forward order')
confirmation_position = workflow.find('Require deliberate Release 461 apply confirmation')
assert confirmation_position >= 0 and apply_position > confirmation_position
assert workflow.find("test \"${APPLY_CONFIRMATION}\" = 'APPLY-RELEASE-461-TO-DEVELOPMENT'", confirmation_position, apply_position) >= 0

release_text = RELEASE_MARKER.read_text(encoding='utf-8')
assert re.search(r'"release"\s*:\s*460\b', release_text), 'accepted source marker must remain Release 460 before explicit D1 acceptance'

print('RELEASE 461 D1 ACCEPTANCE PACKAGE SOURCE GATE: PASS')
print(f"Migrations: {manifest['migration_count']}")
print(f"Required tables: {manifest['table_count']}")
print(f"Required indexes: {manifest['index_count']}")
print('Default workflow mode: READ-ONLY PREFLIGHT')
print('Automatic Development D1 mutation: CLOSED')
