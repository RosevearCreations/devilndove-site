#!/usr/bin/env python3
"""Release 467 Build 137 — Release Closure Evidence Pack & Operator Export gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SHA='577db0056cc169656d7d582c9f03d8a3d3058de9';TREE='c3ec59aec9767a4ff7590d8ab3b3e7516397a2d4'
PROOFS={'system_gate_run':34758452361,'current_application_quality_run':34758452368,'it_admin_runtime_proof_run':34758452390,'branch_hygiene_run':34758452385}
PAGES=34758525107;LIVE=34758561922
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build136-production-proof-retry-telemetry-closure-visibility.json');current=load('release467-build137-release-closure-evidence-pack-operator-export.json');manifest=load('migrations/canonical/manifest.json');provenance=read('scripts/current_system_gate_provenance_gate.py');it_api=read('functions/api/admin/it-operations-control-tower.js');it_client=read('public/js/admin-it-control-tower.js');reliability=read('functions/api/_lib/currentReliability.js');preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==137,'current pointer must identify Release 467 Build 137')
req(pointer.get('title')=='Release Closure Evidence Pack & Operator Export','Build 137 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==SHA and pointer.get('accepted_dev_tree_sha')==TREE,'Build 137 baseline must be exact Build 136')
req((pointer.get('acceptance')or{})==PROOFS,'Build 137 inherited four-proof baseline mismatch')
prod=pointer.get('production_checkpoint')or{};last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==136 and last.get('dev_sha')==SHA and last.get('tree_sha')==TREE,'restart integrity must identify exact Build 136')
req((last.get('proofs')or{})==PROOFS,'restart Build 136 proof set drifted')
req(prod.get('build')==136 and prod.get('main_sha')==SHA and prod.get('tree_sha')==TREE,'Production baseline must be exact Build 136')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 136 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 136 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{};pp=prior.get('production_checkpoint')or{}
req(closure.get('dev_sha')==SHA and closure.get('tree_sha')==TREE and (closure.get('proofs')or{})==PROOFS,'Build 136 final closure mismatch')
req(closure.get('ingested_by_build')==137,'Build 136 closure must be ingested by Build 137')
req(pp.get('main_sha')==SHA and pp.get('tree_sha')==TREE and pp.get('production_pages_deploy_run')==PAGES and pp.get('production_live_resource_integrity_run')==LIVE,'Build 136 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 137 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 137 must not self-claim later proof')
for token in (SHA,TREE,str(PAGES),str(LIVE),'function markdownReport(data)','closure_evidence_pack','format'):
    req(token in it_api,f'I.T. Build 137 projection missing closure/export token: {token}')
for token in ('Release 467 Build 137','Export closure pack','/api/admin/it-operations-control-tower?format=markdown','Production GREEN authority'):
    req(token in it_client,f'I.T. Build 137 client missing export token: {token}')
for token in (SHA,TREE,str(PAGES),str(LIVE),'production_closure_proof_count:6','CURRENT_RELIABILITY_BUILD=137'):
    req(token in reliability,f'Reliability Build 137 projection missing closure token: {token}')
for token in (SHA,TREE,str(PAGES),str(LIVE),'const BUILD=137'):
    req(token in preflight,f'Deployment Preflight Build 137 projection missing closure token: {token}')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req("run_current_contract('scripts/release467_build137_gate.py','Release 467 Build 137')" in provenance,'active System Gate provenance must call Build 137')
req("run_current_contract('scripts/release467_build136_gate.py','Release 467 Build 136')" not in provenance,'active provenance must not execute the closed Build 136 candidate gate against Build 137')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 137 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 137 GATE: PASS')
print('Build 136 six-proof closure: INGESTED BY BUILD 137 / NOT SELF-RECORDED')
print('I.T. closure evidence pack: READ-ONLY MARKDOWN EXPORT')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
