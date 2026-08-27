#!/usr/bin/env python3
"""Fail when a historical root Build Markdown duplicates the established archive."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
archive=ROOT/'docs/archive/build-history'
duplicates=[]
for path in sorted(ROOT.glob('BUILD*.md')):
    archived=archive/path.name
    if archived.exists() and archived.read_bytes()==path.read_bytes():
        duplicates.append(path.name)
print('BUILD 441 REPOSITORY HYGIENE')
print(f'Root BUILD*.md files: {len(list(ROOT.glob("BUILD*.md")))}')
print(f'Exact root/archive duplicates: {len(duplicates)}')
print('Historical evidence authority: docs/archive/build-history + Git history')
if duplicates:
    for name in duplicates: print(f'FAIL — archived duplicate still in root: {name}')
    raise SystemExit(1)
print('BUILD 441 REPOSITORY HYGIENE: PASS')
