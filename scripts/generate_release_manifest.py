#!/usr/bin/env python3
"""Generate a deterministic, binary-safe release package manifest.

The manifest inventories Git-tracked release files only. Local Wrangler state,
backups, validation logs, Python bytecode and other ignored working-tree artifacts
must never change release-package contents from one developer machine to another.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CURRENT_RELEASE = ROOT / 'data/site/current-release.json'
MANIFEST_REL = 'data/site/release-package-manifest.json'
INCLUDE_PREFIXES = (
    'functions/', 'admin/', 'public/js/', 'js/', 'css/', 'assets/', 'data/site/', 'scripts/'
)
INCLUDE_SUFFIXES = ('.sql', '.md')


def build_label() -> str:
    try:
        payload = json.loads(CURRENT_RELEASE.read_text(encoding='utf-8'))
        value = str(payload.get('build_label') or '').strip()
        if value:
            return value
    except Exception:
        pass
    return 'Release'


def include(rel: str) -> bool:
    if rel == MANIFEST_REL:
        return False
    return rel.startswith(INCLUDE_PREFIXES) or rel.endswith(INCLUDE_SUFFIXES)


def tracked_files() -> list[Path]:
    result = subprocess.run(
        ['git', 'ls-files', '-z'],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        raise SystemExit(
            'Release manifest generation requires a Git working tree; '
            f'git ls-files failed: {result.stderr.decode("utf-8", errors="replace").strip()}'
        )

    paths: list[Path] = []
    for raw in result.stdout.split(b'\0'):
        if not raw:
            continue
        rel = raw.decode('utf-8', errors='strict').replace('\\', '/')
        if not include(rel):
            continue
        path = ROOT / rel
        if path.is_file():
            paths.append(path)
    return sorted(paths, key=lambda path: path.relative_to(ROOT).as_posix())


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    files = []
    for path in tracked_files():
        stat = path.stat()
        files.append({
            'path': path.relative_to(ROOT).as_posix(),
            'size_bytes': stat.st_size,
            'sha256': sha256(path),
        })

    payload = {
        'build_label': build_label(),
        'generated_by': 'scripts/generate_release_manifest.py',
        'source_scope': 'git_tracked_release_files',
        'file_count': len(files),
        'total_size_bytes': sum(item['size_bytes'] for item in files),
        'files': files,
    }
    out = ROOT / MANIFEST_REL
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({
        'manifest': str(out.relative_to(ROOT)),
        'build_label': payload['build_label'],
        'source_scope': payload['source_scope'],
        'file_count': len(files),
        'total_size_bytes': payload['total_size_bytes'],
    }, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
