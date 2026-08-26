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
ADMIN_JS = ROOT / 'public/js/admin.js'
AUTH_UI = ROOT / 'public/js/site-auth-ui.js'
ADMIN_BOOTSTRAP = ROOT / 'public/js/core/dd-application-module-bootstrap.mjs'
PUBLIC_VISIBILITY = ROOT / 'public/js/core/dd-public-module-visibility.mjs'
APP_GROUPS = ROOT / 'public/js/core/dd-application-module-groups.mjs'
PLAN = ROOT / 'BUILD438_APPLICATION_CORE_MODULE_PLAN.md'
VERIFY_SQL = ROOT / 'BUILD438_D1_VERIFICATION.sql'

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
    admin_js = read(ADMIN_JS)
    auth_ui = read(AUTH_UI)
    admin_bootstrap = read(ADMIN_BOOTSTRAP)
    public_visibility = read(PUBLIC_VISIBILITY)
    app_groups = read(APP_GROUPS)
    plan = read(PLAN)
    verify_sql = read(VERIFY_SQL)
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
    check('MODULE_CACHE_TTL_MS = 30_000' in server and 'moduleConfigCache' in server and 'readSessionUser' in server, 'non-user module config is bounded-cached while session identity stays request-scoped')
    check("'commerce-operations'" in routes and "'creative-production'" in routes and "'business-administration'" in routes, 'server route catalog recognizes all three existing top-level modules')
    check('/admin/catalog' in routes and '/admin/inventory' in routes and '/admin/orders' in routes and '/admin/membership' in routes, 'Commerce & Operations owns Catalog/Inventory/Orders/Membership routes')
    check('/admin/packaging-studio' in routes and '/admin/creative-process' in routes and '/admin/content-studio' in routes and '/admin/media-content-studio' in routes, 'Creative & Production owns Packaging/Creative/Content/Media routes')
    check("return MODULE_KEYS.BUSINESS_ADMINISTRATION" in routes, 'remaining Admin/platform/accounting/marketing routes fall to Business & Administration')
    check("moduleAccessForRequest" in middleware and "moduleUnavailableResponse" in middleware and "module_access_level_read_only" in middleware and "await context.next()" in middleware, 'root Pages middleware enforces availability plus read-only access levels and cleanly continues allowed requests')
    check("/admin/application-modules" in middleware and "/api/admin/app-modules" in middleware, 'module control/recovery surface is exempt from its own module switch')
    check('availableModulesForRequest' in bootstrap_api and 'CREATE TABLE' not in bootstrap_api and 'UPDATE app_modules' not in bootstrap_api, 'current-user /api/modules bootstrap is read-only')
    check('auditAdminAction' in control_api and 'application_module_state_changed' in control_api and 'DELETE FROM app_modules' not in control_api, 'module state changes are audited and never delete module business rows')
    check('app_module_schema_not_ready' in control_api and 'Build 438 application-module schema is not ready' in control_api, 'Admin writes fail closed until the canonical migration exists')
    check('Application Core + Commerce &amp; Operations + Creative &amp; Production + Business &amp; Administration' in control_page and 'admin-application-modules.js?v=438' in control_page, 'Admin Application Modules control screen is present')
    check("fetch('/api/modules'" in admin_bootstrap and "dd-admin-module-runtime.mjs?v=438" in admin_bootstrap and 'setInterval' not in admin_bootstrap, 'Admin availability is read once before existing umbrella runtime activation with no polling')
    check("dd-application-module-bootstrap.mjs?v=438" in admin_js and 'dd-admin-module-runtime.mjs?v=397' not in admin_js, 'Admin shell now enters through Build 438 authoritative bootstrap')
    check("dd-public-module-visibility.mjs?v=438" in auth_ui and 'setInterval' not in public_visibility, 'public/member navigation receives one lightweight module-visibility pass with no polling')
    check('DD_APPLICATION_MODULES' in app_groups and "id: 'commerce-operations'" in app_groups and "id: 'creative-production'" in app_groups and "id: 'business-administration'" in app_groups and 'three top-level' in plan.lower() and 'SELECT' in verify_sql, 'Build 438 extends the existing three-module architecture and includes read-only D1 verification')

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
    print('Authoritative client bootstrap: SOURCE READY')
    print('Admin Application Modules control: SOURCE READY')
    print('Request-time schema mutation: NONE')
    print('Background polling introduced by Build 438: NONE')
    print('Production D1 migration executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
