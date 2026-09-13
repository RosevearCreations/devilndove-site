#!/usr/bin/env python3
"""Release 467 Build 141 — Closure Evidence Cross-Artifact Consistency Verification gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SHA='901d349760f9631cdbf989b549fcdac140d6569e';TREE='365e6c630e6e7b82eaadfaf85a82d9806cdc948f'
PROOFS={'system_gate_run':34762269626,'current_application_quality_run':34762269665,'it_admin_runtime_proof_run':34762269664,'branch_hygiene_run':34762269682}
PAGES=34762361931;LIVE=34762417112
EVIDENCE='r467-b140-901d349760f9-34762269626-34762361931-34762417112'
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build140-closure-evidence-integrity-self-verification-tamper-detection.json');current=load('release467-build141-closure-evidence-cross-artifact-consistency-verification.json');manifest=load('migrations/canonical/manifest.json');provenance=read('scripts/current_system_gate_provenance_gate.py');it_api=read('functions/api/admin/it-operations-control-tower.js');it_client=read('public/js/admin-it-control-tower.js');it_page=read('admin/it/index.html');reliability=read('functions/api/_lib/currentReliability.js');reliability_page=read('admin/reliability/index.html');preflight=read('functions/api/admin/current-deployment-preflight.js');preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==141,'current pointer must identify Release 467 Build 141')
req(pointer.get('title')=='Closure Evidence Cross-Artifact Consistency Verification','Build 141 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==SHA and pointer.get('accepted_dev_tree_sha')==TREE,'Build 141 baseline must be exact Build 140')
req((pointer.get('acceptance')or{})==PROOFS,'Build 141 inherited four-proof baseline mismatch')
prod=pointer.get('production_checkpoint')or{};last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==140 and last.get('dev_sha')==SHA and last.get('tree_sha')==TREE,'restart integrity must identify exact Build 140')
req((last.get('proofs')or{})==PROOFS,'restart Build 140 proof set drifted')
req(prod.get('build')==140 and prod.get('main_sha')==SHA and prod.get('tree_sha')==TREE,'Production baseline must be exact Build 140')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 140 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 140 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{};pp=prior.get('production_checkpoint')or{}
req(closure.get('dev_sha')==SHA and closure.get('tree_sha')==TREE and (closure.get('proofs')or{})==PROOFS,'Build 140 final closure mismatch')
req(closure.get('ingested_by_build')==141,'Build 140 closure must be ingested by Build 141')
req(pp.get('main_sha')==SHA and pp.get('tree_sha')==TREE and pp.get('production_pages_deploy_run')==PAGES and pp.get('production_live_resource_integrity_run')==LIVE,'Build 140 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 141 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 141 must not self-claim later proof')
for token in (SHA,TREE,str(PAGES),str(LIVE),EVIDENCE,"format==='closure-json'","format==='verification-manifest'",'cross_artifact_contract', 'closure-json-vs-verification-manifest-v1','function stableJson(value)','sha256Hex','SHA-256','recursive-key-sort-json-v1','verificationManifest','Content-Disposition'):
    req(token in it_api,f'I.T. Build 141 projection missing cross-artifact token: {token}')
for token in ('Release 467 Build 141','Verify closure artifacts','verifyClosureArtifacts','fetchClosureJson','fetchVerificationManifest','closurePayloadFromPack','function stableJson(value)','sha256Hex','crypto.subtle.digest','idMatches','payloadMatches','bytesMatch','digestMatches','VERIFIED','MISMATCH','closure-json','verification-manifest',EVIDENCE):
    req(token in it_client,f'I.T. Build 141 client missing cross-artifact verification token: {token}')
for token in ('Release 467 Build 141','Build 140','Cross-Artifact','consistency'):
    req(token.lower() in it_page.lower(),f'I.T. Build 141 page missing identity/verification token: {token}')
for token in (SHA,TREE,str(PAGES),str(LIVE),'production_closure_proof_count:6','CURRENT_RELIABILITY_BUILD=141','build141_cross_artifact_consistency_candidate:true'):
    req(token in reliability,f'Reliability Build 141 projection missing closure token: {token}')
req('Release 467 • Build 141' in reliability_page,'Reliability page must identify Build 141')
for token in (SHA,TREE,str(PAGES),str(LIVE),'const BUILD=141','closure cross-artifact consistency candidate'):
    req(token in preflight,f'Deployment Preflight Build 141 projection missing closure token: {token}')
req('Release 467 Build 141' in preflight_page,'Deployment Preflight page must identify Build 141')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req("run_current_contract('scripts/release467_build141_gate.py','Release 467 Build 141')" in provenance,'active System Gate provenance must call Build 141')
req("run_current_contract('scripts/release467_build140_gate.py','Release 467 Build 140')" not in provenance,'active provenance must not execute the closed Build 140 candidate gate against Build 141')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 141 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 141 GATE: PASS')
print('Build 140 six-proof closure: INGESTED BY BUILD 141 / NOT SELF-RECORDED')
print('I.T. closure evidence: CROSS-ARTIFACT JSON/MANIFEST CONSISTENCY + BROWSER SHA-256 VERIFICATION')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
