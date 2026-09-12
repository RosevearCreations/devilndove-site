#!/usr/bin/env python3
"""Release 467 Build 111 — Orders-to-Fulfilment Reconciliation gate."""
from pathlib import Path
import json, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []
B110_SHA = 'a881a7d6c6f38a297511b0446e780c9f28574c9d'
B110_TREE = 'f92ba677efc109b1748f6892044e3f3c06500315'
B110_PROOFS = {
    'system_gate_run': 34667564542,
    'current_application_quality_run': 34667564497,
    'it_admin_runtime_proof_run': 34667564555,
    'branch_hygiene_run': 34667564565,
}
B110_PAGES = 34669029532
B110_LIVE = 34669069642
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
def run(command, label):
    result = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.stdout.strip(): print(result.stdout.strip())
    if result.returncode != 0:
        FAIL.append(f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")
def node_check(path): run(['node','--check',str(ROOT / path)], f'JavaScript syntax {path}')

pointer = load('current-development-authority.json')
prior = load('release467-build110-storefront-evidence-seo-conversion-audit.json')
current = load('release467-build111-orders-fulfilment-reconciliation.json')
manifest = load('migrations/canonical/manifest.json')
helper = read('functions/api/_lib/orderFulfillmentReconciliation.js')
endpoint = read('functions/api/admin/order-fulfillment-reconciliation.js')
client = read('public/js/admin-order-fulfillment-reconciliation-v111.js')
page = read('admin/order-fulfillment-care/index.html')
b82_helper = read('functions/api/_lib/orderFulfillmentWorkflow.js')
b82_contract = read('functions/api/admin/contracts/operations-order-fulfillment-workflow-write.js')
it_api = read('functions/api/admin/it-operations-control-tower.js')
reliability = read('functions/api/_lib/currentReliability.js')
preflight = read('functions/api/admin/current-deployment-preflight.js')
provenance = read('scripts/current_system_gate_provenance_gate.py')
release_doc = read('docs/operations/RELEASE_467_BUILD_111_ORDERS_FULFILMENT_RECONCILIATION.md')

req(pointer.get('release') == 467 and pointer.get('build') == 111, 'current pointer must identify Release 467 Build 111')
req(pointer.get('title') == 'Orders-to-Fulfilment Reconciliation', 'Build 111 pointer title drifted')
req(pointer.get('state') == 'DEVELOPMENT_GREEN', 'pointer must retain last externally verified Development GREEN state while candidate is tested')
req(pointer.get('accepted_dev_sha') == B110_SHA and pointer.get('accepted_dev_tree_sha') == B110_TREE, 'Build 111 accepted Development baseline must be exact Build 110')
req((pointer.get('acceptance') or {}) == B110_PROOFS, 'Build 111 accepted four-proof baseline must be exact Build 110')
last = (pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}
req(last.get('build') == 110 and last.get('dev_sha') == B110_SHA and last.get('tree_sha') == B110_TREE, 'restart integrity must identify exact Build 110 as last fully verified')
req((last.get('proofs') or {}) == B110_PROOFS, 'restart-integrity Build 110 proof set drifted')
candidate = (pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(candidate.get('build') == 111 and candidate.get('authority') == 'release467-build111-orders-fulfilment-reconciliation.json', 'Build 111 closure candidate authority drifted')
prod = pointer.get('production_checkpoint') or {}
req(prod.get('build') == 110 and prod.get('main_sha') == B110_SHA and prod.get('tree_sha') == B110_TREE, 'Build 111 Production baseline must be exact Build 110')
req(prod.get('production_pages_deploy_run') == B110_PAGES and prod.get('production_live_resource_integrity_run') == B110_LIVE, 'Build 110 Production proof IDs drifted')

req(prior.get('state') == 'PRODUCTION_GREEN', 'Build 110 authority must be ingested as Production GREEN')
closure = prior.get('final_closure') or {}
req(closure.get('dev_sha') == B110_SHA and closure.get('tree_sha') == B110_TREE, 'Build 110 final closure SHA/tree mismatch')
req((closure.get('proofs') or {}) == B110_PROOFS, 'Build 110 final Development proofs mismatch')
req(closure.get('ingested_by_build') == 111, 'Build 110 closure must be ingested by Build 111')
prior_prod = prior.get('production_checkpoint') or {}
req(prior_prod.get('main_sha') == B110_SHA and prior_prod.get('tree_sha') == B110_TREE and prior_prod.get('production_pages_deploy_run') == B110_PAGES and prior_prod.get('production_live_resource_integrity_run') == B110_LIVE, 'Build 110 Production closure mismatch')

req(current.get('state') == 'DEVELOPMENT_CLOSURE_CANDIDATE', 'Build 111 authority must remain a closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None, 'Build 111 candidate must not self-claim later workflow proof')
start = (current.get('starting_point') or {}).get('development') or {}
req(start.get('sha') == B110_SHA and start.get('tree') == B110_TREE, 'Build 111 starting Development SHA/tree must be exact Build 110')
req(start.get('system_gate_run') == B110_PROOFS['system_gate_run'] and start.get('quality_run') == B110_PROOFS['current_application_quality_run'] and start.get('it_admin_runtime_run') == B110_PROOFS['it_admin_runtime_proof_run'] and start.get('repository_hygiene_run') == B110_PROOFS['branch_hygiene_run'], 'Build 111 starting proof key/value contract drifted')

for token in (
    'ORDER_FULFILLMENT_RECONCILIATION_STATES', 'status_history_drift', 'finance_evidence_missing',
    'digital_fulfilment_has_physical_units', 'legacy_inventory_stage_taxonomy', 'evidence_stage_missing',
    'returned_note_missing', 'shared_product_readiness_note', 'transition_supported',
    'existing_build82_write_contract_preserved: true', 'new_order_mutation: false',
    'inventory_reservation: false', 'production_execution: false', 'payment_execution: false',
    'refund_execution: false', 'accounting_posting: false', 'provider_execution: false',
): req(token in helper, f'Build 111 pure reconciliation helper missing token: {token}')
for forbidden in (r'\bfetch\s*\(', r'\bdb\.', r'\blocalStorage\.', r'\bsessionStorage\.', r'\bsetInterval\s*\('):
    req(not re.search(forbidden, helper), f'Build 111 pure reconciliation helper gained forbidden behavior: {forbidden}')

for token in (
    "import { onRequestGet as loadWorkflow } from './order-fulfillment-workflow.js'",
    "import { onRequestGet as loadFinance } from './order-finance-settlement-readiness.js'",
    "import { onRequestGet as loadProduction } from './order-production-release-readiness.js'",
    'buildOrderFulfillmentReconciliation', 'target_orders', 'order_items', 'order_status_history',
    'evidence_note_present', 'returned_note_present', "role: 'read_only_orders_to_fulfilment_reconciliation'",
    "transition_owner: '/api/admin/contracts/operations-order-fulfillment-workflow-write'",
): req(token in endpoint, f'Build 111 reconciliation endpoint missing token: {token}')
req('onRequestPost' not in endpoint, 'Build 111 reconciliation endpoint must expose no POST handler')
for forbidden in ('UPDATE orders', 'INSERT INTO order_status_history', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'):
    req(forbidden not in endpoint.upper(), f'Build 111 endpoint contains forbidden business DML/DDL: {forbidden}')
req(endpoint.count('.prepare(`') == 1, 'Build 111 endpoint must retain one bounded direct evidence query')

for token in (
    '/api/admin/order-fulfillment-reconciliation?limit=100', 'data-build111-reconciliation-hold',
    'Build 111 reconciliation requires review before this transition.', 'MutationObserver',
    'dd:order-updated', 'existing Build 82 reviewed transition controls',
): req(token in client, f'Build 111 reconciliation UI missing token: {token}')
for forbidden in ("method:'POST'", 'WRITE_ROUTE', 'queueNotification', 'processNotificationOutbox', 'setInterval('):
    req(forbidden not in client, f'Build 111 reconciliation UI gained forbidden action: {forbidden}')

req('data-order-fulfillment-reconciliation-build="111"' in page, 'Build 111 reconciliation page marker missing')
req('admin-order-fulfillment-reconciliation-v111.js?v=467b111' in page, 'Build 111 reconciliation client missing from fulfilment page')
req('admin-order-fulfillment-reconciliation.css?v=467b111' in page, 'Build 111 reconciliation CSS missing from fulfilment page')
req('data-order-fulfillment-workflow-build="82"' in page, 'Historical Build 82 workflow mount must remain')
req('admin-order-fulfillment-workflow-v82.js?v=467b82' in page, 'Historical Build 82 workflow client must remain')
req('admin-order-fulfillment-care.js?v=467b18' in page, 'Historical Build 18 attention client must remain')
req(len(re.findall(r'<h1(?:\s|>)', page, re.I)) == 1, 'Fulfilment workspace must contain exactly one H1')

for token in ('ORDER_FULFILLMENT_WRITE_STATUSES', 'customer_message_send: false', 'provider_shipping_execution: false', "audit_authority: 'order_status_history'"):
    req(token in b82_helper, f'Build 82 helper boundary drifted: {token}')
req(b82_contract.count('UPDATE orders SET order_status=?') == 1, 'Build 82 write contract narrow Orders update drifted')
req(b82_contract.count('INSERT INTO order_status_history') == 1, 'Build 82 write contract status-history append drifted')
req("CONTRACT_ID = 'operations-order-fulfillment-workflow-write'" in b82_contract, 'Build 82 write owner contract drifted')

for body,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req('Build 111' in body or 'build:111' in re.sub(r'\s+','',body), f'{label} must identify Build 111')
    req(B110_SHA in body and B110_TREE in body and str(B110_PAGES) in body and str(B110_LIVE) in body, f'{label} must retain exact Build 110 six-proof baseline')
for value in (B110_SHA,B110_TREE,*map(str,B110_PROOFS.values()),str(B110_PAGES),str(B110_LIVE)):
    req(value in release_doc, f'Build 111 release document missing Build 110 closure evidence: {value}')

manifest_files = [str(row.get('file') or '') for row in (manifest.get('migrations') or []) if isinstance(row,dict)]
req(manifest_files == EXPECTED_MIGRATIONS, 'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest), 'Build 111 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build111_gate.py', 'Release 467 Build 111')" in provenance, 'active System Gate provenance must explicitly call Build 111')
req("release467_build110_gate.py', 'Release 467 Build 110'" not in provenance, 'active System Gate provenance must no longer call Build 110 as current')

for path in (
    'functions/api/_lib/orderFulfillmentReconciliation.js',
    'functions/api/admin/order-fulfillment-reconciliation.js',
    'public/js/admin-order-fulfillment-reconciliation-v111.js',
    'functions/api/admin/it-operations-control-tower.js',
    'functions/api/_lib/currentReliability.js',
    'functions/api/admin/current-deployment-preflight.js',
    'public/js/admin-it-control-tower.js',
): node_check(path)
run(['node','scripts/release467_build111_orders_fulfillment_reconciliation_test.mjs'], 'Build 111 reconciliation runtime proof')
run([sys.executable,'scripts/release467_build82_gate.py'], 'carried Build 82 fulfilment workflow contract')
for path,label in (
    ('scripts/current_authority_restart_integrity_gate.py','restart integrity'),
    ('scripts/current_it_release_truth_gate.py','I.T. truth'),
    ('scripts/current_reliability_truth_gate.py','Reliability truth'),
    ('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth'),
): run([sys.executable,path],label)

if FAIL:
    print('RELEASE 467 BUILD 111 GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 111 GATE: PASS')
print('Build 110 six-proof closure: INGESTED')
print('Build 82 fulfilment mutation owner: PRESERVED')
print('Orders-to-Fulfilment reconciliation: READ-ONLY / FAIL-CLOSED')
print('Shared Product readiness as reservation: PROHIBITED')
print('New order/payment/refund/inventory/production/accounting/provider mutation: ZERO')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
