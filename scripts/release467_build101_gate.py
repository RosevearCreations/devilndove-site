#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 101 — Product Work Priority & Next-Action Ordering."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B100_SHA='20400309f3ab450cc256769870e8f963f8d3de3c'
B100_TREE='3344c8e4d8c177820ea5077f4b429ff1e832d881'
B100_PROOFS={'system_gate_run':34598663510,'current_application_quality_run':34598663549,'it_admin_runtime_proof_run':34598663501,'branch_hygiene_run':34598663509}
B100_PAGES=34598827876
B100_LIVE=34598920977
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
pointer=load('current-development-authority.json'); b100=load('release467-build100-product-work-session.json'); b101=load('release467-build101-product-work-priority.json'); manifest=load('migrations/canonical/manifest.json')
session=read('public/js/admin-products-work-session.js'); loader=read('public/js/admin-product-image-role-prompts.js'); provenance=read('scripts/current_system_gate_provenance_gate.py')
it_api=read('functions/api/admin/it-operations-control-tower.js'); it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html'); reliability=read('functions/api/_lib/currentReliability.js'); reliability_page=read('admin/reliability/index.html'); preflight=read('functions/api/admin/current-deployment-preflight.js'); preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==101,'current authority must be Release 467 Build 101')
req(pointer.get('title')=='Product Work Priority & Next-Action Ordering','Build 101 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified GREEN state')
req(pointer.get('accepted_dev_sha')==B100_SHA and pointer.get('accepted_dev_tree_sha')==B100_TREE,'accepted Build 100 SHA/tree drifted')
req((pointer.get('acceptance') or {})==B100_PROOFS,'accepted Build 100 four-proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}; cand=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(last.get('build')==100 and last.get('dev_sha')==B100_SHA and last.get('tree_sha')==B100_TREE and (last.get('proofs') or {})==B100_PROOFS,'Build 100 restart closure drifted')
req(prod.get('build')==100 and prod.get('main_sha')==B100_SHA and prod.get('tree_sha')==B100_TREE and prod.get('production_pages_deploy_run')==B100_PAGES and prod.get('production_live_resource_integrity_run')==B100_LIVE,'Build 100 Production baseline drifted')
req(cand.get('build')==101 and cand.get('authority')=='release467-build101-product-work-priority.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 101 candidate pointer drifted')
req(b100.get('state')=='PRODUCTION_GREEN','Build 100 authority must be Production GREEN')
f100=b100.get('final_closure') or {}; p100=b100.get('production_checkpoint') or {}
req(f100.get('dev_sha')==B100_SHA and f100.get('tree_sha')==B100_TREE and (f100.get('proofs') or {})==B100_PROOFS and f100.get('ingested_by_build')==101,'Build 100 final closure not ingested by Build 101')
req(p100.get('main_sha')==B100_SHA and p100.get('tree_sha')==B100_TREE and p100.get('production_pages_deploy_run')==B100_PAGES and p100.get('production_live_resource_integrity_run')==B100_LIVE,'Build 100 Production closure drifted')
req(b101.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and b101.get('final_closure') is None and b101.get('production_checkpoint') is None,'Build 101 must remain an unproven closure candidate')
for token in ("SESSION_KEY = 'dd_catalog_work_session_v1'","PRIORITIES = ['urgent','high','normal','low']","SORT_MODES = ['priority','blockers','readiness','recent','manual']",'priorityRank','orderedItems','data-work-session-priority','data-work-session-sort','nextIncomplete','nextBlocked'):
    req(token in session,f'Build 101 work-priority layer missing token: {token}')
req('/api/' not in session and 'apiFetch(' not in session and 'fetch(' not in session,'Build 101 work-priority layer must not add network calls')
req("row.querySelector('[data-open-first-blocker]')" in session,'Build 101 blocker action must delegate existing first-blocker action')
req("import('/public/js/admin-products-work-session.js?v=467b101')" in loader,'Build 101 Products loader revision missing')
req("document.body?.dataset?.adminPage === 'products'" in loader,'Build 101 loader must remain Products-only')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B100_SHA in text and B100_TREE in text,f'{label} missing Build 100 SHA/tree')
    for v in B100_PROOFS.values():req(str(v) in text,f'{label} missing Build 100 proof {v}')
    req(str(B100_PAGES) in text and str(B100_LIVE) in text,f'{label} missing Build 100 Production proofs')
req('constBUILD=101;' in compact(it_api),'I.T. API must identify Build 101')
req('CURRENT_RELIABILITY_BUILD = 101' in reliability,'Reliability must identify Build 101')
req('constBUILD=101;' in compact(preflight),'Deployment Preflight must identify Build 101')
req('Release 467 Build 101' in it_client and 'Release 467 Build 101' in it_page,'I.T. surfaces must identify Build 101')
req('Release 467 • Build 101' in reliability_page,'Reliability page must identify Build 101')
req('Release 467 Build 101' in preflight_page,'Deployment Preflight page must identify Build 101')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must retain exactly one H1')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B100_SHA,B100_TREE,*[str(x) for x in B100_PROOFS.values()],str(B100_PAGES),str(B100_LIVE)):req(token in body,f'{path} missing Build 100 closure token {token}')
    req('Build 101' in body and 'Product Work Priority' in body,f'{path} missing Build 101 identity')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Canonical migrations must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 101 must remain schema-neutral')
req("run_current_contract('scripts/release467_build101_gate.py', 'Release 467 Build 101')" in provenance,'System Gate must chain Build 101')
req("run_current_contract('scripts/release467_build100_gate.py', 'Release 467 Build 100')" not in provenance,'Build 101 must supersede Build 100 as current contract')
for path in ('public/js/admin-products-work-session.js','public/js/admin-product-image-role-prompts.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. truth')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
if FAIL:
    print('RELEASE 467 BUILD 101 PRODUCT WORK PRIORITY & NEXT-ACTION ORDERING: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 101 PRODUCT WORK PRIORITY & NEXT-ACTION ORDERING: PASS')
print('Build 100 final Development + Production closure: INGESTED')
print('Priority/order state: BROWSER LOCAL')
print('Additional Product/readiness API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
