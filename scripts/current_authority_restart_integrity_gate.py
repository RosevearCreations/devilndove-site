#!/usr/bin/env python3
"""Release-neutral restart-integrity guard for current Devil n Dove authority.

The static repository cannot embed the SHA/run IDs of proofs that execute only after
that same commit exists.  This guard therefore distinguishes:

* accepted_dev_*: the implementation checkpoint accepted before authority closure;
* restart_integrity.last_fully_verified: the latest descendant whose exact branch
  head subsequently passed all four Development proofs;
* restart_integrity.closure_proof_mode: the rule future closure candidates must use.

A new build may advance source only from or after the last fully verified checkpoint.
The next build ingests the previous build's externally proven final closure evidence,
which removes the self-referential "commit another SHA to record this SHA" loop.
"""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []
SHA_RE = re.compile(r'^[0-9a-f]{40}$')


def req(ok, msg):
    if not ok:
        FAIL.append(msg)


def load(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


pointer = load('current-development-authority.json')
release = int(pointer.get('release') or 0)
build = int(pointer.get('build') or 0)
ri = pointer.get('restart_integrity') or {}
last = ri.get('last_fully_verified') or {}
prod = pointer.get('production_checkpoint') or {}

req(release == 467, 'restart-integrity pointer must remain Release 467')
req(pointer.get('state') == 'DEVELOPMENT_GREEN', 'current authority must remain Development GREEN')
req(ri.get('protocol') == 'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1', 'restart-integrity protocol must be explicit')
req(ri.get('restart_requires_exact_dev_head_proof_verification') is True, 'restart must require exact dev-head proof verification')
req(ri.get('closure_candidate_must_not_self_claim_final_proof') is True, 'closure candidate must not self-claim proofs that happen after commit creation')
req(ri.get('next_build_ingests_previous_final_closure') is True, 'next build must ingest the previous final closure evidence')

last_release = int(last.get('release') or 0)
last_build = int(last.get('build') or 0)
last_sha = str(last.get('dev_sha') or '')
last_tree = str(last.get('tree_sha') or '')
last_runs = last.get('proofs') or {}
req(last_release == release, 'last fully verified checkpoint release must match current release')
req(32 < last_build <= build, 'last fully verified checkpoint build must be within current Development authority')
req(bool(SHA_RE.match(last_sha)), 'last fully verified checkpoint must carry an exact 40-character dev SHA')
req(bool(SHA_RE.match(last_tree)), 'last fully verified checkpoint must carry an exact 40-character tree SHA')
for key in ('system_gate_run', 'current_application_quality_run', 'it_admin_runtime_proof_run', 'branch_hygiene_run'):
    req(int(last_runs.get(key) or 0) > 0, f'last fully verified checkpoint missing {key}')

req(prod.get('main_sha') == '816490a9f36ffc2a730d8149549e5a2fbd609966', 'Production main baseline changed unexpectedly')
req(prod.get('tree_sha') == '2c1b4a3694779996e1bdb094be5e9e043834276e', 'Production tree baseline changed unexpectedly')
req(int(prod.get('production_pages_deploy_run') or 0) == 33866964958, 'Production Pages proof changed unexpectedly')
req(pointer.get('automatic_production_promotion_authorized') is False, 'automatic Production promotion must remain closed')
req(pointer.get('request_time_schema_mutation') is not True, 'request-time schema mutation must remain closed')

# The release authority for the last fully verified build must record the same closure.
authority_path = str(last.get('authority') or '')
req(bool(authority_path), 'last fully verified checkpoint must name its release authority')
if authority_path:
    authority = load(authority_path)
    final = authority.get('final_closure') or {}
    req(int(authority.get('build') or 0) == last_build, 'verified release authority build must match checkpoint')
    req(final.get('dev_sha') == last_sha, 'verified release authority final closure SHA must match pointer')
    req(final.get('tree_sha') == last_tree, 'verified release authority final closure tree must match pointer')
    req((final.get('proofs') or {}) == last_runs, 'verified release authority final proof set must match pointer')

# Human/restart surfaces must describe the already-proven checkpoint, not stale pending state.
doc_paths = [
    'AI_HANDOFF.md',
    'PROJECT_STATUS_AND_ROADMAP.md',
    'SANITY_HEALTH_CHECK.md',
    'MARKDOWN_INDEX.md',
    'docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md',
]
banned = (
    'pending final authority-only closure proof',
    'final authority closure proof pending',
    'authority-only descendant must independently pass',
    'authority-only closure must merge to `dev`',
)
for path in doc_paths:
    text = read(path)
    low = text.lower()
    req(last_sha in text, f'{path} missing last fully verified dev SHA')
    req(last_tree in text, f'{path} missing last fully verified tree SHA')
    for run in last_runs.values():
        req(str(run) in text, f'{path} missing last fully verified proof run {run}')
    for phrase in banned:
        req(phrase not in low, f'{path} still carries stale closure-pending language: {phrase}')

# Read-only operator projections must expose the verified checkpoint separately from
# the implementation acceptance checkpoint.
it_api = read('functions/api/admin/it-operations-control-tower.js')
preflight = read('functions/api/admin/current-deployment-preflight.js')
reliability = read('functions/api/_lib/currentReliability.js')
for text, label in ((it_api, 'I.T. API'), (preflight, 'Deployment Preflight'), (reliability, 'Reliability')):
    req(last_sha in text, f'{label} missing last fully verified dev SHA')
    req(last_tree in text, f'{label} missing last fully verified tree SHA')
req('VERIFIED_DEVELOPMENT' in it_api, 'I.T. API must name the verified Development checkpoint explicitly')
req('verified_development_checkpoint' in preflight, 'Deployment Preflight must expose the verified Development checkpoint')
req('last_fully_verified_development' in reliability, 'Reliability must expose last fully verified Development provenance')

# Build 49 is deliberately bounded to this convergence slice while Build 48 remains
# the latest fully verified checkpoint until Build 49 itself completes its final cycle.
if build == last_build:
    req(int(pointer.get('next_build') or 0) == build + 1, 'stable pointer must name the authorized next build')
    req(pointer.get('next_build_state') in ('AUTHORIZED_IN_PROGRESS', 'READY'), 'next build must have an explicit bounded state')
    req(bool(pointer.get('next_build_title')), 'authorized next build must have a title')
else:
    req(build == last_build + 1, 'current closure candidate may advance only one build beyond last fully verified checkpoint')

if FAIL:
    print('CURRENT AUTHORITY RESTART INTEGRITY GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT AUTHORITY RESTART INTEGRITY GATE: PASS')
