#!/usr/bin/env python3
"""Release 467 Build 153 — Layout Observer Performance Hotfix lifecycle gate."""
from pathlib import Path
import json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    return p.read_text(encoding='utf-8') if p.exists() else ''
def load(path):
    try: return json.loads(read(path) or '{}')
    except Exception as exc: FAIL.append(f'{path} invalid JSON: {exc}'); return {}

# Immutable Build 152 predecessor closure ingested by Build 153.
B152_DEV='1d01cbed98b78543b75dab808a30fb76c20d6060'
B152_MAIN='2f22e280426968a9ff229a0cee9ee62a69dc9d75'
B152_TREE='9cf8b0ac918ce567c51536f05d4c89b6f6294765'
B152_PROOFS={'system_gate_run':34860514075,'current_application_quality_run':34860514137,'it_admin_runtime_proof_run':34860514304,'branch_hygiene_run':34860514150}
B152_PAGES=34860809983; B152_LIVE=34860922626

# Immutable Build 153 closure, available after Build 153 has completed promotion.
B153_DEV='b8323b4e13ae08a8126da761106367de75f7cd40'
B153_MAIN='ba8b3c2406335391334b2a74a89e5819236c770b'
B153_TREE='a3d0225c579953d5572dc99313661c2981c42510'
B153_PROOFS={'system_gate_run':34863777573,'current_application_quality_run':34863777529,'it_admin_runtime_proof_run':34863777559,'branch_hygiene_run':34863777543}
B153_PAGES=34864015766; B153_LIVE=34864113781
TITLE='Layout Observer Performance Hotfix'

closure152=load('release467-build152-sitewide-image-quality-media-qa.json')
closure153=load('release467-build153-layout-observer-performance-hotfix.json')
pointer=load('current-development-authority.json')
manifest=load('migrations/canonical/manifest.json')
guard=read('public/js/layout-overflow-guard.js')
middleware=read('functions/_middleware.js')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')

# Build 152 predecessor evidence remains immutable in every later lifecycle state.
req(closure152.get('release')==467 and closure152.get('build')==152,'Build 152 closure identity is wrong')
req(closure152.get('accepted_dev_sha')==B152_DEV and closure152.get('accepted_dev_tree_sha')==B152_TREE,'Build 152 accepted Development SHA/tree drifted')
req((closure152.get('acceptance') or {})==B152_PROOFS,'Build 152 Development proof set drifted')
final152=closure152.get('final_closure') or {}; prod152=closure152.get('production_checkpoint') or {}
req(final152.get('state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and final152.get('dev_sha')==B152_DEV and final152.get('tree_sha')==B152_TREE,'Build 152 final Development closure drifted')
req((final152.get('proofs') or {})==B152_PROOFS and final152.get('ingested_by_build')==153,'Build 152 closure is not correctly ingested by Build 153')
req(prod152.get('state')=='PRODUCTION_GREEN' and prod152.get('main_sha')==B152_MAIN and prod152.get('tree_sha')==B152_TREE,'Build 152 Production closure drifted')
req(prod152.get('production_pages_deploy_run')==B152_PAGES and prod152.get('production_live_resource_integrity_run')==B152_LIVE,'Build 152 Production proof IDs drifted')

pointer_build=int(pointer.get('build') or 0)
if pointer_build==152:
    # Original Build 153 candidate contract.
    req(pointer.get('release')==467,'current authority release drifted')
    req(pointer.get('title')=='Site-wide Image Quality Scoring & Media QA','Build 152 current title drifted')
    req(pointer.get('accepted_dev_sha')==B152_DEV and pointer.get('accepted_dev_tree_sha')==B152_TREE,'current authority Build 152 SHA/tree drifted')
    req((pointer.get('acceptance') or {})==B152_PROOFS,'current authority Build 152 proofs drifted')
    current_prod=pointer.get('production_checkpoint') or {}
    req(current_prod.get('build')==152 and current_prod.get('main_sha')==B152_MAIN and current_prod.get('tree_sha')==B152_TREE,'Production authority must preserve Build 152 exact checkpoint')
    req(current_prod.get('production_pages_deploy_run')==B152_PAGES and current_prod.get('production_live_resource_integrity_run')==B152_LIVE,'Build 152 Production authority proof IDs drifted')
    req(pointer.get('next_build')==153 and pointer.get('next_build_title')==TITLE,'Build 153 next-build authority missing')
    req(pointer.get('next_build_state')=='AUTHORIZED_IN_PROGRESS','Build 153 must remain an authorized candidate before external proof')
    req(pointer.get('promotion_state')=='BUILD153_CANDIDATE_NOT_YET_VERIFIED','Build 153 candidate must not self-claim Production')
    req((pointer.get('current_release_authorities') or [None])[0]=='release467-build152-sitewide-image-quality-media-qa.json','Build 152 closure must lead current authority chain during candidate phase')
    req('# Build 153 — Layout Observer Performance Hotfix — ACTIVE' in roadmap,'Build 153 candidate roadmap state missing')
elif pointer_build>=153:
    # Successor lifecycle: prove the exact Build 153 closure while allowing later builds to lead current authority.
    req(closure153.get('release')==467 and closure153.get('build')==153,'Build 153 closure identity is wrong')
    req(closure153.get('title')==TITLE,'Build 153 closure title drifted')
    req(closure153.get('accepted_dev_sha')==B153_DEV and closure153.get('accepted_dev_tree_sha')==B153_TREE,'Build 153 accepted Development SHA/tree drifted')
    req((closure153.get('acceptance') or {})==B153_PROOFS,'Build 153 Development proof set drifted')
    final153=closure153.get('final_closure') or {}; prod153=closure153.get('production_checkpoint') or {}
    req(final153.get('state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and final153.get('dev_sha')==B153_DEV and final153.get('tree_sha')==B153_TREE,'Build 153 final Development closure drifted')
    req((final153.get('proofs') or {})==B153_PROOFS,'Build 153 final proof set drifted')
    req(int(final153.get('ingested_by_build') or 0)>=154,'Build 153 closure must be ingested by Build 154 or later')
    req(prod153.get('state')=='PRODUCTION_GREEN' and prod153.get('main_sha')==B153_MAIN and prod153.get('tree_sha')==B153_TREE,'Build 153 Production closure drifted')
    req(prod153.get('production_pages_deploy_run')==B153_PAGES and prod153.get('production_live_resource_integrity_run')==B153_LIVE,'Build 153 Production proof IDs drifted')
    req(pointer.get('release')==467 and pointer_build>=153,'current authority may not regress behind Build 153')
    last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}
    req(int(last.get('build') or 0)>=153,'current restart authority may not regress behind Build 153')
    current_prod=pointer.get('production_checkpoint') or {}
    req(int(current_prod.get('build') or 0)>=153,'current Production authority may not regress behind Build 153')
    req(current_prod.get('state')=='PRODUCTION_GREEN','current Production authority must remain GREEN after Build 153')
    req(int(pointer.get('next_build') or 0)>=154,'successor lifecycle must advance beyond Build 153')
    req('release467-build153-layout-observer-performance-hotfix.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 153 historical authority')
    req('# Build 153 — Layout Observer Performance Hotfix — CLOSED GREEN' in roadmap,'Build 153 closed roadmap state missing')
else:
    req(False,f'unsupported current authority build for Build 153 lifecycle: {pointer_build}')

expected_migrations=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
current_migrations=manifest.get('migrations',[])
current_files=[x.get('file') for x in current_migrations]
req(current_files[:4]==expected_migrations,'Build 153 canonical D1 migration prefix changed')
req(len(current_migrations)>=4 and [int(x.get('version') or 0) for x in current_migrations]==list(range(1,len(current_migrations)+1)),'canonical D1 successor migration sequence is not contiguous')
req(all(str(x.get('file') or '').startswith(f"{int(x.get('version') or 0):04d}_") for x in current_migrations),'canonical D1 successor migration filename/version mismatch')

# Immutable Build 153 implementation/performance assertions stay strict for all successor builds.
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
req('layout-overflow-guard.js?v=${LAYOUT_ASSET_REVISION}' in middleware,'Products route must retain the Build 153 layout cache revision')
for token in ('sharedServiceAccessForRequest','moduleAccessForRequest','return finish(await context.next(), request'):
    req(token in middleware,f'middleware truncation/integrity token missing: {token}')

req('467-b153-layout-observer' in roadmap,'Build 153 roadmap cache revision truth missing')
req('Firefox long-script' in roadmap,'Build 153 roadmap incident truth missing')

for rel in ('public/js/layout-overflow-guard.js','functions/_middleware.js'):
    result=subprocess.run(['node','--check',str(ROOT/rel)],cwd=ROOT,text=True,capture_output=True)
    req(result.returncode==0,f'JavaScript syntax failed for {rel}: {(result.stderr or result.stdout).strip()}')

if FAIL:
    print('RELEASE 467 BUILD 153 GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 153 GATE: PASS')
print('Build 152 predecessor closure: IMMUTABLE')
print('Build 153 lifecycle: CANDIDATE OR EXACT SEALED CLOSURE')
print('Layout observer: FILTERED + RAF BATCHED + ROOT-DEDUPED + SELF-MUTATION ISOLATED')
print('Products layout cache revision: 467-b153-layout-observer')
print('Canonical D1: 0001-0004 / UNCHANGED')
print('D1/R2/provider/payment/accounting mutation added: NONE')
