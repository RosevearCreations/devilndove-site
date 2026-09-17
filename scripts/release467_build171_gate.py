#!/usr/bin/env python3
"""Release 467 Build 171 — release/restart authority convergence gate."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
BASE_SHA='879c8730040afaf6caec6374b5057b7261fdcfe2'
BASE_TREE='da5e3b249d6e14266da5e191cb22c06205947948'
DEV_PROOFS={
    'system_gate_run':35275441340,
    'current_application_quality_run':35275441446,
    'it_admin_runtime_proof_run':35275441412,
    'branch_hygiene_run':35275441448,
}
PROD_PAGES=35275636873
PROD_LIVE=35275711398
PROD_BROWSER=35275711387
PROD_ROUTE=35275711471
TITLE='Release & Restart Authority Convergence'
CANDIDATE='release467-build171-release-restart-authority-convergence.json'
CLOSURE='release467-build170-product-browser-explicit-image-recovery-closure.json'

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f'missing file: {path}')
        return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:return json.loads(read(path))
    except Exception as error:
        FAIL.append(f'invalid JSON {path}: {error}')
        return {}
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')

pointer=load('current-development-authority.json')
candidate=load(CANDIDATE)
closure=load(CLOSURE)
manifest=load('migrations/canonical/manifest.json')
ai=read('AI_HANDOFF.md')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')
index=read('MARKDOWN_INDEX.md')
note=read('docs/operations/RELEASE_467_BUILD_171_RELEASE_RESTART_AUTHORITY_CONVERGENCE.md')
api=read('functions/api/admin/it-operations-control-tower.js')
client=read('public/js/admin-it-control-tower.js')
page=read('admin/it/index.html')

req(pointer.get('release')==467,'pointer release must be 467')
req(pointer.get('build')==171,'pointer build must be 171')
req(pointer.get('title')==TITLE,'pointer title must match Build 171')
req(pointer.get('state')=='DEVELOPMENT_GREEN','pointer must retain last verified Development GREEN state while Build 171 is candidate')
req(pointer.get('source_authority')=='dev','pointer source authority must remain dev')
req(pointer.get('accepted_dev_sha')==BASE_SHA,'pointer accepted Development SHA must be exact Build 170')
req(pointer.get('accepted_dev_tree_sha')==BASE_TREE,'pointer accepted Development tree must be exact Build 170')
req((pointer.get('acceptance') or {})==DEV_PROOFS,'pointer accepted Development proof bundle must be exact Build 170')

restart=pointer.get('restart_integrity') or {}
last=restart.get('last_fully_verified') or {}
current=restart.get('current_closure_candidate') or {}
req(last.get('build')==170 and last.get('dev_sha')==BASE_SHA and last.get('tree_sha')==BASE_TREE,'restart last verified authority must be exact Build 170')
req(last.get('authority')==CLOSURE,'restart last verified authority file must be the Build 170 closure')
req((last.get('proofs') or {})==DEV_PROOFS,'restart Build 170 proof bundle drifted')
req(current.get('build')==171 and current.get('authority')==CANDIDATE,'restart current candidate must be Build 171 authority')
req(restart.get('restart_requires_exact_dev_head_proof_verification') is True,'restart must require exact dev-head proof verification')
req(restart.get('closure_candidate_must_not_self_claim_final_proof') is True,'candidate must not self-claim final proof')

prod=pointer.get('production_checkpoint') or {}
req(prod.get('build')==170 and prod.get('authority')==CLOSURE,'Production checkpoint must resolve to Build 170 closure')
req(prod.get('main_sha')==BASE_SHA and prod.get('tree_sha')==BASE_TREE,'Production checkpoint must be exact Build 170 SHA/tree')
req(prod.get('production_pages_deploy_run')==PROD_PAGES,'Production Pages proof must be exact Build 170')
req(prod.get('production_live_resource_integrity_run')==PROD_LIVE,'Production live-resource proof must be exact Build 170')
req(prod.get('state')=='PRODUCTION_GREEN','Production checkpoint must remain GREEN')
authorities=pointer.get('current_release_authorities') or []
req(bool(authorities) and authorities[0]==CANDIDATE,'Build 171 candidate must be first current release authority')
req(CLOSURE in authorities,'Build 170 Production closure must remain a current release authority')

req(candidate.get('release')==467 and candidate.get('build')==171 and candidate.get('title')==TITLE,'Build 171 candidate identity mismatch')
req(candidate.get('state')=='DEVELOPMENT_CANDIDATE','Build 171 authority must remain an explicit candidate before external exact-head proof')
start=(candidate.get('starting_point') or {}).get('development') or {}
req(start.get('sha')==BASE_SHA and start.get('tree')==BASE_TREE,'Build 171 candidate must start from exact Build 170 Development SHA/tree')
req(start.get('system_gate_run')==DEV_PROOFS['system_gate_run'],'Build 171 candidate System proof mismatch')
req(start.get('quality_run')==DEV_PROOFS['current_application_quality_run'],'Build 171 candidate Quality proof mismatch')
req(start.get('it_admin_runtime_run')==DEV_PROOFS['it_admin_runtime_proof_run'],'Build 171 candidate I.T. proof mismatch')
req(start.get('repository_hygiene_run')==DEV_PROOFS['branch_hygiene_run'],'Build 171 candidate Hygiene proof mismatch')

req(closure.get('release')==467 and closure.get('build')==170,'Build 170 closure identity mismatch')
req(closure.get('state')=='PRODUCTION_GREEN','Build 170 closure must remain Production GREEN')
closure_dev=closure.get('development') or {};closure_prod=closure.get('production') or {}
req(closure_dev.get('dev_sha')==BASE_SHA and closure_dev.get('tree_sha')==BASE_TREE,'Build 170 closure Development identity mismatch')
req(closure_prod.get('main_sha')==BASE_SHA and closure_prod.get('tree_sha')==BASE_TREE,'Build 170 closure Production identity mismatch')
req(closure_prod.get('production_pages_deploy_run')==PROD_PAGES and closure_prod.get('production_live_resource_integrity_run')==PROD_LIVE,'Build 170 closure Production proof mismatch')
req(closure_prod.get('products_browser_proof_run')==PROD_BROWSER and closure_prod.get('products_route_proof_run')==PROD_ROUTE,'Build 170 Product Production proof mismatch')

for body,label in ((ai,'AI_HANDOFF.md'),(roadmap,'PROJECT_STATUS_AND_ROADMAP.md'),(index,'MARKDOWN_INDEX.md'),(note,'Build 171 release note')):
    req('Build 171' in body,f'{label} missing Build 171 current authority')
    req(BASE_SHA in body,f'{label} missing exact Build 170 predecessor SHA')
for stale in ('Build 155 — Products Client Responsiveness Hotfix — ACTIVE','Current Release 467 restart authority — Build 158 candidate','Current exact verified source baseline: **Release 467 Build 154'):
    req(stale not in ai and stale not in roadmap and stale not in index,f'stale restart authority remains active: {stale}')

req('const BUILD=171;' in api,'I.T. API must expose Build 171')
req("const TITLE='Release & Restart Authority Convergence';" in api,'I.T. API must expose Build 171 title')
for token in (BASE_SHA,BASE_TREE,str(DEV_PROOFS['system_gate_run']),str(PROD_PAGES),str(PROD_LIVE),"state:'DEVELOPMENT_GREEN'"):
    req(token in api,f'I.T. API missing Build 170 accepted truth token: {token}')
req('Release 467 Build 171' in client,'I.T. client must identify Build 171')
req('Release 467 Build 171' in page,'I.T. page must identify Build 171')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'I.T. page must retain exactly one H1')
req('onRequestPost' not in api,'Build 171 I.T. authority endpoint must remain read-only')
node('functions/api/admin/it-operations-control-tower.js')
node('public/js/admin-it-control-tower.js')

canonical=[x.get('file') for x in manifest.get('migrations',[])]
req(canonical==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql'],'Build 171 must not alter canonical migration authority')
req(pointer.get('schema_change_authorized') is False and pointer.get('d1_mutation_authorized') is False and pointer.get('r2_mutation_authorized') is False,'Build 171 pointer must keep schema/D1/R2 mutation closed')
req(pointer.get('provider_execution_authorized') is False and pointer.get('provider_publication_authorized') is False,'Build 171 pointer must keep provider execution/publication closed')

if FAIL:
    print('RELEASE 467 BUILD 171 RELEASE/RESTART AUTHORITY CONVERGENCE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 171 RELEASE/RESTART AUTHORITY CONVERGENCE: PASS')
print('Verified predecessor: Build 170 exact SHA/tree + Development/Production proof bundle')
print('Machine pointer / I.T. truth / human handoff: CONVERGED')
print('Schema / D1-R2 business data / provider / payment-runtime mutation: NONE')
