#!/usr/bin/env python3
"""Fail-closed source/runtime-truth contract for Release 467 Build 87."""
from pathlib import Path
import json, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

B86_SHA = '5fdbb5346e52f17072671274dc36e4d3527a7905'
B86_TREE = 'f9037baf12bc3489b3a0df3df03eef5bdbe85e90'
B86_PROOFS = {
    'system_gate_run': 34419070653,
    'current_application_quality_run': 34419070636,
    'it_admin_runtime_proof_run': 34419070642,
    'branch_hygiene_run': 34419070660,
}
B86_PAGES = 34419211512
B86_LIVE = 34419284027
EXPECTED_MIGRATIONS = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]


def read(path):
    target = ROOT / path
    if not target.is_file():
        FAIL.append(f'missing required file: {path}')
        return ''
    return target.read_text(encoding='utf-8', errors='replace')


def load(path):
    try:
        return json.loads(read(path) or '{}')
    except json.JSONDecodeError as exc:
        FAIL.append(f'invalid JSON {path}: {exc}')
        return {}


def req(ok, message):
    if not ok:
        FAIL.append(message)


def run(command, label):
    result = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"{label} failed: {(result.stderr or result.stdout).strip()[-3200:]}")


def compact(body):
    return re.sub(r'\s+', '', body)


pointer = load('current-development-authority.json')
b86 = load('release467-build86-it-operations-self-diagnostics.json')
b87 = load('release467-build87-production-authority-restart-convergence.json')
manifest = load('migrations/canonical/manifest.json')
doc = read('docs/operations/RELEASE_467_BUILD_87_PRODUCTION_AUTHORITY_RESTART_CONVERGENCE.md')
it_api = read('functions/api/admin/it-operations-control-tower.js')
it_client = read('public/js/admin-it-control-tower.js')
it_page = read('admin/it/index.html')
reliability = read('functions/api/_lib/currentReliability.js')
reliability_page = read('admin/reliability/index.html')
preflight = read('functions/api/admin/current-deployment-preflight.js')
preflight_page = read('admin/deployment-preflight/index.html')
provenance = read('scripts/current_system_gate_provenance_gate.py')

# Current machine authority must advance exactly one build beyond the verified Build 86 closure.
req(pointer.get('release') == 467 and pointer.get('build') == 87, 'current authority pointer must be Release 467 Build 87')
req(pointer.get('title') == 'Production Authority & Restart Convergence', 'Build 87 current authority title drifted')
req(pointer.get('state') == 'DEVELOPMENT_GREEN', 'candidate pointer must retain the last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha') == B86_SHA, 'Build 87 accepted Development SHA must be Build 86 exact closure')
req(pointer.get('accepted_dev_tree_sha') == B86_TREE, 'Build 87 accepted Development tree must be Build 86 exact closure')
req((pointer.get('acceptance') or {}) == B86_PROOFS, 'Build 87 accepted Development proof set must equal Build 86 exact proof set')
req(pointer.get('promotion_state') == 'BUILD87_CANDIDATE_NOT_YET_VERIFIED', 'Build 87 promotion state must remain fail-closed candidate state')
req(pointer.get('automatic_production_promotion_authorized') is False, 'automatic Production promotion must remain closed')
req(pointer.get('schema_change_authorized') is False, 'Build 87 must remain schema-neutral')
req(pointer.get('d1_mutation_authorized') is False, 'Build 87 D1 mutation authority must remain closed')
req(pointer.get('r2_mutation_authorized') is False, 'Build 87 R2 mutation authority must remain closed')
req(pointer.get('provider_execution_authorized') is False, 'Build 87 provider execution must remain closed')
req(pointer.get('provider_publication_authorized') is False, 'Build 87 provider publication must remain closed')
req(pointer.get('request_time_schema_mutation') is False, 'Build 87 request-time schema mutation must remain closed')

restart = pointer.get('restart_integrity') or {}
last = restart.get('last_fully_verified') or {}
candidate = restart.get('current_closure_candidate') or {}
prod = pointer.get('production_checkpoint') or {}
req(restart.get('protocol') == 'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1', 'restart-integrity protocol drifted')
req(last.get('build') == 86 and last.get('dev_sha') == B86_SHA and last.get('tree_sha') == B86_TREE, 'Build 86 must be the last fully verified restart checkpoint')
req((last.get('proofs') or {}) == B86_PROOFS, 'Build 86 restart proof set drifted')
req(last.get('authority') == 'release467-build86-it-operations-self-diagnostics.json', 'Build 86 restart authority path drifted')
req(candidate.get('build') == 87 and candidate.get('authority') == 'release467-build87-production-authority-restart-convergence.json', 'Build 87 closure candidate restart authority drifted')
req(candidate.get('state') == 'AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF', 'Build 87 must await external exact-head proof')
req(prod.get('build') == 86 and prod.get('main_sha') == B86_SHA and prod.get('tree_sha') == B86_TREE, 'Build 86 must be current Production baseline')
req(prod.get('production_pages_deploy_run') == B86_PAGES, 'Build 86 Production Pages proof drifted')
req(prod.get('production_live_resource_integrity_run') == B86_LIVE, 'Build 86 live-resource proof drifted')
req(prod.get('state') == 'PRODUCTION_GREEN' and prod.get('role') == 'CURRENT_PRODUCTION_BASELINE', 'Build 86 Production checkpoint must remain GREEN baseline')
req((pointer.get('current_release_authorities') or [])[:2] == ['release467-build87-production-authority-restart-convergence.json','release467-build86-it-operations-self-diagnostics.json'], 'current authority ordering must begin Build 87 candidate then Build 86 verified closure')

# Build 86 authority must now hold the immutable external final closure.
req(b86.get('state') == 'PRODUCTION_GREEN', 'Build 86 authority must be PRODUCTION_GREEN after external closure ingestion')
final86 = b86.get('final_closure') or {}
prod86 = b86.get('production_checkpoint') or {}
req(final86.get('dev_sha') == B86_SHA and final86.get('tree_sha') == B86_TREE, 'Build 86 final closure SHA/tree drifted')
req((final86.get('proofs') or {}) == B86_PROOFS, 'Build 86 final closure proof set drifted')
req(final86.get('proof_state') == 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN', 'Build 86 final proof state drifted')
req(prod86.get('main_sha') == B86_SHA and prod86.get('tree_sha') == B86_TREE, 'Build 86 authority Production SHA/tree drifted')
req(prod86.get('production_pages_deploy_run') == B86_PAGES and prod86.get('production_live_resource_integrity_run') == B86_LIVE, 'Build 86 authority Production runs drifted')

# Build 87 authority itself is only a candidate and must match the proven Build 86 starting point.
req(b87.get('release') == 467 and b87.get('build') == 87, 'Build 87 manifest identity drifted')
req(b87.get('title') == 'Production Authority & Restart Convergence', 'Build 87 manifest title drifted')
req(b87.get('state') == 'DEVELOPMENT_CLOSURE_CANDIDATE', 'Build 87 manifest must remain a closure candidate')
start_dev = (b87.get('starting_point') or {}).get('development') or {}
start_prod = (b87.get('starting_point') or {}).get('production') or {}
req(start_dev.get('sha') == B86_SHA and start_dev.get('tree') == B86_TREE, 'Build 87 Development starting point must equal Build 86 closure')
req(start_dev.get('system_gate_run') == B86_PROOFS['system_gate_run'], 'Build 87 starting System proof drifted')
req(start_dev.get('quality_run') == B86_PROOFS['current_application_quality_run'], 'Build 87 starting Quality proof drifted')
req(start_dev.get('it_admin_runtime_run') == B86_PROOFS['it_admin_runtime_proof_run'], 'Build 87 starting I.T. proof drifted')
req(start_dev.get('repository_hygiene_run') == B86_PROOFS['branch_hygiene_run'], 'Build 87 starting Hygiene proof drifted')
req(start_prod.get('main_sha') == B86_SHA and start_prod.get('tree_sha') == B86_TREE, 'Build 87 Production starting point must equal Build 86 Production closure')
req(start_prod.get('production_pages_deploy_run') == B86_PAGES and start_prod.get('production_live_resource_integrity_run') == B86_LIVE, 'Build 87 Production starting runs drifted')
req(((b87.get('closure_policy') or {}).get('candidate_must_not_self_claim_final_proof')) is True, 'Build 87 must not self-claim final proof')
req((b87.get('closure_policy') or {}).get('final_closure') is None, 'Build 87 must not contain premature final closure')

# External lanes and safety boundaries remain independent and fail closed.
external = pointer.get('external_lanes') or {}
for key in ('stripe_development','paypal_sandbox','social_oauth','cloudflare_access_service_token'):
    req(str(external.get(key) or '').startswith('HOLD_EXTERNAL'), f'{key} must remain HOLD_EXTERNAL')
req(external.get('caip_private_media') == 'EVIDENCE_DEPENDENT', 'CAIP private-media must remain evidence-dependent')
for key, value in (b87.get('safety') or {}).items():
    if key == 'canonical_d1_migrations':
        continue
    req(value is False, f'Build 87 safety boundary drifted: {key}')

# Current operator surfaces must agree on Build 87 candidate / Build 86 verified baseline.
for token in ('const BUILD = 87;', "const TITLE = 'Production Authority & Restart Convergence';", B86_SHA, B86_TREE, str(B86_PAGES), str(B86_LIVE), 'getSelfDiagnostics', 'provider_execution:false', 'provider_publication:false'):
    req(token in it_api, f'Build 87 current I.T. API missing token: {token}')
req('onRequestPost' not in it_api, 'Build 87 I.T. API must remain read-only')
for token in ('Release 467 Build 87', 'Production Authority & Restart Convergence', 'Build 86 proof:', '/api/admin/it-operations-control-tower'):
    req(token in it_client, f'Build 87 I.T. client missing token: {token}')
req("method:'POST'" not in compact(it_client) and 'setInterval(' not in it_client, 'Build 87 I.T. browser layer must not POST or poll')
req('Release 467 Build 87' in it_page and B86_SHA in it_page and B86_TREE in it_page, 'Build 87 I.T. page must expose Build 86 verified baseline')
req(len(re.findall(r'<h1(?:\s|>)', it_page, re.I)) == 1, 'Build 87 I.T. page must retain one H1')

for token in ('CURRENT_RELIABILITY_BUILD = 87', B86_SHA, B86_TREE, str(B86_PAGES), str(B86_LIVE), "mutation_capability: 'none'"):
    req(token in reliability, f'Build 87 Reliability missing token: {token}')
req('Release 467 • Build 87' in reliability_page and B86_SHA in reliability_page, 'Build 87 Reliability page must expose current/verified identity')

pc = compact(preflight)
for token in ('constBUILD=87;', B86_SHA, B86_TREE, str(B86_PAGES), str(B86_LIVE), "mutation_capability:'none'", "manifest_path:'migrations/canonical/manifest.json'", "applicator:'scripts/d1_migrate.py'"):
    req(token in pc, f'Build 87 Deployment Preflight missing token: {token}')
req('onRequestPost' not in preflight, 'Build 87 Deployment Preflight must remain GET-only')
req('Release 467 Build 87' in preflight_page and B86_SHA in preflight_page, 'Build 87 Deployment Preflight page must expose Build 86 verified baseline')
req(len(re.findall(r'<h1(?:\s|>)', preflight_page, re.I)) == 1, 'Build 87 Deployment Preflight page must retain one H1')

# Human/restart authorities must all carry the same externally verified Build 86 checkpoint.
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body = read(path)
    for token in (B86_SHA, B86_TREE, str(B86_PROOFS['system_gate_run']), str(B86_PROOFS['current_application_quality_run']), str(B86_PROOFS['it_admin_runtime_proof_run']), str(B86_PROOFS['branch_hygiene_run']), str(B86_PAGES), str(B86_LIVE)):
        req(token in body, f'{path} missing verified Build 86 token: {token}')
    req('Build 87' in body, f'{path} must identify Build 87 current candidate')

for token in ('truth-convergence build', B86_SHA, B86_TREE, 'HOLD_EXTERNAL', 'EVIDENCE_DEPENDENT', '0001', '0004', 'may not self-claim'):
    req(token.lower() in doc.lower(), f'Build 87 operating document missing token: {token}')

# Canonical migration authority is unchanged.
req([row.get('file') for row in manifest.get('migrations', [])] == EXPECTED_MIGRATIONS, 'Build 87 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 87 must remain schema-neutral')
req("run_current_contract('scripts/release467_build87_gate.py', 'Release 467 Build 87')" in provenance, 'Current System Gate does not chain Build 87')

for path in ('functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js'):
    run(['node','--check',path], f'JavaScript syntax {path}')
run(['python3','scripts/current_it_release_truth_gate.py'], 'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'], 'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'], 'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'], 'current Deployment Preflight truth')
run(['python3','scripts/release467_build86_gate.py'], 'carried Build 86 closure and diagnostics boundary')

if FAIL:
    print('RELEASE 467 BUILD 87 PRODUCTION AUTHORITY & RESTART CONVERGENCE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('RELEASE 467 BUILD 87 PRODUCTION AUTHORITY & RESTART CONVERGENCE: PASS')
print(f'Build 86 verified Development: {B86_SHA} / {B86_TREE}')
print(f'Build 86 Production: Pages {B86_PAGES} / Live Resources {B86_LIVE}')
print('Current operator surfaces: BUILD 87 CANDIDATE / BUILD 86 VERIFIED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
print('Automatic repair / provider execution / Production business-data overwrite: CLOSED')
