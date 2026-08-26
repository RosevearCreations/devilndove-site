#!/usr/bin/env python3
"""Generate RELEASE_NOTES.md from the current release descriptor.

Build 437 introduces data/site/current-release.json as the small mutable release
truth. Historical data/site/release-notes.json remains preserved and is used as a
fallback only when the current descriptor is absent.
"""
from __future__ import annotations
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
current_path = root / 'data/site/current-release.json'
history_path = root / 'data/site/release-notes.json'

if current_path.exists():
    data = json.loads(current_path.read_text(encoding='utf-8'))
else:
    raw_data = json.loads(history_path.read_text(encoding='utf-8'))
    if isinstance(raw_data, list):
        newest = raw_data[0] if raw_data and isinstance(raw_data[0], dict) else {}
        data = {
            'build_label': newest.get('build', 'Release Notes'),
            'summary': [newest.get('summary', '')] if newest.get('summary') else [],
            'changed_files': [],
            'd1_migrations': [],
            'post_deploy_actions': [],
            'validation': [],
        }
    else:
        data = raw_data if isinstance(raw_data, dict) else {}

manifest_path = root / 'data/site/release-package-manifest.json'
manifest = {}
if manifest_path.exists():
    try:
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    except Exception:
        manifest = {}

changed = data.get('changed_files', [])
if not changed and manifest.get('files'):
    changed = [item.get('path') for item in manifest.get('files', []) if item.get('path')]

lines = ['# ' + data.get('build_label', 'Release Notes')]
if data.get('title'):
    lines += ['', '## ' + str(data.get('title'))]
lines += ['', '## Summary', '']
lines += [f"- {x}" for x in data.get('summary', [])]
if manifest_path.exists():
    lines += [
        '',
        '## Release package manifest',
        '',
        '- Static manifest: `data/site/release-package-manifest.json`',
        f"- Manifest build label: `{manifest.get('build_label', 'not regenerated yet')}`",
        '- Regenerate the manifest after source/release-note changes so hashes are current.',
    ]
lines += ['', '## Changed files', ''] + [f"- `{x}`" for x in changed]
lines += ['', '## D1 migration summary', ''] + [f"- {x}" for x in data.get('d1_migrations', [])]
post = data.get('post_deploy_actions') or data.get('required_post_deploy_actions') or []
if post:
    lines += ['', '## Required post-deploy actions', ''] + [f"- {x}" for x in post]
validation = data.get('validation') or []
if validation:
    lines += ['', '## Validation', ''] + [f"- {x}" for x in validation]

(root / 'RELEASE_NOTES.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(json.dumps({
    'release_notes': 'RELEASE_NOTES.md',
    'build_label': data.get('build_label', 'Release Notes'),
    'source': current_path.relative_to(root).as_posix() if current_path.exists() else history_path.relative_to(root).as_posix(),
}, indent=2))
