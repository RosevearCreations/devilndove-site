#!/usr/bin/env python3
"""Release 467 Build 143 — Adaptive Mobile/Desktop/Web Application Shell gate."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SHA='0b022c355217c00a7313aa2cb3e4b37a2b9a2b45';TREE='acf47b86db2cd170dc1fadd2a9e827e485e7c908'
PROOFS={'system_gate_run':34765428970,'current_application_quality_run':34765428976,'it_admin_runtime_proof_run':34765428961,'branch_hygiene_run':34765428957}
PAGES=34765518900;LIVE=34765564112
EVIDENCE='r467-b142-0b022c355217-34765428970-34765518900-34765564112'
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok:FAIL.append(msg)
def read(path):return(ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path):return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip():print(r.stdout.strip())
    if r.returncode!=0:FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build142-storefront-continuity-offline-foundation.json');current=load('release467-build143-adaptive-mobile-desktop-web-application-shell.json');manifest=load('migrations/canonical/manifest.json')
provenance=read('scripts/current_system_gate_provenance_gate.py');middleware=read('functions/_middleware.js');adaptive=read('public/js/adaptive-shell.js');adaptive_css=read('css/adaptive-shell.css');saved=read('saved/index.html');sw=read('sw.js');pwa=read('public/js/pwa-platform.js');it_api=read('functions/api/admin/it-operations-control-tower.js');it_client=read('public/js/admin-it-control-tower.js');it_page=read('admin/it/index.html');reliability=read('functions/api/_lib/currentReliability.js');reliability_page=read('admin/reliability/index.html');preflight=read('functions/api/admin/current-deployment-preflight.js');preflight_page=read('admin/deployment-preflight/index.html');roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')
req(pointer.get('release')==467 and pointer.get('build')==143,'current pointer must identify Release 467 Build 143')
req(pointer.get('title')=='Adaptive Mobile/Desktop/Web Application Shell','Build 143 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==SHA and pointer.get('accepted_dev_tree_sha')==TREE,'Build 143 baseline must be exact Build 142')
req((pointer.get('acceptance')or{})==PROOFS,'Build 143 inherited four-proof baseline mismatch')
prod=pointer.get('production_checkpoint')or{};last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==142 and last.get('dev_sha')==SHA and last.get('tree_sha')==TREE,'restart integrity must identify exact Build 142')
req((last.get('proofs')or{})==PROOFS,'restart Build 142 proof set drifted')
req(prod.get('build')==142 and prod.get('main_sha')==SHA and prod.get('tree_sha')==TREE,'Production baseline must be exact Build 142')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 142 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 142 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{};pp=prior.get('production_checkpoint')or{}
req(closure.get('dev_sha')==SHA and closure.get('tree_sha')==TREE and (closure.get('proofs')or{})==PROOFS,'Build 142 final closure mismatch')
req(closure.get('ingested_by_build')==143,'Build 142 closure must be ingested by Build 143')
req(pp.get('main_sha')==SHA and pp.get('tree_sha')==TREE and pp.get('production_pages_deploy_run')==PAGES and pp.get('production_live_resource_integrity_run')==LIVE,'Build 142 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 143 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 143 must not self-claim later proof')
for token in ('/css/adaptive-shell.css', '/public/js/adaptive-shell.js'):
    req(token in middleware,f'middleware missing adaptive shell asset: {token}')
for token in ("SHELL_BUILD=143","buyerItems","sellerItems","surfaceMode()","'mobile'","'tablet'","'desktop'","dd:saved-products:v1","Account verification needs a connection","dd:shop:data","createProductForm","pagehide","back_forward","ddShellConnectivity","aria-live","/shop/?focus=search","/saved/","/admin/orders/","/admin/products/#createProductForm"):
    req(token in adaptive,f'adaptive shell missing required token: {token}')
for token in ('max-width:760px','min-width:761px','max-width:1099px','min-width:1100px','safe-area-inset-bottom','prefers-reduced-motion','pointer:coarse','dd-shell-nav','dd-shell-drawer'):
    req(token in adaptive_css,f'adaptive shell CSS missing responsive/accessibility token: {token}')
req(len(re.findall(r'<h1(?:\s|>)',saved,re.I))==1,'Saved page must contain exactly one H1')
for token in ('Saved Items','savedItemsMount','savedDeviceStatus','do not reserve inventory','Account syncing is not enabled'):
    req(token.lower() in (saved+' '+adaptive).lower(),f'Saved local-only boundary missing token: {token}')
req("CACHE_NAME = 'devilndove-shell-r450'" in sw,'service worker must retain Release 450 cache identity')
req('BUILD' not in sw.upper(),'service worker must not carry historical/current Build identity')
for token in ("'/saved/'","'/css/adaptive-shell.css'","'/public/js/adaptive-shell.js'","'/api/'","'Cache-Control':'no-store'","authority:'server-required'"):
    req(token in sw,f'service worker adaptive boundary missing token: {token}')
req("const NO_CACHE_PATH_PREFIXES = ['/admin/', '/members/', '/login/', '/register/', '/account-help/', '/api/'];" in sw,'service worker must preserve admin/account/API no-cache boundary')
req('const RELEASE = 450;' in pwa,'shared installable platform must retain Release 450 identity')
for token in (SHA,TREE,str(PAGES),str(LIVE),EVIDENCE,"format==='closure-json'","format==='verification-manifest'",'cross_artifact_contract','closure-json-vs-verification-manifest-v1','SHA-256','recursive-key-sort-json-v1','verificationManifest','Content-Disposition'):
    req(token in it_api,f'I.T. Build 143 projection missing retained closure token: {token}')
for token in ('Release 467 Build 143','Adaptive Mobile/Desktop/Web Application Shell','Verify closure artifacts','verifyClosureArtifacts','fetchClosureJson','fetchVerificationManifest','closurePayloadFromPack','function stableJson(value)','sha256Hex','crypto.subtle.digest','idMatches','payloadMatches','bytesMatch','digestMatches','VERIFIED','MISMATCH',EVIDENCE):
    req(token in it_client,f'I.T. Build 143 client missing adaptive/verification token: {token}')
for token in ('Release 467 Build 143','Build 142','Adaptive Mobile/Desktop/Web Application Shell'):
    req(token in it_page,f'I.T. Build 143 page missing identity token: {token}')
for token in (SHA,TREE,str(PAGES),str(LIVE),'production_closure_proof_count:6','CURRENT_RELIABILITY_BUILD=143','build143_adaptive_application_shell_candidate:true'):
    req(token in reliability,f'Reliability Build 143 projection missing closure token: {token}')
req('Release 467 • Build 143' in reliability_page,'Reliability page must identify Build 143')
for token in (SHA,TREE,str(PAGES),str(LIVE),'const BUILD=143','Adaptive Mobile/Desktop/Web Application Shell'):
    req(token in preflight,f'Deployment Preflight Build 143 projection missing closure/feature token: {token}')
req('Release 467 Build 143' in preflight_page,'Deployment Preflight page must identify Build 143')
for token in ('Buyer + Seller User-Experience Programme','Build 143','Adaptive Mobile/Desktop/Web Application Shell','Mobile app / installed PWA','Tablet','Desktop app / installed PWA','Permanent Connectivity / Failsafe Contract'):
    req(token in roadmap,f'roadmap missing approved UX programme token: {token}')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req("run_current_contract('scripts/release467_build143_gate.py','Release 467 Build 143')" in provenance,'active System Gate provenance must call Build 143')
req("run_current_contract('scripts/release467_build142_gate.py','Release 467 Build 142')" not in provenance,'active provenance must not execute closed Build 142 candidate gate against Build 143')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 143 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 143 GATE: PASS')
print('Build 142 six-proof closure: INGESTED BY BUILD 143 / NOT SELF-RECORDED')
print('Adaptive shell: MOBILE / TABLET / DESKTOP / WEB CAPABILITY PARITY')
print('Saved products: DEVICE-LOCAL / NON-AUTHORITATIVE / NO INVENTORY RESERVATION')
print('Installable client: RELEASE 450 IDENTITY RETAINED / API AUTHORITY UNCACHED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
