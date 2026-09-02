#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
LEDGER_JS = ROOT / 'public/js/admin-it-evidence-ledger.js'
BROWSER_JS = ROOT / 'public/js/admin-it-browser-runtime-acceptance.js'
HTML = ROOT / 'admin/it/index.html'
AUTHORITY = ROOT / 'release467-build4-evidence-acceptance-ledger.json'
WORKFLOW = ROOT / '.github/workflows/release467-build4-proof.yml'


def req(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f'RELEASE 467 BUILD 4 GATE: FAIL: {message}')


def read(path: pathlib.Path) -> str:
    return path.read_text(encoding='utf-8')


def changed_files() -> list[str]:
    try:
        base = subprocess.check_output(['git', 'merge-base', 'HEAD', 'origin/dev'], cwd=ROOT, text=True).strip()
        out = subprocess.check_output(['git', 'diff', '--name-only', f'{base}...HEAD'], cwd=ROOT, text=True)
        return [line.strip() for line in out.splitlines() if line.strip()]
    except Exception:
        return []


for path in (LEDGER_JS, BROWSER_JS, HTML, AUTHORITY, WORKFLOW):
    req(path.exists(), f'missing {path.relative_to(ROOT)}')

ledger = read(LEDGER_JS)
browser = read(BROWSER_JS)
html = read(HTML)
authority = json.loads(read(AUTHORITY))
workflow = read(WORKFLOW)

req('Release 467 Build 4' in ledger, 'Build 4 ledger release marker missing')
req("'/api/admin/it-control-tower'" in ledger, 'ledger must use the existing I.T. Control Tower API')
req("method: 'GET'" in ledger, 'ledger runtime request must be explicit GET')
req('sessionStorage' in ledger, 'ledger must consume same-session browser evidence')
req('localStorage' not in ledger, 'ledger must not persist acceptance evidence in localStorage')
req('MAX_BROWSER_EVIDENCE_AGE_MS' in ledger and '8 * 60 * 60 * 1000' in ledger, 'browser evidence freshness boundary missing')
req("evidence?.target_origin === window.location.origin" in ledger, 'same-origin browser evidence validation missing')
req("evidence?.authority === 'release467-build3-browser-runtime-acceptance'" in ledger, 'Build 3 authority validation missing')
req('ci_service_token_readiness_inferred === false' in ledger, 'ledger must reject browser evidence that infers CI service-token readiness')
req('runtime_source_sha' in ledger and 'exact_sha_available' in ledger, 'exact-SHA evidence visibility missing')
req('external_acceptance' in ledger and 'HOLD' in ledger, 'external acceptance HOLD semantics missing')
req('source_proof_chain' in ledger and 'runtime_ci_query_performed: false' in ledger, 'source proof authority semantics missing')
req('navigator.clipboard.writeText' in ledger, 'sanitized ledger copy missing')
req('credentials_emitted: false' in ledger, 'credential disclosure boundary missing')
req('cloudflare_access_policy_mutation: false' in ledger, 'Cloudflare Access mutation boundary missing')
req('production_mutation: false' in ledger, 'Production mutation boundary missing')
req('provider_execution: false' in ledger and 'provider_publication: false' in ledger, 'provider mutation boundary missing')
req('d1_mutation: false' in ledger and 'r2_mutation: false' in ledger, 'D1/R2 mutation boundary missing')

for forbidden in (
    "method: 'POST'", 'method: "POST"',
    "method: 'PUT'", 'method: "PUT"',
    "method: 'PATCH'", 'method: "PATCH"',
    "method: 'DELETE'", 'method: "DELETE"',
    'devilndove.com',
    'CF_ACCESS_CLIENT_SECRET', 'CF_ACCESS_CLIENT_ID', 'DND_DEV_SESSION_COOKIE',
):
    req(forbidden not in ledger, f'forbidden ledger token present: {forbidden}')

req("const STORAGE_KEY = 'dnd.release467.browserRuntimeEvidence'" in browser, 'Build 3 evidence storage key bridge missing')
req('window.sessionStorage.setItem(STORAGE_KEY' in browser, 'Build 3 same-session evidence persistence missing')
req("new CustomEvent('dnd:browser-runtime-acceptance'" in browser, 'Build 3 ledger refresh event missing')
req('localStorage' not in browser, 'Build 3 browser evidence must remain session-only')
req('ci_service_token_readiness_inferred: false' in browser, 'Build 3 browser proof must not infer CI readiness')

req('itEvidenceLedgerMount' in html, 'Build 4 I.T. mount missing')
req('admin-it-evidence-ledger.js?v=467' in html, 'Build 4 I.T. script include missing')
req('Build 4 consolidates source-proof authorities' in html, 'Build 4 operator description missing')
req(len(re.findall(r'<h1\b', html, re.I)) == 1, 'I.T. page must retain exactly one H1')

req(authority.get('release') == 467 and authority.get('build') == 4, 'release/build authority drifted')
req(authority.get('schema_change_required') is False, 'Build 4 must remain schema-neutral')
req(authority.get('runtime_api_change') is False, 'Build 4 must not add a runtime API')
req(authority.get('api_methods') == ['GET'], 'Build 4 API authority must remain GET-only')
req(authority.get('d1_mutation') is False, 'D1 mutation must remain closed')
req(authority.get('r2_mutation') is False, 'R2 mutation must remain closed')
req(authority.get('production_mutation') is False, 'Production mutation must remain closed')
req(authority.get('production_provider_execution') is False, 'Production provider execution must remain closed')
req(authority.get('provider_publication') is False, 'provider publication must remain closed')
req(authority.get('cloudflare_access_policy_mutation') is False, 'Cloudflare Access policy mutation must remain closed')
req(authority.get('secret_values_emitted') is False, 'secret values must never be emitted')
req(authority.get('browser_evidence', {}).get('storage') == 'sessionStorage', 'browser evidence storage must remain sessionStorage')
req(authority.get('browser_evidence', {}).get('maximum_age_hours') == 8, 'browser evidence maximum age drifted')
req(authority.get('browser_evidence', {}).get('same_origin_required') is True, 'same-origin browser evidence requirement missing')
req(authority.get('browser_evidence', {}).get('ci_service_token_readiness_inferred') is False, 'browser evidence must not infer CI service-token readiness')
req(authority.get('safety_boundary', {}).get('environment') == 'development', 'Development boundary drifted')
req(authority.get('safety_boundary', {}).get('production') == 'FORBIDDEN', 'Production boundary drifted')
req(authority.get('safety_boundary', {}).get('cloudflare_access') == 'NEVER_WEAKENED', 'Cloudflare Access boundary drifted')

source_chain = authority.get('source_proof_chain', [])
for proof in (
    'Release 467 Build 1 Proof',
    'Release 467 Build 2 Proof',
    'Release 467 I.T. Admin Runtime Proof',
    'Release 467 Build 3 Proof',
    'Release 467 Build 4 Proof',
):
    req(proof in source_chain, f'source proof chain missing {proof}')

for token in (
    'python scripts/release467_build1_gate.py',
    'python scripts/release467_build2_gate.py',
    'python scripts/release467_it_admin_runtime_gate.py',
    'python scripts/release467_build3_gate.py',
    'python scripts/release467_build4_gate.py',
    'node --check public/js/admin-it-browser-runtime-acceptance.js',
    'node --check public/js/admin-it-evidence-ledger.js',
    'Production mutation: CLOSED',
    'Cloudflare Access policy mutation: CLOSED',
):
    req(token in workflow, f'Build 4 workflow missing {token}')

changed = changed_files()
if changed:
    migration_changes = [path for path in changed if path.startswith('migrations/') or path.lower().endswith('.sql')]
    req(not migration_changes, f'Build 4 is schema-neutral but migration/SQL files changed: {migration_changes}')

print('RELEASE 467 BUILD 4 I.T. EVIDENCE & ACCEPTANCE LEDGER: PASS')
print('ledger=READ_ONLY browser_evidence=SESSION_ONLY exact_sha=VISIBLE external_acceptance=SEPARATE')
print('schema_change=NONE d1_mutation=NONE r2_mutation=NONE production_mutation=NONE provider_execution=NONE access_policy_mutation=NONE')
