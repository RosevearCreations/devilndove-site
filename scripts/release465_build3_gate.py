#!/usr/bin/env python3
"""Static acceptance for Release 465 Build 3 — Financial, I.T. & Release Hardening."""
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path):
 p=ROOT/path
 if not p.is_file():FAIL.append(f'missing required file: {path}');return''
 return p.read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
 if not ok:FAIL.append(msg)
def has(body,*tokens,label='file'):
 for token in tokens:req(token in body,f'{label} missing required contract: {token}')
a=json.loads(read('release465-build3-financial-it-hardening.json') or '{}')
req(int(a.get('release') or 0)==465 and int(a.get('build') or 0)==3,'Build 3 identity drifted')
req([x.get('id') for x in a.get('items',[])]==[14,15,16,17,18,19,20],'Build 3 authority must contain items 14-20')
req(a.get('state') in ('in_progress_source_candidate','complete_development_green'),'Build 3 authority state unsupported')
expected='complete_development_green' if a.get('state')=='complete_development_green' else 'implemented_source_candidate'
req(all(x.get('status')==expected for x in a.get('items',[])),f'Build 3 item status must be {expected}')
req(a.get('schema_change_required') is False and a.get('migration') is None,'Build 3 must remain schema-neutral')
for key in ('production_mutation','provider_execution','provider_publication','inventory_mutation','production_posting','accounting_posting','automatic_financial_correction','automatic_price_change','raw_r2_delete','request_time_schema_ddl'):req((a.get('safety') or {}).get(key) is False,f'Build 3 safety must keep {key}=false')
req((a.get('safety') or {}).get('preview_access_must_remain_enforced') is True,'Preview Access must remain enforced')
manifest=json.loads(read('migrations/canonical/manifest.json') or '{}');files=[x.get('file') for x in manifest.get('migrations',[])]
req(files==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'Build 3 must preserve exact canonical migration sequence 0001-0004')
helper=read('functions/api/_lib/release465BusinessHealth.js');endpoint=read('functions/api/admin/release465-business-health.js');it_api=read('functions/api/admin/it-operations-dashboard.js');month=read('public/js/admin-month-end-cockpit.js');it_client=read('public/js/admin-it-platform.js');page=read('admin/business-health/index.html');client=read('public/js/admin-business-health.js')
has(helper,'loadProfitabilityIntelligence','loadFinancialAnomalies','buildMonthEndReadinessScore','loadItHealth','loadRelease465BusinessHealth','RELEASE465_EXPECTED_MIGRATIONS = 4','accounting_posting:false','inventory_mutation:false','provider_execution:false','production_mutation:false',label='Build 3 intelligence helper')
has(helper,'creative_project_profitability','creative_project_profitability_extensions','creative_work_events','accounting_payment_applications','accounting_evidence_attachments','runtime_incidents','operational_retention_reviews','PRAGMA foreign_key_check',label='Build 3 reused authorities')
for token in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','.delete(','.put('):req(token not in helper,f'Build 3 helper must remain read-only: {token}')
has(endpoint,'onRequestGet',"mutation_capability:'none'",'read-only-release465-business-health',label='Build 3 API');req('onRequestPost' not in endpoint and 'onRequestPut' not in endpoint and 'onRequestDelete' not in endpoint,'Build 3 API must remain GET-only')
req(page.lower().count('<h1')==1,'Business Health page must have exactly one H1');has(page,'Business Health','Cost &amp; profitability intelligence','Financial anomaly review','Month-end readiness checks','I.T. health dimensions','Release hardening evidence',label='Business Health page');has(client,'/api/admin/release465-business-health','renderProfitability','renderAnomalies','renderMonth','renderIt',label='Business Health client')
has(it_api,'RELEASE465_EXPECTED_MIGRATIONS','loadItHealth','business_health',label='I.T. dashboard integration');req('expected:3' not in it_api,'I.T. dashboard must not retain stale expected migration count 3');has(it_client,'I.T. health','Business Health','foreign_key_violations',label='I.T. client');has(month,'month_end_readiness','/api/admin/release465-business-health','Readiness score','Business Health',label='Month-End integration')
budget=json.loads(read('release465-performance-budget.json') or '{}');req(int(budget.get('release') or 0)==465 and int(budget.get('build') or 0)==3,'performance budget identity drifted')
for key in ('max_js_bytes','max_css_bytes','max_html_bytes','max_runtime_source_bytes','max_runtime_source_files','max_inline_data_uri_bytes'):req(int((budget.get('limits') or {}).get(key) or 0)>0,f'performance budget missing {key}')
has(read('scripts/release465_performance_budget_gate.py'),'release465-performance-budget.json','max_runtime_source_bytes','max_runtime_source_files','inline data URI','PASS',label='performance gate');has(read('scripts/release465_regression_evidence.py'),'release465-regression-evidence.json','source_metrics','canonical_migration_count','performance_budget_sha256','d1_authority',label='regression evidence')
release=json.loads(read('development-release.json') or '{}');req(release.get('convergence_state') in ('release465_build3_source_candidate','release465_complete_development_green'),'development-release Build 3 state drifted');req((release.get('current_release_database_state') or {}).get('build3_schema_change_required') is False,'development-release must state no Build 3 schema change');req(int((release.get('current_release_database_state') or {}).get('development_native_migration_rows') or 0)==4 and int((release.get('current_release_database_state') or {}).get('development_migration_proof_rows') or 0)==4,'Build 3 must preserve 4/4 migration proof')
workflow=read('.github/workflows/system-gate.yml');has(workflow,'release465_build3_gate.py','release465_performance_budget_gate.py','release465_regression_evidence.py','release465-business-health.js','admin-business-health.js','release465-build3-development-deploy-proof','release465-build3-regression-evidence',label='System Gate Build 3 coverage')
print('RELEASE 465 BUILD 3 — FINANCIAL, I.T. & RELEASE HARDENING');print('Items: 14-20');print('D1 schema change: NONE');print('Financial/Month-End/I.T. intelligence: READ ONLY');print('Regression evidence: SYSTEM GATE ARTIFACT');print('Performance growth: FAIL-CLOSED BUDGET');print('Provider / Inventory / Accounting / Production execution: CLOSED')
if FAIL:
 print('RELEASE 465 BUILD 3 GATE: FAIL');[print(f'{i:03d}. {m}') for i,m in enumerate(FAIL,1)];raise SystemExit(1)
print('RELEASE 465 BUILD 3 GATE: PASS')
