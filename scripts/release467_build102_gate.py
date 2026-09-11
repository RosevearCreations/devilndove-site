#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 102 — Product Work Manual Reorder & Accessibility."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B101_SHA='73cd0d56071a60c562000d5804f819f6dde10a13'
B101_TREE='2ef06219e4b1eeb1e525680fc45107eb6ebc5226'
B101_PROOFS={'system_gate_run':34603707283,'current_application_quality_run':34603707270,'it_admin_runtime_proof_run':34603707267,'branch_hygiene_run':34603707269}
B101_PAGES=34603913028
B101_LIVE=34604002146
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
pointer=load('current-development-authority.json'); b101=load('release467-build101-product-work-priority.json'); b102=load('release467-build102-product-work-manual-reorder.json'); manifest=load('migrations/canonical/manifest.json')
session=read('public/js/admin-products-work-session.js'); loader=read('public/js/admin-product-image-role-prompts.js'); provenance=read('scripts/current_system_gate_provenance_gate.py')
it_api=read('functions/api/admin/it-operations-control-tower.js'); it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html'); reliability=read('functions/api/_lib/currentReliability.js'); reliability_page=read('admin/reliability/index.html'); preflight=read('functions/api/admin/current-deployment-preflight.js'); preflight_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==102,'current authority must be Release 467 Build 102')
req(pointer.get('title')=='Product Work Manual Reorder & Accessibility','Build 102 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified GREEN state')
req(pointer.get('accepted_dev_sha')==B101_SHA and pointer.get('accepted_dev_tree_sha')==B101_TREE,'accepted Build 101 SHA/tree drifted')
req((pointer.get('acceptance') or {})==B101_PROOFS,'accepted Build 101 four-proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}; cand=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(last.get('build')==101 and last.get('dev_sha')==B101_SHA and last.get('tree_sha')==B101_TREE and (last.get('proofs') or {})==B101_PROOFS,'Build 101 restart closure drifted')
req(prod.get('build')==101 and prod.get('main_sha')==B101_SHA and prod.get('tree_sha')==B101_TREE and prod.get('production_pages_deploy_run')==B101_PAGES and prod.get('production_live_resource_integrity_run')==B101_LIVE,'Build 101 Production baseline drifted')
req(cand.get('build')==102 and cand.get('authority')=='release467-build102-product-work-manual-reorder.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 102 candidate pointer drifted')
req(b101.get('state')=='PRODUCTION_GREEN','Build 101 authority must be Production GREEN')
f101=b101.get('final_closure') or {}; p101=b101.get('production_checkpoint') or {}
req(f101.get('dev_sha')==B101_SHA and f101.get('tree_sha')==B101_TREE and (f101.get('proofs') or {})==B101_PROOFS and f101.get('ingested_by_build')==102,'Build 101 final closure not ingested by Build 102')
req(p101.get('main_sha')==B101_SHA and p101.get('tree_sha')==B101_TREE and p101.get('production_pages_deploy_run')==B101_PAGES and p101.get('production_live_resource_integrity_run')==B101_LIVE,'Build 101 Production closure drifted')
req(b102.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and b102.get('final_closure') is None and b102.get('production_checkpoint') is None,'Build 102 must remain an unproven closure candidate')
for token in ("SESSION_KEY = 'dd_catalog_work_session_v1'","SORT_MODES = ['priority','blockers','readiness','recent','manual']",'function moveItem(id, delta)',"session.sort_mode !== 'manual'",'session.items.splice(index,1)','data-work-session-action=\"move-up\"','data-work-session-action=\"move-down\"','aria-label=\"Move ${esc(meta.name)} up in manual order\"','aria-label=\"Move ${esc(meta.name)} down in manual order\"','manual position ${storedIndex+1} of ${session.items.length}','nextIncomplete','nextBlocked'):
    req(token in session,f'Build 102 manual reorder layer missing token: {token}')
req('/api/' not in session and 'apiFetch(' not in session and 'fetch(' not in session,'Build 102 manual reorder layer must not add network calls')
req("row.querySelector('[data-open-first-blocker]')" in session,'Build 102 blocker action must delegate existing first-blocker action')
req("import('/public/js/admin-products-work-session.js?v=467b102')" in loader,'Build 102 Products loader revision missing')
req("document.body?.dataset?.adminPage === 'products'" in loader,'Build 102 loader must remain Products-only')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B101_SHA in text and B101_TREE in text,f'{label} missing Build 101 SHA/tree')
    for v in B101_PROOFS.values():req(str(v) in text,f'{label} missing Build 101 proof {v}')
    req(str(B101_PAGES) in text and str(B101_LIVE) in text,f'{label} missing Build 101 Production proofs')
req('constBUILD=102;' in compact(it_api),'I.T. API must identify Build 102')
req('CURRENT_RELIABILITY_BUILD = 102' in reliability,'Reliability must identify Build 102')
req('constBUILD=102;' in compact(preflight),'Deployment Preflight must identify Build 102')
req('Release 467 Build 102' in it_client and 'Release 467 Build 102' in it_page,'I.T. surfaces must identify Build 102')
req('Release 467 • Build 102' in reliability_page,'Reliability page must identify Build 102')
req('Release 467 Build 102' in preflight_page,'Deployment Preflight page must identify Build 102')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must retain exactly one H1')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md','docs/operations/RELEASE_467_BUILD_102_PRODUCT_WORK_MANUAL_REORDER.md'):
    body=read(path)
    for token in (B101_SHA,B101_TREE,*[str(x) for x in B101_PROOFS.values()],str(B101_PAGES),str(B101_LIVE)):req(token in body,f'{path} missing Build 101 closure token {token}')
    req('Build 102' in body and 'Manual Reorder' in body,f'{path} missing Build 102 identity')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Canonical migrations must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 102 must remain schema-neutral')
req("run_current_contract('scripts/release467_build102_gate.py', 'Release 467 Build 102')" in provenance,'System Gate must chain Build 102')
req("run_current_contract('scripts/release467_build101_gate.py', 'Release 467 Build 101')" not in provenance,'Build 102 must supersede Build 101 as current contract')
for path in ('public/js/admin-products-work-session.js','public/js/admin-product-image-role-prompts.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. truth')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
if FAIL:
    print('RELEASE 467 BUILD 102 PRODUCT WORK MANUAL REORDER & ACCESSIBILITY: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 102 PRODUCT WORK MANUAL REORDER & ACCESSIBILITY: PASS')
print('Build 101 final Development + Production closure: INGESTED')
print('Manual reorder state: BROWSER LOCAL / KEYBOARD ACCESSIBLE')
print('Additional Product/readiness API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
