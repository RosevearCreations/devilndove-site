#!/usr/bin/env python3
"""Build 445 repository retirement and forward-sanity authority."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
failures: list[str] = []

def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)

release = json.loads((ROOT / 'development-release.json').read_text(encoding='utf-8'))
require(release == {'environment': 'development', 'release': 445, 'label': 'Build 445'}, 'development-release.json is not exact Build 445 Development authority')

root_build_markdown = sorted(path.name for path in ROOT.glob('BUILD*.md'))
require(not root_build_markdown, f'historical Build Markdown remains in repository root: {root_build_markdown[:12]}')
require(not (ROOT / 'docs/archive/build-history').exists(), 'docs/archive/build-history must not ship after Build 445 retirement')
require((ROOT / 'docs/releases/BUILD445_RELEASE_GATE.md').exists(), 'Build 445 release gate missing')

active_workflows = sorted(path.name for path in (ROOT / '.github/workflows').glob('build*-system-gate.yml'))
require(active_workflows == ['build445-system-gate.yml'], f'exactly one current system gate is allowed, got {active_workflows}')

required_carried = (
    'database_build442_it_platform_user_access.sql',
    'BUILD442_IT_PLATFORM_D1_VERIFICATION.sql',
    'scripts/build442_apply_development_it_platform.py',
    'database_build443_home_carousel.sql',
    'BUILD443_HOME_CAROUSEL_D1_VERIFICATION.sql',
    'scripts/build443_apply_development_home_carousel.py',
    'functions/api/admin/infrastructure-readiness.js',
)
for rel in required_carried:
    require((ROOT / rel).exists(), f'current guarded/carry-forward artifact missing: {rel}')

require(not list(ROOT.glob('database_build445*.sql')), 'Build 445 must not add a D1 migration')
require(not list(ROOT.glob('BUILD445*.sql')), 'Build 445 must not add D1 verification SQL')

wrangler = (ROOT / 'wrangler.toml').read_text(encoding='utf-8')
for marker in (
    'name = "devilndove-site-dev"',
    'binding = "DB"',
    'database_name = "devilndove-dev"',
    'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"',
    'binding = "PRODUCT_MEDIA_BUCKET"',
    'bucket_name = "devilndove-toolshed-images-dev"',
    'binding = "CAIP_PRIVATE_MEDIA_BUCKET"',
    'bucket_name = "devilndove-caip-media-dev"',
):
    require(marker in wrangler, f'Development infrastructure authority missing: {marker}')

infra = (ROOT / 'functions/api/admin/infrastructure-readiness.js').read_text(encoding='utf-8')
for marker in ('SELECT 1 AS ok', 'sqlite_master', 'bucket.list({ limit: 1 })', 'd1_write: false', 'r2_write: false', 'provider_write: false'):
    require(marker in infra, f'read-only infrastructure contract missing: {marker}')
for forbidden in ('CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'INSERT INTO', 'DELETE FROM'):
    require(forbidden not in infra.upper(), f'infrastructure readiness contains mutation SQL: {forbidden}')
require('captureRuntimeIncident' not in infra, 'read-only infrastructure readiness must not write incident rows')

version_pattern = re.compile(r'([?&]v=)(\d+)(?:[.-][\w-]+)?(?=["\'&#\s)]|$)')
runtime = []
runtime.extend(ROOT.glob('*.html'))
runtime.extend((ROOT / 'admin').rglob('*.html'))
runtime.extend((ROOT / 'js').rglob('*.js'))
runtime.extend((ROOT / 'public/js').rglob('*.js'))
runtime.extend((ROOT / 'css').rglob('*.css'))
future_versions: list[str] = []
for path in sorted(set(runtime)):
    text = path.read_text(encoding='utf-8')
    for match in version_pattern.finditer(text):
        if int(match.group(2)) > 445:
            future_versions.append(f'{path.relative_to(ROOT)}:{match.group(2)}')
require(not future_versions, f'future cache majors found: {future_versions[:12]}')

root_build_sql = sorted(path.name for path in ROOT.glob('BUILD*.sql'))
print('BUILD 445 REPOSITORY RETIREMENT / FORWARD SANITY')
print(f'Root historical Build Markdown: {len(root_build_markdown)}')
print('Deployable build-history archive: ABSENT' if not (ROOT / 'docs/archive/build-history').exists() else 'Deployable build-history archive: PRESENT')
print(f'Root Build SQL/verifier artifacts retained for executable dependency review: {len(root_build_sql)}')
print(f'Runtime/cache files scanned: {len(set(runtime))}')
print('Build 445 new D1 SQL migration: NONE')
print('Production mutation capability: NONE')
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('BUILD 445 REPOSITORY RETIREMENT / FORWARD SANITY: PASS')
