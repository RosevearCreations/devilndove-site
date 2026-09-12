#!/usr/bin/env python3
"""Release 467 Build 112 — Inventory & Material-Usage Reconciliation gate."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B111_SHA='a234b874b6e03442af96c0110d3cc22db074fe34'
B111_TREE='4e82696773761595e57bb69eb48c053f95060e2c'
B111_PROOFS={
 'system_gate_run':34669983965,
 'current_application_quality_run':34669983954,
 'it_admin_runtime_proof_run':34669983974,
 'branch_hygiene_run':34669983946,
}
B111_PAGES=34670059768
B111_LIVE=34670099134
EXPECTED_MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def run(command,label):
    result=subprocess.run(command,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip(): print(result.stdout.strip())
    if result.returncode != 0: FAIL.append(f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")
def node_check(path): run(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')

pointer=load('current-development-authority.json')
prior=load('release467-build111-orders-fulfilment-reconciliation.json')
current=load('release467-build112-inventory-material-usage-reconciliation.json')
manifest=load('migrations/canonical/manifest.json')
helper=read('functions/api/_lib/inventoryMaterialUsageReconciliation.js')
endpoint=read('functions/api/admin/inventory-material-usage-reconciliation.js')
client=read('public/js/admin-inventory-material-usage-reconciliation-v112.js')
page=read('admin/inventory-operations/index.html')
lifecycle=read('functions/api/_lib/inventoryLifecycle.js')
creative_post=read('functions/api/_lib/inventoryPostService.js')
product_production=read('functions/api/admin/product-production-release.js')
kit_service=read('functions/api/_lib/inventoryKitService.js')
it_api=read('functions/api/admin/it-operations-control-tower.js')
reliability=read('functions/api/_lib/currentReliability.js')
preflight=read('functions/api/admin/current-deployment-preflight.js')
provenance=read('scripts/current_system_gate_provenance_gate.py')
release_doc=read('docs/operations/RELEASE_467_BUILD_112_INVENTORY_MATERIAL_USAGE_RECONCILIATION.md')

req(pointer.get('release')==467 and pointer.get('build')==112,'current pointer must identify Release 467 Build 112')
req(pointer.get('title')=='Inventory & Material-Usage Reconciliation','Build 112 pointer title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B111_SHA and pointer.get('accepted_dev_tree_sha')==B111_TREE,'Build 112 accepted Development baseline must be exact Build 111')
req((pointer.get('acceptance') or {})==B111_PROOFS,'Build 112 inherited four-proof baseline must be exact Build 111')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}
req(last.get('build')==111 and last.get('dev_sha')==B111_SHA and last.get('tree_sha')==B111_TREE,'restart integrity must identify exact Build 111')
req((last.get('proofs') or {})==B111_PROOFS,'restart-integrity Build 111 proof set drifted')
candidate=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(candidate.get('build')==112 and candidate.get('authority')=='release467-build112-inventory-material-usage-reconciliation.json','Build 112 closure candidate authority drifted')
prod=pointer.get('production_checkpoint') or {}
req(prod.get('build')==111 and prod.get('main_sha')==B111_SHA and prod.get('tree_sha')==B111_TREE,'Build 112 Production baseline must be exact Build 111')
req(prod.get('production_pages_deploy_run')==B111_PAGES and prod.get('production_live_resource_integrity_run')==B111_LIVE,'Build 111 Production proof IDs drifted')

req(prior.get('state')=='PRODUCTION_GREEN','Build 111 authority must be ingested as Production GREEN by Build 112')
closure=prior.get('final_closure') or {}
req(closure.get('dev_sha')==B111_SHA and closure.get('tree_sha')==B111_TREE,'Build 111 final closure SHA/tree mismatch')
req((closure.get('proofs') or {})==B111_PROOFS,'Build 111 final Development proofs mismatch')
req(closure.get('ingested_by_build')==112,'Build 111 closure must be explicitly ingested by Build 112')
req('not self-recorded by Build 111' in str(closure.get('recorded_by') or ''),'Build 111 closure ingestion must preserve non-self-recording provenance')
prior_prod=prior.get('production_checkpoint') or {}
req(prior_prod.get('main_sha')==B111_SHA and prior_prod.get('tree_sha')==B111_TREE and prior_prod.get('production_pages_deploy_run')==B111_PAGES and prior_prod.get('production_live_resource_integrity_run')==B111_LIVE,'Build 111 Production closure mismatch')

req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 112 authority must remain a closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 112 candidate must not self-claim later workflow proof')
start=(current.get('starting_point') or {}).get('development') or {}
req(start.get('sha')==B111_SHA and start.get('tree')==B111_TREE,'Build 112 starting Development SHA/tree must be exact Build 111')
req(start.get('system_gate_run')==B111_PROOFS['system_gate_run'] and start.get('quality_run')==B111_PROOFS['current_application_quality_run'] and start.get('it_admin_runtime_run')==B111_PROOFS['it_admin_runtime_proof_run'] and start.get('repository_hygiene_run')==B111_PROOFS['branch_hygiene_run'],'Build 112 starting proof values drifted')

for token in (
 'INVENTORY_MATERIAL_RECONCILIATION_STATES','reservation_ledger_drift','planned_product_shortage',
 'creative_consumed_without_post','creative_reusable_stock_depletion','product_reusable_stock_depletion',
 'kit_component_unlinked','current_cost_authority_missing','current_component_balance_is_aggregate_not_origin_attribution',
 "current_cost_owner:'site_item_inventory.unit_cost_cents'","synthetic_stock_movement:false",
 "inventory_mutation:false","product_mutation:false","creative_mutation:false","finance_posting:false",
):
    req(token in helper,f'Build 112 pure reconciliation helper missing token: {token}')
for forbidden in (r'\bfetch\s*\(',r'\bdb\.',r'\blocalStorage\.',r'\bsessionStorage\.',r'\bsetInterval\s*\('):
    req(not re.search(forbidden,helper),f'Build 112 pure helper gained forbidden behavior: {forbidden}')

for token in (
 "buildInventoryMaterialUsageReconciliation",'site_item_inventory','site_inventory_movements','product_resource_links',
 'product_production_run_materials','creative_project_material_reviews','creative_project_inventory_posts',
 'inventory_kit_open_events','inventory_kit_open_components',
 "role:'read_only_inventory_material_usage_reconciliation'","synthetic_stock_movement:false","new_inventory_mutation:false",
):
    req(token in endpoint,f'Build 112 endpoint missing token: {token}')
req('onRequestPost' not in endpoint,'Build 112 reconciliation endpoint must expose no POST handler')
for forbidden in ('UPDATE ','INSERT ','DELETE ','CREATE TABLE','ALTER TABLE','DROP TABLE'):
    req(forbidden not in endpoint.upper(),f'Build 112 endpoint contains forbidden DML/DDL token: {forbidden}')
req(endpoint.count('.prepare(`') <= 8,'Build 112 endpoint must retain bounded read-query count')

for token in ('/api/admin/inventory-material-usage-reconciliation?limit=500','data-build112-inventory-material-reconciliation','Refresh evidence','aggregate, not origin-attributed','Safety boundary'):
    req(token in client,f'Build 112 UI missing token: {token}')
for forbidden in ("method:'POST'",'setInterval(','localStorage','sessionStorage'):
    req(forbidden not in client,f'Build 112 UI gained forbidden action: {forbidden}')

req('inventoryMaterialUsageReconciliationMount' in page,'Inventory Operations must mount Build 112 reconciliation')
req('admin-inventory-material-usage-reconciliation-v112.js?v=467b112' in page,'Inventory Operations missing Build 112 client')
req('admin-inventory-material-usage-reconciliation.css?v=467b112' in page,'Inventory Operations missing Build 112 CSS')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Inventory Operations must retain exactly one H1')

for body,label,tokens in (
 (lifecycle,'Build 71 Inventory lifecycle',('applyProductResourceReservationLifecycle',"'reserve'","'release'",'site_inventory_movements')),
 (creative_post,'Build 309 Creative posting',('postCreativeInventoryUsage','creative_project_inventory_posts','site_inventory_movements')),
 (product_production,'Build 440 Product production',('product_production_runs','product_production_run_materials','site_inventory_movements')),
 (kit_service,'Build 440 kit service',('openInventoryKit','inventory_kit_open_events','inventory_kit_open_components','site_inventory_movements')),
):
    for token in tokens: req(token in body,f'{label} authority token drifted: {token}')

for body,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req('Build 112' in body or 'build:112' in re.sub(r'\s+','',body),f'{label} must identify Build 112')
    req(B111_SHA in body and B111_TREE in body and str(B111_PAGES) in body and str(B111_LIVE) in body,f'{label} must retain exact Build 111 six-proof baseline')
    for run in B111_PROOFS.values(): req(str(run) in body,f'{label} missing Build 111 proof {run}')
for value in (B111_SHA,B111_TREE,*map(str,B111_PROOFS.values()),str(B111_PAGES),str(B111_LIVE)):
    req(value in release_doc,f'Build 112 release document missing Build 111 closure evidence: {value}')

manifest_files=[str(row.get('file') or '') for row in (manifest.get('migrations') or []) if isinstance(row,dict)]
req(manifest_files==EXPECTED_MIGRATIONS,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 112 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build112_gate.py', 'Release 467 Build 112')" in provenance,'active System Gate provenance must call Build 112')
req("release467_build111_gate.py', 'Release 467 Build 111'" not in provenance,'active System Gate provenance must no longer call Build 111 as current')

for path in (
 'functions/api/_lib/inventoryMaterialUsageReconciliation.js',
 'functions/api/admin/inventory-material-usage-reconciliation.js',
 'public/js/admin-inventory-material-usage-reconciliation-v112.js',
 'functions/api/admin/it-operations-control-tower.js',
 'functions/api/_lib/currentReliability.js',
 'functions/api/admin/current-deployment-preflight.js',
 'public/js/admin-it-control-tower.js',
): node_check(path)
run(['node','scripts/release467_build112_inventory_material_usage_reconciliation_test.mjs'],'Build 112 reconciliation runtime proof')
for path,label in (
 ('scripts/current_authority_restart_integrity_gate.py','restart integrity'),
 ('scripts/current_it_release_truth_gate.py','I.T. truth'),
 ('scripts/current_reliability_truth_gate.py','Reliability truth'),
 ('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth'),
): run([sys.executable,path],label)

if FAIL:
    print('RELEASE 467 BUILD 112 GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 112 GATE: PASS')
print('Build 111 six-proof closure: INGESTED BY BUILD 112')
print('Inventory/Product/Creative/Kit mutation owners: PRESERVED')
print('Inventory & Material-Usage reconciliation: READ-ONLY / FAIL-CLOSED')
print('Synthetic stock movement or reservation attribution: ZERO')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
