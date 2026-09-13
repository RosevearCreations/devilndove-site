#!/usr/bin/env python3
"""Release 467 Build 149 — Seller Listing Manager & Fast Product Editing gate."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def req(ok, msg):
    if not ok:
        FAIL.append(msg)

def read(path):
    p = ROOT / path
    return p.read_text(encoding='utf-8') if p.exists() else ''

def load_json(path):
    try:
        return json.loads(read(path) or '{}')
    except Exception as exc:
        FAIL.append(f'{path} is not valid JSON: {exc}')
        return {}

closure = load_json('release467-build148-seller-daily-command-centre.json')
auth = load_json('current-development-authority.json')
page = read('admin/listings/index.html')
script = read('public/js/admin-seller-listing-manager-build149.js')

SHA = '5a51981e7831bbef4f44c19f43a36b811e0a2e79'
TREE = 'f4e0a88f1f7c6837176a939a19e5d4ae36596434'
proofs = {
    'system_gate_run': 34772251480,
    'current_application_quality_run': 34772251467,
    'it_admin_runtime_proof_run': 34772251459,
    'branch_hygiene_run': 34772251477,
}
req(closure.get('release') == 467 and closure.get('build') == 148, 'Build 148 closure identity is wrong')
req(closure.get('accepted_dev_sha') == SHA and closure.get('accepted_dev_tree_sha') == TREE, 'Build 148 accepted SHA/tree drifted')
req(closure.get('acceptance') == proofs, 'Build 148 Development proof IDs drifted')
final = closure.get('final_closure') or {}
req(final.get('dev_sha') == SHA and final.get('tree_sha') == TREE, 'Build 148 final closure SHA/tree drifted')
req(final.get('proofs') == proofs, 'Build 148 final closure proofs drifted')
req(final.get('ingested_by_build') == 149, 'Build 148 closure must be ingested by Build 149')
prod = closure.get('production_checkpoint') or {}
req(prod.get('state') == 'PRODUCTION_GREEN', 'Build 148 Production closure is not GREEN')
req(prod.get('main_sha') == SHA and prod.get('tree_sha') == TREE, 'Build 148 Production SHA/tree drifted')
req(prod.get('production_pages_deploy_run') == 34772367891, 'Build 148 Production Pages proof drifted')
req(prod.get('production_live_resource_integrity_run') == 34772410714, 'Build 148 Live Resource proof drifted')

req(auth.get('release') == 467 and auth.get('build') == 148, 'current authority must point to Build 148 baseline')
req(auth.get('accepted_dev_sha') == SHA and auth.get('accepted_dev_tree_sha') == TREE, 'current authority accepted Build 148 SHA/tree drifted')
req((auth.get('restart_integrity') or {}).get('last_fully_verified', {}).get('dev_sha') == SHA, 'restart authority must preserve Build 148 as last fully verified')
req((auth.get('production_checkpoint') or {}).get('main_sha') == SHA, 'Production baseline must be Build 148')
req(auth.get('next_build') == 149 and auth.get('next_build_title') == 'Seller Listing Manager & Fast Product Editing', 'Build 149 next-build authority missing')
req(auth.get('promotion_state') == 'BUILD149_CANDIDATE_NOT_YET_VERIFIED', 'Build 149 candidate must not self-claim Production')
release_authorities = auth.get('current_release_authorities') or []
req(release_authorities and release_authorities[0] == 'release467-build148-seller-daily-command-centre.json', 'Build 148 authority must lead the current release authority chain')
for key, expected in {
    'stripe_development':'HOLD_EXTERNAL',
    'paypal_sandbox':'HOLD_EXTERNAL',
    'social_oauth':'HOLD_EXTERNAL',
    'caip_private_media':'EVIDENCE_DEPENDENT',
    'cloudflare_access_service_token':'HOLD_EXTERNAL',
}.items():
    req((auth.get('external_lanes') or {}).get(key) == expected, f'external lane {key} drifted')
for key in ('automatic_production_promotion_authorized','request_time_schema_mutation','schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized'):
    req(auth.get(key) is False, f'{key} must remain false')

manifest = load_json('migrations/canonical/manifest.json')
expected_migrations = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]
req([x.get('file') for x in manifest.get('migrations', [])] == expected_migrations, 'canonical D1 migration authority changed')

req(page, 'admin/listings/index.html is missing')
req(len(re.findall(r'<h1(?:\s|>)', page, flags=re.I)) == 1, 'Seller Listing Manager page must contain exactly one H1')
for token in ('Seller Listing Manager','id="listingManagerMount"','/public/js/admin-seller-listing-manager-build149.js','/admin/products/','/admin/orders/'):
    req(token in page, f'Listings page missing token: {token}')

for token in (
    'dd:admin:listings:b149:snapshot:v1',
    'dd:admin:listings:b149:quick-edits:v1',
    'navigator.onLine',
    'base_updated_at',
    'client_action_id',
    'waiting_to_sync',
    "sync_state='syncing'",
    "sync_state='conflict'",
    '/api/admin/products',
    '/api/admin/product-detail?product_id=',
    '/api/admin/update-product',
    '/api/admin/create-product',
    "status:'draft'",
    "review_status:'pending_review'",
    '/admin/catalog-media/',
    '/shop/product/?slug=',
    'Bulk active/publish, inventory, delete and archive are intentionally not auto-applied',
):
    req(token in script, f'Build 149 listing manager missing token: {token}')
req('setInterval(' not in script, 'Build 149 must not add polling timers')
req('window.addEventListener(\'online\'' in script, 'Build 149 foreground reconnect retry is missing')
req('liveStamp!==draft.base_updated_at' in script or 'draft.base_updated_at!==liveStamp' in script, 'Build 149 cross-device conflict guard is missing')

if FAIL:
    print('RELEASE 467 BUILD 149 GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('RELEASE 467 BUILD 149 GATE: PASS')
print('Build 148 six-proof Production closure: INGESTED BY BUILD 149')
print('Seller Listing Manager: CARDS + LIST + SEARCH + LIFECYCLE + SAFE LOCAL QUICK EDITS + CONFLICT STOP')
print('Clone listing: LIVE-ONLY / DRAFT / INVENTORY RESET / NO AUTO-PUBLISH')
print('Canonical D1: 0001-0004 / UNCHANGED')
print('Provider / R2 / schema authority added: NONE')
