#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 104 — Product Work Session Focus Views."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B103_SHA='8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146'
B103_TREE='f4e7b2071710c50cfdd3b33ca84bbb85650d86ee'
B103_PROOFS={'system_gate_run':34617580379,'current_application_quality_run':34617580435,'it_admin_runtime_proof_run':34617580311,'branch_hygiene_run':34617580348}
B103_PAGES=34617779013
B103_LIVE=34617890313
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
pointer=load('current-development-authority.json'); b103=load('release467-build103-product-work-session-paging.json'); b104=load('release467-build104-product-work-session-focus.json'); manifest=load('migrations/canonical/manifest.json')
session=read('public/js/admin-products-work-session.js'); loader=read('public/js/admin-product-image-role-prompts.js'); provenance=read('scripts/current_system_gate_provenance_gate.py')
it_api=read('functions/api/admin/it-operations-control-tower.js'); reliability=read('functions/api/_lib/currentReliability.js'); preflight=read('functions/api/admin/current-deployment-preflight.js')
it_page=read('admin/it/index.html'); reliability_page=read('admin/reliability/index.html'); preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==104,'current authority must be Release 467 Build 104')
req(pointer.get('title')=='Product Work Session Focus Views','Build 104 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified GREEN state')
req(pointer.get('accepted_dev_sha')==B103_SHA and pointer.get('accepted_dev_tree_sha')==B103_TREE,'accepted Build 103 SHA/tree drifted')
req((pointer.get('acceptance') or {})==B103_PROOFS,'accepted Build 103 four-proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}; cand=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(last.get('build')==103 and last.get('dev_sha')==B103_SHA and last.get('tree_sha')==B103_TREE and (last.get('proofs') or {})==B103_PROOFS,'Build 103 restart closure drifted')
req(prod.get('build')==103 and prod.get('main_sha')==B103_SHA and prod.get('tree_sha')==B103_TREE and prod.get('production_pages_deploy_run')==B103_PAGES and prod.get('production_live_resource_integrity_run')==B103_LIVE,'Build 103 Production baseline drifted')
req(cand.get('build')==104 and cand.get('authority')=='release467-build104-product-work-session-focus.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 104 candidate pointer drifted')
req(b103.get('state')=='PRODUCTION_GREEN','Build 103 authority must be Production GREEN')
f103=b103.get('final_closure') or {}; p103=b103.get('production_checkpoint') or {}
req(f103.get('dev_sha')==B103_SHA and f103.get('tree_sha')==B103_TREE and (f103.get('proofs') or {})==B103_PROOFS and f103.get('ingested_by_build')==104,'Build 103 final closure not ingested by Build 104')
req(p103.get('main_sha')==B103_SHA and p103.get('tree_sha')==B103_TREE and p103.get('production_pages_deploy_run')==B103_PAGES and p103.get('production_live_resource_integrity_run')==B103_LIVE,'Build 103 Production closure drifted')
req(b104.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and b104.get('final_closure') is None and b104.get('production_checkpoint') is None,'Build 104 must remain an unproven closure candidate')
for token in ("SESSION_KEY = 'dd_catalog_work_session_v1'",'const MAX_ITEMS = 60;','const PAGE_SIZE = 20;',"FOCUS_MODES = ['all','active','blocked','ready','done']","let sessionFocus = 'all';",'function setFocusMode','function matchesFocus','const focusedItems','function focusCounts','data-work-session-focus','Focused Products','next actions still scan the complete ordered session',"session.sort_mode!=='manual'||sessionFocus!=='all'"):
    req(token in session,f'Build 104 focus layer missing token: {token}')
req("import('/public/js/admin-products-work-session.js?v=467b104')" in loader,'Build 104 Products loader revision missing')
req("document.body?.dataset?.adminPage === 'products'" in loader,'Build 104 loader must remain Products-only')
req('/api/' not in session and 'apiFetch(' not in session and 'fetch(' not in session,'Build 104 focus layer must not add network calls')
req("row.querySelector('[data-open-first-blocker]')" in session,'Build 104 blocker action must delegate existing first-blocker action')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B103_SHA in text and B103_TREE in text,f'{label} missing Build 103 SHA/tree')
    for v in B103_PROOFS.values():req(str(v) in text,f'{label} missing Build 103 proof {v}')
    req(str(B103_PAGES) in text and str(B103_LIVE) in text,f'{label} missing Build 103 Production proofs')
req('constBUILD=104;' in compact(it_api),'I.T. API must identify Build 104')
req('CURRENT_RELIABILITY_BUILD = 104' in reliability,'Reliability must identify Build 104')
req('constBUILD=104;' in compact(preflight),'Deployment Preflight must identify Build 104')
req('Release 467 Build 104' in it_page,'I.T. page must identify Build 104')
req('Release 467 • Build 104' in reliability_page,'Reliability page must identify Build 104')
req('Release 467 Build 104' in preflight_page,'Deployment Preflight page must identify Build 104')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must retain exactly one H1')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md','docs/operations/RELEASE_467_BUILD_104_PRODUCT_WORK_SESSION_FOCUS.md'):
    body=read(path)
    for token in (B103_SHA,B103_TREE,*[str(x) for x in B103_PROOFS.values()],str(B103_PAGES),str(B103_LIVE)):req(token in body,f'{path} missing Build 103 closure token {token}')
    req('Build 104' in body and 'Focus' in body,f'{path} missing Build 104 identity')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Canonical migrations must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 104 must remain schema-neutral')
req("run_current_contract('scripts/release467_build104_gate.py', 'Release 467 Build 104')" in provenance,'System Gate must chain Build 104')
req("run_current_contract('scripts/release467_build103_gate.py', 'Release 467 Build 103')" not in provenance,'Build 104 must supersede Build 103 as current contract')
for path in ('public/js/admin-products-work-session.js','public/js/admin-product-image-role-prompts.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. truth')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
if FAIL:
    print('RELEASE 467 BUILD 104 PRODUCT WORK SESSION FOCUS VIEWS: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 104 PRODUCT WORK SESSION FOCUS VIEWS: PASS')
print('Build 103 final Development + Production closure: INGESTED')
print('Session focus: ALL / ACTIVE / BLOCKED / READY / DONE')
print('Additional Product/readiness API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
