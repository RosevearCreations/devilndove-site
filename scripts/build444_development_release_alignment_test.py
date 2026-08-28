#!/usr/bin/env python3
"""Build 444 release identity, infrastructure authority and inherited runtime alignment guard."""
from __future__ import annotations
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
failures: list[str] = []
doc = json.loads((ROOT / 'development-release.json').read_text(encoding='utf-8'))
release = int(doc.get('release') or 0)
if doc != {'environment': 'development', 'release': 444, 'label': 'Build 444'}:
    failures.append('development-release.json is not exact Build 444 Development authority')

wrangler = (ROOT / 'wrangler.toml').read_text(encoding='utf-8')
for marker in (
    'name = "devilndove-site-dev"',
    'database_name = "devilndove-dev"',
    'bucket_name = "devilndove-toolshed-images-dev"',
    'bucket_name = "devilndove-caip-media-dev"',
):
    if marker not in wrangler:
        failures.append(f'Development infrastructure authority missing: {marker}')

it_page = (ROOT / 'admin/it-platform/index.html').read_text(encoding='utf-8')
if 'Development: Build 444' not in it_page or 'Build 444 current-release authority' not in it_page:
    failures.append('I.T. page is not aligned to Build 444')
if 'admin-it-platform.js?v=444' not in it_page:
    failures.append('I.T. runtime cache version is not Build 444')
if it_page.lower().count('<h1') != 1:
    failures.append('I.T. page must expose exactly one H1')

backend = (ROOT / 'functions/api/admin/infrastructure-readiness.js').read_text(encoding='utf-8')
if "const BUILD = '444';" not in backend:
    failures.append('infrastructure readiness endpoint is not aligned to Build 444')
if 'current_release_sql_required: false' not in backend:
    failures.append('Build 444 no-new-D1-SQL authority missing')

for rel in (
    'database_build443_home_carousel.sql',
    'BUILD443_HOME_CAROUSEL_D1_VERIFICATION.sql',
    'scripts/build443_apply_development_home_carousel.py',
    'database_build442_it_platform_user_access.sql',
    'BUILD442_IT_PLATFORM_D1_VERIFICATION.sql',
    'scripts/build442_apply_development_it_platform.py',
    'functions/api/home-carousel.js',
    'functions/api/admin/home-carousel.js',
    'public/js/home-carousel.js',
    'public/js/admin-home-carousel.js',
):
    if not (ROOT / rel).exists():
        failures.append(f'inherited release artifact missing: {rel}')

version_pattern = re.compile(r'([?&]v=)(\d+)(?:[.-]\w+)?(?=["\'&#\s)]|$)')
runtime = []
runtime.extend(ROOT.glob('*.html'))
runtime.extend((ROOT / 'admin').rglob('*.html'))
runtime.extend((ROOT / 'js').rglob('*.js'))
runtime.extend((ROOT / 'public' / 'js').rglob('*.js'))
runtime.extend((ROOT / 'css').rglob('*.css'))
for path in sorted(set(runtime)):
    text = path.read_text(encoding='utf-8')
    for match in version_pattern.finditer(text):
        if int(match.group(2)) > release:
            failures.append(f'{path.relative_to(ROOT)} uses future cache major {match.group(2)}')

print('BUILD 444 DEVELOPMENT RELEASE ALIGNMENT')
print(f'Runtime files scanned: {len(set(runtime))}')
print('Build 443 exact source checkpoint: c5aa6541ec8574c2054578dce765546af9265f7c')
print('Production mutation capability: NONE')
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('BUILD 444 DEVELOPMENT RELEASE ALIGNMENT: PASS')
