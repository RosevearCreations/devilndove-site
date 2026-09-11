#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 95 — Product Workspace Current Context & Table Ergonomics."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B94_SHA='bcafa7bbfbf17793d4b6280195c44c435ff3c68e'
B94_TREE='f83d850b2b28ef4840463439a8b449ebbe1b9a43'
B94_PROOFS={'system_gate_run':34537169571,'current_application_quality_run':34537169401,'it_admin_runtime_proof_run':34537169400,'branch_hygiene_run':34537169580}
B94_PAGES=34537326802
B94_LIVE=34537397229
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
b94=load('release467-build94-product-workspace-readability.json')
b95=load('release467-build95-product-workspace-current-context.json')
manifest=load('migrations/canonical/manifest.json')
workspace=read('public/js/admin-product-workspaces.js')
enhancements=read('public/js/admin-products-enhancements.js')
table_css=read('css/admin-products-table-layout.css')
admin=read('public/js/admin.js')
middleware=read('functions/_middleware.js')
it_api=read('functions/api/admin/it-operations-control-tower.js')
it_client=read('public/js/admin-it-control-tower.js')
it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_95_PRODUCT_WORKSPACE_CURRENT_CONTEXT.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

# Restart authority: Build 95 candidate over exact externally proven Build 94 closure.
req(pointer.get('release')==467 and pointer.get('build')==95,'current authority must be Release 467 Build 95')
req(pointer.get('title')=='Product Workspace Current Context & Table Ergonomics','Build 95 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B94_SHA and pointer.get('accepted_dev_tree_sha')==B94_TREE,'Build 95 accepted Development SHA/tree must equal Build 94 closure')
req((pointer.get('acceptance') or {})==B94_PROOFS,'Build 95 accepted Development proof set must equal Build 94')
req(pointer.get('promotion_state')=='BUILD95_CANDIDATE_NOT_YET_VERIFIED','Build 95 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==94 and last.get('dev_sha')==B94_SHA and last.get('tree_sha')==B94_TREE and (last.get('proofs') or {})==B94_PROOFS,'Build 94 restart closure drifted')
req(cand.get('build')==95 and cand.get('authority')=='release467-build95-product-workspace-current-context.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 95 closure-candidate pointer drifted')
req(prod.get('build')==94 and prod.get('main_sha')==B94_SHA and prod.get('tree_sha')==B94_TREE and prod.get('production_pages_deploy_run')==B94_PAGES and prod.get('production_live_resource_integrity_run')==B94_LIVE,'Build 94 Production baseline drifted')
for key in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):
    req(pointer.get(key) is False,f'unsafe pointer flag must remain false: {key}')

# Build 94 immutable closure and Build 95 candidate starting point.
req(b94.get('state')=='PRODUCTION_GREEN','Build 94 authority must retain Production GREEN')
f94=b94.get('final_closure') or {}; p94=b94.get('production_checkpoint') or {}
req(f94.get('dev_sha')==B94_SHA and f94.get('tree_sha')==B94_TREE and (f94.get('proofs') or {})==B94_PROOFS,'Build 94 final closure drifted')
req(f94.get('ingested_by_build')==95,'Build 94 final closure must be ingested by Build 95')
req(p94.get('main_sha')==B94_SHA and p94.get('tree_sha')==B94_TREE and p94.get('production_pages_deploy_run')==B94_PAGES and p94.get('production_live_resource_integrity_run')==B94_LIVE,'Build 94 Production closure drifted')
req(b95.get('release')==467 and b95.get('build')==95 and b95.get('title')=='Product Workspace Current Context & Table Ergonomics','Build 95 authority identity drifted')
req(b95.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 95 authority must remain closure candidate')
sd=(b95.get('starting_point') or {}).get('development') or {}; sp=(b95.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B94_SHA and sd.get('tree')==B94_TREE and sd.get('system_gate_run')==B94_PROOFS['system_gate_run'] and sd.get('quality_run')==B94_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B94_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B94_PROOFS['branch_hygiene_run'],'Build 95 Development starting point drifted')
req(sp.get('main_sha')==B94_SHA and sp.get('tree_sha')==B94_TREE and sp.get('production_pages_deploy_run')==B94_PAGES and sp.get('production_live_resource_integrity_run')==B94_LIVE,'Build 95 Production starting point drifted')
req(b95.get('final_closure') is None and b95.get('production_checkpoint') is None,'Build 95 must not contain premature final closure/Production proof')

# Current Product workspace identity and retained behavior.
for token in ("const BUILD = 95","R467B95_V1","Release ${RELEASE} Build ${BUILD}","No Product is selected yet","data-product-workspace-tab","role=\"tablist\"","setAttribute('role', 'tab')","setAttribute('role', 'tabpanel')","writeWorkspaceToUrl","['ArrowLeft', 'ArrowRight', 'Home', 'End']","dd:product-workspace-changed","window.DDProductWorkspaces"):
    req(token in workspace,f'Build 95 Product workspace missing token: {token}')
req('Release 467 Build 66' not in workspace,'current Product workspace must not expose stale Build 66 label')
for workspace_id in ('products','editor','inventory','media','seo','cleanup'):
    req(f"id: '{workspace_id}'" in workspace,f'Build 95 Product workspace missing {workspace_id}')
workspace_lower=workspace.lower()
for forbidden in ('/api/','apifetch(','fetch(','.prepare(','.exec(','stripe.com','paypal.com'):
    req(forbidden not in workspace_lower,f'Product workspace organizer gained forbidden authority: {forbidden}')

# Table context/presets remain presentation-only and reuse the existing Product snapshot.
for token in ("PREF_KEY = 'dd_catalog_table_prefs_v1'","SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2'","Essential columns","Full columns","Locate current Product","data-current-product-row","currentProductId","scrollIntoView","dd:product-editor-target"):
    req(token in enhancements,f'Build 95 Product table enhancement missing: {token}')
req('/api/' not in enhancements and 'apiFetch(' not in enhancements and 'fetch(' not in enhancements,'Build 95 Product table enhancements must not add Product/API reads or writes')
for token in ('width:1608px!important','min-width:1608px!important','position:sticky','top:0','left:0','left:72px','data-current-product-row="1"','@media(min-width:1000px)'):
    req(token in compact(table_css),f'Build 95 Product table CSS missing: {token}')
req("PRODUCTS_ASSET_REVISION = '467-products-b95-context'" in middleware,'Build 95 Product cache-buster missing')
req("admin-product-workspaces.js?v=95" in admin,'Build 95 admin loader must request current Product workspace bundle')

# Current operator projections use Build 95 over exact Build 94 closure.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B94_SHA in text and B94_TREE in text,f'{label} missing Build 94 verified SHA/tree')
    req(str(B94_PAGES) in text and str(B94_LIVE) in text,f'{label} missing Build 94 Production proof')
req('constBUILD=95;' in compact(it_api),'I.T. API must identify Build 95')
req('CURRENT_RELIABILITY_BUILD = 95' in reliability,'Reliability must identify Build 95')
req('constBUILD=95;' in compact(preflight),'Deployment Preflight must identify Build 95')
req('Release 467 Build 95' in it_client and 'Release 467 Build 95' in it_page,'I.T. current surfaces must identify Build 95')
req('Release 467 • Build 95' in reliability_page,'Reliability page must identify Build 95')
req('Release 467 Build 95' in preflight_page,'Deployment Preflight page must identify Build 95')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):
    req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must contain exactly one H1')
    req('current-responsive.css' in page,f'{label} page must explicitly load current responsive CSS')

scope=b95.get('scope') or {}; acceptance=b95.get('acceptance') or {}
for key in ('ingest_build94_final_closure','current_product_workspace_identity','remove_stale_build66_operator_label','table_sticky_header','table_sticky_identity_columns_desktop','selected_product_row_context','locate_current_product_control','essential_columns_preset','full_columns_preset','existing_column_preferences_preserved','product_workspace_url_routing_preserved','keyboard_tab_navigation_preserved','single_product_authority_preserved','build94_navigation_readability_preserved','one_h1_rule_unchanged'):
    req(scope.get(key) is True,f'Build 95 scope missing {key}')
for key in ('business_data_change','schema_change','automatic_provider_execution','provider_publication','automatic_production_promotion'):
    req(scope.get(key) is False,f'Build 95 unsafe scope drifted: {key}')
for key in ('operator_surface_identifies_build95','table_header_remains_visible_during_vertical_scroll','system_number_and_name_remain_visible_during_desktop_horizontal_scroll','current_editor_product_is_visually_identifiable_in_table','locate_current_product_is_manual_only','essential_columns_preset_hides_secondary_columns_only','full_columns_preset_restores_all_optional_columns','column_preferences_remain_browser_local','no_additional_product_api_read_for_table_dashboard','build95_source_gate_required'):
    req(acceptance.get(key) is True,f'Build 95 acceptance missing {key}')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B94_SHA,B94_TREE,str(B94_PROOFS['system_gate_run']),str(B94_PROOFS['current_application_quality_run']),str(B94_PROOFS['it_admin_runtime_proof_run']),str(B94_PROOFS['branch_hygiene_run']),str(B94_PAGES),str(B94_LIVE)):
        req(token in body,f'{path} missing Build 94 verified token: {token}')
    req('Build 95' in body and 'Product Workspace Current Context' in body,f'{path} must identify Build 95 current candidate')
for token in ('Build 94','Build 66','Current Product','sticky','System #','Name','Locate current Product','Essential columns','Full columns','browser-local','no additional Product API','0001','0004','Canada-only','U.S. sales/shipping'):
    req(token.lower() in doc.lower(),f'Build 95 operating document missing token: {token}')

req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 95 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 95 must remain schema-neutral')
req("run_current_contract('scripts/release467_build95_gate.py', 'Release 467 Build 95')" in provenance,'System Gate does not chain Build 95')

for path in ('functions/_middleware.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-product-workspaces.js','public/js/admin-products-enhancements.js','public/js/admin.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_responsive_layout_gate.py'],'current responsive layout')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build94_gate.py'],'carried Build 94 boundary')

if FAIL:
    print('RELEASE 467 BUILD 95 PRODUCT WORKSPACE CURRENT CONTEXT & TABLE ERGONOMICS: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 95 PRODUCT WORKSPACE CURRENT CONTEXT & TABLE ERGONOMICS: PASS')
print('Current Product context: VISIBLE / SHARED')
print('Product records table: STICKY HEADER + DESKTOP IDENTITY COLUMNS + CURRENT ROW')
print('Table views: ESSENTIAL + FULL + BROWSER-LOCAL FINE TUNING')
print('Additional Product API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
