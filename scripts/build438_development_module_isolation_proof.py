#!/usr/bin/env python3
"""Build 438 Development-only live module isolation proof.

This harness proves the deployed Development control plane rather than only source/D1
shape. It temporarily disables exactly one top-level module at a time, verifies the
public module bootstrap and representative direct route behavior, proves the shared
Core recovery page stays reachable, and always restores the original module state.

Safety:
- hard-pinned through build438_development_module_activation.py to branch dev and
  devilndove-dev UUID dbc1615b-dcbe-4951-973b-b47c99c73bfa;
- refuses to toggle unless the deployed Development site already reports Build 438,
  schema_ready=true, source=d1, exactly three modules, and all three enabled;
- records each enabled route's actual healthy anonymous baseline before any toggle;
- temporary writes touch app_modules only;
- no Product/Inventory/Creative/CAIP/Packaging/Content/Accounting/Order/Member data;
- no Production target/mode exists;
- every module change is restored in a finally block.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import tempfile
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ACTIVATION_HELPER = ROOT / 'scripts' / 'build438_development_module_activation.py'
DEFAULT_BASE_URL = 'https://devilndove-site-dev.pages.dev'
BUILD = 438
CACHE_SETTLE_SECONDS = 7
HTTP_TIMEOUT_SECONDS = 20
EXPECTED_MODULES = (
    'business-administration',
    'commerce-operations',
    'creative-production',
)
REPRESENTATIVE_ROUTES = {
    'commerce-operations': '/shop/',
    'creative-production': '/admin/creative-process/',
    'business-administration': '/admin/accounting/',
}
# The public Commerce page must be directly available while enabled. Admin HTML may
# be served as a JS-authenticated shell (200) or may be blocked server-side for an
# anonymous request (401). Build 438 isolation is proven by the state transition:
# enabled baseline -> 403 module_disabled -> exact enabled baseline after restore.
BASELINE_ALLOWED_STATUS = {
    'commerce-operations': frozenset({200}),
    'creative-production': frozenset({200, 401}),
    'business-administration': frozenset({200, 401}),
}
CORE_RECOVERY_ROUTE = '/admin/application-modules/'


def load_activation_helper():
    spec = importlib.util.spec_from_file_location('build438_dev_activation', ACTIVATION_HELPER)
    if spec is None or spec.loader is None:
        raise SystemExit('STOP: could not load the hard-pinned Build 438 Development helper.')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


activation = load_activation_helper()


def fail(message: str) -> None:
    raise RuntimeError(message)


def clean_base_url(value: str) -> str:
    url = str(value or '').strip().rstrip('/')
    if not url.startswith('https://'):
        fail('Development base URL must use https://')
    return url


def request_text(base_url: str, path: str) -> tuple[int, str]:
    url = f'{base_url}{path}'
    request = Request(
        url,
        headers={
            'User-Agent': 'Devil-n-Dove-Build438-Development-Proof/1.0',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        },
        method='GET',
    )
    try:
        with urlopen(request, timeout=HTTP_TIMEOUT_SECONDS) as response:
            return int(response.status), response.read().decode('utf-8', errors='replace')
    except HTTPError as error:
        body = error.read().decode('utf-8', errors='replace')
        return int(error.code), body
    except URLError as error:
        fail(f'Development HTTP request failed for {url}: {error}')
    raise AssertionError('unreachable')


def read_module_bootstrap(base_url: str) -> dict[str, Any]:
    status, body = request_text(base_url, '/api/modules?fresh=1')
    if status != 200:
        fail(f'/api/modules?fresh=1 returned HTTP {status}; no module state was changed.')
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as error:
        fail(f'/api/modules?fresh=1 did not return JSON: {error}')
    if not isinstance(payload, dict):
        fail('/api/modules?fresh=1 returned an unexpected payload.')
    return payload


def module_map(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    rows = payload.get('modules')
    if not isinstance(rows, list):
        return {}
    return {
        str(row.get('module_key') or ''): row
        for row in rows
        if isinstance(row, dict) and row.get('module_key')
    }


def require_deployed_baseline(base_url: str) -> tuple[dict[str, dict[str, Any]], dict[str, int]]:
    payload = read_module_bootstrap(base_url)
    modules = module_map(payload)
    actual_keys = tuple(sorted(modules))
    expected_keys = tuple(sorted(EXPECTED_MODULES))
    if int(payload.get('build') or 0) != BUILD:
        fail(f'Development site is not serving Build 438 module bootstrap (build={payload.get("build")!r}).')
    if payload.get('schema_ready') is not True:
        fail(f'Development module bootstrap schema_ready is not true: {payload.get("schema_ready")!r}.')
    if str(payload.get('source') or '') != 'd1':
        fail(f'Development module bootstrap source is not d1: {payload.get("source")!r}.')
    if actual_keys != expected_keys:
        fail(f'Development module keys mismatch: {actual_keys!r}.')
    if any(int(modules[key].get('is_enabled') or 0) != 1 for key in EXPECTED_MODULES):
        fail('All three Development modules must be enabled before the isolation proof begins.')
    if any(int(modules[key].get('background_activity_enabled') or 0) != 0 for key in EXPECTED_MODULES):
        fail('All three Development module background permissions must be OFF before the isolation proof begins.')

    core_status, _ = request_text(base_url, CORE_RECOVERY_ROUTE)
    if core_status != 200:
        fail(f'Core recovery route returned HTTP {core_status}; refusing to toggle modules.')

    baseline_statuses: dict[str, int] = {}
    for key in EXPECTED_MODULES:
        route = REPRESENTATIVE_ROUTES[key]
        status, _ = request_text(base_url, route)
        allowed = BASELINE_ALLOWED_STATUS[key]
        if status not in allowed:
            fail(
                f'Enabled baseline route {route} returned HTTP {status}; expected one of '
                f'{sorted(allowed)}. Refusing to toggle modules.'
            )
        baseline_statuses[key] = status
        print(f'BASELINE {key}: {route} -> HTTP {status}')

    return modules, baseline_statuses


def write_module_state(module_key: str, enabled: int, background_enabled: int) -> None:
    if module_key not in EXPECTED_MODULES:
        fail(f'Unknown Build 438 module: {module_key}')
    enabled = 1 if int(enabled) == 1 else 0
    background_enabled = 1 if int(background_enabled) == 1 and enabled == 1 else 0
    sql = (
        'UPDATE app_modules\n'
        f'SET is_enabled={enabled}, background_activity_enabled={background_enabled}, updated_at=CURRENT_TIMESTAMP\n'
        f"WHERE module_key='{module_key}';\n"
    )
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode='w',
            encoding='utf-8',
            suffix='.sql',
            prefix='build438_dev_module_state_',
            delete=False,
        ) as handle:
            handle.write(sql)
            temp_path = Path(handle.name)
        result = activation.run(activation.file_command(temp_path))
        if result.returncode != 0:
            activation.classify_failure(result, f'Build 438 Development state change for {module_key}')
    finally:
        if temp_path is not None:
            try:
                temp_path.unlink(missing_ok=True)
            except OSError:
                pass


def wait_for_module_state(base_url: str, module_key: str, expected_enabled: int) -> dict[str, Any]:
    deadline = time.monotonic() + 20
    last: dict[str, Any] | None = None
    while time.monotonic() < deadline:
        payload = read_module_bootstrap(base_url)
        row = module_map(payload).get(module_key)
        if row is not None:
            last = row
            if int(row.get('is_enabled') or 0) == expected_enabled:
                return row
        time.sleep(2)
    fail(f'{module_key} did not reach is_enabled={expected_enabled}; last={last!r}')
    raise AssertionError('unreachable')


def wait_for_route_status(base_url: str, path: str, expected: int) -> tuple[int, str]:
    deadline = time.monotonic() + 20
    last_status = 0
    last_body = ''
    while time.monotonic() < deadline:
        last_status, last_body = request_text(base_url, path)
        if last_status == expected:
            return last_status, last_body
        time.sleep(2)
    fail(f'{path} did not reach HTTP {expected}; last HTTP status was {last_status}.')
    raise AssertionError('unreachable')


def prove_one_module(
    base_url: str,
    module_key: str,
    original: dict[str, Any],
    baseline_statuses: dict[str, int],
) -> None:
    route = REPRESENTATIVE_ROUTES[module_key]
    original_enabled = int(original.get('is_enabled') or 0)
    original_background = int(original.get('background_activity_enabled') or 0)
    restored = False
    print(f'\n=== {module_key}: DISABLE / BLOCK / RESTORE ===')
    print(f'Enabled route baseline: {route} -> HTTP {baseline_statuses[module_key]}')
    try:
        write_module_state(module_key, 0, 0)
        time.sleep(CACHE_SETTLE_SECONDS)
        disabled = wait_for_module_state(base_url, module_key, 0)
        if int(disabled.get('background_activity_enabled') or 0) != 0:
            fail(f'{module_key} retained background activity while disabled.')

        status, body = wait_for_route_status(base_url, route, 403)
        if 'currently disabled' not in body.lower():
            fail(f'{route} returned 403 but did not identify the module as disabled.')
        print(f'PASS disabled bootstrap: {module_key} is_enabled=0 / background=0')
        print(f'PASS disabled direct route: {route} -> HTTP {status}')

        core_status, _ = request_text(base_url, CORE_RECOVERY_ROUTE)
        if core_status != 200:
            fail(f'Core recovery route failed while {module_key} was disabled: HTTP {core_status}.')
        print(f'PASS Core recovery route while disabled: {CORE_RECOVERY_ROUTE} -> HTTP 200')

        # Other modules must retain their exact recorded enabled-state behavior.
        for other_key in EXPECTED_MODULES:
            if other_key == module_key:
                continue
            other_route = REPRESENTATIVE_ROUTES[other_key]
            expected_status = baseline_statuses[other_key]
            other_status, _ = wait_for_route_status(base_url, other_route, expected_status)
            print(f'PASS unaffected module route: {other_route} -> HTTP {other_status}')
    finally:
        print(f'RESTORE {module_key}: is_enabled={original_enabled} background={original_background}')
        try:
            write_module_state(module_key, original_enabled, original_background)
            time.sleep(CACHE_SETTLE_SECONDS)
            row = wait_for_module_state(base_url, module_key, original_enabled)
            if int(row.get('background_activity_enabled') or 0) != original_background:
                fail(f'{module_key} background state did not restore exactly.')
            expected_status = baseline_statuses[module_key]
            restored_status, _ = wait_for_route_status(base_url, route, expected_status)
            print(f'PASS restored direct route: {route} -> HTTP {restored_status}')
            restored = True
        finally:
            if not restored:
                print(f'CRITICAL: automatic restore proof for {module_key} did not complete successfully.')


def final_exact_state(base_url: str, baseline: dict[str, dict[str, Any]]) -> None:
    payload = read_module_bootstrap(base_url)
    modules = module_map(payload)
    for key in EXPECTED_MODULES:
        before = baseline[key]
        after = modules.get(key) or {}
        for field in ('is_enabled', 'background_activity_enabled'):
            if int(after.get(field) or 0) != int(before.get(field) or 0):
                fail(f'Final Development state drift for {key}.{field}: before={before.get(field)!r} after={after.get(field)!r}')
    print('\nFINAL MODULE STATE: RESTORED / EXACT')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default=DEFAULT_BASE_URL, help='Development Pages base URL.')
    args = parser.parse_args()
    base_url = clean_base_url(args.base_url)

    activation.require_dev_branch()
    activation.require_exact_dev_config()
    activation.auth_check()

    print('BUILD 438 DEVELOPMENT MODULE ISOLATION PROOF')
    print(f'Development site: {base_url}')
    print(f'D1 target: {activation.DATABASE} ({activation.EXPECTED_DATABASE_ID})')
    print('Temporary D1 writes: app_modules ONLY')
    print('Production target capability: NONE')

    baseline, baseline_statuses = require_deployed_baseline(base_url)
    print('BASELINE: PASS / BUILD 438 / D1 / ALL THREE ENABLED / BACKGROUND OFF')
    print(f'BASELINE ROUTE STATUS: {baseline_statuses}')

    failures: list[str] = []
    for module_key in ('commerce-operations', 'creative-production', 'business-administration'):
        try:
            prove_one_module(base_url, module_key, baseline[module_key], baseline_statuses)
        except BaseException as error:
            failures.append(f'{module_key}: {error}')
            print(f'FAIL {module_key}: {error}')
            # Do not start another toggle after any module proof failure.
            break

    try:
        final_exact_state(base_url, baseline)
    except BaseException as error:
        failures.append(f'final restore verification: {error}')
        print(f'FAIL final restore verification: {error}')

    print()
    if failures:
        print(f'BUILD 438 DEVELOPMENT MODULE ISOLATION PROOF: FAIL ({len(failures)} issue(s))')
        for failure in failures:
            print(' -', failure)
        print('Production D1 mutation executed: NO')
        print('PRODUCTION PROMOTION: CLOSED')
        return 1

    print('BUILD 438 DEVELOPMENT MODULE ISOLATION PROOF: PASS (3/3 MODULES)')
    print('Enabled baseline behavior: RECORDED / RESTORED EXACTLY')
    print('Direct module disablement: PROVEN')
    print('Core recovery availability: PROVEN')
    print('Other enabled module routes remain available: PROVEN')
    print('Automatic exact restore: PROVEN')
    print('Business data mutation by proof harness: NONE')
    print('Production D1 mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
