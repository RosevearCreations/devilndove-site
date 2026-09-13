#!/usr/bin/env python3
"""Release 467 Build 139 — Closure Evidence Integrity Fingerprint & Verification Manifest gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SHA='5f3f0d39cdcf1ce743c9a17c40691f58fb342e8b';TREE='76e77253294ea84ea4a77f28ab684ffe3f07dd34'
PROOFS={'system_gate_run':34760742040,'current_application_quality_run':34760741973,'it_admin_runtime_proof_run':34760741960,'branch_hygiene_run':34760741974}
PAGES=34760868140;LIVE=34760912351
EVIDENCE='r467-b138-5f3f0d39cdcf-34760742040-34760868140-34760912351'
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build138-closure-evidence-json-operator-reference.json');current=load('release467-build139-closure-evidence-integrity-fingerprint-verification-manifest.json');manifest=load('migrations/canonical/manifest.json');provenance=read('scripts/current_system_gate_provenance_gate.py');it_api=read('functions/api/admin/it-operations-control-tower.js');it_client=read('public/js/admin-it-control-tower.js');it_page=read('admin/it/index.html');reliability=read('functions/api/_lib/currentReliability.js');reliability_page=read('admin/reliability/index.html');preflight=read('functions/api/admin/current-deployment-preflight.js');preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==139,'current pointer must identify Release 467 Build 139')
req(pointer.get('title')=='Closure Evidence Integrity Fingerprint & Verification Manifest','Build 139 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==SHA and pointer.get('accepted_dev_tree_sha')==TREE,'Build 139 baseline must be exact Build 138')
req((pointer.get('acceptance')or{})==PROOFS,'Build 139 inherited four-proof baseline mismatch')
prod=pointer.get('production_checkpoint')or{};last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==138 and last.get('dev_sha')==SHA and last.get('tree_sha')==TREE,'restart integrity must identify exact Build 138')
req((last.get('proofs')or{})==PROOFS,'restart Build 138 proof set drifted')
req(prod.get('build')==138 and prod.get('main_sha')==SHA and prod.get('tree_sha')==TREE,'Production baseline must be exact Build 138')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 138 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 138 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{};pp=prior.get('production_checkpoint')or{}
req(closure.get('dev_sha')==SHA and closure.get('tree_sha')==TREE and (closure.get('proofs')or{})==PROOFS,'Build 138 final closure mismatch')
req(closure.get('ingested_by_build')==139,'Build 138 closure must be ingested by Build 139')
req(pp.get('main_sha')==SHA and pp.get('tree_sha')==TREE and pp.get('production_pages_deploy_run')==PAGES and pp.get('production_live_resource_integrity_run')==LIVE,'Build 138 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 139 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 139 must not self-claim later proof')
for token in (SHA,TREE,str(PAGES),str(LIVE),EVIDENCE,"format==='verification-manifest'",'function stableJson(value)','sha256Hex','SHA-256','recursive-key-sort-json-v1','digest_scope','verificationManifest','function closureJson(data)','Content-Disposition'):
    req(token in it_api,f'I.T. Build 139 projection missing integrity token: {token}')
for token in ('Release 467 Build 139','Export Markdown','Export JSON','Export verification manifest','Copy evidence ID','Copy SHA-256','verification-manifest',EVIDENCE):
    req(token in it_client,f'I.T. Build 139 client missing integrity token: {token}')
for token in ('Release 467 Build 139','Build 138','SHA-256','verification'):
    req(token in it_page,f'I.T. Build 139 page missing identity/integrity token: {token}')
for token in (SHA,TREE,str(PAGES),str(LIVE),'production_closure_proof_count:6','CURRENT_RELIABILITY_BUILD=139','build139_integrity_fingerprint_verification_candidate:true'):
    req(token in reliability,f'Reliability Build 139 projection missing closure token: {token}')
req('Release 467 • Build 139' in reliability_page,'Reliability page must identify Build 139')
for token in (SHA,TREE,str(PAGES),str(LIVE),'const BUILD=139','integrity-fingerprint/verification-manifest candidate'):
    req(token in preflight,f'Deployment Preflight Build 139 projection missing closure token: {token}')
req('Release 467 Build 139' in preflight_page,'Deployment Preflight page must identify Build 139')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req("run_current_contract('scripts/release467_build139_gate.py','Release 467 Build 139')" in provenance,'active System Gate provenance must call Build 139')
req("run_current_contract('scripts/release467_build138_gate.py','Release 467 Build 138')" not in provenance,'active provenance must not execute the closed Build 138 candidate gate against Build 139')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 139 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 139 GATE: PASS')
print('Build 138 six-proof closure: INGESTED BY BUILD 139 / NOT SELF-RECORDED')
print('I.T. closure evidence: MARKDOWN + JSON + SHA-256 FINGERPRINT + VERIFICATION MANIFEST')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')