#!/usr/bin/env python3
"""Release 467 Build 142 — Storefront Continuity & Offline Foundation gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SHA='72e270e4c27bd666afcb4d5befc3462dd757a1d1';TREE='d4a6bfe0327d8de641d3ea1910dcd8c6bc67e14b'
PROOFS={'system_gate_run':34763039974,'current_application_quality_run':34763039975,'it_admin_runtime_proof_run':34763040049,'branch_hygiene_run':34763039996}
PAGES=34763165246;LIVE=34763209880
EVIDENCE='r467-b141-72e270e4c27b-34763039974-34763165246-34763209880'
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build141-closure-evidence-cross-artifact-consistency-verification.json');current=load('release467-build142-storefront-continuity-offline-foundation.json');manifest=load('migrations/canonical/manifest.json');provenance=read('scripts/current_system_gate_provenance_gate.py');it_api=read('functions/api/admin/it-operations-control-tower.js');it_client=read('public/js/admin-it-control-tower.js');it_page=read('admin/it/index.html');reliability=read('functions/api/_lib/currentReliability.js');reliability_page=read('admin/reliability/index.html');preflight=read('functions/api/admin/current-deployment-preflight.js');preflight_page=read('admin/deployment-preflight/index.html');pwa=read('public/js/pwa-platform.js');sw=read('sw.js');roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')
req(pointer.get('release')==467 and pointer.get('build')==142,'current pointer must identify Release 467 Build 142')
req(pointer.get('title')=='Storefront Continuity & Offline Foundation','Build 142 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==SHA and pointer.get('accepted_dev_tree_sha')==TREE,'Build 142 baseline must be exact Build 141')
req((pointer.get('acceptance')or{})==PROOFS,'Build 142 inherited four-proof baseline mismatch')
prod=pointer.get('production_checkpoint')or{};last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==141 and last.get('dev_sha')==SHA and last.get('tree_sha')==TREE,'restart integrity must identify exact Build 141')
req((last.get('proofs')or{})==PROOFS,'restart Build 141 proof set drifted')
req(prod.get('build')==141 and prod.get('main_sha')==SHA and prod.get('tree_sha')==TREE,'Production baseline must be exact Build 141')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 141 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 141 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{};pp=prior.get('production_checkpoint')or{}
req(closure.get('dev_sha')==SHA and closure.get('tree_sha')==TREE and (closure.get('proofs')or{})==PROOFS,'Build 141 final closure mismatch')
req(closure.get('ingested_by_build')==142,'Build 141 closure must be ingested by Build 142')
req(pp.get('main_sha')==SHA and pp.get('tree_sha')==TREE and pp.get('production_pages_deploy_run')==PAGES and pp.get('production_live_resource_integrity_run')==LIVE,'Build 141 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 142 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 142 must not self-claim later proof')
for token in (SHA,TREE,str(PAGES),str(LIVE),EVIDENCE,"format==='closure-json'","format==='verification-manifest'",'cross_artifact_contract','closure-json-vs-verification-manifest-v1','SHA-256','recursive-key-sort-json-v1','verificationManifest','Content-Disposition'):
    req(token in it_api,f'I.T. Build 142 projection missing retained closure token: {token}')
for token in ('Release 467 Build 142','Storefront Continuity','Verify closure artifacts','verifyClosureArtifacts','fetchClosureJson','fetchVerificationManifest','closurePayloadFromPack','function stableJson(value)','sha256Hex','crypto.subtle.digest','idMatches','payloadMatches','bytesMatch','digestMatches','VERIFIED','MISMATCH',EVIDENCE):
    req(token in it_client,f'I.T. Build 142 client missing continuity/verification token: {token}')
for token in ('Release 467 Build 142','Build 141','Storefront Continuity','cached'):
    req(token.lower() in it_page.lower(),f'I.T. Build 142 page missing identity/continuity token: {token}')
for token in (SHA,TREE,str(PAGES),str(LIVE),'production_closure_proof_count:6','CURRENT_RELIABILITY_BUILD=142','build142_storefront_continuity_candidate:true'):
    req(token in reliability,f'Reliability Build 142 projection missing closure token: {token}')
req('Release 467 • Build 142' in reliability_page,'Reliability page must identify Build 142')
for token in (SHA,TREE,str(PAGES),str(LIVE),'const BUILD=142','Storefront continuity'):
    req(token in preflight,f'Deployment Preflight Build 142 projection missing closure/feature token: {token}')
req('Release 467 Build 142' in preflight_page,'Deployment Preflight page must identify Build 142')
for token in ('const RELEASE = 450;','const BUILD = 142','dd:shop:data','fromCache','Last verified price','Last verified stock','Reconnect to confirm availability','button.disabled=true','window.addEventListener(\'offline\'','window.addEventListener(\'online\'','DDShopRuntime','Retry live shop'):
    req(token in pwa,f'PWA Storefront continuity missing fail-safe token: {token}')
for token in ("CACHE_NAME = 'devilndove-shell-r450'","'/shop/'","'/public/js/shop.js'","'/api/'","'Cache-Control':'no-store'","authority:'server-required'"):
    req(token in sw,f'Service worker Build 142 authority missing token: {token}')
req('BUILD' not in sw.upper(),'service worker must retain release-only installable-platform identity')
req("const NO_CACHE_PATH_PREFIXES = ['/admin/', '/members/', '/login/', '/register/', '/account-help/', '/api/'];" in sw,'service worker must preserve API/admin no-cache boundary')
for token in ('Buyer + Seller User-Experience Programme','Build 142','Storefront Continuity','Mobile app / installed PWA','Desktop app / installed PWA','Permanent Connectivity / Failsafe Contract'):
    req(token in roadmap,f'roadmap missing approved UX programme token: {token}')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req("run_current_contract('scripts/release467_build142_gate.py','Release 467 Build 142')" in provenance,'active System Gate provenance must call Build 142')
req("run_current_contract('scripts/release467_build141_gate.py','Release 467 Build 141')" not in provenance,'active provenance must not execute the closed Build 141 candidate gate against Build 142')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 142 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 142 GATE: PASS')
print('Build 141 six-proof closure: INGESTED BY BUILD 142 / NOT SELF-RECORDED')
print('Storefront continuity: CACHED BROWSING / PURCHASE AUTHORITY FAILS CLOSED UNTIL LIVE REVALIDATION')
print('Service worker: PUBLIC SHOP SHELL CACHED / API AUTHORITY UNCACHED / RELEASE 450 IDENTITY RETAINED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')