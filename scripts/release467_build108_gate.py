#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 108 — Mobile Workshop Assistant."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B107_SHA='943d7af070bc1b01506f2b8d3e8fc36b8aed7750'
B107_TREE='a16e55754b40279050b781ed5bad1892ee62b76c'
B107_PROOFS={'system_gate_run':34662074529,'current_application_quality_run':34662074545,'it_admin_runtime_proof_run':34662074524,'branch_hygiene_run':34662074579}
B107_PAGES=34662205783
B107_LIVE=34662253285
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
pointer=load('current-development-authority.json'); b107=load('release467-build107-storefront-discovery-collections.json'); b108=load('release467-build108-mobile-workshop-assistant.json'); manifest=load('migrations/canonical/manifest.json')
page=read('admin/mobile-workshop-assistant/index.html'); client=read('public/js/admin-mobile-workshop-assistant.js'); css=read('css/mobile-workshop-assistant.css'); creator=read('admin/creator/index.html'); provenance=read('scripts/current_system_gate_provenance_gate.py')
it_api=read('functions/api/admin/it-operations-control-tower.js'); reliability=read('functions/api/_lib/currentReliability.js'); preflight=read('functions/api/admin/current-deployment-preflight.js'); it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html'); reliability_page=read('admin/reliability/index.html'); preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==108,'current authority must be Release 467 Build 108')
req(pointer.get('title')=='Mobile Workshop Assistant','Build 108 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified GREEN state')
req(pointer.get('accepted_dev_sha')==B107_SHA and pointer.get('accepted_dev_tree_sha')==B107_TREE,'accepted Build 107 SHA/tree drifted')
req((pointer.get('acceptance') or {})==B107_PROOFS,'accepted Build 107 four-proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}; cand=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(last.get('build')==107 and last.get('dev_sha')==B107_SHA and last.get('tree_sha')==B107_TREE and (last.get('proofs') or {})==B107_PROOFS,'Build 107 restart closure drifted')
req(prod.get('build')==107 and prod.get('main_sha')==B107_SHA and prod.get('tree_sha')==B107_TREE and prod.get('production_pages_deploy_run')==B107_PAGES and prod.get('production_live_resource_integrity_run')==B107_LIVE,'Build 107 Production baseline drifted')
req(cand.get('build')==108 and cand.get('authority')=='release467-build108-mobile-workshop-assistant.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 108 candidate pointer drifted')
req(b107.get('state')=='PRODUCTION_GREEN','Build 107 authority must be Production GREEN')
f107=b107.get('final_closure') or {}; p107=b107.get('production_checkpoint') or {}
req(f107.get('dev_sha')==B107_SHA and f107.get('tree_sha')==B107_TREE and (f107.get('proofs') or {})==B107_PROOFS and f107.get('ingested_by_build')==108,'Build 107 final closure not ingested by Build 108')
req(p107.get('main_sha')==B107_SHA and p107.get('tree_sha')==B107_TREE and p107.get('production_pages_deploy_run')==B107_PAGES and p107.get('production_live_resource_integrity_run')==B107_LIVE,'Build 107 Production closure drifted')
req(b108.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and b108.get('final_closure') is None and b108.get('production_checkpoint') is None,'Build 108 must remain an unproven closure candidate')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Mobile Workshop Assistant page must contain exactly one H1')
for token in ('Release 467 • Build 108','capture="environment"','mobileWorkshopPrivacy','mobileWorkshopConsent','mobileWorkshopRole','mobileWorkshopStory','mobileWorkshopCaption','Media Studio','CAIP Content Handoff','Photo Moderation'):
    req(token in page,f'Mobile Workshop Assistant page missing token: {token}')
for token in ("const BUILD = 108","const CONTRACT = 'mobile-workshop-assistant'","const STORAGE_KEY = 'dd_mobile_workshop_assistant_v1'","const PUBLICATION_AUTHORIZED = false","const PRODUCT_READ_PATH = '/api/products?limit=100'",'binary_included: false','upload_performed: false','publication_authorized: PUBLICATION_AUTHORIZED','downstream_review_required: true','owner_no_people','explicit_release','third_party_hold','PUBLIC HOLD','URL.createObjectURL','localStorage.setItem','navigator.clipboard.writeText','new Blob'):
    req(token in client,f'Mobile Workshop Assistant runtime missing token: {token}')
req('photo_bytes' not in client and 'data:image/' not in client,'Photo bytes/data URLs must not be persisted by Build 108')
for forbidden in (r"method\s*:\s*['\"]POST['\"]",r'\bFormData\b',r'/api/admin/',r'\b(?:INSERT|UPDATE|DELETE|REPLACE)\s+(?:INTO|FROM)\b',r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b'):
    req(not re.search(forbidden,client,re.I),f'Mobile Workshop Assistant gained forbidden mutation/upload behavior: {forbidden}')
fetch_calls=re.findall(r'\bfetch\s*\(([^\n]+)',client)
req(len(fetch_calls)==1 and 'PRODUCT_READ_PATH' in fetch_calls[0],'Build 108 may perform only the single existing Product read')
req('/admin/mobile-workshop-assistant/' in creator,'Creator hub must expose Mobile Workshop Assistant')
req('Captured photo bytes stay local to the browser tab' in creator,'Creator hub must state local photo boundary')
req('grid-template-columns' in css and '@media(max-width:760px)' in css,'Mobile Workshop Assistant must include responsive mobile layout')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B107_SHA in text and B107_TREE in text,f'{label} missing Build 107 SHA/tree')
    for v in B107_PROOFS.values():req(str(v) in text,f'{label} missing Build 107 proof {v}')
    req(str(B107_PAGES) in text and str(B107_LIVE) in text,f'{label} missing Build 107 Production proofs')
req('constBUILD=108;' in compact(it_api),'I.T. API must identify Build 108')
req('CURRENT_RELIABILITY_BUILD = 108' in reliability,'Reliability must identify Build 108')
req('constBUILD=108;' in compact(preflight),'Deployment Preflight must identify Build 108')
req('Release 467 Build 108' in it_client,'I.T. client must identify Build 108')
req('Release 467 Build 108' in it_page,'I.T. page must identify Build 108')
req('Release 467 • Build 108' in reliability_page,'Reliability page must identify Build 108')
req('Release 467 Build 108' in preflight_page,'Deployment Preflight page must identify Build 108')
for html,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight'),(creator,'Creator')):req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{label} page must retain exactly one H1')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md','docs/operations/RELEASE_467_BUILD_108_MOBILE_WORKSHOP_ASSISTANT.md'):
    body=read(path)
    for token in (B107_SHA,B107_TREE,*[str(x) for x in B107_PROOFS.values()],str(B107_PAGES),str(B107_LIVE)):req(token in body,f'{path} missing Build 107 closure token {token}')
    req('Build 108' in body and 'Mobile Workshop Assistant' in body,f'{path} missing Build 108 identity')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')
for build in range(108,114):req(f'Build {build}' in roadmap,f'current roadmap missing planned Build {build}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Canonical migrations must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 108 must remain schema-neutral')
req("run_current_contract('scripts/release467_build108_gate.py', 'Release 467 Build 108')" in provenance,'System Gate must chain Build 108')
req("run_current_contract('scripts/release467_build107_gate.py', 'Release 467 Build 107')" not in provenance,'Build 108 must supersede Build 107 as current contract')
for path in ('public/js/admin-mobile-workshop-assistant.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. truth')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
if FAIL:
    print('RELEASE 467 BUILD 108 MOBILE WORKSHOP ASSISTANT: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 108 MOBILE WORKSHOP ASSISTANT: PASS')
print('Build 107 final Development + Production closure: INGESTED')
print('Photo capture: TAB-LOCAL BYTES / BROWSER-LOCAL METADATA')
print('Consent/privacy public-candidate boundary: FAIL-CLOSED')
print('Existing Product API read: OPTIONAL / READ-ONLY')
print('Product/Inventory/D1/R2/provider mutation: NONE')
print('Provider/social publication: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
