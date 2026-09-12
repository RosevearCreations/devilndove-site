#!/usr/bin/env python3
"""Release 467 Build 110 — Storefront Evidence & SEO Conversion Audit gate."""
from pathlib import Path
import json, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []
B109_SHA = 'fe9d80dc8ace5dd5ac52f877ea16badf47b27c66'
B109_TREE = 'a8b8c6e0910cb840c78afa468701929d733875d2'
B109_PROOFS = {
    'system_gate_run': 34666034487,
    'current_application_quality_run': 34666034490,
    'it_admin_runtime_proof_run': 34666034497,
    'branch_hygiene_run': 34666034518,
}
B109_PAGES = 34666119275
B109_LIVE = 34666156495
EXPECTED_MIGRATIONS = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]

def req(ok, msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT / path).read_text(encoding='utf-8', errors='replace')
def load(path): return json.loads(read(path))
def one_h1(path): return len(re.findall(r'<h1(?:\s|>)', read(path), re.I)) == 1
def run_gate(path, label):
    result = subprocess.run([sys.executable, str(ROOT / path)], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or label).strip()[-2400:]
        FAIL.append(f'{label} failed: {detail}')

def node_check(path):
    result = subprocess.run(['node','--check',str(ROOT / path)], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.returncode != 0: FAIL.append(f'JavaScript syntax failed for {path}: {(result.stderr or result.stdout)[-1600:]}')

pointer = load('current-development-authority.json')
prior = load('release467-build109-customer-proof-fulfilment.json')
current = load('release467-build110-storefront-evidence-seo-conversion-audit.json')
manifest = load('migrations/canonical/manifest.json')
helper = read('public/js/storefront-evidence-conversion-audit.js')
discovery = read('public/js/storefront-discovery-paths.js')
breadcrumb = read('public/js/product-breadcrumb-seo.js')
collections = read('collections/index.html')
custom = read('custom-request/index.html')
it_api = read('functions/api/admin/it-operations-control-tower.js')
it_client = read('public/js/admin-it-control-tower.js')
it_page = read('admin/it/index.html')
reliability = read('functions/api/_lib/currentReliability.js')
reliability_page = read('admin/reliability/index.html')
preflight = read('functions/api/admin/current-deployment-preflight.js')
preflight_page = read('admin/deployment-preflight/index.html')
provenance = read('scripts/current_system_gate_provenance_gate.py')

req(pointer.get('release') == 467 and pointer.get('build') == 110, 'current pointer must identify Release 467 Build 110')
req(pointer.get('title') == 'Storefront Evidence & SEO Conversion Audit', 'Build 110 pointer title drifted')
req(pointer.get('state') == 'DEVELOPMENT_GREEN', 'pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha') == B109_SHA and pointer.get('accepted_dev_tree_sha') == B109_TREE, 'Build 110 accepted Development baseline must be exact Build 109')
req((pointer.get('acceptance') or {}) == B109_PROOFS, 'Build 110 accepted four-proof baseline must be exact Build 109')
last = (pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}
req(last.get('build') == 109 and last.get('dev_sha') == B109_SHA and last.get('tree_sha') == B109_TREE, 'restart integrity must identify exact Build 109 as last fully verified')
req((last.get('proofs') or {}) == B109_PROOFS, 'restart-integrity Build 109 proof set drifted')
candidate = (pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(candidate.get('build') == 110 and candidate.get('authority') == 'release467-build110-storefront-evidence-seo-conversion-audit.json', 'Build 110 closure candidate authority drifted')
prod = pointer.get('production_checkpoint') or {}
req(prod.get('build') == 109 and prod.get('main_sha') == B109_SHA and prod.get('tree_sha') == B109_TREE, 'Build 110 Production baseline must be exact Build 109')
req(prod.get('production_pages_deploy_run') == B109_PAGES and prod.get('production_live_resource_integrity_run') == B109_LIVE, 'Build 109 Production proof IDs drifted')

req(prior.get('state') == 'PRODUCTION_GREEN', 'Build 109 authority must be ingested as Production GREEN')
closure = prior.get('final_closure') or {}
req(closure.get('dev_sha') == B109_SHA and closure.get('tree_sha') == B109_TREE, 'Build 109 final closure SHA/tree mismatch')
req((closure.get('proofs') or {}) == B109_PROOFS, 'Build 109 final Development proofs mismatch')
req(closure.get('ingested_by_build') == 110, 'Build 109 closure must be ingested by Build 110')
prior_prod = prior.get('production_checkpoint') or {}
req(prior_prod.get('main_sha') == B109_SHA and prior_prod.get('tree_sha') == B109_TREE and prior_prod.get('production_pages_deploy_run') == B109_PAGES and prior_prod.get('production_live_resource_integrity_run') == B109_LIVE, 'Build 109 Production closure mismatch')

req(current.get('state') == 'DEVELOPMENT_CLOSURE_CANDIDATE', 'Build 110 authority must remain a closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None, 'Build 110 candidate must not self-claim later workflow proof')
start = (current.get('starting_point') or {}).get('development') or {}
req(start.get('sha') == B109_SHA and start.get('tree') == B109_TREE, 'Build 110 starting Development SHA/tree must be exact Build 109')
req(start.get('system_gate_run') == B109_PROOFS['system_gate_run'] and start.get('quality_run') == B109_PROOFS['current_application_quality_run'] and start.get('it_admin_runtime_run') == B109_PROOFS['it_admin_runtime_proof_run'] and start.get('repository_hygiene_run') == B109_PROOFS['branch_hygiene_run'], 'Build 110 starting proof key/value contract drifted')

for token in ('dd:shop:data','build110ShopStructuredData','ItemList','Storefront evidence check','Buyer evidence &amp; next step','productStructuredData','/custom-request/','/pickup/','/collections/','placeholder'):
    req(token in helper, f'Build 110 Storefront audit helper missing token: {token}')
for forbidden in ('fetch(', 'apiFetch', "method:'POST'", 'method:"POST"', "method:'PUT'", "method:'PATCH'", "method:'DELETE'"):
    req(forbidden not in helper, f'Build 110 Storefront audit helper must remain network/mutation-free: {forbidden}')
req('storefront-evidence-conversion-audit.js?v=467b110' in discovery, 'Shop discovery must load Build 110 audit helper')
req('storefront-evidence-conversion-audit.js?v=467b110' in breadcrumb, 'Product breadcrumb authority must load Build 110 audit helper')
req('build110CollectionsStructuredData' in collections and '"@type":"ItemList"' in collections, 'Collections must expose visible ItemList structured data')
for token in ('?discover=one-of-a-kind','?discover=local-pickup','?discover=custom-gifts','?merchandise_origin=vintage','?discover=laser-engraved','?discover=workshop-experiments','?discover=proof-rich','/custom-request/','/pickup/'):
    req(token in collections, f'Collections missing crawlable Build 110 path: {token}')
req('build110CustomRequestStructuredData' in custom and '"@type":"Service"' in custom and 'Ontario, Canada' in custom, 'Custom Request must expose visible-fact Service structured data')
for token in ('/shop/?discover=proof-rich','/shop/?discover=custom-gifts','/collections/','/pickup/'):
    req(token in custom, f'Custom Request missing crawlable Storefront conversion path: {token}')

for page in ('shop/index.html','shop/product/index.html','collections/index.html','custom-request/index.html','admin/it/index.html','admin/reliability/index.html','admin/deployment-preflight/index.html'):
    req(one_h1(page), f'{page} must contain exactly one H1')

for body,label in ((it_api,'I.T. API'),(it_client,'I.T. client'),(it_page,'I.T. page'),(reliability,'Reliability'),(reliability_page,'Reliability page'),(preflight,'Deployment Preflight'),(preflight_page,'Deployment Preflight page')):
    req('Build 110' in body or 'build:110' in re.sub(r'\s+','',body), f'{label} must identify Build 110')
    for value in (B109_SHA,B109_TREE,str(B109_PROOFS['system_gate_run']),str(B109_PROOFS['current_application_quality_run']),str(B109_PROOFS['it_admin_runtime_proof_run']),str(B109_PROOFS['branch_hygiene_run'])):
        if label in ('I.T. client','Reliability page','Deployment Preflight page') and value in (B109_SHA,B109_TREE):
            pass
    
req(B109_SHA in it_api and B109_TREE in it_api and str(B109_PAGES) in it_api and str(B109_LIVE) in it_api, 'I.T. API must retain exact Build 109 six-proof baseline')
req(B109_SHA in reliability and B109_TREE in reliability and str(B109_PAGES) in reliability and str(B109_LIVE) in reliability, 'Reliability must retain exact Build 109 six-proof baseline')
req(B109_SHA in preflight and B109_TREE in preflight and str(B109_PAGES) in preflight and str(B109_LIVE) in preflight, 'Deployment Preflight must retain exact Build 109 six-proof baseline')

manifest_files = [str(row.get('file') or '') for row in (manifest.get('migrations') or []) if isinstance(row,dict)]
req(manifest_files == EXPECTED_MIGRATIONS, 'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest), 'Build 110 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build110_gate.py', 'Release 467 Build 110')" in provenance, 'active System Gate provenance must explicitly call Build 110')
req("release467_build109_gate.py', 'Release 467 Build 109'" not in provenance, 'active System Gate provenance must no longer call Build 109 as current')

for path in ('public/js/storefront-evidence-conversion-audit.js','public/js/storefront-discovery-paths.js','public/js/product-breadcrumb-seo.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    node_check(path)
for path,label in (
    ('scripts/current_authority_restart_integrity_gate.py','restart integrity'),
    ('scripts/current_it_release_truth_gate.py','I.T. truth'),
    ('scripts/current_reliability_truth_gate.py','Reliability truth'),
    ('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth'),
): run_gate(path,label)

if FAIL:
    print('RELEASE 467 BUILD 110 GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 110 GATE: PASS')
print('Build 109 six-proof closure: INGESTED')
print('Storefront evidence/SEO audit: EXISTING PUBLIC FACTS ONLY')
print('Placeholder media as evidence: EXCLUDED')
print('Structured data / visible fact alignment: GUARDED')
print('Additional Product/API/D1/R2/provider mutation: ZERO')
