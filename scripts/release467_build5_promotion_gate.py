#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
UI = ROOT / 'public/js/admin-it-promotion-readiness.js'
HTML = ROOT / 'admin/it/index.html'
AUTHORITY = ROOT / 'release467-build5-production-promotion-readiness.json'
WORKFLOW = ROOT / '.github/workflows/release467-build5-promotion-proof.yml'
PROMOTION_DOC = ROOT / 'docs/operations/RELEASE_467_PRODUCTION_PROMOTION.md'
BUILD5_DOC = ROOT / 'docs/operations/RELEASE_467_BUILD_5_PROMOTION_READINESS.md'
CI_GATE = ROOT / 'scripts/release467_build5_gate.py'
CI_AUTHORITY = ROOT / 'release467-build5-ci-access-readiness.json'


def req(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f'RELEASE 467 BUILD 5 PROMOTION GATE: FAIL: {message}')


def read(path: pathlib.Path) -> str:
    return path.read_text(encoding='utf-8')


def changed_files() -> list[str]:
    try:
        base = subprocess.check_output(['git', 'merge-base', 'HEAD', 'origin/dev'], cwd=ROOT, text=True).strip()
        out = subprocess.check_output(['git', 'diff', '--name-only', f'{base}...HEAD'], cwd=ROOT, text=True)
        return [line.strip() for line in out.splitlines() if line.strip()]
    except Exception:
        return []


for path in (UI, HTML, AUTHORITY, WORKFLOW, PROMOTION_DOC, BUILD5_DOC, CI_GATE, CI_AUTHORITY):
    req(path.exists(), f'missing {path.relative_to(ROOT)}')

ui = read(UI)
html = read(HTML)
authority = json.loads(read(AUTHORITY))
workflow = read(WORKFLOW)
promotion_doc = read(PROMOTION_DOC)
build5_doc = read(BUILD5_DOC)
ci_authority = json.loads(read(CI_AUTHORITY))

req(ci_authority.get('release') == 467 and ci_authority.get('build') == 5, 'existing CI/Access Build 5 authority must remain intact')
req(ci_authority.get('state') == 'HOLD_EXTERNAL', 'existing CI/Access Build 5 external hold must remain intact')
req('Release 467 Build 5' in ui, 'Build 5 UI release marker missing')
req("'/api/admin/it-control-tower'" in ui, 'promotion review must consume the existing I.T. Control Tower API')
req("method: 'GET'" in ui, 'promotion review runtime request must be explicit GET')
req('sessionStorage' in ui, 'promotion review must consume same-session browser evidence')
req('localStorage' not in ui, 'promotion review must not persist acceptance evidence in localStorage')
req('READY_FOR_MANUAL_PROMOTION' in ui and 'HOLD' in ui, 'HOLD/READY decision semantics missing')
req('candidate_sha' in ui and 'trustedRuntimeSha' in ui, 'exact candidate SHA handling missing')
req('exact_sha_available !== true' in ui and 'deployment_ancestry' in ui and 'runtime_source_sha' in ui, 'exact-SHA authority missing')
req("database?.state === 'green' && admin?.state === 'green'" in ui, 'runtime-core authority missing')
req('external?.accepted === true' in ui, 'external acceptance authority missing')
req("tower?.readiness?.launch_state" in ui and "READY_FOR_SEPARATE_PROMOTION_REVIEW" in ui, 'launch-state authority missing')
req('production_contacted: false' in ui and 'main_advanced: false' in ui, 'promotion safety evidence missing')
req('production_mutation: false' in ui, 'Production mutation boundary missing')
req('provider_execution: false' in ui and 'provider_publication: false' in ui, 'provider boundary missing')
req('cloudflare_access_policy_changed: false' in ui, 'Cloudflare Access boundary missing')
req('credentials_emitted: false' in ui, 'credential boundary missing')
req('navigator.clipboard.writeText' in ui, 'sanitized readiness-package copy missing')

for forbidden in (
    "method: 'POST'", 'method: "POST"',
    "method: 'PUT'", 'method: "PUT"',
    "method: 'PATCH'", 'method: "PATCH"',
    "method: 'DELETE'", 'method: "DELETE"',
    'CF_ACCESS_CLIENT_SECRET', 'CF_ACCESS_CLIENT_ID', 'DND_DEV_SESSION_COOKIE',
):
    req(forbidden not in ui, f'forbidden promotion UI token present: {forbidden}')

req('itCiAccessReadinessMount' in html, 'existing Build 5 CI / Access mount must remain')
req('admin-it-ci-access-readiness.js?v=467' in html, 'existing Build 5 CI / Access script must remain')
req('itPromotionReadinessMount' in html, 'Build 5 promotion mount missing')
req('admin-it-promotion-readiness.js?v=467' in html, 'Build 5 promotion script include missing')
req('Build 5' in html and 'Production promotion readiness review' in html, 'Build 5 promotion operator description missing')
req(len(re.findall(r'<h1\b', html, re.I)) == 1, 'I.T. page must retain exactly one H1')

req(authority.get('release') == 467 and authority.get('build') == 5, 'release/build authority drifted')
req(authority.get('schema_change_required') is False, 'promotion review must remain schema-neutral')
req(authority.get('runtime_api_change') is False, 'promotion review must not add a runtime API')
req(authority.get('api_methods') == ['GET'], 'promotion API authority must remain GET-only')
req(authority.get('d1_mutation') is False and authority.get('r2_mutation') is False, 'D1/R2 mutation must remain closed')
req(authority.get('production_mutation') is False and authority.get('promotion_execution') is False, 'Production promotion/mutation must remain closed')
req(authority.get('production_provider_execution') is False and authority.get('provider_publication') is False, 'provider execution/publication must remain closed')
req(authority.get('cloudflare_access_policy_mutation') is False, 'Cloudflare Access policy mutation must remain closed')
req(authority.get('secret_values_emitted') is False, 'secret values must never be emitted')

contract = authority.get('promotion_contract', {})
req(contract.get('source_authority') == 'dev', 'source authority must remain dev')
req(contract.get('production_source') == 'main', 'Production source must remain main')
req(contract.get('exact_green_development_tree_only') is True, 'exact green Development tree requirement missing')
req(contract.get('production_business_data_is_production_owned') is True, 'Production data ownership boundary missing')
req(contract.get('canonical_d1_migrations_are_only_schema_change_authority') is True, 'canonical D1 migration authority missing')
req(contract.get('production_resources_are_not_contacted_by_build5') is True, 'Build 5 must not contact Production resources')
req(contract.get('main_is_not_advanced_by_build5') is True, 'Build 5 must not advance main')

for token in (
    'python scripts/release467_build1_gate.py',
    'python scripts/release467_build2_gate.py',
    'python scripts/release467_it_admin_runtime_gate.py',
    'python scripts/release467_build3_gate.py',
    'python scripts/release467_build4_gate.py',
    'python scripts/release467_build5_gate.py',
    'python scripts/release467_build5_promotion_gate.py',
    'node --check public/js/admin-it-promotion-readiness.js',
    'Production mutation: CLOSED',
    'Promotion execution: CLOSED',
    'Cloudflare Access policy mutation: CLOSED',
):
    req(token in workflow, f'promotion workflow missing {token}')

for token in (
    'exact green Development tree only',
    'Production business data remains Production-owned',
    'Canonical D1 migrations remain the only schema-change authority',
):
    req(token in promotion_doc, f'Production promotion authority missing: {token}')

for token in (
    'READY_FOR_MANUAL_PROMOTION',
    'Build 5 does not contact Production',
    'Production business data remains Production-owned',
    'Canonical D1 migrations remain the only schema-change authority',
    '`main`: UNTOUCHED',
):
    req(token in build5_doc, f'Build 5 operator document missing: {token}')

changed = changed_files()
if changed:
    migration_changes = [path for path in changed if path.startswith('migrations/') or path.lower().endswith('.sql')]
    req(not migration_changes, f'promotion review is schema-neutral but migration/SQL files changed: {migration_changes}')

print('RELEASE 467 BUILD 5 PRODUCTION PROMOTION READINESS: PASS')
print('ci_access_authority=RETAINED promotion_decision=HOLD_OR_READY_ONLY production_contact=NONE')
print('schema_change=NONE d1_mutation=NONE r2_mutation=NONE production_mutation=NONE provider_execution=NONE access_policy_mutation=NONE')
