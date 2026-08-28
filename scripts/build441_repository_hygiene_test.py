#!/usr/bin/env python3
"""Build 441 legacy hygiene probe retained temporarily for exact Build 445 cleanup inventory."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
archive=ROOT/'docs/archive/build-history'
root_build_docs=sorted(ROOT.glob('BUILD*.md'))
duplicates=[]
for path in root_build_docs:
    archived=archive/path.name
    if archived.exists() and archived.read_bytes()==path.read_bytes():
        duplicates.append(path.name)
print('BUILD 441 REPOSITORY HYGIENE')
print(f'Root BUILD*.md files: {len(root_build_docs)}')
print('ROOT_BUILD_DOC_MANIFEST_BEGIN')
for path in root_build_docs:
    print(path.name)
print('ROOT_BUILD_DOC_MANIFEST_END')
print(f'Exact root/archive duplicates: {len(duplicates)}')
print('Historical evidence authority: docs/archive/build-history + Git history')
if duplicates:
    for name in duplicates: print(f'FAIL — archived duplicate still in root: {name}')
    raise SystemExit(1)
print('BUILD 441 REPOSITORY HYGIENE: PASS')
