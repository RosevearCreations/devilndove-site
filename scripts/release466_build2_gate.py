#!/usr/bin/env python3
"""Fail-closed source contract for Release 466 Build 2 — Runtime & Storefront Intelligence."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTHORITY = ROOT / 'release466-build2-runtime-storefront-intelligence.json'
FAIL: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        FAIL.append(message)


def text(path: str) -> str:
    target = ROOT / path
    require(target.is_file(), f'missing required file: {path}')
    return target.read_text(encoding='utf-8', errors='replace') if target.is_file() else ''


def main() -> int:
    authority = json.loads(AUTHORITY.read_text(encoding='utf-8')) if AUTHORITY.is_file() else {}
    require(authority.get('release') == 466 and authority.get('build') == 2, 'authority must identify Release 466 Build 2')
    require(authority.get('state') in {'implementation_in_progress', 'development_green'}, 'unexpected Build 2 state')
    require(authority.get('schema_change_required') is False and authority.get('migration') is None, 'Build 2 must remain schema-neutral')
    items = {int(row.get('id', 0)): row for row in authority.get('items', []) if isinstance(row, dict)}
    require(set(items) == {6, 7, 8, 9, 10}, 'Build 2 authority must own exactly items 6–10')
    require(all(items[item].get('status') in {'implementation_in_progress', 'development_green'} for item in items), 'Build 2 item state is outside accepted lifecycle')

    safety = authority.get('safety', {})
    for key in ('production_business_mutation', 'production_schema_mutation', 'provider_execution', 'provider_publication', 'payment_execution', 'inventory_mutation', 'accounting_posting', 'raw_r2_delete', 'request_time_schema_ddl'):
        require(safety.get(key) is False, f'safety flag must remain false: {key}')
    require(safety.get('preview_access_must_remain_enforced') is True, 'Preview Access must remain enforced')
    require(safety.get('main_must_remain_release465_until_deliberate_promotion') is True, 'main boundary must remain Release 465')

    endpoint = text('functions/api/runtime-telemetry.js')
    client = text('public/js/runtime-intelligence.js')
    middleware = text('functions/_middleware.js')
    intelligence = text('functions/api/admin/release466-runtime-storefront-intelligence.js')
    alias = text('functions/api/admin/release-runtime-storefront-intelligence.js')
    cockpit = text('admin/release-control/runtime-storefront-intelligence/index.html')
    cockpit_js = text('public/js/admin-release466-runtime-storefront-intelligence.js')
    synthetic = text('scripts/release466_storefront_synthetic_monitor.py')
    crawler = text('scripts/release466_production_seo_crawler.py')
    workflow = text('.github/workflows/release466-build2-proof.yml')

    for token in ('MAX_BODY_BYTES = 24576', 'sameOriginRequest', 'captureRuntimeIncident', "incident_scope: 'client_runtime'", "incident_scope: 'real_user_performance'", "'Cache-Control': 'no-store'"):
        require(token in endpoint, f'runtime telemetry endpoint missing: {token}')
    require(not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b', endpoint, re.I), 'public telemetry endpoint carries schema DDL')

    for token in ('PerformanceObserver', "addEventListener('error'", "addEventListener('unhandledrejection'", 'largest-contentful-paint', 'layout-shift', "observe('event'", 'navigator.globalPrivacyControl', 'navigator.doNotTrack', 'navigator.sendBeacon', 'RUM_SAMPLE_RATE = 0.15'):
        require(token in client, f'client runtime intelligence missing: {token}')
    require('location.pathname' in client and 'location.search' not in client, 'telemetry must record path without query-string authority')
    require('/public/js/runtime-intelligence.js' in middleware and 'isPublicRuntimeIntelligencePath' in middleware, 'middleware must inject public runtime intelligence and exclude admin')

    for token in ('percentile(values', "incident_scope='client_runtime'", "incident_scope='real_user_performance'", 'search_console_page_queries', 'striking_distance_queries', 'low_ctr_pages', 'release465_source_budget'):
        require(token in intelligence, f'admin intelligence API missing: {token}')
    require(not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b', intelligence, re.I), 'Build 2 intelligence API carries schema DDL')
    require("export { onRequestGet }" in alias, 'I.T. release-route alias must export the read-only intelligence GET')

    require(cockpit.lower().count('<h1') == 1, 'Build 2 cockpit must have exactly one H1')
    require('/api/admin/release-runtime-storefront-intelligence' in cockpit_js, 'cockpit JS must use I.T. release-route API')
    require('/admin/operations/#searchConsoleImportAdminMount' in cockpit, 'cockpit must link to existing Search Console Operations panel')
    require('/admin/operations/#runtimeIncidentsAdminMount' in cockpit, 'cockpit must link to existing Runtime Incidents Operations panel')

    for token in ('method="GET"', 'business_mutations', 'provider_calls', 'read_only'):
        require(token in synthetic, f'synthetic monitor missing read-only contract: {token}')
    require("method='GET'" in crawler and 'production_mutations' in crawler and '--fail-on-seo-errors' in crawler, 'Production SEO crawler must remain read-only and support later promotion gating')

    require('Release 466 Build 2 Proof' in workflow, 'Build 2 proof workflow missing name')
    require('scripts/release466_build2_gate.py' in workflow, 'Build 2 proof workflow must execute Build 2 source gate')
    require('scripts/release466_storefront_synthetic_monitor.py' in workflow, 'Build 2 proof workflow must run synthetic monitor')
    require('scripts/release466_production_seo_crawler.py' in workflow, 'Build 2 proof workflow must run Production SEO crawler')

    release466_migrations = sorted((ROOT / 'migrations/canonical').glob('*466*build2*')) if (ROOT / 'migrations/canonical').is_dir() else []
    require(not release466_migrations, f'Build 2 declared schema-neutral but migration files exist: {[p.name for p in release466_migrations]}')

    print('RELEASE 466 BUILD 2 SOURCE CONTRACT')
    print('Items: 6 synthetic monitoring; 7 client errors; 8 RUM; 9 Production SEO crawler; 10 Search Console/indexing intelligence')
    print('Schema change: NONE')
    print('Production business mutation: ZERO')
    print('Provider/payment execution: ZERO')
    if FAIL:
        print('RELEASE 466 BUILD 2 SOURCE CONTRACT: FAIL')
        for index, message in enumerate(FAIL, 1):
            print(f'{index:03d}. {message}')
        return 1
    print('RELEASE 466 BUILD 2 SOURCE CONTRACT: PASS')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
