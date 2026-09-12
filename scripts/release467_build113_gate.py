#!/usr/bin/env python3
"""Release 467 Build 113 — Accountant & Month-End Evidence Depth gate."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B112_SHA='959f376b5e430c5d142376097291d65c48c8c49b';B112_TREE='506ac4dc790d88978d3f6c1ffee5435b5042dc5c'
B112_PROOFS={'system_gate_run':34695751247,'current_application_quality_run':34695751252,'it_admin_runtime_proof_run':34695751279,'branch_hygiene_run':34695751249}
B112_PAGES=34695830846;B112_LIVE=34695871530
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path):return json.loads(read(path))
def command(args,label):
    result=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip():print(result.stdout.strip())
    if result.returncode!=0:FAIL.append(f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")

pointer=load('current-development-authority.json');prior=load('release467-build112-inventory-material-usage-reconciliation.json');current=load('release467-build113-accountant-month-end-evidence-depth.json');manifest=load('migrations/canonical/manifest.json')
helper=read('functions/api/_lib/accountantMonthEndEvidenceDepth.js');endpoint=read('functions/api/admin/accountant-month-end-evidence-depth.js');client=read('public/js/admin-accountant-month-end-evidence-depth-v113.js');page=read('admin/finance/index.html');close_read=read('functions/api/_lib/accountingCloseWorkflowReadService.js');close_owner=read('functions/api/admin/accounting-close-workflow.js');provenance=read('scripts/current_system_gate_provenance_gate.py')

req(pointer.get('release')==467 and pointer.get('build')==113,'current pointer must identify Release 467 Build 113');req(pointer.get('title')=='Accountant & Month-End Evidence Depth','Build 113 title drifted');req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state');req(pointer.get('accepted_dev_sha')==B112_SHA and pointer.get('accepted_dev_tree_sha')==B112_TREE,'Build 113 accepted baseline must be exact Build 112');req((pointer.get('acceptance')or{})==B112_PROOFS,'Build 113 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{};req(last.get('build')==112 and last.get('dev_sha')==B112_SHA and last.get('tree_sha')==B112_TREE,'restart integrity must identify exact Build 112');req((last.get('proofs')or{})==B112_PROOFS,'restart Build 112 proof set drifted')
prod=pointer.get('production_checkpoint')or{};req(prod.get('build')==112 and prod.get('main_sha')==B112_SHA and prod.get('tree_sha')==B112_TREE,'Production baseline must be exact Build 112');req(prod.get('production_pages_deploy_run')==B112_PAGES and prod.get('production_live_resource_integrity_run')==B112_LIVE,'Build 112 Production proof IDs drifted')

req(prior.get('state')=='PRODUCTION_GREEN','Build 112 must be ingested as Production GREEN');closure=prior.get('final_closure')or{};req(closure.get('dev_sha')==B112_SHA and closure.get('tree_sha')==B112_TREE,'Build 112 final closure SHA/tree mismatch');req((closure.get('proofs')or{})==B112_PROOFS,'Build 112 final proof mismatch');req(closure.get('ingested_by_build')==113,'Build 112 closure must be ingested by Build 113');req('not self-recorded by Build 112' in str(closure.get('recorded_by')or''),'Build 112 non-self-recording provenance missing');pp=prior.get('production_checkpoint')or{};req(pp.get('main_sha')==B112_SHA and pp.get('tree_sha')==B112_TREE and pp.get('production_pages_deploy_run')==B112_PAGES and pp.get('production_live_resource_integrity_run')==B112_LIVE,'Build 112 Production closure mismatch')

req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 113 must remain closure candidate');req(current.get('final_closure')is None and current.get('production_checkpoint')is None,'Build 113 must not self-claim later workflow proof');start=(current.get('starting_point')or{}).get('development')or{};req(start.get('sha')==B112_SHA and start.get('tree')==B112_TREE,'Build 113 starting Development identity mismatch')

for token in ('MONTH_END_EVIDENCE_CHECK_IDS','bank-reconciliation','sales-tax-review','tax-remittance-evidence','receipts-bills-evidence','gifi-review','schedule-141-notes','outstanding-payments','attachment-integrity','accountant-export-package','readiness_is_not_posting_authorization:true','accounting_posting:false','period_close:false','automatic_export:false'):
    req(token in helper,f'Build 113 helper missing token: {token}')
for forbidden in (r'\bfetch\s*\(',r'\bdb\.',r'\blocalStorage\.',r'\bsessionStorage\.',r'\bsetInterval\s*\('):req(not re.search(forbidden,helper),f'Build 113 pure helper gained forbidden behavior: {forbidden}')
for token in ('readAccountingCloseWorkflow','buildAccountantMonthEndEvidenceDepth',"role:'read_only_accountant_month_end_evidence_depth'",'accounting_posting:false','period_close:false','automatic_export:false'):
    req(token in endpoint,f'Build 113 endpoint missing token: {token}')
req('onRequestPost' not in endpoint,'Build 113 endpoint must expose no POST handler')
for forbidden in ('UPDATE ','INSERT ','DELETE ','CREATE TABLE','ALTER TABLE','DROP TABLE'):req(forbidden not in endpoint.upper(),f'Build 113 endpoint contains forbidden DML/DDL: {forbidden}')
for token in ('accountantMonthEndEvidenceDepthMount','data-accountant-month-end-evidence-build="113"','admin-accountant-month-end-evidence-depth-v113.js?v=467b113','admin-accountant-month-end-evidence-depth.css?v=467b113'):
    req(token in page,f'Finance page missing Build 113 token: {token}')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Finance page must retain exactly one H1');req("method:'GET'" in client and "method:'POST'" not in client,'Build 113 client must remain GET-only')
for token in ('accounting_payment_applications','accounting_hst_gst_reviews','accounting_period_closures','accountant_export_packages','accounting_evidence_attachments','mode:\'read-only-accounting-close-workflow\''):
    req(token in close_read,f'existing Accounting read authority token drifted: {token}')
req('buildAccountantZip' in close_owner and 'onRequestPost' in close_owner,'existing Accounting action/export owner must remain explicit')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)];req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004');req('0005_' not in json.dumps(manifest),'Build 113 must not introduce migration 0005');req("run_current_contract('scripts/release467_build113_gate.py','Release 467 Build 113')" in provenance,'active System Gate provenance must call Build 113');req('release467_build112_gate.py' not in provenance,'Build 112 must no longer be current provenance gate')
for path in ('functions/api/_lib/accountantMonthEndEvidenceDepth.js','functions/api/admin/accountant-month-end-evidence-depth.js','public/js/admin-accountant-month-end-evidence-depth-v113.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build113_accountant_month_end_evidence_depth_test.mjs'],'Build 113 runtime proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 113 GATE: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 113 GATE: PASS')
print('Build 112 six-proof closure: INGESTED BY BUILD 113')
print('Accountant & Month-End evidence depth: READ-ONLY / FAIL-CLOSED')
print('Accounting posting/close/evidence/export mutation: EXISTING OWNERS ONLY')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
