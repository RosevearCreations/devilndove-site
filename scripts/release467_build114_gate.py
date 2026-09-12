#!/usr/bin/env python3
"""Release 467 Build 114 — Business Health Action Queue & Owner Routing gate."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B113_SHA='9dca8383a1507838539820fb667aaea192ed4098';B113_TREE='36f473d66011c1138426346bcb0c553bfd2a69b1'
B113_PROOFS={'system_gate_run':34696252402,'current_application_quality_run':34696252394,'it_admin_runtime_proof_run':34696252388,'branch_hygiene_run':34696252396}
B113_PAGES=34696344689;B113_LIVE=34696386137
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path):return json.loads(read(path))
def command(args,label):
    result=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip():print(result.stdout.strip())
    if result.returncode!=0:FAIL.append(f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")

pointer=load('current-development-authority.json');prior=load('release467-build113-accountant-month-end-evidence-depth.json');current=load('release467-build114-business-health-action-queue.json');manifest=load('migrations/canonical/manifest.json')
helper=read('functions/api/_lib/businessHealthActionQueue.js');endpoint=read('functions/api/admin/business-health-action-queue.js');client=read('public/js/admin-business-health-action-queue-v114.js');page=read('admin/business-health/index.html');legacy_helper=read('functions/api/_lib/release465BusinessHealth.js');legacy_endpoint=read('functions/api/admin/release465-business-health.js');legacy_client=read('public/js/admin-business-health.js');provenance=read('scripts/current_system_gate_provenance_gate.py')

req(pointer.get('release')==467 and pointer.get('build')==114,'current pointer must identify Release 467 Build 114');req(pointer.get('title')=='Business Health Action Queue & Owner Routing','Build 114 title drifted');req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state');req(pointer.get('accepted_dev_sha')==B113_SHA and pointer.get('accepted_dev_tree_sha')==B113_TREE,'Build 114 accepted baseline must be exact Build 113');req((pointer.get('acceptance')or{})==B113_PROOFS,'Build 114 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{};req(last.get('build')==113 and last.get('dev_sha')==B113_SHA and last.get('tree_sha')==B113_TREE,'restart integrity must identify exact Build 113');req((last.get('proofs')or{})==B113_PROOFS,'restart Build 113 proof set drifted')
prod=pointer.get('production_checkpoint')or{};req(prod.get('build')==113 and prod.get('main_sha')==B113_SHA and prod.get('tree_sha')==B113_TREE,'Production baseline must be exact Build 113');req(prod.get('production_pages_deploy_run')==B113_PAGES and prod.get('production_live_resource_integrity_run')==B113_LIVE,'Build 113 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 113 must be ingested as Production GREEN');closure=prior.get('final_closure')or{};req(closure.get('dev_sha')==B113_SHA and closure.get('tree_sha')==B113_TREE,'Build 113 final closure SHA/tree mismatch');req((closure.get('proofs')or{})==B113_PROOFS,'Build 113 final proof mismatch');req(closure.get('ingested_by_build')==114,'Build 113 closure must be ingested by Build 114');req('not self-recorded by Build 113' in str(closure.get('recorded_by')or''),'Build 113 non-self-recording provenance missing');pp=prior.get('production_checkpoint')or{};req(pp.get('main_sha')==B113_SHA and pp.get('tree_sha')==B113_TREE and pp.get('production_pages_deploy_run')==B113_PAGES and pp.get('production_live_resource_integrity_run')==B113_LIVE,'Build 113 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 114 must remain closure candidate');req(current.get('final_closure')is None and current.get('production_checkpoint')is None,'Build 114 must not self-claim later workflow proof');start=(current.get('starting_point')or{}).get('development')or{};req(start.get('sha')==B113_SHA and start.get('tree')==B113_TREE,'Build 114 starting Development identity mismatch')
for token in ('BUSINESS_HEALTH_ACTION_QUEUE_BUILD','financial-anomaly:','month-end:','profitability:','it:','owner_module',"mutation_capability:'none'",'automatic_business_action:false','accounting_posting:false','inventory_mutation:false','creative_mutation:false','provider_execution:false'):
    req(token in helper,f'Build 114 helper missing token: {token}')
for forbidden in (r'\bfetch\s*\(',r'\bdb\.',r'\blocalStorage\.',r'\bsessionStorage\.',r'\bsetInterval\s*\('):req(not re.search(forbidden,helper),f'Build 114 pure helper gained forbidden behavior: {forbidden}')
for token in ('loadRelease465BusinessHealth','buildBusinessHealthActionQueue',"role:'read_only_business_health_action_queue'",'automatic_business_action:false','accounting_posting:false','inventory_mutation:false','creative_mutation:false'):
    req(token in endpoint,f'Build 114 endpoint missing token: {token}')
req('onRequestPost' not in endpoint,'Build 114 endpoint must expose no POST handler')
for forbidden in ('UPDATE ','INSERT ','DELETE ','CREATE TABLE','ALTER TABLE','DROP TABLE'):req(forbidden not in endpoint.upper(),f'Build 114 endpoint contains forbidden DML/DDL: {forbidden}')
for token in ('b114ActionQueue','data-business-health-action-queue-build="114"','admin-business-health-action-queue-v114.js?v=467b114'):
    req(token in page,f'Business Health page missing Build 114 token: {token}')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Business Health page must retain exactly one H1');req('/api/admin/business-health-action-queue' in client and "method:'GET'" in client and "method:'POST'" not in client,'Build 114 client must remain GET-only')
req('loadRelease465BusinessHealth' in legacy_helper,'existing Business Health read authority drifted');req('onRequestPost' not in legacy_endpoint,'historical Business Health endpoint must remain GET-only');req('/api/admin/release465-business-health' in legacy_client,'historical Business Health client authority drifted')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)];req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004');req('0005_' not in json.dumps(manifest),'Build 114 must not introduce migration 0005');req("run_current_contract('scripts/release467_build114_gate.py','Release 467 Build 114')" in provenance,'active System Gate provenance must call Build 114');req("run_current_contract('scripts/release467_build113_gate.py','Release 467 Build 113')" not in provenance,'Build 113 must no longer be current provenance gate')
for path in ('functions/api/_lib/businessHealthActionQueue.js','functions/api/admin/business-health-action-queue.js','public/js/admin-business-health-action-queue-v114.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build114_business_health_action_queue_test.mjs'],'Build 114 runtime proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 114 GATE: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 114 GATE: PASS')
print('Build 113 six-proof closure: INGESTED BY BUILD 114')
print('Business Health action queue: READ-ONLY / OWNER-ROUTING ONLY')
print('Automatic business action / Accounting / Inventory / Creative / provider mutation: ZERO')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')