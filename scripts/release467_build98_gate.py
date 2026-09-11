#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 98 — Product Readiness Triage & Blocker Groups."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B97_SHA='eef3c48a287cc919b1f4d964e8b504d4611e671e'
B97_TREE='d2714d4e74fd7f85c9ca7efa0b63a366be1c4f63'
B97_PROOFS={'system_gate_run':34548442379,'current_application_quality_run':34548442377,'it_admin_runtime_proof_run':34548442359,'branch_hygiene_run':34548442374}
B97_PAGES=34548574039
B97_LIVE=34548646961
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
b97=load('release467-build97-product-readiness-work-queue.json')
b98=load('release467-build98-product-readiness-triage.json')
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
doc=read('docs/operations/RELEASE_467_BUILD_98_PRODUCT_READINESS_TRIAGE.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

# Restart authority must ingest the exact externally proven Build 97 closure.
req(pointer.get('release')==467 and pointer.get('build')==98,'current authority must be Release 467 Build 98')
req(pointer.get('title')=='Product Readiness Triage & Blocker Groups','Build 98 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B97_SHA and pointer.get('accepted_dev_tree_sha')==B97_TREE,'Build 98 accepted Development SHA/tree must equal Build 97 closure')
req((pointer.get('acceptance') or {})==B97_PROOFS,'Build 98 accepted Development proof set must equal Build 97')
req(pointer.get('promotion_state')=='BUILD98_CANDIDATE_NOT_YET_VERIFIED','Build 98 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==97 and last.get('dev_sha')==B97_SHA and last.get('tree_sha')==B97_TREE and (last.get('proofs') or {})==B97_PROOFS,'Build 97 restart closure drifted')
req(cand.get('build')==98 and cand.get('authority')=='release467-build98-product-readiness-triage.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 98 closure-candidate pointer drifted')
req(prod.get('build')==97 and prod.get('main_sha')==B97_SHA and prod.get('tree_sha')==B97_TREE and prod.get('production_pages_deploy_run')==B97_PAGES and prod.get('production_live_resource_integrity_run')==B97_LIVE,'Build 97 Production baseline drifted')
for key in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):
    req(pointer.get(key) is False,f'unsafe pointer flag must remain false: {key}')

# Build 97 immutable closure and Build 98 candidate start.
req(b97.get('state')=='PRODUCTION_GREEN','Build 97 authority must retain Production GREEN')
f97=b97.get('final_closure') or {}; p97=b97.get('production_checkpoint') or {}
req(f97.get('dev_sha')==B97_SHA and f97.get('tree_sha')==B97_TREE and (f97.get('proofs') or {})==B97_PROOFS,'Build 97 final closure drifted')
req(f97.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and f97.get('ingested_by_build')==98,'Build 97 final closure must be exact and ingested by Build 98')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(f97.get(key) is True,f'Build 97 final closure missing {key}')
req(p97.get('main_sha')==B97_SHA and p97.get('tree_sha')==B97_TREE and p97.get('production_pages_deploy_run')==B97_PAGES and p97.get('production_live_resource_integrity_run')==B97_LIVE and p97.get('state')=='PRODUCTION_GREEN','Build 97 Production closure drifted')
req(b98.get('release')==467 and b98.get('build')==98 and b98.get('title')=='Product Readiness Triage & Blocker Groups','Build 98 authority identity drifted')
req(b98.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 98 authority must remain closure candidate')
sd=(b98.get('starting_point') or {}).get('development') or {}; sp=(b98.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B97_SHA and sd.get('tree')==B97_TREE and sd.get('system_gate_run')==B97_PROOFS['system_gate_run'] and sd.get('quality_run')==B97_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B97_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B97_PROOFS['branch_hygiene_run'],'Build 98 Development starting point drifted')
req(sp.get('main_sha')==B97_SHA and sp.get('tree_sha')==B97_TREE and sp.get('production_pages_deploy_run')==B97_PAGES and sp.get('production_live_resource_integrity_run')==B97_LIVE,'Build 98 Production starting point drifted')
req(b98.get('final_closure') is None and b98.get('production_checkpoint') is None,'Build 98 must not contain premature final closure/Production proof')

# Build 98 triage must remain browser-local presentation over the existing rendered readiness authority.
for token in ("TRIAGE_KEY = 'dd_catalog_readiness_triage_v1'","TRIAGE_VALUES = ['all', 'media', 'seo', 'commerce', 'copy', 'other']",'blockerGroup','blockerGroupCounts','syncTriageControls','readinessQueueRows','data-readiness-triage="media"','data-readiness-triage="seo"','data-readiness-triage="commerce"','data-readiness-triage="copy"','data-readiness-triage="other"','catalogOpenNextReadinessBlocker','catalogShowNextReadinessProduct','openNextReadinessBlocker','showNextReadinessProduct','data-open-first-blocker','Open next blocker','Show next Product'):
    req(token in enhancements,f'Build 98 readiness triage missing token: {token}')
req('/api/' not in enhancements and 'apiFetch(' not in enhancements and 'fetch(' not in enhancements,'Build 98 enhancement layer must not add Product/readiness API reads or writes')
req('existing.click()' in enhancements,'Build 98 next-blocker navigation must delegate to the existing Product-row blocker action')
for token in ('product-readiness-triage','product-readiness-next-actions','product-readiness-work-queue','product-readiness-queue-item','.btn[aria-pressed="true"]','@media(max-width:720px)'):
    req(token in table_css,f'Build 98 readiness CSS missing: {token}')
req("PRODUCTS_ASSET_REVISION = '467-products-b98-readiness-triage'" in middleware,'Build 98 Product asset cache-buster missing')

scope=b98.get('scope') or {}; acceptance=b98.get('acceptance') or {}
for key in ('ingest_build97_final_closure','reuse_existing_rendered_readiness_projection','reuse_existing_first_blocker_action','blocker_group_classification','blocker_group_counts','browser_local_triage_filter','next_blocker_navigation','queue_lowest_score_priority_preserved','readiness_unknown_not_classified_ready','build97_queue_preserved','build96_search_focus_preserved','build95_current_product_context_preserved','build95_table_ergonomics_preserved','single_product_authority_preserved','one_h1_rule_unchanged'):
    req(scope.get(key) is True,f'Build 98 scope missing {key}')
for key in ('business_data_change','schema_change','additional_product_api_read','additional_readiness_api_read','automatic_provider_execution','provider_publication','automatic_production_promotion'):
    req(scope.get(key) is False,f'Build 98 unsafe scope drifted: {key}')
for key in ('triage_groups_include_media_seo_commerce_copy_other','classification_uses_existing_first_blocker_and_help_text','triage_filter_is_browser_local_and_persisted','queue_counts_show_all_blocked_groups','next_blocker_delegates_to_existing_product_blocker_action','show_next_product_reuses_explicit_row_location','blocked_queue_remains_lowest_readiness_score_first','no_product_or_readiness_api_call_added_to_enhancement_layer','triage_is_read_only_and_performs_no_product_mutation','build98_source_gate_required'):
    req(acceptance.get(key) is True,f'Build 98 acceptance missing {key}')

# Current operator projections use Build 98 over exact Build 97 closure.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B97_SHA in text and B97_TREE in text,f'{label} missing Build 97 verified SHA/tree')
    for value in B97_PROOFS.values(): req(str(value) in text,f'{label} missing Build 97 Development proof {value}')
    req(str(B97_PAGES) in text and str(B97_LIVE) in text,f'{label} missing Build 97 Production proof')
req('constBUILD=98;' in compact(it_api),'I.T. API must identify Build 98')
req('CURRENT_RELIABILITY_BUILD = 98' in reliability,'Reliability must identify Build 98')
req('constBUILD=98;' in compact(preflight),'Deployment Preflight must identify Build 98')
req('Release 467 Build 98' in it_client and 'Release 467 Build 98' in it_page,'I.T. current surfaces must identify Build 98')
req('Release 467 • Build 98' in reliability_page,'Reliability page must identify Build 98')
req('Release 467 Build 98' in preflight_page,'Deployment Preflight page must identify Build 98')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):
    req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must contain exactly one H1')
    req('current-responsive.css' in page,f'{label} page must explicitly load current responsive CSS')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B97_SHA,B97_TREE,str(B97_PROOFS['system_gate_run']),str(B97_PROOFS['current_application_quality_run']),str(B97_PROOFS['it_admin_runtime_proof_run']),str(B97_PROOFS['branch_hygiene_run']),str(B97_PAGES),str(B97_LIVE)):
        req(token in body,f'{path} missing Build 97 verified token: {token}')
    req('Build 98' in body and 'Product Readiness Triage' in body,f'{path} must identify Build 98 current candidate')
for token in ('Build 97','Media','SEO','Commerce','Copy / story','Other','Open next blocker','Show next Product','no Product/readiness API','0001','0004','Canada-only','U.S. sales/shipping'):
    req(token.lower() in doc.lower(),f'Build 98 operating document missing token: {token}')

req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 98 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 98 must remain schema-neutral')
req("run_current_contract('scripts/release467_build98_gate.py', 'Release 467 Build 98')" in provenance,'System Gate does not chain Build 98')
req("run_current_contract('scripts/release467_build97_gate.py', 'Release 467 Build 97')" not in provenance,'Current System Gate must supersede Build 97 current-surface gate with Build 98')

for path in ('functions/_middleware.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-products-enhancements.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_responsive_layout_gate.py'],'current responsive layout')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build94_gate.py'],'carried Build 94 historical boundary')

if FAIL:
    print('RELEASE 467 BUILD 98 PRODUCT READINESS TRIAGE & BLOCKER GROUPS: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 98 PRODUCT READINESS TRIAGE & BLOCKER GROUPS: PASS')
print('Build 97 final Development + Production closure: INGESTED')
print('Readiness triage: MEDIA + SEO + COMMERCE + COPY/STORY + OTHER')
print('Next blocker navigation: EXISTING PRODUCT BLOCKER ACTION')
print('Additional Product/readiness API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
