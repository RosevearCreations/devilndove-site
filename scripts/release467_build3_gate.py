#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
JS_PATH = ROOT / 'public/js/admin-it-browser-runtime-acceptance.js'
HTML_PATH = ROOT / 'admin/it/index.html'
AUTHORITY_PATH = ROOT / 'release467-build3-browser-runtime-acceptance.json'
WORKFLOW_PATH = ROOT / '.github/workflows/release467-build3-proof.yml'


def req(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f'RELEASE 467 BUILD 3 GATE: FAIL: {message}')


def read(path: pathlib.Path) -> str:
    return path.read_text(encoding='utf-8')


def changed_files() -> list[str]:
    try:
        base = subprocess.check_output(['git', 'merge-base', 'HEAD', 'origin/dev'], cwd=ROOT, text=True).strip()
        out = subprocess.check_output(['git', 'diff', '--name-only', f'{base}...HEAD'], cwd=ROOT, text=True)
        return [line.strip() for line in out.splitlines() if line.strip()]
    except Exception:
        return []


for path in (JS_PATH, HTML_PATH, AUTHORITY_PATH, WORKFLOW_PATH):
    req(path.exists(), f'missing {path.relative_to(ROOT)}')

js = read(JS_PATH)
html = read(HTML_PATH)
authority = json.loads(read(AUTHORITY_PATH))
workflow = read(WORKFLOW_PATH)

req("Release 467 Build 3" in js, 'browser runtime script release marker missing')
req("method: 'GET'" in js, 'browser runtime requests must be explicit GET')
req("/api/admin/app-modules" in js, 'module runtime contract missing')
req("/api/admin/it-control-tower" in js, 'I.T. control tower runtime contract missing')
req("/api/admin/site-item-inventory" in js, 'inventory authority runtime contract missing')
req("/api/admin/product-media-score" in js, 'product media runtime contract missing')
req("/api/admin/caip-production-pipeline" in js, 'CAIP runtime contract missing')
req('root_admin_full_manage' in js, 'root-admin full-manage runtime proof missing')
req("quantity_authority === 'base'" in js or "quantity_authority === \"base\"" in js, 'base-unit inventory runtime proof missing')
req('min_quality_score' in js and '1200' in js and 'min_alt_characters' in js, 'product media thresholds runtime proof missing')
req('provider_execution_active === false' in js, 'CAIP provider execution fail-closed proof missing')
req('publication_active === false' in js, 'CAIP publication fail-closed proof missing')
req('r2_delete_active === false' in js, 'CAIP raw R2 delete fail-closed proof missing')
req('credentials_emitted: false' in js, 'sanitized evidence credential boundary missing')
req('ci_service_token_readiness_inferred: false' in js, 'browser proof must not infer CI service-token readiness')
req('production_mutation: false' in js, 'Production mutation boundary missing')
req('navigator.clipboard.writeText' in js, 'sanitized operator evidence copy missing')

for forbidden in (
    "method: 'POST'", 'method: "POST"',
    "method: 'PUT'", 'method: "PUT"',
    "method: 'PATCH'", 'method: "PATCH"',
    "method: 'DELETE'", 'method: "DELETE"',
    'devilndove.com', 'devilndove-site-dev.pages.dev',
    'CF_ACCESS_CLIENT_SECRET', 'CF_ACCESS_CLIENT_ID', 'DND_DEV_SESSION_COOKIE',
):
    req(forbidden not in js, f'forbidden browser runtime token present: {forbidden}')

req('itBrowserRuntimeAcceptanceMount' in html, 'Build 3 I.T. mount missing')
req('admin-it-browser-runtime-acceptance.js?v=467' in html, 'Build 3 browser runtime script include missing')
req('same-origin authenticated browser runtime acceptance' in html.lower(), 'Build 3 operator explanation missing')
req(len(re.findall(r'<h1\b', html, re.I)) == 1, 'I.T. page must retain exactly one H1')

req(authority.get('release') == 467 and authority.get('build') == 3, 'release/build authority drifted')
req(authority.get('schema_change_required') is False, 'Build 3 must remain schema-neutral')
req(authority.get('runtime_api_change') is False, 'Build 3 must not add a runtime API')
req(authority.get('http_methods') == ['GET'], 'Build 3 HTTP authority must remain GET-only')
req(authority.get('d1_mutation') is False, 'D1 mutation must remain closed')
req(authority.get('r2_mutation') is False, 'R2 mutation must remain closed')
req(authority.get('production_mutation') is False, 'Production mutation must remain closed')
req(authority.get('production_provider_execution') is False, 'Production provider execution must remain closed')
req(authority.get('provider_publication') is False, 'provider publication must remain closed')
req(authority.get('cloudflare_access_policy_mutation') is False, 'Cloudflare Access policy mutation must remain closed')
req(authority.get('secret_values_emitted') is False, 'secret values must never be emitted')
req(authority.get('ci_service_token_readiness_inferred_from_browser') is False, 'browser proof cannot infer CI service-token readiness')
req(authority.get('safety_boundary', {}).get('target') == 'current_authenticated_development_origin_only', 'target boundary drifted')
req(authority.get('safety_boundary', {}).get('cloudflare_access') == 'never_weakened', 'Cloudflare Access boundary drifted')

for token in (
    'python scripts/release467_build1_gate.py',
    'python scripts/release467_build2_gate.py',
    'python scripts/release467_it_admin_runtime_gate.py',
    'python scripts/release467_build3_gate.py',
    'node --check public/js/admin-it-browser-runtime-acceptance.js',
    'Production mutation: CLOSED',
    'Cloudflare Access policy mutation: CLOSED',
):
    req(token in workflow, f'Build 3 workflow missing {token}')

changed = changed_files()
if changed:
    migration_changes = [path for path in changed if path.startswith('migrations/') or path.lower().endswith('.sql')]
    req(not migration_changes, f'Build 3 is schema-neutral but migration/SQL files changed: {migration_changes}')

print('RELEASE 467 BUILD 3 AUTHENTICATED BROWSER RUNTIME ACCEPTANCE: PASS')
print('browser_runtime=GET_ONLY same_origin=DEVELOPMENT cloudflare_access=UNCHANGED')
print('schema_change=NONE d1_mutation=NONE r2_mutation=NONE production_mutation=NONE provider_execution=NONE')
