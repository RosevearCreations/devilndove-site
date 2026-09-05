#!/usr/bin/env python3
"""Release-neutral restart-integrity guard for current Devil n Dove authority."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []
SHA_RE = re.compile(r'^[0-9a-f]{40}$')
AUTHORITY_RE = re.compile(r'^release467-build(\d+)-.+\.json$')


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
req(ri.get('closure_candidate_must_not_self_claim_final_proof') is True, 'closure candidate must not self-claim later proofs')
req(ri.get('next_build_ingests_previous_final_closure') is True, 'next build must ingest previous final closure evidence')

# The machine pointer may be a closure candidate, but it may not silently remain on an
# older build after a newer Release 467 authority file has been introduced. This turns
# the stale-pointer condition Build 57 repaired into a release-neutral regression guard.
authority_builds = []
for path in ROOT.glob('release467-build*.json'):
    match = AUTHORITY_RE.match(path.name)
    if match:
        authority_builds.append((int(match.group(1)), path.name))
if authority_builds:
    newest_build = max(item[0] for item in authority_builds)
    req(build == newest_build, f'current authority pointer Build {build} must match newest Release 467 authority Build {newest_build}')
    named = pointer.get('current_release_authorities') or []
    req(bool(named), 'current authority must list current release authorities')
    if named:
        first = str(named[0])
        first_match = AUTHORITY_RE.match(Path(first).name)
        req(bool(first_match) and int(first_match.group(1)) == build, 'first current release authority must match current pointer build')

last_release = int(last.get('release') or 0)
last_build = int(last.get('build') or 0)
last_sha = str(last.get('dev_sha') or '')
last_tree = str(last.get('tree_sha') or '')
last_runs = last.get('proofs') or {}
req(last_release == release, 'last fully verified checkpoint release must match current release')
req(32 < last_build <= build, 'last fully verified checkpoint build must be within current authority')
req(bool(SHA_RE.match(last_sha)), 'last fully verified checkpoint must carry an exact dev SHA')
req(bool(SHA_RE.match(last_tree)), 'last fully verified checkpoint must carry an exact tree SHA')
for key in ('system_gate_run','current_application_quality_run','it_admin_runtime_proof_run','branch_hygiene_run'):
    req(int(last_runs.get(key) or 0) > 0, f'last fully verified checkpoint missing {key}')

# Production authority is release-neutral: it must point to a proven build at or before
# the latest fully verified Development build and retain exact SHA/tree/deploy evidence.
prod_build = int(prod.get('build') or 0)
prod_sha = str(prod.get('main_sha') or '')
prod_tree = str(prod.get('tree_sha') or '')
prod_run = int(prod.get('production_pages_deploy_run') or 0)
req(32 <= prod_build <= last_build, 'Production checkpoint build must not exceed verified Development')
req(prod.get('state') == 'PRODUCTION_GREEN', 'Production checkpoint must be PRODUCTION_GREEN')
req(prod.get('role') == 'CURRENT_PRODUCTION_BASELINE', 'Production checkpoint role must be current baseline')
req(bool(SHA_RE.match(prod_sha)), 'Production checkpoint must carry an exact main SHA')
req(bool(SHA_RE.match(prod_tree)), 'Production checkpoint must carry an exact tree SHA')
req(prod_run > 0, 'Production checkpoint must carry a Production Pages proof run')
req(pointer.get('automatic_production_promotion_authorized') is False, 'automatic Production promotion must remain closed')
req(pointer.get('request_time_schema_mutation') is not True, 'request-time schema mutation must remain closed')

# Last verified build authority must record the same final closure.
authority_path = str(last.get('authority') or '')
req(bool(authority_path), 'last fully verified checkpoint must name its release authority')
if authority_path:
    authority = load(authority_path)
    final = authority.get('final_closure') or {}
    req(int(authority.get('build') or 0) == last_build, 'verified release authority build must match checkpoint')
    req(final.get('dev_sha') == last_sha, 'verified release authority final closure SHA must match pointer')
    req(final.get('tree_sha') == last_tree, 'verified release authority final closure tree must match pointer')
    req((final.get('proofs') or {}) == last_runs, 'verified release authority final proof set must match pointer')

# If Production is the same feature build, its release authority must record matching
# Production tree/run and exact dev->main tree parity.
prod_authority_path = str(prod.get('authority') or '')
if prod_build == last_build and prod_authority_path:
    pa = load(prod_authority_path)
    pp = pa.get('production_checkpoint') or {}
    req(pp.get('main_sha') == prod_sha, 'Production release authority main SHA must match pointer')
    req(pp.get('tree_sha') == prod_tree, 'Production release authority tree must match pointer')
    req(int(pp.get('production_pages_deploy_run') or 0) == prod_run, 'Production release authority run must match pointer')
    req(prod_tree == last_tree, 'promoted Production tree must exactly match verified Development tree')

# Human/restart surfaces must describe the already-proven Development checkpoint.
doc_paths = ['AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md']
for path in doc_paths:
    text = read(path)
    req(last_sha in text, f'{path} missing last fully verified dev SHA')
    req(last_tree in text, f'{path} missing last fully verified tree SHA')
    for run in last_runs.values():
        req(str(run) in text, f'{path} missing last fully verified proof run {run}')
    req(prod_sha in text, f'{path} missing current Production main SHA')
    req(str(prod_run) in text, f'{path} missing current Production proof run')

# Read-only operator projections expose verified Development and Production separately.
it_api = read('functions/api/admin/it-operations-control-tower.js')
preflight = read('functions/api/admin/current-deployment-preflight.js')
reliability = read('functions/api/_lib/currentReliability.js')
for text, label in ((it_api,'I.T. API'),(preflight,'Deployment Preflight'),(reliability,'Reliability')):
    req(last_sha in text, f'{label} missing last fully verified dev SHA')
    req(last_tree in text, f'{label} missing last fully verified tree SHA')
    req(prod_sha in text, f'{label} missing current Production SHA')
    req(str(prod_run) in text, f'{label} missing current Production proof run')
req('VERIFIED_DEVELOPMENT' in it_api, 'I.T. API must name verified Development explicitly')
req('verified_development_checkpoint' in preflight, 'Deployment Preflight must expose verified Development')
req('last_fully_verified_development' in reliability, 'Reliability must expose verified Development provenance')

if build == last_build:
    req(int(pointer.get('next_build') or 0) == build + 1, 'stable pointer must name next build')
    req(pointer.get('next_build_state') in ('AUTHORIZED_IN_PROGRESS','READY'), 'next build must have explicit bounded state')
    req(bool(pointer.get('next_build_title')), 'authorized next build must have a title')
else:
    req(build == last_build + 1, 'current closure candidate may advance only one build beyond last verified checkpoint')

if FAIL:
    print('CURRENT AUTHORITY RESTART INTEGRITY GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT AUTHORITY RESTART INTEGRITY GATE: PASS')
