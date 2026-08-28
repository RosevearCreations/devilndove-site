#!/usr/bin/env python3
"""Release-neutral public SEO structural gate.

Every real public HTML document must expose exactly one source H1. Admin documents are
not public SEO surfaces. Dynamic Storefront carousel code must never manufacture H1s.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
failures: list[str] = []
checked = 0

H1_OPEN = re.compile(r'<h1(?:\s|>)', re.IGNORECASE)
HTML_DOC = re.compile(r'<html(?:\s|>)', re.IGNORECASE)
TITLE = re.compile(r'<title>\s*[^<\s][^<]*</title>', re.IGNORECASE)

for path in sorted(ROOT.rglob('*.html')):
    rel = path.relative_to(ROOT)
    if not rel.parts or rel.parts[0] in {'admin', 'node_modules', 'vendor', 'tests', 'test'}:
        continue
    text = path.read_text(encoding='utf-8', errors='replace')
    if not HTML_DOC.search(text):
        continue
    checked += 1
    count = len(H1_OPEN.findall(text))
    if count != 1:
        failures.append(f'{rel}: expected exactly one <h1>, found {count}')
    if not TITLE.search(text):
        failures.append(f'{rel}: missing non-empty <title>')

carousel_path = ROOT / 'public/js/home-carousel.js'
if not carousel_path.exists():
    failures.append('public/js/home-carousel.js is missing')
else:
    carousel = carousel_path.read_text(encoding='utf-8', errors='replace').lower()
    forbidden = ("<h1", "createelement('h1')", 'createelement("h1")', '.innerhtml = `<h1', '.innerhtml=`<h1')
    for marker in forbidden:
        if marker in carousel:
            failures.append(f'public/js/home-carousel.js may inject an H1 via {marker!r}')

if checked == 0:
    failures.append('no public HTML documents were checked')

print('PUBLIC SEO STRUCTURE GATE')
print(f'Public HTML documents checked: {checked}')
print('H1 policy: exactly one source H1 per public document')
print('Carousel H1 injection: forbidden')
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('PUBLIC SEO STRUCTURE GATE: PASS')
