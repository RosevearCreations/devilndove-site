#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 97 — Product Readiness Work Queue & Blocker Navigation."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B96_SHA='ba0e2f633d823b90fdcc2cbbbe6be4c50c79b284'
B96_TREE='76f01771b844f6f610a621cd969d033cfa3d7c9c'
B96_PROOFS={'system_gate_run':34546959255,'current_application_quality_run':34546959190,'it_admin_runtime_proof_run':34546959188,'branch_hygiene_run':34546959296}
B96_PAGES=34547083100
B96_LIVE=34547157869
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']

def read(path):
    target=ROOT/path
    if not target.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return target.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:return json.loads(read(path) or '{}')
    except json.JSONDecodeError as exc:FAIL.append(f'invalid JSON {path}: {exc}');return{}
def req(ok,msg):
    if not ok:FAIL.append(msg)
def run(cmd,label):
    result=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip(): print(result.stdout.strip())
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3600:]}")
def compact(body): return re.sub(r'\s+','',body)

pointer=load('current-development-authority.json')
b96=load('release467-build96-product-browser-focus.json')
b97=load('release467-build97-product-readiness-work-queue.json')
manifest=load('migrations/canonical/manifest.json')
enhancements=read('public/js/admin-products-enhancements.js')
table_css=read('css/admin-products-table-layout.css')
middleware=read('functions/_middleware.js')
it_api=read('functions/api/admin/it-operations-control-tower.js')
it_client=read('public/js/admin-it-control-tower.js')
it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_97_PRODUCT_READINESS_WORK_QUEUE.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

# Restart authority must ingest the exact externally proven Build 96 closure.
req(pointer.get('release')==467 and pointer.get('build')==97,'current authority must be Release 467 Build 97')
req(pointer.get('title')=='Product Readiness Work Queue & Blocker Navigation','Build 97 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B96_SHA and pointer.get('accepted_dev_tree_sha')==B96_TREE,'Build 97 accepted Development SHA/tree must equal Build 96 closure')
req((pointer.get('acceptance') or {})==B96_PROOFS,'Build 97 accepted Development proof set must equal Build 96')
req(pointer.get('promotion_state')=='BUILD97_CANDIDATE_NOT_YET_VERIFIED','Build 97 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==96 and last.get('dev_sha')==B96_SHA and last.get('tree_sha')==B96_TREE and (last.get('proofs') or {})==B96_PROOFS,'Build 96 restart closure drifted')
req(cand.get('build')==97 and cand.get('authority')=='release467-build97-product-readiness-work-queue.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 97 closure-candidate pointer drifted')
req(prod.get('build')==96 and prod.get('main_sha')==B96_SHA and prod.get('tree_sha')==B96_TREE and prod.get('production_pages_deploy_run')==B96_PAGES and prod.get('production_live_resource_integrity_run')==B96_LIVE,'Build 96 Production baseline drifted')
for key in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):
    req(pointer.get(key) is False,f'unsafe pointer flag must remain false: {key}')

# Build 96 immutable closure and Build 97 candidate start.
req(b96.get('state')=='PRODUCTION_GREEN','Build 96 authority must retain Production GREEN')
f96=b96.get('final_closure') or {}; p96=b96.get('production_checkpoint') or {}
req(f96.get('dev_sha')==B96_SHA and f96.get('tree_sha')==B96_TREE and (f96.get('proofs') or {})==B96_PROOFS,'Build 96 final closure drifted')
req(f96.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and f96.get('ingested_by_build')==97,'Build 96 final closure must be exact and ingested by Build 97')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(f96.get(key) is True,f'Build 96 final closure missing {key}')
req(p96.get('main_sha')==B96_SHA and p96.get('tree_sha')==B96_TREE and p96.get('production_pages_deploy_run')==B96_PAGES and p96.get('production_live_resource_integrity_run')==B96_LIVE and p96.get('state')=='PRODUCTION_GREEN','Build 96 Production closure drifted')
req(b97.get('release')==467 and b97.get('build')==97 and b97.get('title')=='Product Readiness Work Queue & Blocker Navigation','Build 97 authority identity drifted')
req(b97.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 97 authority must remain closure candidate')
sd=(b97.get('starting_point') or {}).get('development') or {}; sp=(b97.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B96_SHA and sd.get('tree')==B96_TREE and sd.get('system_gate_run')==B96_PROOFS['system_gate_run'] and sd.get('quality_run')==B96_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B96_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B96_PROOFS['branch_hygiene_run'],'Build 97 Development starting point drifted')
req(sp.get('main_sha')==B96_SHA and sp.get('tree_sha')==B96_TREE and sp.get('production_pages_deploy_run')==B96_PAGES and sp.get('production_live_resource_integrity_run')==B96_LIVE,'Build 97 Production starting point drifted')
req(b97.get('final_closure') is None and b97.get('production_checkpoint') is None,'Build 97 must not contain premature final closure/Production proof')

# Build 97 readiness queue must be presentation-only and reuse the readiness already rendered by the primary Product loader.
for token in ("FOCUS_VALUES = ['all', 'attention', 'drafts', 'low_stock', 'missing_image', 'readiness_blocked', 'readiness_ready']",'readinessForRow','readinessQueueRows','renderReadinessQueue','Readiness work queue','data-product-focus-filter="readiness_blocked"','data-product-focus-filter="readiness_ready"','data-open-readiness-blocker','data-show-readiness-product','data-open-first-blocker','Open blocker','Show Product row','readiness_unknown'):
    req(token in enhancements,f'Build 97 readiness UI missing token: {token}')
req('/api/' not in enhancements and 'apiFetch(' not in enhancements and 'fetch(' not in enhancements,'Build 97 enhancement layer must not add Product/readiness API reads or writes')
req('existing.click()' in enhancements,'Build 97 Open blocker must delegate to the existing Product-row blocker action')
for token in ('product-readiness-work-queue','product-readiness-queue-item','product-readiness-queue-actions','product-table-focus-actions','.btn[aria-pressed="true"]','@media(max-width:720px)'):
    req(token in table_css,f'Build 97 readiness CSS missing: {token}')
req("PRODUCTS_ASSET_REVISION = '467-products-b97-readiness-queue'" in middleware,'Build 97 Product asset cache-buster missing')

scope=b97.get('scope') or {}; acceptance=b97.get('acceptance') or {}
for key in ('ingest_build96_final_closure','reuse_existing_product_readiness_preview','reuse_existing_rendered_readiness_projection','reuse_existing_first_blocker_action','prioritized_blocker_queue','first_blocker_corrective_navigation','blocked_readiness_focus','ready_readiness_focus','readiness_result_counts','current_product_context_preserved','build96_search_focus_preserved','build95_table_ergonomics_preserved','single_product_authority_preserved','one_h1_rule_unchanged'):
    req(scope.get(key) is True,f'Build 97 scope missing {key}')
for key in ('business_data_change','schema_change','additional_product_api_read','additional_readiness_api_read','automatic_provider_execution','provider_publication','automatic_production_promotion'):
    req(scope.get(key) is False,f'Build 97 unsafe scope drifted: {key}')
for key in ('readiness_data_reuses_primary_rendered_readiness','work_queue_orders_blocked_products_by_lowest_readiness_score','queue_shows_product_identity_score_and_first_blocker','queue_corrective_links_reuse_existing_product_blocker_action','blocked_and_ready_filters_are_operator_selected','readiness_filters_coexist_with_build96_text_search','readiness_unavailable_is_fail_soft_not_ready','no_product_or_readiness_api_call_added_to_enhancement_layer','queue_is_read_only_and_performs_no_product_mutation','build97_source_gate_required'):
    req(acceptance.get(key) is True,f'Build 97 acceptance missing {key}')

# Current operator projections use Build 97 over exact Build 96 closure.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B96_SHA in text and B96_TREE in text,f'{label} missing Build 96 verified SHA/tree')
    for value in B96_PROOFS.values(): req(str(value) in text,f'{label} missing Build 96 Development proof {value}')
    req(str(B96_PAGES) in text and str(B96_LIVE) in text,f'{label} missing Build 96 Production proof')
req('constBUILD=97;' in compact(it_api),'I.T. API must identify Build 97')
req('CURRENT_RELIABILITY_BUILD = 97' in reliability,'Reliability must identify Build 97')
req('constBUILD=97;' in compact(preflight),'Deployment Preflight must identify Build 97')
req('Release 467 Build 97' in it_client and 'Release 467 Build 97' in it_page,'I.T. current surfaces must identify Build 97')
req('Release 467 • Build 97' in reliability_page,'Reliability page must identify Build 97')
req('Release 467 Build 97' in preflight_page,'Deployment Preflight page must identify Build 97')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):
    req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must contain exactly one H1')
    req('current-responsive.css' in page,f'{label} page must explicitly load current responsive CSS')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B96_SHA,B96_TREE,str(B96_PROOFS['system_gate_run']),str(B96_PROOFS['current_application_quality_run']),str(B96_PROOFS['it_admin_runtime_proof_run']),str(B96_PROOFS['branch_hygiene_run']),str(B96_PAGES),str(B96_LIVE)):
        req(token in body,f'{path} missing Build 96 verified token: {token}')
    req('Build 97' in body and 'Product Readiness Work Queue' in body,f'{path} must identify Build 97 current candidate')
for token in ('Build 96','Readiness work queue','Readiness blocked','Ready','Open blocker','Show Product row','rendered','no second','0001','0004','Canada-only','U.S. sales/shipping'):
    req(token.lower() in doc.lower(),f'Build 97 operating document missing token: {token}')

req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 97 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 97 must remain schema-neutral')
req("run_current_contract('scripts/release467_build97_gate.py', 'Release 467 Build 97')" in provenance,'System Gate does not chain Build 97')
req("run_current_contract('scripts/release467_build96_gate.py', 'Release 467 Build 96')" not in provenance,'Current System Gate must supersede Build 96 current-surface gate with Build 97')

for path in ('functions/_middleware.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-products-enhancements.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_responsive_layout_gate.py'],'current responsive layout')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build94_gate.py'],'carried Build 94 historical boundary')

if FAIL:
    print('RELEASE 467 BUILD 97 PRODUCT READINESS WORK QUEUE & BLOCKER NAVIGATION: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 97 PRODUCT READINESS WORK QUEUE & BLOCKER NAVIGATION: PASS')
print('Build 96 final Development + Production closure: INGESTED')
print('Product readiness queue: BLOCKED LOWEST-SCORE-FIRST + EXISTING BLOCKER ACTION')
print('Readiness focus: BLOCKED + READY / UNKNOWN FAIL-SOFT')
print('Additional Product/readiness API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
