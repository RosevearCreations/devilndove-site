#!/usr/bin/env python3
"""Static acceptance for Release 466 Build 1 — Governance, Recovery & Production Reliability."""
from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
CANONICAL=[
 '0001_release464_migration_authority.sql',
 '0002_release464_operational_acceptance.sql',
 '0003_release464_business_growth.sql',
 '0004_release465_storefront_quality.sql',
]

def read(path):
 p=ROOT/path
 if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
 return p.read_text(encoding='utf-8',errors='replace')

def req(ok,msg):
 if not ok: FAIL.append(msg)

def has(body,*tokens,label='file'):
 for token in tokens: req(token in body,f'{label} missing required contract: {token}')

a=json.loads(read('release466-build1-governance-recovery-reliability.json') or '{}')
req(int(a.get('release') or 0)==466 and int(a.get('build') or 0)==1,'Release 466 Build 1 identity drifted')
req(a.get('state') in ('in_progress_source_candidate','development_green_external_ruleset_pending','complete_development_green'),'Build 1 state unsupported')
req([x.get('id') for x in a.get('items',[])]==[1,2,3,4,5],'Build 1 authority must contain items 1-5')
req(a.get('schema_change_required') is False and a.get('migration') is None,'Build 1 must remain schema-neutral')
item={int(x.get('id') or 0):x for x in a.get('items',[])}
req(item.get(1,{}).get('status') in ('implemented_source_candidate_external_ruleset_apply_pending','development_green_external_ruleset_pending','complete_development_green'),'native ruleset state must remain explicit')
for idx in (2,3,4,5): req(item.get(idx,{}).get('status') in ('implemented_source_candidate','complete_development_green'),f'Build 1 item {idx} status unsupported')
for key in ('production_business_mutation','production_schema_mutation','provider_execution','provider_publication','inventory_mutation','accounting_posting','automatic_rollback_execution','raw_r2_delete','request_time_schema_ddl'):
 req((a.get('safety') or {}).get(key) is False,f'Build 1 safety boundary drifted: {key}')
req((a.get('safety') or {}).get('preview_access_must_remain_enforced') is True,'Preview Access must remain enforced')

manifest=json.loads(read('migrations/canonical/manifest.json') or '{}')
req([x.get('file') for x in manifest.get('migrations',[])]==CANONICAL,'Release 466 Build 1 must preserve exact canonical migration sequence 0001-0004')
req(not (ROOT/'migrations/canonical/0005_release466_governance_recovery_reliability.sql').exists(),'Build 1 must not invent migration 0005')

policy=read('.github/RELEASE466_BRANCH_PROTECTION_POLICY.md')
has(policy,'Target branch: `dev`','Target branch: `main`','Block branch deletion','Block force pushes','Require linear history','status check context `source-gate`','exact source-gated commit SHA','external repository-governance action',label='branch protection policy')

rollback=read('scripts/release466_rollback_plan.py')
has(rollback,'merge-base','--is-ancestor','schema_rollback_allowed','business_data_restore_automatic','target_must_have_prior_successful_production_deployment','post_rollback_binding_and_public_smoke_required',label='rollback planner')
rollback_workflow=read('.github/workflows/production-rollback-readiness.yml')
has(rollback_workflow,'workflow_dispatch','RELEASE466_ROLLBACK_READINESS','release466_rollback_plan.py','prior successful Production deployment','release466-production-rollback-readiness','Rollback action executed: NO','Production mutation: ZERO',label='rollback readiness workflow')
for token in ('pages deploy','--target production --apply','git push','update-ref','d1 migrations apply'):
 req(token not in rollback_workflow,f'rollback readiness workflow must not execute rollback/migration action: {token}')

recovery=read('scripts/release466_recovery_rehearsal.py')
has(recovery,'ephemeral_local_sqlite','PRAGMA integrity_check','PRAGMA foreign_key_check','raw_export_artifact_retained','restored_database_artifact_retained','production_contacted',label='recovery rehearsal')
drift=read('scripts/release466_drift_detector.py')
has(drift,'schema_identity_and_canonical_migration_authority_only','business_rows_read','missing_in_production','extra_in_production','canonical_migrations_match','canonical_proofs_match','--fail-on-drift',label='drift detector')

helper=read('functions/api/_lib/release466Reliability.js')
endpoint=read('functions/api/admin/release466-reliability.js')
page=read('admin/reliability/index.html')
client=read('public/js/admin-release466-reliability.js')
has(helper,'loadRelease466Reliability','current_snapshot_not_historical_uptime','native_github_ruleset','development_export_restore_rehearsal','business_rows_compared:false',"mutation_capability:'none'",'provider_execution:false','production_mutation:false',label='Release 466 reliability helper')
for token in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','.put(','.delete('): req(token not in helper,f'Reliability helper must remain read-only: {token}')
has(endpoint,'onRequestGet',"mutation_capability:'none'",label='Release 466 reliability API')
req('onRequestPost' not in endpoint and 'onRequestPut' not in endpoint and 'onRequestDelete' not in endpoint,'Reliability API must remain GET-only')
req(page.lower().count('<h1')==1,'Reliability cockpit must have exactly one H1')
has(page,'Governance, Recovery &amp; Production Reliability','Current SLO scope','current platform-health snapshot','No schema rollback',label='Reliability cockpit')
has(client,'/api/admin/release466-reliability','Reliability score','Native GitHub ruleset','Structural drift check',label='Reliability client')

roadmap=read('docs/operations/RELEASE_466_FOUR_BUILD_ROADMAP.md')
has(roadmap,'Build 1 — Governance, Recovery & Production Reliability','Build 2 — Runtime & Storefront Intelligence','Build 3 — Revenue & Business Intelligence','Build 4 — External Acceptance & Commercial Readiness','Build 1 schema expectation:** NONE',label='Release 466 roadmap')

workflow=read('.github/workflows/system-gate.yml')
has(workflow,'release466_build1_gate.py','release466_recovery_rehearsal.py','release466_drift_detector.py','release466-reliability.js','admin-release466-reliability.js','release466-build1-recovery-drift-proof',label='System Gate Release 466 coverage')

print('RELEASE 466 BUILD 1 — GOVERNANCE, RECOVERY & PRODUCTION RELIABILITY')
print('Items: 1-5')
print('D1 schema migration: NONE / canonical 0001-0004 preserved')
print('Rollback: READINESS ONLY / FORWARD SCHEMA / NO AUTOMATIC DATA RESTORE')
print('Recovery rehearsal: DEVELOPMENT EXPORT -> EPHEMERAL LOCAL SQLITE')
print('Drift: DEVELOPMENT/PRODUCTION STRUCTURAL METADATA ONLY')
print('Reliability SLO: CURRENT SNAPSHOT / READ ONLY')
print('Native GitHub ruleset: EXTERNAL SETTING UNTIL GITHUB PROVES ACTIVE')
if FAIL:
 print('RELEASE 466 BUILD 1 GATE: FAIL')
 for n,message in enumerate(FAIL,1): print(f'{n:03d}. {message}')
 raise SystemExit(1)
print('RELEASE 466 BUILD 1 GATE: PASS')
