#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def load(path):
    return json.loads(read(path))


def req(condition, message):
    if not condition:
        raise SystemExit(message)


authority = load('release467-build53-generated-deliverable-review-state-convergence.json')
helper = read('functions/api/_lib/contentAutomationStudio.js')
route = read('functions/api/admin/content-studio.js')
manifest = load('migrations/canonical/manifest.json')

req(authority.get('release') == 467 and authority.get('build') == 53, 'Build 53 authority identity is wrong')
base = authority.get('source_base') or {}
req(base.get('build') == 52, 'Build 53 must ingest Build 52 as its source base')
req(base.get('dev_sha') == '33ead64048edf0b089b49c4a02783f468dc806a5', 'Build 53 source-base SHA must be the externally proven Build 52 closure head')
req(base.get('tree_sha') == '8c25dfedc31bd27cb7b79429c15b669830e176f8', 'Build 53 source-base tree must be the externally proven Build 52 closure tree')
proofs = base.get('proofs') or {}
req(proofs == {
    'system_gate_run': 33933307193,
    'current_application_quality_run': 33933307182,
    'it_admin_runtime_proof_run': 33933307188,
    'branch_hygiene_run': 33933307190,
}, 'Build 53 must ingest the exact Build 52 final four-proof set')
req(base.get('proof_state') == 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and base.get('exact_preview_deployment') is True, 'Build 52 final closure must be exact-head and Preview proven before Build 53 mutation')

start = helper.index('function deliverableSpecs(')
end = helper.index('export async function ensureContentAutomationSchema', start)
generator = helper[start:end]
required_status_rule = "const baseStatus = usable.length && usable.every((asset) => asset.safety_status === 'public_allowed') ? 'ready_for_review' : 'needs_media_review';"
req(required_status_rule in generator, 'Generated video deliverables must converge to ready_for_review only when all usable media is public-cleared, otherwise needs_media_review')
req("'ready_for_render'" not in generator and '"ready_for_render"' not in generator, 'Generated deliverable specifications must never originate as ready_for_render')
req("deliverable_status, approval_status, generated_by" in helper and 'spec.status' in helper, 'writeDeliverables must persist the converged generated review state')

# Build 52 remains the only guarded transition into ready_for_render on the active Content Studio route.
req("requestedStatus === 'ready_for_render'" in route, 'The active Content Studio route must retain the explicit ready_for_render transition guard')
req('requireContentRenderReadiness' in route, 'The active ready_for_render transition must retain Build 52 fail-closed readiness')
req('render_job_created: false' in route, 'The guarded transition must still record zero render-job creation')

scope = authority.get('scope') or {}
req(scope.get('generated_deliverables_may_start_ready_for_render') is False, 'Build 53 must prohibit generated ready_for_render state')
req(scope.get('ready_for_render_reserved_for_guarded_transition') is True, 'ready_for_render must be reserved for the guarded transition')
req(scope.get('render_job_creation_authorized') is False and scope.get('provider_execution_authorized') is False, 'Build 53 must not authorize render-job/provider execution')
req(scope.get('schema_change_authorized') is False and scope.get('canonical_migration_added') is False, 'Build 53 must remain schema-neutral')

migrations = manifest.get('migrations') or []
req(len(migrations) == 4, f'Canonical migration stream changed unexpectedly: {len(migrations)}')
req(authority.get('canonical_d1_migration_count') == 4, 'Build 53 authority must preserve canonical migration count 4')

print('Build 53 generated deliverable review-state convergence: GREEN')
