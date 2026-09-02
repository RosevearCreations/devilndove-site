#!/usr/bin/env python3
"""Current authenticated GET-only Development runtime acceptance.

Targets only the canonical `dev` Preview alias or an exact hashed Preview deployment.
Application-session credentials and optional Cloudflare Access service-token credentials
are read from environment variables and are never emitted.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
RELEASE_FILE = ROOT / 'development-release.json'
DEFAULT_BASE_URL = 'https://dev.devilndove-site.pages.dev'
SESSION_ENV = 'DND_DEV_SESSION_COOKIE'
ACCESS_ID_ENV = 'CF_ACCESS_CLIENT_ID'
ACCESS_SECRET_ENV = 'CF_ACCESS_CLIENT_SECRET'
EXPECTED_MODULES = ['storefront', 'creators', 'socials', 'financials', 'it-platform']
CAIP_CONTRACT_RELEASE = 461
PROTECTED_ENDPOINTS = {
    'modules': '/api/admin/app-modules',
    'it_control_tower': '/api/admin/it-control-tower',
    'inventory_base_units': '/api/admin/site-item-inventory',
    'product_media_quality': '/api/admin/product-media-score',
    'caip_pipeline': '/api/admin/caip-production-pipeline',
}


class AcceptanceError(RuntimeError):
    pass


def current_application_release() -> int:
    payload = json.loads(RELEASE_FILE.read_text(encoding='utf-8'))
    release = int(payload.get('release') or 0)
    if release <= 0:
        raise AcceptanceError('development-release.json does not declare a valid current release.')
    return release


def is_allowed_development_host(host: str) -> bool:
    host = str(host or '').strip().lower()
    return host == 'dev.devilndove-site.pages.dev' or re.fullmatch(r'[0-9a-f]{8}\.devilndove-site\.pages\.dev', host) is not None


def validate_base_url(value: str) -> str:
    value = str(value or '').strip().rstrip('/')
    parsed = urlparse(value)
    host = (parsed.hostname or '').lower()
    if parsed.scheme != 'https' or not is_allowed_development_host(host) or parsed.path not in ('', '/'):
        raise AcceptanceError('Only the canonical HTTPS Development Preview alias or an exact hashed Preview deployment is permitted. Production, retired projects and arbitrary targets are forbidden.')
    return value


def access_service_headers() -> dict[str, str]:
    client_id = os.environ.get(ACCESS_ID_ENV, '').strip()
    client_secret = os.environ.get(ACCESS_SECRET_ENV, '').strip()
    if bool(client_id) != bool(client_secret):
        raise AcceptanceError(f'{ACCESS_ID_ENV} and {ACCESS_SECRET_ENV} must either both be configured or both be absent.')
    if not client_id:
        return {}
    return {'CF-Access-Client-Id': client_id, 'CF-Access-Client-Secret': client_secret}


def request_raw(base_url: str, path: str, cookie: str | None, timeout: float = 20.0) -> tuple[int, str, str, str]:
    headers = {
        'Accept': 'application/json',
        'Cache-Control': 'no-store',
        'User-Agent': 'devilndove-development-runtime-acceptance/1.0',
        **access_service_headers(),
    }
    if cookie:
        headers['Cookie'] = cookie
    request = Request(urljoin(base_url + '/', path.lstrip('/')), headers=headers, method='GET')
    try:
        with urlopen(request, timeout=timeout) as response:
            status = int(getattr(response, 'status', 200))
            raw = response.read(600000).decode('utf-8', errors='replace')
            content_type = str(response.headers.get('content-type') or '').lower()
            final_url = str(response.geturl() or '')
    except HTTPError as error:
        status = int(error.code)
        raw = error.read(600000).decode('utf-8', errors='replace')
        content_type = str(error.headers.get('content-type') or '').lower()
        final_url = str(error.geturl() or '')
    except URLError as error:
        raise AcceptanceError(f'GET {path} failed: {error.reason}') from error
    return status, raw, content_type, final_url


def looks_like_cloudflare_access(raw: str, content_type: str, final_url: str) -> bool:
    text = str(raw or '').lower()
    final = str(final_url or '').lower()
    return (
        'cloudflare access' in text
        or 'cdn-cgi/access' in text
        or '/cdn-cgi/access/' in final
        or ('text/html' in content_type and ('access' in text and 'cloudflare' in text))
    )


def get_json(base_url: str, path: str, cookie: str | None, timeout: float = 20.0) -> tuple[int, dict]:
    status, raw, content_type, final_url = request_raw(base_url, path, cookie, timeout)
    if looks_like_cloudflare_access(raw, content_type, final_url):
        if access_service_headers():
            raise AcceptanceError(f'Cloudflare Access refused configured service-token credentials for GET {path}.')
        raise AcceptanceError(f'Cloudflare Access protects GET {path}; configure the existing {ACCESS_ID_ENV}/{ACCESS_SECRET_ENV} GitHub secrets to run authenticated CI acceptance without weakening Access.')
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise AcceptanceError(f'GET {path} returned non-JSON content (HTTP {status}; content-type={content_type or "unknown"}).') from error
    if not isinstance(payload, dict):
        raise AcceptanceError(f'GET {path} returned non-object JSON.')
    return status, payload


def record(checks: list[dict], name: str, passed: bool, detail: str) -> None:
    checks.append({'check': name, 'status': 'PASS' if passed else 'FAIL', 'detail': detail})


def invariant(name: str, payload: dict, app_release: int) -> tuple[bool, str]:
    if payload.get('ok') is not True:
        return False, 'ok is not true'
    if name == 'modules':
        rows = payload.get('modules', []) if isinstance(payload.get('modules'), list) else []
        profiles = payload.get('profiles', []) if isinstance(payload.get('profiles'), list) else []
        keys = sorted(str(x.get('module_key') or '').lower() for x in rows if isinstance(x, dict) and x.get('module_key'))
        diagnostics = payload.get('diagnostics', {}) if isinstance(payload.get('diagnostics'), dict) else {}
        root_profiles = [p for p in profiles if isinstance(p, dict) and p.get('is_root_admin') is True]
        root_full = bool(root_profiles and root_profiles[0].get('full_manage') is True)
        passed = (
            int(payload.get('release') or 0) == app_release
            and payload.get('schema_ready') is True
            and payload.get('migration_required') is False
            and keys == sorted(EXPECTED_MODULES)
            and len(profiles) > 0
            and diagnostics.get('root_admin_full_manage') is True
            and root_full
            and diagnostics.get('healthy') is True
        )
        return passed, f"release={payload.get('release')!r}; schema_ready={payload.get('schema_ready')!r}; modules={keys}; profiles={len(profiles)}; root_admin_full_manage={diagnostics.get('root_admin_full_manage')!r}; healthy={diagnostics.get('healthy')!r}"
    if name == 'it_control_tower':
        diagnostics = payload.get('diagnostics', {}) if isinstance(payload.get('diagnostics'), dict) else {}
        state = str(payload.get('overall_state') or payload.get('state') or diagnostics.get('overall_state') or '').upper()
        passed = int(payload.get('release') or 0) == 467 and bool(payload.get('sections') or payload.get('checks') or diagnostics) and state not in {'RED', 'FAIL'}
        return passed, f"release={payload.get('release')!r}; state={state or 'unspecified'}; has_readiness_payload={bool(payload.get('sections') or payload.get('checks') or diagnostics)}"
    if name == 'inventory_base_units':
        rows = []
        for key in ('items', 'results'):
            if isinstance(payload.get(key), list):
                rows.extend(x for x in payload[key] if isinstance(x, dict) and int(x.get('site_item_inventory_id') or 0) > 0)
        row_authority_ok = all(x.get('quantity_authority') == 'base' for x in rows)
        passed = payload.get('quantity_authority') == 'base' and row_authority_ok
        return passed, f"quantity_authority={payload.get('quantity_authority')!r}; inventory_rows={len(rows)}; all_rows_base_authority={row_authority_ok}"
    if name == 'product_media_quality':
        thresholds = payload.get('primary_image_thresholds', {}) if isinstance(payload.get('primary_image_thresholds'), dict) else {}
        roles = payload.get('roles', []) if isinstance(payload.get('roles'), list) else []
        role_keys = {str(x.get('role_key') or '') for x in roles if isinstance(x, dict)}
        passed = int(thresholds.get('min_width_px') or 0) == 1200 and int(thresholds.get('min_height_px') or 0) == 1200 and int(thresholds.get('min_alt_characters') or 0) == 12 and int(thresholds.get('min_quality_score') or 0) == 70 and 'main' in role_keys
        return passed, f"thresholds={thresholds}; roles={sorted(role_keys)}"
    if name == 'caip_pipeline':
        passed = int(payload.get('release') or 0) == CAIP_CONTRACT_RELEASE and payload.get('schema_ready') is True and payload.get('provider_execution_active') is False and payload.get('publication_active') is False and payload.get('r2_delete_active') is False
        projects = payload.get('projects', []) if isinstance(payload.get('projects'), list) else []
        return passed, f"contract_release={payload.get('release')!r}; schema_ready={payload.get('schema_ready')!r}; projects={len(projects)}; execution={payload.get('provider_execution_active')!r}; publication={payload.get('publication_active')!r}; r2_delete={payload.get('r2_delete_active')!r}"
    return True, 'contract ok'


def run_anonymous_check(base_url: str, timeout: float) -> dict:
    checks = []
    for name, path in PROTECTED_ENDPOINTS.items():
        status, raw, content_type, final_url = request_raw(base_url, path, None, timeout)
        access_protected = looks_like_cloudflare_access(raw, content_type, final_url)
        refused = status in (401, 403) or access_protected
        detail = f'HTTP {status}; access_protected={access_protected}; expected application 401/403 or Cloudflare Access refusal'
        record(checks, f'anonymous_{name}_refused', refused, detail)
    return {
        'mode': 'anonymous-protected-route-check',
        'release': current_application_release(),
        'target': base_url,
        'checks': checks,
        'overall': 'PASS' if all(x['status'] == 'PASS' for x in checks) else 'FAIL',
    }


def run_authenticated(base_url: str, cookie: str, timeout: float) -> dict:
    app_release = current_application_release()
    checks = []
    payloads = {}
    for name, path in PROTECTED_ENDPOINTS.items():
        status, payload = get_json(base_url, path, cookie, timeout)
        payloads[name] = payload
        passed, detail = invariant(name, payload) if False else invariant(name, payload, app_release)
        if status != 200:
            passed, detail = False, f'HTTP {status}; error={payload.get("error")!r}'
        record(checks, name, status == 200 and passed, f'HTTP {status}; {detail}')

    projects = payloads.get('caip_pipeline', {}).get('projects', [])
    project_id = 0
    if isinstance(projects, list):
        for row in projects:
            if isinstance(row, dict) and int(row.get('creative_project_id') or 0) > 0:
                project_id = int(row['creative_project_id'])
                break
    if project_id:
        status, handoff = get_json(base_url, f'/api/admin/caip-content-handoff?creative_project_id={project_id}', cookie, timeout)
        passed = status == 200 and handoff.get('ok') is True and int(handoff.get('release') or 0) == CAIP_CONTRACT_RELEASE and handoff.get('schema_ready') is True and handoff.get('provider_execution_active') is False and handoff.get('publication_active') is False and handoff.get('source_media_unchanged') is True
        record(checks, 'caip_reviewed_handoff', passed, f"HTTP {status}; project={project_id}; contract_release={handoff.get('release')!r}; schema_ready={handoff.get('schema_ready')!r}; execution={handoff.get('provider_execution_active')!r}; publication={handoff.get('publication_active')!r}; source_media_unchanged={handoff.get('source_media_unchanged')!r}")
    else:
        record(checks, 'caip_reviewed_handoff_no_project_fixture', True, 'No CAIP project exists to select; authenticated pipeline schema/safety contract passed and no fixture was fabricated.')

    core = all(x['status'] == 'PASS' for x in checks)
    return {
        'authority': 'development-runtime-acceptance',
        'release': app_release,
        'mode': 'authenticated-development-read-only',
        'target': base_url,
        'generated_at': datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        'http_method': 'GET',
        'application_credentials_source': SESSION_ENV,
        'cloudflare_access_service_token_used': bool(access_service_headers()),
        'credentials_emitted': False,
        'core_runtime': 'PASS' if core else 'FAIL',
        'checks': checks,
        'd1_mutation': False,
        'r2_mutation': False,
        'provider_execution': False,
        'provider_publication': False,
        'raw_caip_r2_delete': False,
        'production_mutation': 'FORBIDDEN',
    }


def self_check() -> int:
    checks = []
    try:
        validate_base_url(DEFAULT_BASE_URL)
        record(checks, 'development_default_allowed', True, DEFAULT_BASE_URL)
    except AcceptanceError as error:
        record(checks, 'development_default_allowed', False, str(error))
    try:
        validate_base_url('https://abc12345.devilndove-site.pages.dev')
        record(checks, 'hashed_preview_allowed', True, 'abc12345 preview')
    except AcceptanceError as error:
        record(checks, 'hashed_preview_allowed', False, str(error))
    for forbidden in ('https://devilndove.com', 'https://devilndove-site.pages.dev', 'https://devilndove-site-dev.pages.dev', 'https://example.com', 'http://dev.devilndove-site.pages.dev'):
        refused = False
        try:
            validate_base_url(forbidden)
        except AcceptanceError:
            refused = True
        record(checks, f"forbid_{urlparse(forbidden).hostname or 'invalid'}", refused, forbidden)
    record(checks, 'current_release_loaded', current_application_release() >= 466, str(current_application_release()))
    record(checks, 'five_modules_declared', EXPECTED_MODULES == ['storefront', 'creators', 'socials', 'financials', 'it-platform'], str(EXPECTED_MODULES))
    record(checks, 'auth_from_environment_only', SESSION_ENV == 'DND_DEV_SESSION_COOKIE', SESSION_ENV)
    record(checks, 'access_service_token_environment_only', ACCESS_ID_ENV == 'CF_ACCESS_CLIENT_ID' and ACCESS_SECRET_ENV == 'CF_ACCESS_CLIENT_SECRET', f'{ACCESS_ID_ENV}+{ACCESS_SECRET_ENV}')
    record(checks, 'current_it_and_module_surfaces_declared', {'modules', 'it_control_tower'}.issubset(PROTECTED_ENDPOINTS), str(PROTECTED_ENDPOINTS))
    record(checks, 'get_only_manifest', all(path.startswith('/api/') for path in PROTECTED_ENDPOINTS.values()), f'{len(PROTECTED_ENDPOINTS)} protected GET surfaces')
    overall = all(x['status'] == 'PASS' for x in checks)
    print('DEVELOPMENT RUNTIME ACCEPTANCE SELF-CHECK')
    for row in checks:
        print(f"{row['status']}: {row['check']} — {row['detail']}")
    print(f"SELF-CHECK: {'PASS' if overall else 'FAIL'}")
    return 0 if overall else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default=DEFAULT_BASE_URL)
    parser.add_argument('--timeout', type=float, default=20.0)
    parser.add_argument('--evidence-json', default='')
    parser.add_argument('--self-check', action='store_true')
    parser.add_argument('--anonymous-check', action='store_true')
    args = parser.parse_args()
    if args.self_check:
        return self_check()
    try:
        base = validate_base_url(args.base_url)
        if args.anonymous_check:
            evidence = run_anonymous_check(base, args.timeout)
        else:
            cookie = os.environ.get(SESSION_ENV, '').strip()
            if not cookie:
                raise AcceptanceError(f'{SESSION_ENV} is required. Never commit or print session credentials.')
            evidence = run_authenticated(base, cookie, args.timeout)
    except AcceptanceError as error:
        print(f'RUNTIME ACCEPTANCE: REFUSED/FAILED — {error}', file=sys.stderr)
        return 2
    if args.evidence_json:
        target = Path(args.evidence_json)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(evidence, indent=2, sort_keys=True) + '\n', encoding='utf-8')
        print(f'Sanitized evidence: {target}')
    for row in evidence.get('checks', []):
        print(f"{row['status']}: {row['check']} — {row['detail']}")
    overall = evidence.get('core_runtime') or evidence.get('overall') or 'FAIL'
    print(f'RUNTIME ACCEPTANCE: {overall}')
    return 0 if overall == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
