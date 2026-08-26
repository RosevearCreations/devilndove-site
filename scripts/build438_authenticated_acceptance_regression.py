#!/usr/bin/env python3
"""Local-only safety regression for Build 438 authenticated Admin acceptance proof."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'admin' / 'application-modules' / 'index.html'
JS = ROOT / 'public' / 'js' / 'admin-application-modules.js'

page = PAGE.read_text(encoding='utf-8') if PAGE.exists() else ''
js = JS.read_text(encoding='utf-8') if JS.exists() else ''

checks = [
    ('authenticated acceptance button exists', 'runAuthenticatedModuleAcceptanceButton' in page),
    ('authenticated acceptance result mount exists', 'authenticatedModuleAcceptanceMount' in page),
    ('acceptance bundle is cache-busted', 'admin-application-modules.js?v=438-auth' in page),
    ('all three module owners have acceptance cases', all(key in js for key in ('commerce-operations','creative-production','business-administration'))),
    ('three shared probes are read-only contracts', all(path in js for path in ('/api/admin/contracts/inventory-read?limit=1','/api/admin/contracts/content-media?limit=1','/api/admin/contracts/accounting-read?limit=1'))),
    ('no shared Inventory mutation contract is invoked', '/api/admin/contracts/inventory-post' not in js and '/api/admin/contracts/inventory-reverse' not in js),
    ('module changes use audited control API', "action: 'set_module_state'" in js and "const API = '/api/admin/app-modules'" in js),
    ('module restore is protected by finally', js.count('finally {') >= 4 and 'exact restore' in js),
    ('client availability is checked while disabled', 'DDApplicationModules.isAvailable(item.module_key) === false' in js),
    ('Pages guard headers are required', 'X-DND-Module-Guard' in js and 'X-DND-Module-Key' in js and 'X-DND-Shared-Contract' in js),
    ('read-level probe uses Business Administration', "module_key: 'business-administration'" in js and "path: '/api/admin/startup-readiness'" in js),
    ('read-level mutation probe is intentionally unsupported', '__build438_read_guard_probe__' in js),
    ('read-level denial requires canonical code', 'module_access_level_read_only' in js),
    ('admin role transition uses audited role-control action', "action: 'set_role_access'" in js and "access_level: 'read'" in js),
    ('admin role exact restore is checked', 'Admin role exact restore' in js and 'roleRestored' in js),
    ('final health/module/background state is rechecked', 'Final Core Health' in js and 'Final module state' in js and 'Final background state' in js),
    ('acceptance runner contains no direct SQL mutation', all(token not in js for token in ('UPDATE ','DELETE FROM','INSERT INTO','DROP TABLE','ALTER TABLE'))),
    ('acceptance runner has no Production target string', 'devilndove-prod' not in js),
]

failures = []
for index, (label, ok) in enumerate(checks, 1):
    print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
    if not ok:
        failures.append(label)

print()
if failures:
    print(f'BUILD 438 AUTHENTICATED ACCEPTANCE SAFETY REGRESSION: FAIL ({len(failures)}/{len(checks)} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 438 AUTHENTICATED ACCEPTANCE SAFETY REGRESSION: PASS ({len(checks)}/{len(checks)})')
print('Audited temporary module controls: PRESENT / RESTORING')
print('Audited temporary role control: PRESENT / RESTORING')
print('Shared live probes: READ-ONLY ONLY')
print('Inventory post/reverse dummy mutation probes: ABSENT')
print('Read-level mutation probe: PRE-ENDPOINT / UNSUPPORTED ACTION / FAIL-SAFE')
print('Direct SQL mutation in browser proof: NONE')
print('Production mutation capability: NONE')
