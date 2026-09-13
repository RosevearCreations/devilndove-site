#!/usr/bin/env python3
"""Release 467 Build 140 — Closure Evidence Integrity Self-Verification & Tamper Detection gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SHA='3cb401b8cbf9c5c37e9b734497984cd9f4a385e5';TREE='5c6adcd9702348532e0c0807b3ea634c2604d7f7'
PROOFS={'system_gate_run':34761418389,'current_application_quality_run':34761418405,'it_admin_runtime_proof_run':34761418383,'branch_hygiene_run':34761418425}
PAGES=34761544388;LIVE=34761591278
EVIDENCE='r467-b139-3cb401b8cbf9-34761418389-34761544388-34761591278'
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build139-closure-evidence-integrity-fingerprint-verification-manifest.json');current=load('release467-build140-closure-evidence-integrity-self-verification-tamper-detection.json');manifest=load('migrations/canonical/manifest.json');provenance=read('scripts/current_system_gate_provenance_gate.py');it_api=read('functions/api/admin/it-operations-control-tower.js');it_client=read('public/js/admin-it-control-tower.js');it_page=read('admin/it/index.html');reliability=read('functions/api/_lib/currentReliability.js');reliability_page=read('admin/reliability/index.html');preflight=read('functions/api/admin/current-deployment-preflight.js');preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==140,'current pointer must identify Release 467 Build 140')
req(pointer.get('title')=='Closure Evidence Integrity Self-Verification & Tamper Detection','Build 140 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==SHA and pointer.get('accepted_dev_tree_sha')==TREE,'Build 140 baseline must be exact Build 139')
req((pointer.get('acceptance')or{})==PROOFS,'Build 140 inherited four-proof baseline mismatch')
prod=pointer.get('production_checkpoint')or{};last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==139 and last.get('dev_sha')==SHA and last.get('tree_sha')==TREE,'restart integrity must identify exact Build 139')
req((last.get('proofs')or{})==PROOFS,'restart Build 139 proof set drifted')
req(prod.get('build')==139 and prod.get('main_sha')==SHA and prod.get('tree_sha')==TREE,'Production baseline must be exact Build 139')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 139 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 139 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{};pp=prior.get('production_checkpoint')or{}
req(closure.get('dev_sha')==SHA and closure.get('tree_sha')==TREE and (closure.get('proofs')or{})==PROOFS,'Build 139 final closure mismatch')
req(closure.get('ingested_by_build')==140,'Build 139 closure must be ingested by Build 140')
req(pp.get('main_sha')==SHA and pp.get('tree_sha')==TREE and pp.get('production_pages_deploy_run')==PAGES and pp.get('production_live_resource_integrity_run')==LIVE,'Build 139 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 140 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 140 must not self-claim later proof')
for token in (SHA,TREE,str(PAGES),str(LIVE),EVIDENCE,"format==='verification-manifest'",'function stableJson(value)','sha256Hex','SHA-256','recursive-key-sort-json-v1','digest_scope','verificationManifest','Content-Disposition'):
    req(token in it_api,f'I.T. Build 140 projection missing integrity token: {token}')
for token in ('Release 467 Build 140','Verify current manifest','verifyManifestIntegrity','fetchVerificationManifest','function stableJson(value)','sha256Hex','crypto.subtle.digest','VERIFIED','MISMATCH','verification-manifest',EVIDENCE):
    req(token in it_client,f'I.T. Build 140 client missing independent verification token: {token}')
for token in ('Release 467 Build 140','Build 139','Self-Verification','tamper'):
    req(token.lower() in it_page.lower(),f'I.T. Build 140 page missing identity/verification token: {token}')
for token in (SHA,TREE,str(PAGES),str(LIVE),'production_closure_proof_count:6','CURRENT_RELIABILITY_BUILD=140','build140_integrity_self_verification_candidate:true'):
    req(token in reliability,f'Reliability Build 140 projection missing closure token: {token}')
req('Release 467 • Build 140' in reliability_page,'Reliability page must identify Build 140')
for token in (SHA,TREE,str(PAGES),str(LIVE),'const BUILD=140','integrity self-verification/tamper-detection candidate'):
    req(token in preflight,f'Deployment Preflight Build 140 projection missing closure token: {token}')
req('Release 467 Build 140' in preflight_page,'Deployment Preflight page must identify Build 140')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req("run_current_contract('scripts/release467_build140_gate.py','Release 467 Build 140')" in provenance,'active System Gate provenance must call Build 140')
req("run_current_contract('scripts/release467_build139_gate.py','Release 467 Build 139')" not in provenance,'active provenance must not execute the closed Build 139 candidate gate against Build 140')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 140 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 140 GATE: PASS')
print('Build 139 six-proof closure: INGESTED BY BUILD 140 / NOT SELF-RECORDED')
print('I.T. closure evidence: INDEPENDENT BROWSER SHA-256 SELF-VERIFICATION / TAMPER MISMATCH VISIBILITY')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
