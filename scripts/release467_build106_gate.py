#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 106 — Marketplace Listing Readiness."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B105_SHA='1ce61a319c0534ea386c64978f2ed58c3391470d'
B105_TREE='045fa67ef20ee1aec9f87dfa6e2fd4cf02219690'
B105_PROOFS={'system_gate_run':34631203672,'current_application_quality_run':34631203855,'it_admin_runtime_proof_run':34631203641,'branch_hygiene_run':34631204122}
B105_PAGES=34631390665
B105_LIVE=34631490953
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
pointer=load('current-development-authority.json'); b105=load('release467-build105-product-work-session-handoff.json'); b106=load('release467-build106-marketplace-listing-readiness.json'); manifest=load('migrations/canonical/manifest.json')
feature=read('public/js/admin-products-marketplace-readiness.js'); loader=read('public/js/admin-product-image-role-prompts.js'); provenance=read('scripts/current_system_gate_provenance_gate.py')
it_api=read('functions/api/admin/it-operations-control-tower.js'); reliability=read('functions/api/_lib/currentReliability.js'); preflight=read('functions/api/admin/current-deployment-preflight.js')
it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html'); reliability_page=read('admin/reliability/index.html'); preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==106,'current authority must be Release 467 Build 106')
req(pointer.get('title')=='Marketplace Listing Readiness','Build 106 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified GREEN state')
req(pointer.get('accepted_dev_sha')==B105_SHA and pointer.get('accepted_dev_tree_sha')==B105_TREE,'accepted Build 105 SHA/tree drifted')
req((pointer.get('acceptance') or {})==B105_PROOFS,'accepted Build 105 four-proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}; cand=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(last.get('build')==105 and last.get('dev_sha')==B105_SHA and last.get('tree_sha')==B105_TREE and (last.get('proofs') or {})==B105_PROOFS,'Build 105 restart closure drifted')
req(prod.get('build')==105 and prod.get('main_sha')==B105_SHA and prod.get('tree_sha')==B105_TREE and prod.get('production_pages_deploy_run')==B105_PAGES and prod.get('production_live_resource_integrity_run')==B105_LIVE,'Build 105 Production baseline drifted')
req(cand.get('build')==106 and cand.get('authority')=='release467-build106-marketplace-listing-readiness.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 106 candidate pointer drifted')
req(b105.get('state')=='PRODUCTION_GREEN','Build 105 authority must be Production GREEN')
f105=b105.get('final_closure') or {}; p105=b105.get('production_checkpoint') or {}
req(f105.get('dev_sha')==B105_SHA and f105.get('tree_sha')==B105_TREE and (f105.get('proofs') or {})==B105_PROOFS and f105.get('ingested_by_build')==106,'Build 105 final closure not ingested by Build 106')
req(p105.get('main_sha')==B105_SHA and p105.get('tree_sha')==B105_TREE and p105.get('production_pages_deploy_run')==B105_PAGES and p105.get('production_live_resource_integrity_run')==B105_LIVE,'Build 105 Production closure drifted')
req(b106.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and b106.get('final_closure') is None and b106.get('production_checkpoint') is None,'Build 106 must remain an unproven closure candidate')
for token in ("SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2'","etsy:","facebook_marketplace:","pinterest:","manual:",'hero_image','image_quality','title_description','dimensions_materials','price','inventory_state','fulfilment','tags_category','evidence','function evaluate','function exportPack','Copy export pack','Download JSON','publication_allowed: false','marketplace_publication: false','us_sales_shipping_enabled: false','local_pickup_supported: true'):
    req(token in feature,f'Build 106 marketplace layer missing token: {token}')
req("import('/public/js/admin-products-marketplace-readiness.js?v=467b106')" in loader,'Build 106 Products loader revision missing')
req("document.body?.dataset?.adminPage === 'products'" in loader,'Build 106 loader must remain Products-only')
for token in ('apiFetch(', 'fetch(', '/api/'):
    req(token not in feature,f'Build 106 marketplace layer must not add network access: {token}')
for token in ('POST','PUT','PATCH','DELETE'):
    req(f"method: '{token}'" not in feature and f'method:"{token}"' not in feature,f'Build 106 marketplace layer must not add mutation method {token}')
req('new Blob(' in feature and 'navigator.clipboard' in feature,'Build 106 user-initiated export controls missing')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B105_SHA in text and B105_TREE in text,f'{label} missing Build 105 SHA/tree')
    for v in B105_PROOFS.values():req(str(v) in text,f'{label} missing Build 105 proof {v}')
    req(str(B105_PAGES) in text and str(B105_LIVE) in text,f'{label} missing Build 105 Production proofs')
req('constBUILD=106;' in compact(it_api),'I.T. API must identify Build 106')
req('CURRENT_RELIABILITY_BUILD = 106' in reliability,'Reliability must identify Build 106')
req('constBUILD=106;' in compact(preflight),'Deployment Preflight must identify Build 106')
req('Release 467 Build 106' in it_client,'I.T. client must identify Build 106')
req('Release 467 Build 106' in it_page,'I.T. page must identify Build 106')
req('Release 467 • Build 106' in reliability_page,'Reliability page must identify Build 106')
req('Release 467 Build 106' in preflight_page,'Deployment Preflight page must identify Build 106')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must retain exactly one H1')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md','docs/operations/RELEASE_467_BUILD_106_MARKETPLACE_LISTING_READINESS.md'):
    body=read(path)
    for token in (B105_SHA,B105_TREE,*[str(x) for x in B105_PROOFS.values()],str(B105_PAGES),str(B105_LIVE)):req(token in body,f'{path} missing Build 105 closure token {token}')
    req('Build 106' in body and 'Marketplace Listing Readiness' in body,f'{path} missing Build 106 identity')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')
for build in range(106,114):req(f'Build {build}' in roadmap,f'current roadmap missing planned Build {build}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Canonical migrations must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 106 must remain schema-neutral')
req("run_current_contract('scripts/release467_build106_gate.py', 'Release 467 Build 106')" in provenance,'System Gate must chain Build 106')
req("run_current_contract('scripts/release467_build105_gate.py', 'Release 467 Build 105')" not in provenance,'Build 106 must supersede Build 105 as current contract')
for path in ('public/js/admin-products-marketplace-readiness.js','public/js/admin-product-image-role-prompts.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. truth')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
if FAIL:
    print('RELEASE 467 BUILD 106 MARKETPLACE LISTING READINESS: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 106 MARKETPLACE LISTING READINESS: PASS')
print('Build 105 final Development + Production closure: INGESTED')
print('Marketplace readiness: ETSY / FACEBOOK MARKETPLACE / PINTEREST / MANUAL EXPORT')
print('Additional Product/readiness API/database read: NONE')
print('Marketplace publication/provider execution: CLOSED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
