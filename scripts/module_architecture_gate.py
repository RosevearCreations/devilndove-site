#!/usr/bin/env python3
"""Current five-module platform architecture source gate."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
failures = []


def require(condition, message):
    if not condition:
        failures.append(message)


release = json.loads((ROOT / 'development-release.json').read_text(encoding='utf-8'))
expected = ['storefront', 'creators', 'socials', 'financials', 'it-platform']
require([row.get('key') for row in release.get('canonical_modules', [])] == expected, 'release module list drifted')

routes = (ROOT / 'functions/api/_lib/appModuleRoutes.js').read_text(encoding='utf-8')
modules = (ROOT / 'functions/api/_lib/appModules.js').read_text(encoding='utf-8')
session = (ROOT / 'functions/api/_lib/appModuleSessionGuard.js').read_text(encoding='utf-8')
middleware = (ROOT / 'functions/_middleware.js').read_text(encoding='utf-8')
control = (ROOT / 'functions/api/admin/app-modules.js').read_text(encoding='utf-8')

for key in expected:
    require(f"'{key}'" in routes, f'route catalog missing module {key}')
    require(key in modules, f'module authority missing module {key}')
for stale in ('Build 438', 'build: 438'):
    require(stale not in routes + modules + session + middleware + control, f'stale runtime identity remains: {stale}')
for marker in ('/admin/accounting', '/admin/social-publishing', '/admin/it-platform', '/admin/home-carousel', '/admin/creative-process'):
    require(marker in routes, f'canonical route ownership missing {marker}')
require('readUserModuleAccess' in session, 'session guard must load explicit user module access')
require('explicit_user_grant_required' in modules, 'I.T. explicit-user denial path missing')
require("headers.set(RELEASE_HEADER" in middleware, 'current release response header missing')
require('migration_required' in control, 'module control API must expose canonical migration state')
require("MODULE_KEYS.IT_PLATFORM && isAllowed === 1" in control, 'I.T. role-grant protection missing')

print('MODULE ARCHITECTURE GATE')
print('Canonical modules:', ', '.join(expected))
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('MODULE ARCHITECTURE GATE: PASS')
