#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 94 — Product Workspace Readability & Responsive Navigation."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B93_SHA='be70b37f61574ec7a11bbad445ab30d0f280bbf3'
B93_TREE='a68a11663f02bfa496883220aa9d8940da4c3cbc'
B93_PROOFS={'system_gate_run':34513256032,'current_application_quality_run':34513256105,'it_admin_runtime_proof_run':34513256055,'branch_hygiene_run':34513256082}
B93_PAGES=34513466761
B93_LIVE=34513570740
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
    if result.stdout.strip():print(result.stdout.strip())
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3600:]}")
def compact(body):return re.sub(r'\s+','',body)

pointer=load('current-development-authority.json')
b93=load('release467-build93-centered-application-shell-overflow-accessibility.json')
b94=load('release467-build94-product-workspace-readability.json')
manifest=load('migrations/canonical/manifest.json')
css=read('css/current-responsive.css'); cssc=compact(css)
workspace=read('public/js/admin-product-workspaces.js')
it_api=read('functions/api/admin/it-operations-control-tower.js'); it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js'); reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js'); preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_94_PRODUCT_WORKSPACE_READABILITY.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

# Current restart authority must be Build 94 over the exact externally-proven Build 93 closure.
req(pointer.get('release')==467 and pointer.get('build')==94,'current authority must be Release 467 Build 94')
req(pointer.get('title')=='Product Workspace Readability & Responsive Navigation','Build 94 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B93_SHA and pointer.get('accepted_dev_tree_sha')==B93_TREE,'Build 94 accepted Development SHA/tree must equal Build 93 closure')
req((pointer.get('acceptance') or {})==B93_PROOFS,'Build 94 accepted Development proof set must equal Build 93')
req(pointer.get('promotion_state')=='BUILD94_CANDIDATE_NOT_YET_VERIFIED','Build 94 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==93 and last.get('dev_sha')==B93_SHA and last.get('tree_sha')==B93_TREE and (last.get('proofs') or {})==B93_PROOFS,'Build 93 restart closure drifted')
req(cand.get('build')==94 and cand.get('authority')=='release467-build94-product-workspace-readability.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 94 closure-candidate pointer drifted')
req(prod.get('build')==93 and prod.get('main_sha')==B93_SHA and prod.get('tree_sha')==B93_TREE and prod.get('production_pages_deploy_run')==B93_PAGES and prod.get('production_live_resource_integrity_run')==B93_LIVE,'Build 93 Production baseline drifted')
for key in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):
    req(pointer.get(key) is False,f'unsafe pointer flag must remain false: {key}')

# Build 93 must be immutable final closure, and Build 94 must start from it without self-proof.
req(b93.get('state')=='PRODUCTION_GREEN','Build 93 authority must retain Production GREEN')
f93=b93.get('final_closure') or {}; p93=b93.get('production_checkpoint') or {}
req(f93.get('dev_sha')==B93_SHA and f93.get('tree_sha')==B93_TREE and (f93.get('proofs') or {})==B93_PROOFS,'Build 93 final closure drifted')
req(f93.get('ingested_by_build')==94,'Build 93 final closure must be ingested by Build 94')
req(p93.get('main_sha')==B93_SHA and p93.get('tree_sha')==B93_TREE and p93.get('production_pages_deploy_run')==B93_PAGES and p93.get('production_live_resource_integrity_run')==B93_LIVE,'Build 93 Production closure drifted')
req(b94.get('release')==467 and b94.get('build')==94 and b94.get('title')=='Product Workspace Readability & Responsive Navigation','Build 94 authority identity drifted')
req(b94.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 94 authority must remain closure candidate')
sd=(b94.get('starting_point') or {}).get('development') or {}; sp=(b94.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B93_SHA and sd.get('tree')==B93_TREE and sd.get('system_gate_run')==B93_PROOFS['system_gate_run'] and sd.get('quality_run')==B93_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B93_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B93_PROOFS['branch_hygiene_run'],'Build 94 Development starting point drifted')
req(sp.get('main_sha')==B93_SHA and sp.get('tree_sha')==B93_TREE and sp.get('production_pages_deploy_run')==B93_PAGES and sp.get('production_live_resource_integrity_run')==B93_LIVE,'Build 94 Production starting point drifted')
req(b94.get('final_closure') is None and b94.get('production_checkpoint') is None,'Build 94 must not contain premature final closure/Production proof')

# Product workspace readability: labels own a full line, descriptions flow below, and columns reflow before squeezing.
for token in (
    'body[data-admin-page="products"].product-workspace-tabs',
    'grid-template-columns:repeat(3,minmax(0,1fr))!important',
    'body[data-admin-page="products"].product-workspace-tab',
    'flex-direction:column!important',
    'align-items:flex-start!important',
    'justify-content:flex-start!important',
    'body[data-admin-page="products"].product-workspace-tab>strong',
    'white-space:nowrap',
    'word-break:normal',
    'body[data-admin-page="products"].product-workspace-tab>.small',
    'grid-template-columns:repeat(2,minmax(0,1fr))!important',
    'grid-template-columns:minmax(0,1fr)!important',
):
    req(token in cssc,f'Build 94 responsive Product workspace CSS missing: {token}')
req('@media(min-width:721px)and(max-width:1050px)' in cssc,'Build 94 medium/tablet workspace breakpoint missing')
req('@media(max-width:720px)' in cssc,'Build 94 phone workspace breakpoint missing')

# The existing Build 66 behavior remains the authority: same six workspaces, URL routing, tab semantics and keyboard controls.
for token in ("{ id: 'products', label: 'Products'", "{ id: 'editor', label: 'Editor'", "{ id: 'inventory', label: 'Inventory Links'", "{ id: 'media', label: 'Media'", "{ id: 'seo', label: 'SEO / Publishing'", "{ id: 'cleanup', label: 'Cleanup / Archive'", "role', 'tab'", 'aria-selected', 'writeWorkspaceToUrl', "['ArrowLeft', 'ArrowRight', 'Home', 'End']", 'dd:product-workspace-changed'):
    req(token in workspace,f'Build 94 must preserve Product workspace behavior token: {token}')
req('fetch(' not in workspace and '.prepare(' not in workspace and '.exec(' not in workspace,'Product workspace organizer must remain presentation-only')

# Current operator surfaces use Build 94 over exact Build 93 closure.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B93_SHA in text and B93_TREE in text,f'{label} missing Build 93 verified SHA/tree')
    req(str(B93_PAGES) in text and str(B93_LIVE) in text,f'{label} missing Build 93 Production proof')
req('constBUILD=94;' in compact(it_api),'I.T. API must identify Build 94')
req('CURRENT_RELIABILITY_BUILD = 94' in reliability,'Reliability must identify Build 94')
req('constBUILD=94;' in compact(preflight),'Deployment Preflight must identify Build 94')
req('Release 467 Build 94' in it_client and 'Release 467 Build 94' in it_page,'I.T. current surfaces must identify Build 94')
req('Release 467 • Build 94' in reliability_page,'Reliability page must identify Build 94')
req('Release 467 Build 94' in preflight_page,'Deployment Preflight page must identify Build 94')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):
    req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must contain exactly one H1')
    req('current-responsive.css' in page,f'{label} page must explicitly load current responsive CSS')

scope=b94.get('scope') or {}; acceptance=b94.get('acceptance') or {}
for key in ('ingest_build93_final_closure','product_workspace_navigation_readability','workspace_labels_preserve_words','workspace_description_vertical_flow','desktop_three_column_layout','tablet_two_column_layout','phone_single_column_layout','active_workspace_state_visible','keyboard_tab_navigation_preserved','single_product_authority_preserved','build93_centered_shell_preserved','one_h1_rule_unchanged'):
    req(scope.get(key) is True,f'Build 94 scope missing {key}')
for key in ('business_data_change','schema_change','automatic_provider_execution','provider_publication','automatic_production_promotion'):
    req(scope.get(key) is False,f'Build 94 unsafe scope drifted: {key}')
for key in ('workspace_buttons_use_vertical_content_flow','workspace_primary_labels_do_not_fragment','workspace_descriptions_use_full_available_width','workspace_grid_reflows_before_text_becomes_unreadable','mobile_workspace_navigation_remains_fully_reachable','product_workspace_url_routing_preserved','arrow_home_end_keyboard_navigation_preserved','build94_source_gate_required'):
    req(acceptance.get(key) is True,f'Build 94 acceptance missing {key}')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B93_SHA,B93_TREE,str(B93_PROOFS['system_gate_run']),str(B93_PROOFS['current_application_quality_run']),str(B93_PROOFS['it_admin_runtime_proof_run']),str(B93_PROOFS['branch_hygiene_run']),str(B93_PAGES),str(B93_LIVE)):
        req(token in body,f'{path} missing Build 93 verified token: {token}')
    req('Build 94' in body and 'Product Workspace Readability' in body,f'{path} must identify Build 94 current candidate')
for token in ('Products','Editor','Inventory Links','vertical','three-column','two columns','single column','keyboard','Build 93','0001','0004','Canada-only','U.S. sales/shipping'):
    req(token.lower() in doc.lower(),f'Build 94 operating document missing token: {token}')

req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 94 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 94 must remain schema-neutral')
req("run_current_contract('scripts/release467_build94_gate.py', 'Release 467 Build 94')" in provenance,'System Gate does not chain Build 94')

for path in ('functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-product-workspaces.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_responsive_layout_gate.py'],'current responsive layout')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build93_gate.py'],'carried Build 93 boundary')

if FAIL:
    print('RELEASE 467 BUILD 94 PRODUCT WORKSPACE READABILITY & RESPONSIVE NAVIGATION: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 94 PRODUCT WORKSPACE READABILITY & RESPONSIVE NAVIGATION: PASS')
print('Workspace labels: WHOLE / FULL-WIDTH PRIMARY LINE')
print('Workspace descriptions: BELOW LABEL / FULL CARD WIDTH')
print('Responsive navigation: 3-COLUMN DESKTOP / 2-COLUMN TABLET / 1-COLUMN PHONE')
print('Single Product authority + keyboard/URL routing: PRESERVED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
