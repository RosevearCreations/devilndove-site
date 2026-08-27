#!/usr/bin/env python3
"""Build 442 release identity guard without erasing inherited subsystem provenance."""
from __future__ import annotations
import json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
failures=[]
doc=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
release=int(doc.get('release') or 0)
if release != 442: failures.append(f'development-release.json release is {release}, expected 442')
if doc.get('environment') != 'development': failures.append('release environment must be development')
if doc.get('label') != 'Build 442': failures.append('release label must be Build 442')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if 'Build 442' not in sw: failures.append('sw.js must identify Build 442')
if 'devilndove-shell-v442' not in sw: failures.append('sw.js cache must be devilndove-shell-v442')
it=ROOT/'admin'/'it-platform'/'index.html'
if not it.exists(): failures.append('admin/it-platform/index.html is missing')
else:
    text=it.read_text(encoding='utf-8')
    if 'Build 442' not in text: failures.append('I.T. hub must identify Build 442')
    if '?v=442' not in text: failures.append('I.T. hub must use Build 442 shell cache busting')
for rel in ('database_build442_it_platform_user_access.sql','BUILD442_IT_PLATFORM_D1_VERIFICATION.sql','scripts/build442_apply_development_it_platform.py','scripts/build442_it_platform_migration_regression.py'):
    if not (ROOT/rel).exists(): failures.append(f'Build 442 Phase A artifact missing: {rel}')
version_pattern=re.compile(r'([?&]v=)(\d+)(?:\.\d+)?(?=[\"\'&#\s)]|$)')
runtime=[]
runtime.extend(ROOT.glob('*.html')); runtime.extend((ROOT/'admin').rglob('*.html'))
runtime.extend((ROOT/'js').rglob('*.js')); runtime.extend((ROOT/'public'/'js').rglob('*.js'))
runtime.extend((ROOT/'css').rglob('*.css'))
for path in sorted(set(runtime)):
    text=path.read_text(encoding='utf-8')
    for m in version_pattern.finditer(text):
        major=int(m.group(2))
        if major > release:
            line=text.count('\n',0,m.start())+1
            failures.append(f'{path.relative_to(ROOT)}:{line}: future cache major {major} > {release}')
print('BUILD 442 DEVELOPMENT RELEASE ALIGNMENT')
print(f'Runtime files scanned: {len(set(runtime))}')
print('Inherited cache majors <= 442: ALLOWED AS SUBSYSTEM PROVENANCE')
print('Build 442 runtime I.T. enforcement: DELIBERATELY NOT ACTIVE UNTIL D1 PROOF')
print('Cloudflare/D1/R2/provider access: NONE')
if failures:
    for i,f in enumerate(failures,1): print(f'{i:03d}. FAIL — {f}')
    raise SystemExit(1)
print('BUILD 442 DEVELOPMENT RELEASE ALIGNMENT: PASS')
