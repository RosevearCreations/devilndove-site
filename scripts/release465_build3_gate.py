#!/usr/bin/env python3
"""Historical acceptance for Release 465 Build 3, append-safe for later releases."""
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
a=json.loads(read('release465-build3-financial-it-hardening.json') or '{}');req(int(a.get('release') or 0)==465 and int(a.get('build') or 0)==3,'Build 3 identity drifted');req(a.get('state')=='complete_development_green','Build 3 authority must remain complete Development green');req([x.get('id') for x in a.get('items',[])]==[14,15,16,17,18,19,20] and all(x.get('status')=='complete_development_green' for x in a.get('items',[])),'Build 3 items must remain green');req(a.get('schema_change_required') is False and a.get('migration') is None,'Build 3 must remain schema-neutral')
for key in ('production_mutation','provider_execution','provider_publication','inventory_mutation','production_posting','accounting_posting','automatic_financial_correction','automatic_price_change','raw_r2_delete','request_time_schema_ddl'):req((a.get('safety') or {}).get(key) is False,f'Build 3 safety drifted: {key}')
manifest=json.loads(read('migrations/canonical/manifest.json') or '{}');req([x.get('file') for x in manifest.get('migrations',[])]==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'Build 3 must preserve exact canonical 0001-0004')
helper=read('functions/api/_lib/release465BusinessHealth.js');endpoint=read('functions/api/admin/release465-business-health.js');page=read('admin/business-health/index.html');client=read('public/js/admin-business-health.js');has(helper,'loadProfitabilityIntelligence','loadFinancialAnomalies','buildMonthEndReadinessScore','loadItHealth','RELEASE465_EXPECTED_MIGRATIONS = 4','accounting_posting:false','inventory_mutation:false','provider_execution:false','production_mutation:false',label='Build 3 helper');req('onRequestPost' not in endpoint and 'onRequestPut' not in endpoint and 'onRequestDelete' not in endpoint,'Build 3 API must remain GET-only');req(page.lower().count('<h1')==1,'Business Health page must retain one H1');has(client,'/api/admin/release465-business-health','renderProfitability','renderAnomalies','renderMonth','renderIt',label='Business Health client')
budget=json.loads(read('release465-performance-budget.json') or '{}');req(int(budget.get('release') or 0)==465 and int(budget.get('build') or 0)==3,'performance budget identity drifted');has(read('scripts/release465_performance_budget_gate.py'),'release465-performance-budget.json','max_runtime_source_bytes','max_runtime_source_files','PASS',label='performance gate');has(read('scripts/release465_regression_evidence.py'),'release465-regression-evidence.json','source_metrics','canonical_migration_count','d1_authority',label='historical regression evidence')
release=json.loads(read('development-release.json') or '{}');req(int(release.get('release') or 0)>=465,'current release must not regress below 465');req(all(x.get('status')=='complete_development_green' for x in release.get('release465_build3',[])),'current authority must preserve Release 465 Build 3 completion');db=release.get('current_release_database_state') or {};req(db.get('build3_schema_change_required') is False,'Release 465 Build 3 schema boundary must remain false');req(int(db.get('development_native_migration_rows') or 0)==4 and int(db.get('development_migration_proof_rows') or 0)==4,'Build 3 must preserve 4/4 migration proof')
workflow=read('.github/workflows/system-gate.yml');has(workflow,'release465_build3_gate.py','release465_performance_budget_gate.py','release465_regression_evidence.py','current_regression_evidence.py','current-development-deploy-proof','current-regression-evidence',label='System Gate historical Build 3 coverage through current proof contracts')
print('RELEASE 465 BUILD 3 — FINANCIAL, I.T. & RELEASE HARDENING — HISTORICAL APPEND SAFE')
if FAIL:
 print('FAIL');[print(f'{i:03d}. {m}') for i,m in enumerate(FAIL,1)];raise SystemExit(1)
print('PASS')
