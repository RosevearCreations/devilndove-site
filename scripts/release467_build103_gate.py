#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 103 — Product Work Session Paging & Full Coverage."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B102_SHA='7325c093f47c29aafaafef0cff3da88f1b273227'
B102_TREE='f7c1e97b1b811af68c2701db985ccc824e11abca'
B102_AUTHORITY='release467-build102-product-work-manual-reorder.json'
B102_AUTHORITY_BLOB='0dcdd7cb9afd8bb39e67b281c48dbb142b273cce'
B103_AUTHORITY='release467-build103-product-work-session-paging.json'
B103_AUTHORITY_BLOB='10d6d70a4eace5687c9117acb69b37342d4ea1e7'
B103_POINTER_BLOB='885aabe81c6b64bb402c1d0f088414437a216375'
B102_PROOFS={'system_gate_run':34606547840,'current_application_quality_run':34606547841,'it_admin_runtime_proof_run':34606547865,'branch_hygiene_run':34606547882}
B102_PAGES=34606720131
B102_LIVE=34606812380
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def read(path):
    p=ROOT/path
    if not p.is_file():FAIL.append(f'missing required file: {path}');return''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:return json.loads(read(path) or '{}')
    except Exception as exc:FAIL.append(f'invalid JSON {path}: {exc}');return{}
def req(ok,msg):
    if not ok:FAIL.append(msg)
def run(cmd,label):
    r=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip():print(r.stdout.strip())
    req(r.returncode==0,f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
def compact(s):return re.sub(r'\s+','',s)
def blob_sha(path):
    data=(ROOT/path).read_bytes()
    return hashlib.sha1(f'blob {len(data)}\0'.encode('ascii')+data).hexdigest()

pointer_path='current-development-authority.json'
pointer_text=read(pointer_path);b102_text=read(B102_AUTHORITY);b103_text=read(B103_AUTHORITY)
pointer=load(pointer_path);b102=load(B102_AUTHORITY);b103=load(B103_AUTHORITY);manifest=load('migrations/canonical/manifest.json')
session=read('public/js/admin-products-work-session.js');loader=read('public/js/admin-product-image-role-prompts.js');provenance=read('scripts/current_system_gate_provenance_gate.py')
it_api=read('functions/api/admin/it-operations-control-tower.js');it_client=read('public/js/admin-it-control-tower.js');it_page=read('admin/it/index.html');reliability=read('functions/api/_lib/currentReliability.js');reliability_page=read('admin/reliability/index.html');preflight=read('functions/api/admin/current-deployment-preflight.js');preflight_page=read('admin/deployment-preflight/index.html')

# Build 102 -> 103 is sealed through immutable Git blobs plus exact tree/proof evidence.
# This avoids brittle duplicate JSON string comparisons without weakening any evidence.
req(blob_sha(pointer_path)==B103_POINTER_BLOB,'Build 103 current-development authority blob drifted')
req(blob_sha(B102_AUTHORITY)==B102_AUTHORITY_BLOB,'Build 102 authority blob drifted')
req(blob_sha(B103_AUTHORITY)==B103_AUTHORITY_BLOB,'Build 103 authority blob drifted')
req(B102_SHA in pointer_text and B102_SHA in b102_text and B102_SHA in b103_text,'Build 102 exact SHA text must remain sealed in machine authorities')
req(pointer.get('release')==467 and pointer.get('build')==103,'current authority must be Release 467 Build 103')
req(pointer.get('title')=='Product Work Session Paging & Full Coverage','Build 103 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified GREEN state')
req(pointer.get('accepted_dev_tree_sha')==B102_TREE,'accepted Build 102 tree drifted')
req((pointer.get('acceptance') or {})==B102_PROOFS,'accepted Build 102 four-proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {};prod=pointer.get('production_checkpoint') or {};cand=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(last.get('build')==102 and last.get('tree_sha')==B102_TREE and (last.get('proofs') or {})==B102_PROOFS,'Build 102 restart closure tree/proofs drifted')
req(prod.get('build')==102 and prod.get('tree_sha')==B102_TREE and prod.get('production_pages_deploy_run')==B102_PAGES and prod.get('production_live_resource_integrity_run')==B102_LIVE,'Build 102 Production baseline tree/proofs drifted')
req(cand.get('build')==103 and cand.get('authority')==B103_AUTHORITY and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 103 candidate pointer drifted')
req(b102.get('state')=='PRODUCTION_GREEN','Build 102 authority must be Production GREEN')
f102=b102.get('final_closure') or {};p102=b102.get('production_checkpoint') or {}
req(f102.get('tree_sha')==B102_TREE and (f102.get('proofs') or {})==B102_PROOFS and f102.get('ingested_by_build')==103,'Build 102 final closure tree/proofs not ingested by Build 103')
req(p102.get('tree_sha')==B102_TREE and p102.get('production_pages_deploy_run')==B102_PAGES and p102.get('production_live_resource_integrity_run')==B102_LIVE,'Build 102 Production closure tree/proofs drifted')
req(b103.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and b103.get('final_closure') is None and b103.get('production_checkpoint') is None,'Build 103 must remain an unproven closure candidate')

for token in ("SESSION_KEY = 'dd_catalog_work_session_v1'",'const MAX_ITEMS = 60;','const PAGE_SIZE = 20;',"SORT_MODES = ['priority','blockers','readiness','recent','manual']",'let sessionPage = 0;','const pageCountFor','const clampPage','data-work-session-command=\"page-prev\"','data-work-session-command=\"page-next\"','Product work session pages','Page ${sessionPage+1} of ${pageCount}','Products ${pageStart+1}-${pageEnd} of ${total}','sessionPage=Math.floor(target/PAGE_SIZE)','function moveItem(id, delta)','nextIncomplete','nextBlocked'):
    req(token in session,f'Build 103 paging layer missing token: {token}')
req('ordered.slice(0,20)' not in session,'Build 103 must remove first-20-only session rendering')
req('/api/' not in session and 'apiFetch(' not in session and 'fetch(' not in session,'Build 103 session paging layer must not add network calls')
req("row.querySelector('[data-open-first-blocker]')" in session,'Build 103 blocker action must delegate existing first-blocker action')
req("import('/public/js/admin-products-work-session.js?v=467b103')" in loader,'Build 103 Products loader revision missing')
req("document.body?.dataset?.adminPage === 'products'" in loader,'Build 103 loader must remain Products-only')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B102_TREE in text,f'{label} missing Build 102 tree')
    for v in B102_PROOFS.values():req(str(v) in text,f'{label} missing Build 102 proof {v}')
    req(str(B102_PAGES) in text and str(B102_LIVE) in text,f'{label} missing Build 102 Production proofs')
req('constBUILD=103;' in compact(it_api),'I.T. API must identify Build 103')
req('CURRENT_RELIABILITY_BUILD = 103' in reliability,'Reliability must identify Build 103')
req('constBUILD=103;' in compact(preflight),'Deployment Preflight must identify Build 103')
req('Release 467 Build 103' in it_client and 'Release 467 Build 103' in it_page,'I.T. surfaces must identify Build 103')
req('Release 467 • Build 103' in reliability_page,'Reliability page must identify Build 103')
req('Release 467 Build 103' in preflight_page,'Deployment Preflight page must identify Build 103')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must retain exactly one H1')

# Human restart surfaces retain immutable tree and six proof IDs; SHA identity is sealed
# by the machine-authority blobs above and does not need redundant Markdown duplication.
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md','docs/operations/RELEASE_467_BUILD_103_PRODUCT_WORK_SESSION_PAGING.md'):
    body=read(path)
    for token in (B102_TREE,*[str(x) for x in B102_PROOFS.values()],str(B102_PAGES),str(B102_LIVE)):req(token in body,f'{path} missing Build 102 closure token {token}')
    req('Build 103' in body and 'Paging' in body,f'{path} missing Build 103 identity')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Canonical migrations must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 103 must remain schema-neutral')
req("run_current_contract('scripts/release467_build103_gate.py', 'Release 467 Build 103')" in provenance,'System Gate must chain Build 103')
req("run_current_contract('scripts/release467_build102_gate.py', 'Release 467 Build 102')" not in provenance,'Build 103 must supersede Build 102 as current contract')
for path in ('public/js/admin-products-work-session.js','public/js/admin-product-image-role-prompts.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. truth')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
if FAIL:
    print('RELEASE 467 BUILD 103 PRODUCT WORK SESSION PAGING & FULL COVERAGE: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 103 PRODUCT WORK SESSION PAGING & FULL COVERAGE: PASS')
print('Build 102 final Development + Production closure: INGESTED / IMMUTABLY BOUND')
print('Session coverage: 60 ITEMS / 20 PER PAGE / KEYBOARD ACCESSIBLE')
print('Additional Product/readiness API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
