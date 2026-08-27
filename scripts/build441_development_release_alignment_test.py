#!/usr/bin/env python3
"""Build 441 release identity guard without erasing inherited subsystem provenance."""
from __future__ import annotations
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
failures=[]
doc=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
release=int(doc.get('release') or 0)
if release != 441: failures.append(f'development-release.json release is {release}, expected 441')
if doc.get('environment') != 'development': failures.append('release environment must be development')
if doc.get('label') != 'Build 441': failures.append('release label must be Build 441')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if 'Build 441' not in sw: failures.append('sw.js must identify Build 441')
if 'devilndove-shell-v441' not in sw: failures.append('sw.js cache must be devilndove-shell-v441')
it=ROOT/'admin'/'it-platform'/'index.html'
if not it.exists(): failures.append('admin/it-platform/index.html is missing')
else:
    text=it.read_text(encoding='utf-8')
    if 'Build 441' not in text: failures.append('I.T. hub must identify Build 441')
    if '?v=441' not in text: failures.append('I.T. hub must use Build 441 shell cache busting')
# Build-specific filenames/comments remain provenance. Runtime cache majors may trail
# at 440 until those subsystem assets are touched, but nothing may advertise a future major.
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
print('BUILD 441 DEVELOPMENT RELEASE ALIGNMENT')
print(f'Runtime files scanned: {len(set(runtime))}')
print('Inherited cache majors <= 441: ALLOWED AS SUBSYSTEM PROVENANCE')
print('Cloudflare/D1/R2/provider access: NONE')
if failures:
    for i,f in enumerate(failures,1): print(f'{i:03d}. FAIL — {f}')
    raise SystemExit(1)
print('BUILD 441 DEVELOPMENT RELEASE ALIGNMENT: PASS')
