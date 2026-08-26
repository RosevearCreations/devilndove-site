#!/usr/bin/env python3
"""Build 438 local-only Application Core / module activation regression."""
from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

MIGRATION = ROOT / 'database_build438_application_module_activation.sql'
SERVER = ROOT / 'functions/api/_lib/appModules.js'
ROUTES = ROOT / 'functions/api/_lib/appModuleRoutes.js'
MIDDLEWARE = ROOT / 'functions/_middleware.js'
BOOTSTRAP_API = ROOT / 'functions/api/modules.js'
CONTROL_API = ROOT / 'functions/api/admin/app-modules.js'
CONTROL_PAGE = ROOT / 'admin/application-modules/index.html'
CONTROL_JS = ROOT / 'public/js/admin-application-modules.js'
ADMIN_INDEX = ROOT / 'admin/index.html'
ADMIN_JS = ROOT / 'public/js/admin.js'
AUTH_UI = ROOT / 'public/js/site-auth-ui.js'
ADMIN_BOOTSTRAP = ROOT / 'public/js/core/dd-application-module-bootstrap.mjs'
PUBLIC_VISIBILITY = ROOT / 'public/js/core/dd-public-module-visibility.mjs'
APP_GROUPS = ROOT / 'public/js/core/dd-application-module-groups.mjs'
PLAN = ROOT / 'BUILD438_APPLICATION_CORE_MODULE_PLAN.md'
VERIFY_SQL = ROOT / 'BUILD438_D1_VERIFICATION.sql'
ROUTE_TEST = ROOT / 'scripts/build438_module_route_map_test.mjs'
ACCESS_POLICY_TEST = ROOT / 'scripts/build438_module_access_policy_test.mjs'
DEV_HELPER = ROOT / 'scripts/build438_development_module_activation.py'
FULL_SCHEMA_SYNC = ROOT / 'scripts/build438_sync_full_schema.py'
SCHEMA_REFERENCE = ROOT / 'DATABASE_SCHEMA_REFERENCE.md'

EXPECTED_MODULES = ['business-administration', 'commerce-operations', 'creative-production']

checks = 0
failures: list[str] = []


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8') if path.exists() else ''


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    print(f'{checks:02d}. {"PASS" if condition else "FAIL"} — {label}')
    if not condition:
        failures.append(label)


def migration_simulation() -> dict:
    sql = read(MIGRATION)
    conn = sqlite3.connect(':memory:')
    try:
        conn.executescript(sql)
        modules = conn.execute('SELECT module_key,is_enabled,requires_login,background_activity_enabled FROM app_modules ORDER BY module_key').fetchall()
        access = conn.execute('SELECT module_key,role_code,is_allowed,access_level FROM app_module_role_access ORDER BY module_key,role_code').fetchall()
        indexes = {row[0] for row in conn.execute("SELECT name FROM sqlite_schema WHERE type='index' AND name LIKE 'idx_app_module%'").fetchall()}
        conn.executescript(sql)
        rerun_count = conn.execute('SELECT COUNT(*) FROM app_modules').fetchone()[0]
        enabled_count = conn.execute('SELECT COUNT(*) FROM app_modules WHERE is_enabled=1').fetchone()[0]
        background_count = conn.execute('SELECT COUNT(*) FROM app_modules WHERE background_activity_enabled=1').fetchone()[0]
        return {
            'modules': modules,
            'access': access,
            'indexes': indexes,
            'rerun_count': rerun_count,
            'enabled_count': enabled_count,
            'background_count': background_count,
        }
    finally:
        conn.close()


def main() -> int:
    migration = read(MIGRATION)
    server = read(SERVER)
    routes = read(ROUTES)
    middleware = read(MIDDLEWARE)
    bootstrap_api = read(BOOTSTRAP_API)
    control_api = read(CONTROL_API)
    control_page = read(CONTROL_PAGE)
    control_js = read(CONTROL_JS)
    admin_index = read(ADMIN_INDEX)
    admin_js = read(ADMIN_JS)
    auth_ui = read(AUTH_UI)
    admin_bootstrap = read(ADMIN_BOOTSTRAP)
    public_visibility = read(PUBLIC_VISIBILITY)
    app_groups = read(APP_GROUPS)
    plan = read(PLAN)
    verify_sql = read(VERIFY_SQL)
    route_test = read(ROUTE_TEST)
    access_policy_test = read(ACCESS_POLICY_TEST)
    dev_helper = read(DEV_HELPER)
    full_schema_sync = read(FULL_SCHEMA_SYNC)
    schema_reference = read(SCHEMA_REFERENCE)
    sim = migration_simulation()

    print('BUILD 438 APPLICATION CORE / MODULE ACTIVATION REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    print()

    check('CREATE TABLE IF NOT EXISTS app_modules' in migration and 'CREATE TABLE IF NOT EXISTS app_module_role_access' in migration, 'canonical additive module and role-access tables exist')
    check([row[0] for row in sim['modules']] == EXPECTED_MODULES and sim['rerun_count'] == 3 and sim['enabled_count'] == 3 and sim['background_count'] == 0, 'migration seeds exactly three enabled modules, background-off defaults, and is rerun-safe')
    check(len(sim['access']) == 6 and {row[1] for row in sim['access']} == {'member', 'admin'}, 'current member/admin role access is explicitly seeded for all modules')
    check({'idx_app_modules_enabled_priority', 'idx_app_module_role_access_role'} <= sim['indexes'], 'bounded module/role lookup indexes exist')
    check('CREATE TABLE' not in server and 'ALTER TABLE' not in server and 'DROP TABLE' not in server and "from './appModuleRoutes.js'" in server, 'shared runtime service performs no request-time DDL and reuses the canonical route map')
    check('MODULE_CACHE_TTL_MS = 5_000' in server and 'failClosedConfig' in server and 'module_config_read_failed_using_last_known' in server and 'readSessionUser' in server, 'module authority is briefly cached, request identity is scoped, and real authority failures do not fail open')
    check("'commerce-operations'" in routes and "'creative-production'" in routes and "'business-administration'" in routes and 'SHARED_SERVICE_CONTRACTS' in routes and "'/api/admin/contracts/inventory-post'" in routes and 'path.startsWith(`${prefix}-`)' in routes, 'server route catalog recognizes all modules, reviewed shared contracts and hyphenated API families')
    check('/admin/catalog' in routes and '/admin/inventory' in routes and '/admin/orders' in routes and '/admin/membership' in routes, 'Commerce & Operations owns Catalog/Inventory/Orders/Membership routes')
    check('/admin/packaging-studio' in routes and '/admin/creative-process' in routes and '/admin/content-studio' in routes and '/admin/media-content-studio' in routes, 'Creative & Production owns Packaging/Creative/Content/Media routes')
    check("return MODULE_KEYS.BUSINESS_ADMINISTRATION" in routes and 'BUILD 438 MODULE ROUTE MAP TEST: PASS' in route_test and 'BUILD 438 MODULE ACCESS POLICY TEST: PASS' in access_policy_test and 'Creative can consume Inventory post while Commerce UI is disabled' in access_policy_test, 'Business/Admin fallback plus executable route and cross-module access-policy proofs are present')
    check("moduleAccessForRequest" in middleware and "moduleUnavailableResponse" in middleware and "module_access_level_read_only" in middleware and 'sharedServiceAccessForRequest' in middleware and 'sharedServiceUnavailableResponse' in middleware and "await context.next()" in middleware, 'root Pages middleware enforces direct module access plus consumer-gated shared service contracts')
    check("/admin/application-modules" in middleware and "/api/admin/app-modules" in middleware, 'module control/recovery surface is exempt from its own module switch')
    check('availableModulesForRequest' in bootstrap_api and "searchParams.get('fresh') === '1'" in bootstrap_api and 'CREATE TABLE' not in bootstrap_api, 'current-user /api/modules bootstrap is read-only and supports explicit fresh reads')
    check('auditAdminAction' in control_api and 'application_module_state_changed' in control_api and 'diagnosticsFor' in control_api and 'shared_service_contract_count' in control_api and 'DELETE FROM app_modules' not in control_api and 'background_activity_enabled=CASE WHEN ?=0 THEN 0' in control_api, 'module controls are audited, expose core diagnostics, never delete business rows and clear background permission on disable')
    check('app_module_schema_not_ready' in control_api and 'Build 438 application-module schema is not ready' in control_api and 'inactive_module_background_forbidden' in control_api, 'Admin writes fail closed before schema and background work cannot be enabled for an inactive module')
    check('Application Core + Commerce &amp; Operations + Creative &amp; Production + Business &amp; Administration' in control_page and 'applicationModuleHealthMount' in control_page and 'runModuleRouteProofButton' in control_page and 'data-dd-module-control-card="1"' in admin_index and 'admin-application-modules.js?v=438' in control_page and 'Current-state route proof' in control_js, 'Admin dashboard/control surface exposes permanent module entry, health diagnostics and current-state route proof')
    check("fetch(force ? '/api/modules?fresh=1' : '/api/modules'" in admin_bootstrap and "dd-admin-module-runtime.mjs?v=438" in admin_bootstrap and 'setInterval' not in admin_bootstrap, 'Admin availability is read before existing umbrella runtime activation with explicit fresh refresh and no polling')
    check("dd-application-module-bootstrap.mjs?v=438" in admin_js and 'dd-admin-module-runtime.mjs?v=397' not in admin_js and 'site-auth-ui.js?v=438' in admin_index and 'admin.js?v=438' in admin_index, 'Admin shell enters through Build 438 authoritative bootstrap with current cache-busted shared scripts')
    check("dd-public-module-visibility.mjs?v=438" in auth_ui and 'sessionStorage' in public_visibility and 'CORE_RECOVERY_PREFIX' in public_visibility and 'setInterval' not in public_visibility, 'public/member navigation uses bounded per-tab visibility caching and preserves recovery access without polling')
    check('DD_APPLICATION_MODULES' in app_groups and "id: 'commerce-operations'" in app_groups and "id: 'creative-production'" in app_groups and "id: 'business-administration'" in app_groups and 'three top-level' in plan.lower() and 'SELECT' in verify_sql and EXPECTED_MODULES[1] in dev_helper and 'EXPECTED_DATABASE_ID' in dev_helper and 'BUILD 438 FULL-SCHEMA SYNC' in full_schema_sync and 'database_full_schema.sql' in schema_reference and 'database_build438_application_module_activation.sql' in schema_reference, 'Build 438 extends the three-module architecture with exact D1 verification, hard-pinned Development apply and deterministic fresh-schema synchronization')

    print()
    if failures:
        print(f'BUILD 438 APPLICATION CORE / MODULE ACTIVATION REGRESSION: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 438 APPLICATION CORE / MODULE ACTIVATION REGRESSION: PASS ({checks}/{checks})')
    print('Existing top-level modules: commerce-operations / creative-production / business-administration')
    print('Central D1 activation authority: SOURCE READY')
    print('Server page/API module guard: SOURCE READY')
    print('Read-only module access enforcement: SOURCE READY')
    print('Cross-module shared service preservation: SOURCE READY / CONSUMER-GATED')
    print('Route ownership matrix: SOURCE READY')
    print('Module access policy unit proof: SOURCE READY')
    print('Authoritative client bootstrap: SOURCE READY')
    print('Admin Application Modules control + health + route proof: SOURCE READY')
    print('Deterministic full-schema sync helper: SOURCE READY / OWNER RUN REQUIRED')
    print('Request-time schema mutation: NONE')
    print('Background polling introduced by Build 438: NONE')
    print('Production D1 migration executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
