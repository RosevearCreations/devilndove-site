#!/usr/bin/env python3
"""Release 467 Build 136 — Production Proof Retry Telemetry & Closure Visibility gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SHA='e48f2bab89cfcb67cc24eec7fab3296aa1ed3750';TREE='a1eff3544b4ecddb07d539de52eab71f3b81c9a3'
PROOFS={'system_gate_run':34735075779,'current_application_quality_run':34735075777,'it_admin_runtime_proof_run':34735075772,'branch_hygiene_run':34735075770}
PAGES=34735145318;LIVE=34735184613
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build135-production-live-resource-proof-transport-resilience.json');current=load('release467-build136-production-proof-retry-telemetry-closure-visibility.json');manifest=load('migrations/canonical/manifest.json');workflow=read('.github/workflows/production-live-resource-integrity-proof.yml');provenance=read('scripts/current_system_gate_provenance_gate.py');it_api=read('functions/api/admin/it-operations-control-tower.js');it_client=read('public/js/admin-it-control-tower.js');reliability=read('functions/api/_lib/currentReliability.js');preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==136,'current pointer must identify Release 467 Build 136')
req(pointer.get('title')=='Production Proof Retry Telemetry & Closure Visibility','Build 136 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==SHA and pointer.get('accepted_dev_tree_sha')==TREE,'Build 136 baseline must be exact Build 135')
req((pointer.get('acceptance')or{})==PROOFS,'Build 136 inherited four-proof baseline mismatch')
prod=pointer.get('production_checkpoint')or{};last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==135 and last.get('dev_sha')==SHA and last.get('tree_sha')==TREE,'restart integrity must identify exact Build 135')
req((last.get('proofs')or{})==PROOFS,'restart Build 135 proof set drifted')
req(prod.get('build')==135 and prod.get('main_sha')==SHA and prod.get('tree_sha')==TREE,'Production baseline must be exact Build 135')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 135 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 135 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{};pp=prior.get('production_checkpoint')or{}
req(closure.get('dev_sha')==SHA and closure.get('tree_sha')==TREE and (closure.get('proofs')or{})==PROOFS,'Build 135 final closure mismatch')
req(closure.get('ingested_by_build')==136,'Build 135 closure must be ingested by Build 136')
req(pp.get('main_sha')==SHA and pp.get('tree_sha')==TREE and pp.get('production_pages_deploy_run')==PAGES and pp.get('production_live_resource_integrity_run')==LIVE,'Build 135 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 136 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 136 must not self-claim later proof')
for token in ('RETRYABLE_HTTP={408,425,429,500,502,503,504}','def urlopen_retry(req,timeout=25,attempts=3)','TRANSPORT RETRY','urllib.error.URLError','ConnectionResetError','TimeoutError'):
    req(token in workflow,f'Build 136 must retain Build 135 transport-resilience token: {token}')
req('devilndove-production-resource-proof/3.1' in workflow,'retry-capable Production resource proof version drifted')
req(workflow.count('def urlopen_retry(req,timeout=25,attempts=3)')==3,'live-network proof blocks must retain bounded retry helpers')
req(workflow.count('with urlopen_retry(req) as response:')>=5,'live JSON/image/D1 requests must remain routed through bounded retry')
for token in (SHA,TREE,str(PAGES),str(LIVE),'PRODUCTION_PROOF_TRANSPORT','max_attempts:3','permanent_4xx_fail_closed:true','resource_correctness_fail_closed:true'):
    req(token in it_api,f'I.T. Build 136 projection missing closure/transport token: {token}')
for token in ('Release 467 Build 136','Production proof transport policy','Production GREEN authority'):
    req(token in it_client,f'I.T. Build 136 client missing visibility token: {token}')
for token in (SHA,TREE,str(PAGES),str(LIVE),'production_closure_proof_count:6','PRODUCTION_PROOF_TRANSPORT_POLICY','max_attempts:3'):
    req(token in reliability,f'Reliability Build 136 projection missing closure/transport token: {token}')
for token in (SHA,TREE,str(PAGES),str(LIVE),'PRODUCTION_PROOF_TRANSPORT','max_attempts:3'):
    req(token in preflight,f'Deployment Preflight Build 136 projection missing closure/transport token: {token}')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req("run_current_contract('scripts/release467_build136_gate.py','Release 467 Build 136')" in provenance,'active System Gate provenance must call Build 136')
req("run_current_contract('scripts/release467_build135_gate.py','Release 467 Build 135')" not in provenance,'active provenance must not execute the closed Build 135 candidate gate against Build 136')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 136 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 136 GATE: PASS')
print('Build 135 six-proof closure: INGESTED BY BUILD 136 / NOT SELF-RECORDED')
print('Production proof retry telemetry: VISIBLE IN I.T. + RELIABILITY + DEPLOYMENT PREFLIGHT')
print('Transport policy: MAX 3 TRANSIENT ATTEMPTS / PERMANENT 4XX + RESOURCE FAILURES BLOCK')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
