#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'release467-build7-external-commercial-acceptance.json'
API = ROOT / 'functions/api/admin/release467-external-commercial-acceptance.js'
LEGACY_API = ROOT / 'functions/api/admin/release466-external-commercial-readiness.js'
UI = ROOT / 'public/js/admin-it-external-commercial-acceptance.js'
HTML = ROOT / 'admin/it/index.html'
HANDOFF = ROOT / 'AI_HANDOFF.md'
WORKFLOW = ROOT / '.github/workflows/release467-build7-proof.yml'
BUILD6_GATE = ROOT / 'scripts/release467_build6_gate.py'


def req(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f'RELEASE 467 BUILD 7 GATE: FAIL: {message}')


def read(path: pathlib.Path) -> str:
    req(path.exists(), f'missing {path.relative_to(ROOT)}')
    return path.read_text(encoding='utf-8')


def changed_files() -> list[str]:
    try:
        base = subprocess.check_output(['git', 'merge-base', 'HEAD', 'origin/dev'], cwd=ROOT, text=True).strip()
        out = subprocess.check_output(['git', 'diff', '--name-only', f'{base}...HEAD'], cwd=ROOT, text=True)
        return [line.strip() for line in out.splitlines() if line.strip()]
    except Exception:
        return []


def main() -> None:
    manifest = json.loads(read(MANIFEST))
    api = read(API)
    read(LEGACY_API)
    ui = read(UI)
    html = read(HTML)
    handoff = read(HANDOFF)
    workflow = read(WORKFLOW)
    read(BUILD6_GATE)

    req(manifest.get('release') == 467 and manifest.get('build') == 7, 'release/build authority drifted')
    req(manifest.get('title') == 'External Commercial Acceptance Bridge', 'unexpected Build 7 title')
    req(manifest.get('state') == 'DEVELOPMENT_CANDIDATE', 'Build 7 source state must remain DEVELOPMENT_CANDIDATE before merge')
    req(manifest.get('source_branch') == 'release467-build7-external-commercial-acceptance', 'Build 7 source branch changed')
    req(manifest.get('source_base_sha') == '493454d50c4a6f3f1ed8eb74e189bc576879a040', 'Build 7 must remain based on the proven Build 6 dev checkpoint')
    req(manifest.get('source_authority') == 'dev', 'Build 7 source authority must remain dev')
    req(manifest.get('runtime_api') == '/api/admin/release467-external-commercial-acceptance', 'Build 7 runtime API path changed')
    req(manifest.get('api_methods') == ['GET'], 'Build 7 runtime API must remain GET-only')
    req(manifest.get('external_acceptance_state') == 'HOLD_EXTERNAL', 'Build 7 must not pre-declare external acceptance')

    expected_lanes = ['caip_private_media', 'stripe_development', 'paypal_sandbox', 'social_oauth']
    req(manifest.get('required_acceptance_lanes') == expected_lanes, 'Build 7 acceptance lane set changed')
    inherited = manifest.get('inherited_release467_authorities') or []
    for authority in (
        'release467-build4-evidence-acceptance-ledger.json',
        'release467-build5-ci-access-readiness.json',
        'release467-build5-production-promotion-readiness.json',
        'release467-build6-access-acceptance-harness.json',
    ):
        req(authority in inherited, f'Build 7 must preserve {authority}')

    bridge = manifest.get('legacy_evidence_bridge') or {}
    req(bridge.get('runtime_authority') == 'release466-external-commercial-readiness', 'legacy runtime bridge authority changed')
    req(bridge.get('reuse_mode') == 'READ_ONLY_WRAPPER', 'legacy evidence bridge must remain read-only')
    req(bridge.get('legacy_production_release_field_is_current_authority') is False, 'legacy Production release must never become current authority')
    req(bridge.get('legacy_production_source_sha_field_is_current_authority') is False, 'legacy Production SHA must never become current authority')
    req(bridge.get('legacy_live_seo_wording_is_current_authority') is False, 'legacy live SEO wording must remain historical only')
    req(bridge.get('historical_authority_is_mutated') is False, 'historical authority must not be mutated by Build 7')

    for key in (
        'schema_change_authorized',
        'request_time_schema_mutation',
        'd1_mutation_authorized',
        'r2_mutation_authorized',
        'provider_execution_authorized',
        'provider_publication_authorized',
        'cloudflare_access_policy_mutation_authorized',
        'main_mutation_authorized',
        'production_mutation_authorized',
        'secret_values_emitted',
    ):
        req(manifest.get(key) is False, f'{key} must remain false')

    required_api_markers = [
        "import { onRequestGet as getLegacyCommercialReadiness } from './release466-external-commercial-readiness.js';",
        "authority: 'release467-external-commercial-acceptance'",
        "reuse_mode: 'READ_ONLY_WRAPPER'",
        'historical_authority_mutated: false',
        'historical_production_release_field_accepted_as_current: false',
        'historical_production_source_sha_field_accepted_as_current: false',
        'historical_live_seo_wording_accepted_as_current: false',
        "production_promotion_authority: 'release467-build5-production-promotion-readiness.json'",
        "cloudflare_access_authority: 'release467-build6-access-acceptance-harness.json'",
        "current_release_authority: 'release467-build7-external-commercial-acceptance.json'",
        "request_method: 'GET'",
        'provider_execution: false',
        'provider_publication: false',
        'production_mutation: false',
        'secret_values_emitted: false',
        '/admin/release-control/external-commercial-readiness/#provider-acceptance-runner',
        '/admin/runtime-acceptance/',
        '/admin/it-integrations/',
    ]
    for marker in required_api_markers:
        req(marker in api, f'Build 7 API marker missing: {marker}')

    for forbidden in (
        'onRequestPost', 'onRequestPut', 'onRequestPatch', 'onRequestDelete',
        'STRIPE_SECRET_KEY', 'PAYPAL_SECRET', 'CF_ACCESS_CLIENT_SECRET',
        'paymentExecutionStatus(', 'fetch("https://api.stripe.com', "fetch('https://api.stripe.com",
    ):
        req(forbidden not in api, f'forbidden Build 7 API behavior found: {forbidden}')

    req('itExternalCommercialAcceptanceMount' in html, 'Build 7 I.T. mount missing')
    req('/public/js/admin-it-external-commercial-acceptance.js?v=467' in html, 'Build 7 I.T. script missing')
    req('itAccessAcceptanceHarnessMount' in html, 'Build 6 Access acceptance mount must remain')
    req('/public/js/admin-it-access-acceptance-harness.js?v=467' in html, 'Build 6 Access acceptance script must remain')
    req('itPromotionReadinessMount' in html, 'Build 5 promotion mount must remain')
    req('/public/js/admin-it-promotion-readiness.js?v=467' in html, 'Build 5 promotion script must remain')
    req('Build 7' in html and 'external commercial acceptance' in html.lower(), 'Build 7 operator context missing from I.T. page')
    req(len(re.findall(r'<h1\b', html, re.I)) == 1, 'I.T. page must retain exactly one H1')

    required_ui_markers = [
        'Release 467 · Build 7',
        '/api/admin/release467-external-commercial-acceptance',
        "method:'GET'",
        'Stripe Development',
        'PayPal sandbox',
        'CAIP private media',
        'Social / OAuth',
        'Build 7 performs no provider action.',
        'Cloudflare Access service-token acceptance remains Build 6.',
        'Production Promotion Readiness remains Build 5.',
        '/admin/release-control/external-commercial-readiness/#provider-acceptance-runner',
        '/admin/runtime-acceptance/',
        '/admin/it-integrations/',
    ]
    for marker in required_ui_markers:
        req(marker in ui, f'Build 7 UI marker missing: {marker}')

    for forbidden in (
        "method:'POST'", 'method:"POST"', "method: 'POST'", 'method: "POST"',
        "method:'PUT'", "method:'PATCH'", "method:'DELETE'",
        'localStorage.setItem', 'sessionStorage.setItem',
        'CF-Access-Client-Secret', 'STRIPE_SECRET_KEY', 'PAYPAL_SECRET',
    ):
        req(forbidden not in ui, f'forbidden Build 7 browser behavior found: {forbidden}')

    # Preserve Build 7's handoff contract while allowing a newer Release 467 build to become current.
    forward_release467 = 'Release 467 Build 8' in handoff or 'Release 467 Build 9' in handoff
    if forward_release467:
        req('Release 467 Build 7' in handoff, 'forward handoff must retain Build 7 predecessor authority')
        req('External Commercial Acceptance Bridge' in handoff, 'forward handoff must retain Build 7 title/context')
        req('HOLD_EXTERNAL' in handoff, 'forward handoff must retain external hold semantics')
        req('Build 5' in handoff and 'Production Promotion Readiness' in handoff, 'forward handoff must retain Build 5 promotion authority')
        req('Build 6' in handoff and 'Cloudflare Access' in handoff, 'forward handoff must retain Build 6 Access authority')
        req('development-release.json' in handoff and 'INHERITED_REGRESSION_COMPATIBILITY' in handoff, 'forward handoff must fence inherited Release 466 compatibility evidence')
        req('Release 466' in handoff, 'forward handoff must explain inherited Release 466 compatibility rather than silently deleting it')
    else:
        req('Release 467 Build 7' in handoff, 'canonical handoff has not converged to Build 7')
        req('External Commercial Acceptance Bridge' in handoff, 'Build 7 handoff title missing')
        req('HOLD_EXTERNAL' in handoff, 'Build 7 handoff must retain external hold semantics')
        req('Build 5 — CI / Cloudflare Access readiness' in handoff, 'Build 5 CI / Access handoff authority must remain')
        req('Production Promotion Readiness' in handoff, 'Build 5 promotion handoff authority must remain')
        req('Release 467 Build 6' in handoff, 'Build 6 handoff authority must remain')
        req('Release 466' not in handoff.split('## Historical authority', 1)[0], 'stale Release 466 current authority remains in handoff')

    for marker in (
        'python scripts/release467_build6_gate.py',
        'python scripts/release467_build7_gate.py',
        'node --check functions/api/admin/release467-external-commercial-acceptance.js',
        'node --check public/js/admin-it-external-commercial-acceptance.js',
        'Provider execution: NONE',
        'Production mutation: NONE',
        'Historical readiness authority mutation: NONE',
    ):
        req(marker in workflow, f'Build 7 workflow marker missing: {marker}')

    changed = changed_files()
    if changed:
        forbidden_changes = [path for path in changed if path.startswith('migrations/') or path.lower().endswith('.sql')]
        req(not forbidden_changes, f'Build 7 is schema-neutral but migration/SQL files changed: {forbidden_changes}')
        historical_mutations = [path for path in changed if path in {
            'functions/api/admin/release466-external-commercial-readiness.js',
            'public/js/admin-release466-external-commercial-readiness.js',
            'scripts/release466_build4_gate.py',
        }]
        req(not historical_mutations, f'Build 7 must bridge, not rewrite, historical external readiness authority: {historical_mutations}')

    print('Release 467 Build 7 External Commercial Acceptance Bridge: PASS')
    print('Build 6 Access acceptance authority: RETAINED')
    print('Build 5 Production Promotion Readiness authority: RETAINED')
    print('Historical readiness authority mutation: NONE')
    print('Schema change: NONE')
    print('D1/R2 mutation: NONE')
    print('Provider execution: NONE')
    print('Provider publication: NONE')
    print('Cloudflare Access policy mutation: NONE')
    print('Production mutation: NONE')
    print('External commercial acceptance: HOLD_EXTERNAL unless inherited runtime evidence proves all four lanes')


if __name__ == '__main__':
    main()
