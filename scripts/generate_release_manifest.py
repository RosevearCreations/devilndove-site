#!/usr/bin/env python3
"""Generate a binary-safe release package manifest with file hashes.

This script is no-network and safe for build zips. It records path, size, mtime,
and SHA-256 for schema files, functions, admin pages, public JS, CSS, Markdown,
and key static JSON files.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INCLUDE_PREFIXES = (
    'functions/', 'admin/', 'public/js/', 'js/', 'css/', 'data/site/'
)
INCLUDE_SUFFIXES = ('.sql', '.md')
SKIP_PARTS = {'.git', 'node_modules', 'archive', '__pycache__'}

def include(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    if rel == 'data/site/release-package-manifest.json':
        return False
    return rel.startswith(INCLUDE_PREFIXES) or rel.endswith(INCLUDE_SUFFIXES)

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
      for chunk in iter(lambda: f.read(1024 * 1024), b''):
        h.update(chunk)
    return h.hexdigest()

def main() -> int:
    files=[]
    for path in sorted(ROOT.rglob('*')):
        if any(part in SKIP_PARTS for part in path.parts):
            continue
        if not path.is_file() or not include(path):
            continue
        stat=path.stat()
        files.append({
            'path': path.relative_to(ROOT).as_posix(),
            'size_bytes': stat.st_size,
            'sha256': sha256(path),
        })
    payload={
        'build_label': 'Build 185',
        'generated_by': 'scripts/generate_release_manifest.py',
        'file_count': len(files),
        'total_size_bytes': sum(item['size_bytes'] for item in files),
        'files': files,
    }
    out=ROOT/'data/site/release-package-manifest.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(json.dumps({'manifest': str(out.relative_to(ROOT)), 'file_count': len(files), 'total_size_bytes': payload['total_size_bytes']}, indent=2))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
