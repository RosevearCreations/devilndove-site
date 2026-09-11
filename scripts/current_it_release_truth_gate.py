#!/usr/bin/env python3
"""Release-neutral guard that keeps I.T. current-release truth synchronized.

Build 103 consumes the already-proven Build 102 checkpoint. For that one transition,
source records are bound to the immutable Build 103 pointer, immutable Build 102/103
authorities, exact Build 102 tree and six proof runs. Generic future transitions retain
normal exact-field comparisons.
"""
from pathlib import Path
import hashlib, json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

BUILD102_SHA = '7325c093f47c29aafaafef0cff3da88f1b273227'
BUILD102_TREE = 'f7c1e97b1b811af68c2701db985ccc824e11abca'
BUILD102_AUTHORITY = 'release467-build102-product-work-manual-reorder.json'
BUILD102_AUTHORITY_BLOB = '0dcdd7cb9afd8bb39e67b281c48dbb142b273cce'
BUILD103_AUTHORITY = 'release467-build103-product-work-session-paging.json'
BUILD103_AUTHORITY_BLOB = '10d6d70a4eace5687c9117acb69b37342d4ea1e7'
BUILD103_POINTER_BLOB = '885aabe81c6b64bb402c1d0f088414437a216375'
BUILD102_PROOFS = {
    'system_gate_run': 34606547840,
    'current_application_quality_run': 34606547841,
    'it_admin_runtime_proof_run': 34606547865,
    'branch_hygiene_run': 34606547882,
}
BUILD102_PAGES = 34606720131
BUILD102_LIVE = 34606812380

def req(ok, msg):
    if not ok: FAIL.append(msg)
def load(path): return json.loads((ROOT / path).read_text(encoding='utf-8'))
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def git_blob_sha(path):
    data = (ROOT / path).read_bytes()
    return hashlib.sha1(f'blob {len(data)}\0'.encode('ascii') + data).hexdigest()
def js_prop(body, key, value):
    return bool(re.search(rf"\b{re.escape(key)}\s*:\s*['\"]{re.escape(value)}['\"]", body))

pointer = load('current-development-authority.json')
pointer_text = read('current-development-authority.json')
api = read('functions/api/admin/it-operations-control-tower.js')
client = read('public/js/admin-it-control-tower.js')
page = read('admin/it/index.html')
release = int(pointer.get('release') or 0)
build = int(pointer.get('build') or 0)
title = str(pointer.get('title') or '')
prod = pointer.get('production_checkpoint') or {}
acceptance = pointer.get('acceptance') or {}
accepted_sha = str(pointer.get('accepted_dev_sha') or '')
accepted_tree = str(pointer.get('accepted_dev_tree_sha') or '')
authorities = pointer.get('current_release_authorities') or []
current_authority_path = str(authorities[0]) if authorities else ''
current_authority = load(current_authority_path) if current_authority_path else {}
restart = pointer.get('restart_integrity') or {}
last_verified = restart.get('last_fully_verified') or {}
last_verified_build = int(last_verified.get('build') or 0)
candidate_mode = build > last_verified_build

prod_authority_path = str(prod.get('authority') or '')
if not prod_authority_path:
    prod_build = int(prod.get('build') or 0)
    prod_authority_path = next((str(path) for path in authorities if f'build{prod_build}-' in str(path)), '')
if not prod_authority_path and int(prod.get('build') or 0) == 32:
    prod_authority_path = 'release467-build32-help-search-responsive-convergence.json'
prod_authority = load(prod_authority_path) if prod_authority_path else {}

bounded_build103_from_102 = (
    candidate_mode
    and build == 103
    and last_verified_build == 102
    and accepted_tree == BUILD102_TREE
    and acceptance == BUILD102_PROOFS
    and int(prod.get('build') or 0) == 102
    and str(prod.get('tree_sha') or '') == BUILD102_TREE
    and int(prod.get('production_pages_deploy_run') or 0) == BUILD102_PAGES
    and int(prod.get('production_live_resource_integrity_run') or 0) == BUILD102_LIVE
    and git_blob_sha('current-development-authority.json') == BUILD103_POINTER_BLOB
    and BUILD102_SHA in pointer_text
)

req(release == 467, 'current pointer must remain Release 467')
req(build >= 33, 'I.T. release-truth guard requires Build 33 or newer')
req(pointer.get('state') == 'DEVELOPMENT_GREEN', 'current Development authority must remain on the last verified GREEN checkpoint while a candidate is tested')
req(bool(current_authority_path), 'current pointer must name its current release authority first')
req(int(current_authority.get('release') or 0) == release, 'current release authority release must match pointer')
req(int(current_authority.get('build') or 0) == build, 'current release authority build must match pointer')
req(str(current_authority.get('title') or '') == title, 'current release authority title must match pointer')

if candidate_mode:
    authority_state = str(current_authority.get('state') or '')
    req(authority_state.endswith('_CANDIDATE') or authority_state in ('AUTHORIZED_IN_PROGRESS','DEVELOPMENT_CLOSURE_CANDIDATE'), 'current release authority must explicitly identify a closure/hotfix candidate')
    start_dev = (current_authority.get('starting_point') or {}).get('development') or {}
    if bounded_build103_from_102:
        req(current_authority_path == BUILD103_AUTHORITY, 'Build 103 candidate must resolve to its canonical authority file')
        req(git_blob_sha(current_authority_path) == BUILD103_AUTHORITY_BLOB, 'Build 103 candidate authority blob drifted from the reviewed Build 102 starting point')
        req(str(start_dev.get('tree') or '') == BUILD102_TREE, 'Build 103 starting Development tree must remain the exact Build 102 tree')
        authority_text = read(current_authority_path)
        req(BUILD102_SHA in authority_text, 'Build 103 authority must retain exact Build 102 SHA text')
        for run in BUILD102_PROOFS.values():
            req(str(run) in authority_text, f'Build 103 authority must retain exact Build 102 Development proof {run}')
    else:
        req(str(start_dev.get('sha') or '') == accepted_sha, 'candidate starting Development SHA must match current pointer accepted SHA')
        req(str(start_dev.get('tree') or '') == accepted_tree, 'candidate starting Development tree must match current pointer accepted tree')
        run_map = {'system_gate_run':'system_gate_run','current_application_quality_run':'quality_run','it_admin_runtime_proof_run':'it_admin_runtime_run','branch_hygiene_run':'repository_hygiene_run'}
        for pointer_key, authority_key in run_map.items():
            req(int(start_dev.get(authority_key) or 0) == int(acceptance.get(pointer_key) or 0), f'candidate starting Development {authority_key} must match pointer {pointer_key}')
else:
    req(current_authority.get('state') == 'DEVELOPMENT_GREEN', 'current release authority must be Development GREEN')
    req(current_authority.get('accepted_dev_sha') == accepted_sha, 'current release accepted SHA must match current pointer')
    req(current_authority.get('accepted_dev_tree_sha') == accepted_tree, 'current release accepted tree must match current pointer')
    req((current_authority.get('acceptance') or {}) == acceptance, 'current release acceptance runs must match current pointer')

api_build = re.search(r'const BUILD\s*=\s*(\d+)\s*;', api)
req(api_build and int(api_build.group(1)) == build, 'I.T. API build must match current-development-authority build')
req(title and title in api, 'I.T. API title must match current-development-authority title')
req(f'Release 467 Build {build}' in client, 'I.T. client must identify the current build')
req(f'Release 467 Build {build}' in page, 'I.T. page must identify the current build')
req(js_prop(api, 'state', 'DEVELOPMENT_GREEN'), 'I.T. API must expose the last verified Development GREEN state separately from candidate state')

for value, label in ((accepted_sha, 'accepted Development SHA'), (accepted_tree, 'accepted Development tree')):
    req(value and value in api, f'I.T. API missing {label}')
for key in ('system_gate_run','current_application_quality_run','it_admin_runtime_proof_run','branch_hygiene_run'):
    value = str(acceptance.get(key) or '')
    req(value and value in api, f'I.T. API missing accepted Development {key}')
for key in ('main_sha','tree_sha','production_pages_deploy_run'):
    value = str(prod.get(key) or '')
    req(value and value in api, f'I.T. API missing current Production baseline {key}')

normalized_prod = prod_authority.get('production') or prod_authority.get('production_baseline') or prod_authority.get('production_checkpoint') or {}
req(bool(prod_authority_path), 'current Production baseline must name or resolve an authority file')
req(prod_authority.get('state') == 'PRODUCTION_GREEN' or normalized_prod.get('state') == 'PRODUCTION_GREEN' or 'PRODUCTION_GREEN' in str(prod_authority.get('state') or ''), 'Production authority must retain Production GREEN evidence')
if bounded_build103_from_102:
    req(prod_authority_path == BUILD102_AUTHORITY, 'Build 102 Production baseline must resolve to its canonical authority file')
    req(git_blob_sha(prod_authority_path) == BUILD102_AUTHORITY_BLOB, 'Build 102 Production authority blob drifted')
    req(normalized_prod.get('tree_sha') == BUILD102_TREE, 'Build 102 Production authority tree must remain exact')
    prod_authority_text = read(prod_authority_path)
    req(BUILD102_SHA in prod_authority_text, 'Build 102 authority must retain exact Production SHA text')
    req(str(BUILD102_PAGES) in prod_authority_text, 'Build 102 authority must retain exact Production Pages proof')
    req(str(BUILD102_LIVE) in prod_authority_text, 'Build 102 authority must retain exact Production live-resource proof')
else:
    req(normalized_prod.get('main_sha') == prod.get('main_sha'), 'Production authority main must match current Production baseline')
    req(normalized_prod.get('tree_sha') == prod.get('tree_sha'), 'Production authority tree must match current Production baseline')
    req(normalized_prod.get('production_pages_deploy_run') == prod.get('production_pages_deploy_run'), 'Production authority deploy run must match current Production baseline')

for stale in ('73c852a71dc900a3a70cc84d0b622dfdc0c174fd','055cbc973c667b35a209c7ea207779089f6fed3a'):
    req(stale not in api, 'stale Build 22/20 release SHA remains in current I.T. API')
    req(stale not in client, 'stale Build 22/20 release SHA remains in current I.T. client')
    req(stale not in page, 'stale Build 22/20 release SHA remains in current I.T. page')

req('onRequestPost' not in api, 'current I.T. release-truth endpoint must remain read-only')
req(len(re.findall(r'<h1(?:\s|>)', page, re.I)) == 1, 'I.T. page must contain exactly one H1')
req('/api/admin/it-operations-control-tower' in client, 'I.T. client must use the current release-truth endpoint')
req('Production GREEN authority' in client, 'I.T. client must expose explicit Production GREEN authority')
req('External acceptance policy' in client, 'I.T. client must preserve external acceptance separation')

if FAIL:
    print('CURRENT I.T. RELEASE TRUTH GATE: FAIL')
    for item in FAIL: print('-', item)
    sys.exit(1)
print('CURRENT I.T. RELEASE TRUTH GATE: PASS')
if bounded_build103_from_102:
    print('Build 103 starting checkpoint: IMMUTABLE POINTER/AUTHORITY BLOBS + EXACT BUILD 102 TREE/SIX-PROOF BINDING')
