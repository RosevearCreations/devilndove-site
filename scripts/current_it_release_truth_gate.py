#!/usr/bin/env python3
"""Release-neutral guard that keeps I.T. current-release truth synchronized."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def req(ok, msg):
    if not ok:
        FAIL.append(msg)


def load(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


pointer = load('current-development-authority.json')
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
    req(str(start_dev.get('sha') or '') == accepted_sha, 'candidate starting Development SHA must match current pointer accepted SHA')
    req(str(start_dev.get('tree') or '') == accepted_tree, 'candidate starting Development tree must match current pointer accepted tree')
    run_map = {
        'system_gate_run': 'system_gate_run',
        'current_application_quality_run': 'quality_run',
        'it_admin_runtime_proof_run': 'it_admin_runtime_run',
        'branch_hygiene_run': 'repository_hygiene_run',
    }
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
req("state: 'DEVELOPMENT_GREEN'" in api, 'I.T. API must expose the last verified Development GREEN state separately from candidate state')

for value, label in ((accepted_sha, 'accepted Development SHA'), (accepted_tree, 'accepted Development tree')):
    req(value and value in api, f'I.T. API missing {label}')
for key in ('system_gate_run', 'current_application_quality_run', 'it_admin_runtime_proof_run', 'branch_hygiene_run'):
    value = str(acceptance.get(key) or '')
    req(value and value in api, f'I.T. API missing accepted Development {key}')

for key in ('main_sha', 'tree_sha', 'production_pages_deploy_run'):
    value = str(prod.get(key) or '')
    req(value and value in api, f'I.T. API missing current Production baseline {key}')

normalized_prod = prod_authority.get('production') or prod_authority.get('production_baseline') or prod_authority.get('production_checkpoint') or {}
req(bool(prod_authority_path), 'current Production baseline must name or resolve an authority file')
req(prod_authority.get('state') == 'PRODUCTION_GREEN' or normalized_prod.get('state') == 'PRODUCTION_GREEN' or 'PRODUCTION_GREEN' in str(prod_authority.get('state') or ''), 'Production authority must retain Production GREEN evidence')
req(normalized_prod.get('main_sha') == prod.get('main_sha'), 'Production authority main must match current Production baseline')
req(normalized_prod.get('tree_sha') == prod.get('tree_sha'), 'Production authority tree must match current Production baseline')
req(normalized_prod.get('production_pages_deploy_run') == prod.get('production_pages_deploy_run'), 'Production authority deploy run must match current Production baseline')

for stale in ('73c852a71dc900a3a70cc84d0b622dfdc0c174fd', '055cbc973c667b35a209c7ea207779089f6fed3a'):
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
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT I.T. RELEASE TRUTH GATE: PASS')
