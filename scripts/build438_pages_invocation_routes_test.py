#!/usr/bin/env python3
"""Local-only regression for Build 438 Pages Functions invocation scope."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ROOT / '_routes.json'
MIDDLEWARE = ROOT / 'functions' / '_middleware.js'

required = {
    '/api/*',
    '/admin',
    '/admin/*',
    '/shop',
    '/shop/*',
    '/cart',
    '/cart/*',
    '/checkout',
    '/checkout/*',
    '/product',
    '/product/*',
    '/products',
    '/products/*',
    '/custom-request',
    '/custom-request/*',
    '/members',
    '/members/*',
}

payload = json.loads(ROUTES.read_text(encoding='utf-8'))
includes = set(payload.get('include') or [])
excludes = set(payload.get('exclude') or [])
middleware = MIDDLEWARE.read_text(encoding='utf-8')

checks = [
    ('routes schema version is 1', payload.get('version') == 1),
    ('all module-owned invocation routes are included', required <= includes),
    ('global /* invocation is not enabled', '/*' not in includes),
    ('ordinary informational public pages are not forced through Functions', '/about' not in includes and '/about/*' not in includes and '/gallery' not in includes and '/gallery/*' not in includes),
    ('static asset directories are not forced through Functions', all(route not in includes for route in ('/assets/*', '/css/*', '/js/*', '/public/*'))),
    ('no exclusion overrides the required module-owned routes', not any(route in excludes for route in required)),
    ('route count remains well below the Cloudflare 100-rule ceiling', len(includes) + len(excludes) < 50),
    ('API route remains covered', '/api/*' in includes),
    ('middleware emits Build 438 module-guard diagnostic header', "headers.set('X-DND-Module-Guard', String(BUILD))" in middleware),
    ('middleware emits the resolved direct module key diagnostic', "headers.set('X-DND-Module-Key', moduleKey)" in middleware),
]

failures = []
for index, (label, ok) in enumerate(checks, 1):
    print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
    if not ok:
        failures.append(label)

print()
if failures:
    print(f'BUILD 438 PAGES INVOCATION ROUTES TEST: FAIL ({len(failures)}/{len(checks)} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 438 PAGES INVOCATION ROUTES TEST: PASS ({len(checks)}/{len(checks)})')
print('Admin/module-owned static pages: FUNCTIONS-GUARDED')
print('Transactional Commerce pages: FUNCTIONS-GUARDED')
print('General informational/static pages: STATIC / NOT FORCED THROUGH FUNCTIONS')
print('Live deployment marker: X-DND-Module-Guard / X-DND-Module-Key')
print('Production mutation capability: NONE')
