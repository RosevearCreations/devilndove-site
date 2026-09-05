#!/usr/bin/env python3
"""Fail-closed Release 467 Build 52 Content Studio render-readiness boundary gate."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def req(ok, message):
    if not ok:
        FAIL.append(message)


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def load(path):
    return json.loads(read(path))


authority = load('release467-build52-content-studio-render-readiness.json')
readiness = read('functions/api/_lib/contentRenderReadiness.js')
endpoint = read('functions/api/admin/content-render-readiness.js')
content_route = read('functions/api/admin/content-studio.js')
ui = read('public/js/admin-content-render-readiness-v52.js')
page = read('admin/content-studio/index.html')

req(authority.get('release') == 467 and authority.get('build') == 52, 'Build 52 authority identity is wrong')
base = authority.get('source_base') or {}
req(base.get('dev_sha') == '3f5e10f4ad005945ed4092b63079b11f62c4d7ee', 'Build 52 must ingest exact Build 51 final dev SHA')
req(base.get('tree_sha') == 'baca33be1a9b0dc888f12c2882f97545faed97a8', 'Build 52 must ingest exact Build 51 final tree SHA')
proofs = base.get('proofs') or {}
req(proofs.get('system_gate_run') == 33932323391, 'Build 52 source base missing final Build 51 System Gate')
req(proofs.get('current_application_quality_run') == 33932323375, 'Build 52 source base missing final Build 51 quality proof')
req(proofs.get('it_admin_runtime_proof_run') == 33932323392, 'Build 52 source base missing final Build 51 I.T. proof')
req(proofs.get('branch_hygiene_run') == 33932323423, 'Build 52 source base missing final Build 51 branch hygiene proof')
req(base.get('proof_state') == 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN', 'Build 52 source base must be exact-head four-proof GREEN')
req(base.get('exact_preview_deployment') is True, 'Build 52 source base must include exact Preview acceptance')
req(authority.get('canonical_d1_migration_count') == 4, 'Build 52 must keep canonical D1 migration count at four')

# Readiness authority must be read-only and explicit.
req('export async function assessContentRenderReadiness' in readiness, 'render readiness assessor export is missing')
req('export async function requireContentRenderReadiness' in readiness, 'fail-closed render readiness assertion export is missing')
for phrase in ('PROJECT_APPROVAL_REQUIRED','DELIVERABLE_APPROVAL_REQUIRED','PUBLIC_MEDIA_CLEARANCE_REQUIRED','ACTIVE_RENDER_JOB_EXISTS','REVIEW_POLICY_REQUIRED'):
    req(phrase in readiness, f'render readiness is missing blocker {phrase}')
req('render_job_creation: false' in readiness and 'provider_execution: false' in readiness and 'publication: false' in readiness, 'render readiness safety boundary is incomplete')
req(not re.search(r'\b(?:INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|CREATE\s+(?:TABLE|INDEX|TRIGGER|VIEW)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW))\b', readiness, re.I), 'render readiness authority must remain read-only')

# Endpoint is GET-only and delegates to the read-only assessor.
req('export async function onRequestGet' in endpoint, 'render readiness endpoint must export GET')
req('onRequestPost' not in endpoint, 'render readiness endpoint must not export POST')
req('assessContentRenderReadiness' in endpoint, 'render readiness endpoint must use the shared assessor')
req('read_only_fail_closed_no_render_job_creation' in endpoint, 'endpoint must state its no-job boundary')

# Active Content Studio route must intercept ready_for_render before the legacy helper can see it.
req("import { requireContentRenderReadiness } from '../_lib/contentRenderReadiness.js';" in content_route, 'Content Studio route must import the Build 52 readiness authority')
ready_pos = content_route.find("if (requestedStatus === 'ready_for_render')")
check_pos = content_route.find('await requireContentRenderReadiness', ready_pos)
safe_save_pos = content_route.find("deliverable_status: 'ready_for_review'", ready_pos)
direct_status_pos = content_route.find("SET deliverable_status='ready_for_render'", ready_pos)
req(ready_pos >= 0, 'Content Studio route must intercept ready_for_render')
req(check_pos > ready_pos, 'Content Studio route must evaluate readiness inside the ready_for_render branch')
req(safe_save_pos > check_pos, 'Content Studio route must not save until readiness passes')
req(direct_status_pos > safe_save_pos, 'Content Studio route must set ready_for_render only after safe review save')
req('INSERT INTO content_render_jobs' not in content_route, 'Content Studio active route must not create render jobs')
req('render_job_created: false' in content_route, 'Content Studio response/event must record that no render job was created')
req('error?.readiness || null' in content_route, 'Content Studio failures must return structured readiness blockers')

# No new caller may bypass the protected route while the retained helper still has historical job-planning behavior.
callers = set()
for path in (ROOT / 'functions' / 'api').rglob('*.js'):
    text = path.read_text(encoding='utf-8')
    if 'updateContentDeliverable(' in text:
        callers.add(path.relative_to(ROOT).as_posix())
req(callers == {'functions/api/_lib/contentAutomationStudio.js', 'functions/api/admin/content-studio.js'}, f'Unexpected updateContentDeliverable caller(s): {sorted(callers)}')

# Admin UI exposes only the GET check.
req('/api/admin/content-render-readiness?' in ui, 'Content Studio UI must call the Build 52 readiness endpoint')
req("method: 'POST'" not in ui and 'method:"POST"' not in ui, 'Build 52 readiness UI must not POST')
req('Check render readiness' in ui, 'Build 52 readiness UI button is missing')
req('admin-content-render-readiness-v52.js' in page, 'Content Studio page must load the Build 52 readiness UI')
req('Nothing publishes or renders automatically.' in page, 'Content Studio page must state the execution boundary')

scope = authority.get('scope') or {}
for key in ('render_job_creation_authorized','renderer_execution_authorized','provider_execution_authorized','publication_authorized','social_queue_expansion_authorized','r2_mutation_authorized','schema_change_authorized','canonical_migration_added','main_mutation_authorized','production_mutation_authorized'):
    req(scope.get(key) is False, f'Build 52 boundary must keep {key}=false')
req(scope.get('ready_for_render_requires_fail_closed_readiness') is True, 'Build 52 must require fail-closed ready_for_render validation')
req(scope.get('render_readiness_is_read_only') is True, 'Build 52 render readiness must remain read-only')
req(scope.get('implicit_render_job_creation_blocked_on_active_route') is True, 'Build 52 must explicitly close implicit render-job creation on the active route')

if FAIL:
    print('CURRENT CONTENT RENDER READINESS GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT CONTENT RENDER READINESS GATE: PASS')
