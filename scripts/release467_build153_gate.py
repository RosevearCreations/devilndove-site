#!/usr/bin/env python3
"""Release 467 Build 153 — Layout Observer Performance Hotfix gate."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    return p.read_text(encoding='utf-8') if p.exists() else ''
def load(path):
    try: return json.loads(read(path) or '{}')
    except Exception as exc: FAIL.append(f'{path} invalid JSON: {exc}'); return {}

DEV_SHA='1d01cbed98b78543b75dab808a30fb76c20d6060'
MAIN_SHA='2f22e280426968a9ff229a0cee9ee62a69dc9d75'
TREE='9cf8b0ac918ce567c51536f05d4c89b6f6294765'
PROOFS={'system_gate_run':34860514075,'current_application_quality_run':34860514137,'it_admin_runtime_proof_run':34860514304,'branch_hygiene_run':34860514150}
PAGES=34860809983; LIVE=34860922626
TITLE='Layout Observer Performance Hotfix'

closure=load('release467-build152-sitewide-image-quality-media-qa.json')
pointer=load('current-development-authority.json')
manifest=load('migrations/canonical/manifest.json')
guard=read('public/js/layout-overflow-guard.js')
middleware=read('functions/_middleware.js')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')

req(closure.get('release')==467 and closure.get('build')==152,'Build 152 closure identity is wrong')
req(closure.get('accepted_dev_sha')==DEV_SHA and closure.get('accepted_dev_tree_sha')==TREE,'Build 152 accepted Development SHA/tree drifted')
req((closure.get('acceptance') or {})==PROOFS,'Build 152 Development proof set drifted')
final=closure.get('final_closure') or {}; prod=closure.get('production_checkpoint') or {}
req(final.get('state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and final.get('dev_sha')==DEV_SHA and final.get('tree_sha')==TREE,'Build 152 final Development closure drifted')
req((final.get('proofs') or {})==PROOFS and final.get('ingested_by_build')==153,'Build 152 closure is not correctly ingested by Build 153')
req(prod.get('state')=='PRODUCTION_GREEN' and prod.get('main_sha')==MAIN_SHA and prod.get('tree_sha')==TREE,'Build 152 Production closure drifted')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 152 Production proof IDs drifted')

req(pointer.get('release')==467 and pointer.get('build')==152,'current authority must point to Build 152 baseline')
req(pointer.get('title')=='Site-wide Image Quality Scoring & Media QA','Build 152 current title drifted')
req(pointer.get('accepted_dev_sha')==DEV_SHA and pointer.get('accepted_dev_tree_sha')==TREE,'current authority Build 152 SHA/tree drifted')
req((pointer.get('acceptance') or {})==PROOFS,'current authority Build 152 proofs drifted')
current_prod=pointer.get('production_checkpoint') or {}
req(current_prod.get('build')==152 and current_prod.get('main_sha')==MAIN_SHA and current_prod.get('tree_sha')==TREE,'Production authority must preserve Build 152 exact checkpoint')
req(current_prod.get('production_pages_deploy_run')==PAGES and current_prod.get('production_live_resource_integrity_run')==LIVE,'Build 152 Production authority proof IDs drifted')
req(pointer.get('next_build')==153 and pointer.get('next_build_title')==TITLE,'Build 153 next-build authority missing')
req(pointer.get('next_build_state')=='AUTHORIZED_IN_PROGRESS','Build 153 must remain an authorized candidate before external proof')
req(pointer.get('promotion_state')=='BUILD153_CANDIDATE_NOT_YET_VERIFIED','Build 153 candidate must not self-claim Production')
req((pointer.get('current_release_authorities') or [None])[0]=='release467-build152-sitewide-image-quality-media-qa.json','Build 152 closure must lead current authority chain')

expected_migrations=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
req([x.get('file') for x in manifest.get('migrations',[])]==expected_migrations,'canonical D1 migration authority changed')

for token in (
    "const TARGET_SELECTOR = 'table,.container,.admin-shell'",
    'const pendingRoots = new Set()',
    'const flush = () =>',
    'const deduped = roots.filter',
    'observer?.disconnect()',
    'window.requestAnimationFrame(flush)',
    "if (!node?.matches?.(TARGET_SELECTOR) && !node?.querySelector?.(TARGET_SELECTOR)) return",
    "observer.observe(document.body, { childList: true, subtree: true })",
    "if (root?.nodeType === 1 && root.matches?.('table')) wrapTable(root)",
): req(token in guard,f'Build 153 layout guard missing performance token: {token}')
req(guard.count('new MutationObserver')==1,'layout guard must retain one bounded MutationObserver')
req('setInterval(' not in guard,'layout guard must not add recurring polling')
req('fetch(' not in guard and 'apiFetch(' not in guard,'layout guard must remain network-free')
req('h1' not in guard.lower(),'layout guard must not mutate heading hierarchy')
req("const LAYOUT_ASSET_REVISION = '467-b153-layout-observer'" in middleware,'Build 153 layout cache revision missing')
req('layout-overflow-guard.js?v=${LAYOUT_ASSET_REVISION}' in middleware,'Products route must inject the Build 153 layout cache revision')
for token in ('sharedServiceAccessForRequest','moduleAccessForRequest','return finish(await context.next(), request'):
    req(token in middleware,f'middleware truncation/integrity token missing: {token}')

for token in ('# Build 153 — Layout Observer Performance Hotfix — ACTIVE','467-b153-layout-observer','Firefox long-script termination'):
    req(token in roadmap,f'Build 153 roadmap truth missing token: {token}')

for rel in ('public/js/layout-overflow-guard.js','functions/_middleware.js'):
    result=subprocess.run(['node','--check',str(ROOT/rel)],cwd=ROOT,text=True,capture_output=True)
    req(result.returncode==0,f'JavaScript syntax failed for {rel}: {(result.stderr or result.stdout).strip()}')

if FAIL:
    print('RELEASE 467 BUILD 153 GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 153 GATE: PASS')
print('Build 152 six-proof Production closure: INGESTED BY BUILD 153')
print('Layout observer: FILTERED + RAF BATCHED + ROOT-DEDUPED + SELF-MUTATION ISOLATED')
print('Products cache revision: 467-b153-layout-observer')
print('Canonical D1: 0001-0004 / UNCHANGED')
print('D1/R2/provider/payment/accounting mutation added: NONE')
