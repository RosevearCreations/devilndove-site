#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'scripts/release461_d1_acceptance_manifest.py'
REPAIR_CHECK=ROOT/'scripts/release461_d1_forward_repair_check.py'
REPAIR_GATE=ROOT/'scripts/release461_d1_forward_repair_gate.py'
REPAIR_SQL=ROOT/'migrations/dev/20260830_runtime_schema_structural_forward_repair.sql'
WORKFLOW=ROOT/'.github/workflows/development-d1-release461-acceptance.yml'
RELEASE=ROOT/'development-release.json'
for path in (MANIFEST,REPAIR_CHECK,REPAIR_GATE,REPAIR_SQL,WORKFLOW,RELEASE): assert path.is_file(),path
subprocess.run([sys.executable,'-m','py_compile',str(MANIFEST),str(REPAIR_CHECK),str(REPAIR_GATE)],cwd=ROOT,check=True)
subprocess.run([sys.executable,str(REPAIR_GATE)],cwd=ROOT,check=True)
with tempfile.TemporaryDirectory() as tmp:
 p=Path(tmp)/'manifest.json';subprocess.run([sys.executable,str(MANIFEST),'manifest','--output',str(p)],cwd=ROOT,check=True);manifest=json.loads(p.read_text())
assert manifest['release']==461 and manifest['migration_count']>=19 and manifest['table_count']>0 and manifest['index_count']>0
paths=[row['path'] for row in manifest['migrations']];assert paths==sorted(paths)
assert 'migrations/dev/20260830_runtime_schema_structural_forward_repair.sql' not in paths,'structural repair must remain outside release461 additive manifest'
workflow=WORKFLOW.read_text(encoding='utf-8')
for token in (
 'workflow_dispatch:','default: preflight','preflight, apply','expected_sha:','apply_confirmation:',
 'data/release461-d1-acceptance-request.json','git diff --name-only HEAD^ HEAD','expected_parent_sha',
 'APPLY-RELEASE-461-TO-DEVELOPMENT','DEV_D1_DATABASE_NAME: devilndove-dev','EXPECTED_DEV_D1_DATABASE_ID: dbc1615b-dcbe-4951-973b-b47c99c73bfa',
 'python scripts/release461_aggregate_source_gate.py','release461_d1_acceptance_manifest.py manifest','release461_d1_forward_repair_check.py',
 '20260830_runtime_schema_structural_forward_repair.sql','R461_D1_REPAIR_REQUIRED','Apply exact reviewed structural forward repair',
 'Read-only post-repair structural proof','release461_d1_acceptance_manifest.py list','--require-converged',
 'SELECT COUNT(*) AS fk_violations FROM pragma_foreign_key_check','development-release.json promotion: NOT performed by this workflow','Separate live Production mutation: NONE'):
 assert token in workflow,f'missing acceptance workflow safety token: {token}'
no_comments='\n'.join(line.split('#',1)[0] for line in workflow.splitlines())
for forbidden in ('\n  pull_request:','\n  schedule:','\n  repository_dispatch:'): assert forbidden not in no_comments
assert "paths:\n      - 'data/release461-d1-acceptance-request.json'" in workflow
assert "test \"$(git diff --name-only HEAD^ HEAD)\" = 'data/release461-d1-acceptance-request.json'" in workflow
confirm=workflow.find('Require deliberate Release 461 apply confirmation');repair=workflow.find('Apply exact reviewed structural forward repair');apply=workflow.find('Apply Release 461 migrations in deterministic forward order')
assert 0<=confirm<repair<apply
release=json.loads(RELEASE.read_text());assert int(release.get('release') or 0)==461
assert int(release['development_infrastructure']['d1']['schema_current_through_release']) in (460,461)
assert release['current_release_database_state']['historical_migration_replay'] is False
print('RELEASE 461 D1 ACCEPTANCE PACKAGE SOURCE GATE: PASS')
print(f"Migrations: {manifest['migration_count']}")
print(f"Required tables: {manifest['table_count']}")
print(f"Required indexes: {manifest['index_count']}")
print('Known structural drift: EXACT FORWARD REPAIR REQUIRED/CLASSIFIED')
print('Default workflow mode: READ-ONLY PREFLIGHT')
print('Ordinary-push Development D1 mutation: CLOSED')
