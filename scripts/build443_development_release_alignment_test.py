#!/usr/bin/env python3
"""Build 443 release identity and carousel runtime alignment guard."""
from __future__ import annotations
import json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
failures=[]
doc=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
release=int(doc.get('release') or 0)
if doc != {'environment':'development','release':443,'label':'Build 443'}: failures.append('development-release.json is not exact Build 443 Development authority')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if 'Build 443' not in sw or 'devilndove-shell-v443' not in sw: failures.append('service worker is not aligned to Build 443')
home=(ROOT/'index.html').read_text(encoding='utf-8')
if 'homeHeroCarouselMount' not in home or 'home-carousel.js?v=443' not in home: failures.append('Home carousel runtime is not aligned to Build 443')
admin=(ROOT/'admin/home-carousel/index.html').read_text(encoding='utf-8') if (ROOT/'admin/home-carousel/index.html').exists() else ''
if 'Build 443' not in admin or 'admin-home-carousel.js?v=443' not in admin: failures.append('Home carousel editor is not aligned to Build 443')
for rel in ('database_build443_home_carousel.sql','BUILD443_HOME_CAROUSEL_D1_VERIFICATION.sql','scripts/build443_apply_development_home_carousel.py','functions/api/home-carousel.js','functions/api/admin/home-carousel.js','public/js/home-carousel.js','public/js/admin-home-carousel.js'):
    if not (ROOT/rel).exists(): failures.append(f'Build 443 carousel artifact missing: {rel}')
version_pattern=re.compile(r'([?&]v=)(\d+)(?:\.\d+)?(?=["\'&#\s)]|$)')
runtime=[]
runtime.extend(ROOT.glob('*.html')); runtime.extend((ROOT/'admin').rglob('*.html'))
runtime.extend((ROOT/'js').rglob('*.js')); runtime.extend((ROOT/'public'/'js').rglob('*.js'))
runtime.extend((ROOT/'css').rglob('*.css'))
for path in sorted(set(runtime)):
    text=path.read_text(encoding='utf-8')
    for match in version_pattern.finditer(text):
        if int(match.group(2)) > release:
            failures.append(f'{path.relative_to(ROOT)} uses future cache major {match.group(2)}')
print('BUILD 443 DEVELOPMENT RELEASE ALIGNMENT')
print(f'Runtime files scanned: {len(set(runtime))}')
print('Build 442 exact checkpoint: b8868c9b77ad12de4fee4984274fe80e1d096613')
print('Production mutation capability: NONE')
if failures:
    for i,failure in enumerate(failures,1): print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('BUILD 443 DEVELOPMENT RELEASE ALIGNMENT: PASS')
