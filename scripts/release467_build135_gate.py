#!/usr/bin/env python3
"""Release 467 Build 135 — Production Live-Resource Proof Transport Resilience gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SHA='fa53527989dfb9583969d752c1e237dfc35e25ec';TREE='a8fcb858178dc95b8648927c6f979996ef229857'
PROOFS={'system_gate_run':34733563985,'current_application_quality_run':34733563987,'it_admin_runtime_proof_run':34733564024,'branch_hygiene_run':34733563990}
PAGES=34733635050;LIVE=34733673164
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build134-admin-navigation-context-summary-readability-full-text-accessibility.json');current=load('release467-build135-production-live-resource-proof-transport-resilience.json');manifest=load('migrations/canonical/manifest.json');workflow=read('.github/workflows/production-live-resource-integrity-proof.yml');provenance=read('scripts/current_system_gate_provenance_gate.py')
req(pointer.get('release')==467 and pointer.get('build')==135,'current pointer must identify Release 467 Build 135')
req(pointer.get('title')=='Production Live-Resource Proof Transport Resilience','Build 135 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==SHA and pointer.get('accepted_dev_tree_sha')==TREE,'Build 135 baseline must be exact Build 134')
req((pointer.get('acceptance')or{})==PROOFS,'Build 135 inherited four-proof baseline mismatch')
prod=pointer.get('production_checkpoint')or{};last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==134 and last.get('dev_sha')==SHA and last.get('tree_sha')==TREE,'restart integrity must identify exact Build 134')
req((last.get('proofs')or{})==PROOFS,'restart Build 134 proof set drifted')
req(prod.get('build')==134 and prod.get('main_sha')==SHA and prod.get('tree_sha')==TREE,'Production baseline must be exact Build 134')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 134 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 134 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{};pp=prior.get('production_checkpoint')or{}
req(closure.get('dev_sha')==SHA and closure.get('tree_sha')==TREE and (closure.get('proofs')or{})==PROOFS,'Build 134 final closure mismatch')
req(closure.get('ingested_by_build')==135,'Build 134 closure must be ingested by Build 135')
req(pp.get('main_sha')==SHA and pp.get('tree_sha')==TREE and pp.get('production_pages_deploy_run')==PAGES and pp.get('production_live_resource_integrity_run')==LIVE,'Build 134 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 135 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 135 must not self-claim later proof')
for token in ('RETRYABLE_HTTP={408,425,429,500,502,503,504}','def urlopen_retry(req,timeout=25,attempts=3)','TRANSPORT RETRY','urllib.error.URLError','ConnectionResetError','TimeoutError','user-agent'):
    if token=='user-agent': req('devilndove-production-resource-proof/3.1' in workflow,'Build 135 workflow must identify retry-capable proof version')
    else: req(token in workflow,f'Build 135 workflow missing transport resilience token: {token}')
req(workflow.count('def urlopen_retry(req,timeout=25,attempts=3)')==3,'Build 135 must protect each live-network proof block with bounded retry')
req(workflow.count('with urlopen_retry(req) as response:')>=5,'Build 135 must route live JSON/image/D1 requests through bounded retry')
for permanent in ('assert payload.get(\'ok\') is True','assert products','assert candidates','assert proven','assert auth.get(\'binding_available\') is True'):
    req(permanent in workflow,f'Build 135 must preserve fail-closed resource assertion: {permanent}')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req("run_current_contract('scripts/release467_build135_gate.py','Release 467 Build 135')" in provenance,'active System Gate provenance must call Build 135')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 135 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 135 GATE: PASS')
print('Build 134 six-proof closure: INGESTED BY BUILD 135 / NOT SELF-RECORDED')
print('Production live-resource transport retry: BOUNDED 3 ATTEMPTS / TRANSIENT FAILURES ONLY')
print('Resource correctness: R2 + PRODUCT API + PHOTO + D1 ASSERTIONS PRESERVED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
