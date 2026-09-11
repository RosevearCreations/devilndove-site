#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 105 — Product Work Session Completion & Handoff."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B104_SHA='0a308b4fd0b6bd50c1dde4627bd61d1d76b84891'
B104_TREE='399d16c99bb54c16247fb8c44d5a054286650e30'
B104_PROOFS={'system_gate_run':34622757518,'current_application_quality_run':34622757414,'it_admin_runtime_proof_run':34622757394,'branch_hygiene_run':34622757555}
B104_PAGES=34623045557
B104_LIVE=34623145483
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
pointer=load('current-development-authority.json'); b104=load('release467-build104-product-work-session-focus.json'); b105=load('release467-build105-product-work-session-handoff.json'); manifest=load('migrations/canonical/manifest.json')
handoff=read('public/js/admin-products-work-session-handoff.js'); loader=read('public/js/admin-product-image-role-prompts.js'); provenance=read('scripts/current_system_gate_provenance_gate.py')
it_api=read('functions/api/admin/it-operations-control-tower.js'); reliability=read('functions/api/_lib/currentReliability.js'); preflight=read('functions/api/admin/current-deployment-preflight.js')
it_page=read('admin/it/index.html'); reliability_page=read('admin/reliability/index.html'); preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==105,'current authority must be Release 467 Build 105')
req(pointer.get('title')=='Product Work Session Completion & Handoff','Build 105 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified GREEN state')
req(pointer.get('accepted_dev_sha')==B104_SHA and pointer.get('accepted_dev_tree_sha')==B104_TREE,'accepted Build 104 SHA/tree drifted')
req((pointer.get('acceptance') or {})==B104_PROOFS,'accepted Build 104 four-proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}; cand=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(last.get('build')==104 and last.get('dev_sha')==B104_SHA and last.get('tree_sha')==B104_TREE and (last.get('proofs') or {})==B104_PROOFS,'Build 104 restart closure drifted')
req(prod.get('build')==104 and prod.get('main_sha')==B104_SHA and prod.get('tree_sha')==B104_TREE and prod.get('production_pages_deploy_run')==B104_PAGES and prod.get('production_live_resource_integrity_run')==B104_LIVE,'Build 104 Production baseline drifted')
req(cand.get('build')==105 and cand.get('authority')=='release467-build105-product-work-session-handoff.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 105 candidate pointer drifted')
req(b104.get('state')=='PRODUCTION_GREEN','Build 104 authority must be Production GREEN')
f104=b104.get('final_closure') or {}; p104=b104.get('production_checkpoint') or {}
req(f104.get('dev_sha')==B104_SHA and f104.get('tree_sha')==B104_TREE and (f104.get('proofs') or {})==B104_PROOFS and f104.get('ingested_by_build')==105,'Build 104 final closure not ingested by Build 105')
req(p104.get('main_sha')==B104_SHA and p104.get('tree_sha')==B104_TREE and p104.get('production_pages_deploy_run')==B104_PAGES and p104.get('production_live_resource_integrity_run')==B104_LIVE,'Build 104 Production closure drifted')
req(b105.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and b105.get('final_closure') is None and b105.get('production_checkpoint') is None,'Build 105 must remain an unproven closure candidate')
for token in ("SESSION_KEY = 'dd_catalog_work_session_v1'","SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2'",'function buildSummary','function reportText','Current blockers:','Session Products:','data-work-session-handoff-command="copy"','data-work-session-handoff-command="download"','Product Work Session Handoff','no Product/Inventory mutation'):
    req(token in handoff,f'Build 105 handoff layer missing token: {token}')
req("import('/public/js/admin-products-work-session-handoff.js?v=467b105')" in loader,'Build 105 Products loader revision missing')
req("document.body?.dataset?.adminPage === 'products'" in loader,'Build 105 loader must remain Products-only')
req('/api/' not in handoff and 'apiFetch(' not in handoff and 'fetch(' not in handoff,'Build 105 handoff layer must not add network calls')
req('new Blob(' in handoff and 'navigator.clipboard' in handoff,'Build 105 user-initiated handoff export controls missing')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B104_SHA in text and B104_TREE in text,f'{label} missing Build 104 SHA/tree')
    for v in B104_PROOFS.values():req(str(v) in text,f'{label} missing Build 104 proof {v}')
    req(str(B104_PAGES) in text and str(B104_LIVE) in text,f'{label} missing Build 104 Production proofs')
req('constBUILD=105;' in compact(it_api),'I.T. API must identify Build 105')
req('CURRENT_RELIABILITY_BUILD = 105' in reliability,'Reliability must identify Build 105')
req('constBUILD=105;' in compact(preflight),'Deployment Preflight must identify Build 105')
req('Release 467 Build 105' in it_page,'I.T. page must identify Build 105')
req('Release 467 • Build 105' in reliability_page,'Reliability page must identify Build 105')
req('Release 467 Build 105' in preflight_page,'Deployment Preflight page must identify Build 105')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must retain exactly one H1')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md','docs/operations/RELEASE_467_BUILD_105_PRODUCT_WORK_SESSION_HANDOFF.md'):
    body=read(path)
    for token in (B104_SHA,B104_TREE,*[str(x) for x in B104_PROOFS.values()],str(B104_PAGES),str(B104_LIVE)):req(token in body,f'{path} missing Build 104 closure token {token}')
    req('Build 105' in body and 'Handoff' in body,f'{path} missing Build 105 identity')
req('Build 106' in read('PROJECT_STATUS_AND_ROADMAP.md') and 'Build 110' in read('PROJECT_STATUS_AND_ROADMAP.md'),'current roadmap must retain the autonomous Build 106-110 layout')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Canonical migrations must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 105 must remain schema-neutral')
req("run_current_contract('scripts/release467_build105_gate.py', 'Release 467 Build 105')" in provenance,'System Gate must chain Build 105')
req("run_current_contract('scripts/release467_build104_gate.py', 'Release 467 Build 104')" not in provenance,'Build 105 must supersede Build 104 as current contract')
for path in ('public/js/admin-products-work-session.js','public/js/admin-products-work-session-handoff.js','public/js/admin-product-image-role-prompts.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. truth')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
if FAIL:
    print('RELEASE 467 BUILD 105 PRODUCT WORK SESSION COMPLETION & HANDOFF: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 105 PRODUCT WORK SESSION COMPLETION & HANDOFF: PASS')
print('Build 104 final Development + Production closure: INGESTED')
print('Session handoff: SUMMARY / BLOCKERS / COPY / DOWNLOAD')
print('Additional Product/readiness API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
