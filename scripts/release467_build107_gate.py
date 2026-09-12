#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 107 — Storefront Discovery & Collection Improvements."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B106_SHA='e22b3f9c7fcb223114b48e52a51e0c537e6da081'
B106_TREE='334d907d8e39dcbc8a02dc80cfa949abf13bd8c5'
B106_PROOFS={'system_gate_run':34655258282,'current_application_quality_run':34655258284,'it_admin_runtime_proof_run':34655258283,'branch_hygiene_run':34655258294}
B106_PAGES=34655379475
B106_LIVE=34655438506
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:return json.loads(read(path) or '{}')
    except Exception as exc:FAIL.append(f'invalid JSON {path}: {exc}');return{}
def req(ok,msg):
    if not ok:FAIL.append(msg)
def run(cmd,label):
    result=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip():print(result.stdout.strip())
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")
def compact(s):return re.sub(r'\s+','',s)
pointer=load('current-development-authority.json'); b106=load('release467-build106-marketplace-listing-readiness.json'); b107=load('release467-build107-storefront-discovery-collections.json'); manifest=load('migrations/canonical/manifest.json')
feature=read('public/js/storefront-discovery-paths.js'); shop=read('shop/index.html'); collections=read('collections/index.html'); provenance=read('scripts/current_system_gate_provenance_gate.py')
it_api=read('functions/api/admin/it-operations-control-tower.js'); reliability=read('functions/api/_lib/currentReliability.js'); preflight=read('functions/api/admin/current-deployment-preflight.js')
it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html'); reliability_page=read('admin/reliability/index.html'); preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==107,'current authority must be Release 467 Build 107')
req(pointer.get('title')=='Storefront Discovery & Collection Improvements','Build 107 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified GREEN state')
req(pointer.get('accepted_dev_sha')==B106_SHA and pointer.get('accepted_dev_tree_sha')==B106_TREE,'accepted Build 106 SHA/tree drifted')
req((pointer.get('acceptance') or {})==B106_PROOFS,'accepted Build 106 four-proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}; cand=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(last.get('build')==106 and last.get('dev_sha')==B106_SHA and last.get('tree_sha')==B106_TREE and (last.get('proofs') or {})==B106_PROOFS,'Build 106 restart closure drifted')
req(prod.get('build')==106 and prod.get('main_sha')==B106_SHA and prod.get('tree_sha')==B106_TREE and prod.get('production_pages_deploy_run')==B106_PAGES and prod.get('production_live_resource_integrity_run')==B106_LIVE,'Build 106 Production baseline drifted')
req(cand.get('build')==107 and cand.get('authority')=='release467-build107-storefront-discovery-collections.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 107 candidate pointer drifted')
req(b106.get('state')=='PRODUCTION_GREEN','Build 106 authority must be Production GREEN')
f106=b106.get('final_closure') or {}; p106=b106.get('production_checkpoint') or {}
req(f106.get('dev_sha')==B106_SHA and f106.get('tree_sha')==B106_TREE and (f106.get('proofs') or {})==B106_PROOFS and f106.get('ingested_by_build')==107,'Build 106 final closure not ingested by Build 107')
req(p106.get('main_sha')==B106_SHA and p106.get('tree_sha')==B106_TREE and p106.get('production_pages_deploy_run')==B106_PAGES and p106.get('production_live_resource_integrity_run')==B106_LIVE,'Build 106 Production closure drifted')
req(b107.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and b107.get('final_closure') is None and b107.get('production_checkpoint') is None,'Build 107 must remain an unproven closure candidate')
for token in ('const BUILD = 107',"const CONTRACT = 'storefront-discovery-paths'",'one-of-a-kind','local-pickup','custom-gifts','laser-engraved','workshop-experiments','proof-rich','function evidenceText','function matchesDiscovery','dd:shop:data','DDShopRuntime','DDStorefrontSearchCollections','fails closed'):
    req(token in feature,f'Build 107 discovery layer missing token: {token}')
for forbidden in (r'\bfetch\s*\(',r'\bXMLHttpRequest\b',r'\bsetInterval\s*\(',r'\bnavigator\.sendBeacon\b',r'\b(?:INSERT|UPDATE|DELETE|REPLACE)\s+(?:INTO|FROM)\b',r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b'):
    req(not re.search(forbidden,feature,re.I),f'Build 107 discovery layer gained forbidden behavior: {forbidden}')
links=('max_price_cents=2500','discover=one-of-a-kind','discover=local-pickup','discover=custom-gifts','merchandise_origin=vintage','discover=laser-engraved','discover=workshop-experiments','discover=proof-rich')
for body,label in ((shop,'Shop'),(collections,'Collections')):
    req(len(re.findall(r'<h1(?:\s|>)',body,re.I))==1,f'{label} page must retain exactly one H1')
    for token in links:req(token in body,f'{label} page missing crawlable discovery link: {token}')
req('/public/js/shop.js?v=467b75' in shop and '/public/js/storefront-search-collections.js?v=75' in shop,'Build 107 must preserve Build 75 Shop discovery runtime')
req('/public/js/storefront-discovery-paths.js?v=467b107' in shop,'Build 107 Shop loader missing discovery layer')
req(shop.index('/public/js/storefront-search-collections.js?v=75') < shop.index('/public/js/storefront-discovery-paths.js?v=467b107'),'Build 107 discovery layer must load after established Shop filter/sort layer')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B106_SHA in text and B106_TREE in text,f'{label} missing Build 106 SHA/tree')
    for v in B106_PROOFS.values():req(str(v) in text,f'{label} missing Build 106 proof {v}')
    req(str(B106_PAGES) in text and str(B106_LIVE) in text,f'{label} missing Build 106 Production proofs')
req('constBUILD=107;' in compact(it_api),'I.T. API must identify Build 107')
req('CURRENT_RELIABILITY_BUILD = 107' in reliability,'Reliability must identify Build 107')
req('constBUILD=107;' in compact(preflight),'Deployment Preflight must identify Build 107')
req('Release 467 Build 107' in it_client,'I.T. client must identify Build 107')
req('Release 467 Build 107' in it_page,'I.T. page must identify Build 107')
req('Release 467 • Build 107' in reliability_page,'Reliability page must identify Build 107')
req('Release 467 Build 107' in preflight_page,'Deployment Preflight page must identify Build 107')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must retain exactly one H1')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md','docs/operations/RELEASE_467_BUILD_107_STOREFRONT_DISCOVERY_COLLECTIONS.md'):
    body=read(path)
    for token in (B106_SHA,B106_TREE,*[str(x) for x in B106_PROOFS.values()],str(B106_PAGES),str(B106_LIVE)):req(token in body,f'{path} missing Build 106 closure token {token}')
    req('Build 107' in body and 'Storefront Discovery' in body,f'{path} missing Build 107 identity')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')
for build in range(107,114):req(f'Build {build}' in roadmap,f'current roadmap missing planned Build {build}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Canonical migrations must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 107 must remain schema-neutral')
req("run_current_contract('scripts/release467_build107_gate.py', 'Release 467 Build 107')" in provenance,'System Gate must chain Build 107')
req("run_current_contract('scripts/release467_build106_gate.py', 'Release 467 Build 106')" not in provenance,'Build 107 must supersede Build 106 as current contract')
for path in ('public/js/storefront-discovery-paths.js','public/js/shop.js','public/js/storefront-search-collections.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. truth')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
if FAIL:
    print('RELEASE 467 BUILD 107 STOREFRONT DISCOVERY & COLLECTION IMPROVEMENTS: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 107 STOREFRONT DISCOVERY & COLLECTION IMPROVEMENTS: PASS')
print('Build 106 final Development + Production closure: INGESTED')
print('Crawlable discovery paths: UNDER $25 / ONE-OF-A-KIND / LOCAL PICKUP / CUSTOM GIFTS / VINTAGE / LASER / WORKSHOP EXPERIMENTS / PROOF-RICH')
print('Inferred discovery claims: EVIDENCE-BACKED / FAIL-CLOSED')
print('Additional Product API/database read: NONE')
print('Product/Inventory/provider mutation: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
