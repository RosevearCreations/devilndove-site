#!/usr/bin/env python3
"""Lightweight dark-theme regression check for public Devil n Dove sections."""
from pathlib import Path
import re, sys
ROOT = Path(__file__).resolve().parents[1]
TARGETS = [ROOT/'index.html', ROOT/'creations'/'index.html', ROOT/'shop'/'index.html', ROOT/'gift-cards'/'index.html']
BAD = re.compile(r'background\s*:\s*(#fff|#ffffff|white)\b[^;}]*;[^{}]{0,180}color\s*:\s*(#fff|#ffffff|white)', re.I)
issues=[]
for path in TARGETS:
    if not path.exists():
        issues.append(f'Missing target: {path.relative_to(ROOT)}')
        continue
    text=path.read_text(encoding='utf-8', errors='ignore')
    if BAD.search(text): issues.append(f'Light-on-light inline style risk: {path.relative_to(ROOT)}')
css=(ROOT/'css'/'styles.css').read_text(encoding='utf-8', errors='ignore') if (ROOT/'css'/'styles.css').exists() else ''
for selector in ['local-maker-trust','creations-browser','browse-by-collection','collection-direction']:
    if selector not in css: issues.append(f'Missing dark-theme guard selector: {selector}')
if issues:
    print('Dark theme regression: FAIL')
    print('\n'.join(issues))
    sys.exit(1)
print('Dark theme regression: PASS')
