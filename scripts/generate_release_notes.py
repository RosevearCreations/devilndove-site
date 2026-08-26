#!/usr/bin/env python3
"""Generate RELEASE_NOTES.md from the current release descriptor.

Build 437 uses data/site/current-release.json as the mutable release truth.
Historical data/site/release-notes.json remains preserved as a fallback only when
the current descriptor is absent. Release notes intentionally do not depend on
volatile values from a previously generated manifest because the manifest hashes
RELEASE_NOTES.md; generate notes first, then regenerate the manifest.
"""
from __future__ import annotations

import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
current_path = root / 'data/site/current-release.json'
history_path = root / 'data/site/release-notes.json'
manifest_path = root / 'data/site/release-package-manifest.json'

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

manifest = {}
if manifest_path.exists():
    try:
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    except Exception:
        manifest = {}

release_build = str(data.get('build_label') or 'Release Notes')

changed = data.get('changed_files', [])
if not changed and manifest.get('files'):
    changed = [item.get('path') for item in manifest.get('files', []) if item.get('path')]

lines = ['# ' + release_build]
if data.get('title'):
    lines += ['', '## ' + str(data.get('title'))]
lines += ['', '## Summary', '']
lines += [f"- {x}" for x in data.get('summary', [])]

production = data.get('production_evidence') or {}
if isinstance(production, dict) and production:
    lines += ['', '## Production completion evidence', '']
    evidence_rows = [
        ('Database', production.get('database')),
        ('Database ID', production.get('database_id')),
        ('Backup', production.get('backup_path')),
        ('Backup bytes', production.get('backup_bytes')),
        ('Backup SHA-256', production.get('backup_sha256')),
        ('Rows', f"{production.get('membership_rows_before')} -> {production.get('membership_rows_after')}"),
        ('Queries executed', production.get('queries_executed')),
        ('Final bookmark', production.get('final_bookmark')),
        ('Canonical values preserved', production.get('canonical_values_preserved')),
        ('Canonical sort index columns', production.get('canonical_sort_index_columns')),
        ('Independent read-only postcheck', production.get('independent_read_only_postcheck')),
    ]
    for label, value in evidence_rows:
        if value is not None:
            rendered = json.dumps(value, ensure_ascii=False) if isinstance(value, (list, dict)) else str(value)
            lines.append(f'- {label}: `{rendered}`')

lines += [
    '',
    '## Release package manifest',
    '',
    '- Static manifest: `data/site/release-package-manifest.json`',
    f'- Manifest build label: `{release_build}`',
    '- Manifest source scope: `git_tracked_release_files`',
    '- Generation order: regenerate `RELEASE_NOTES.md` first, then regenerate the manifest so the manifest hashes the final notes.',
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
    'build_label': release_build,
    'manifest_source_scope': 'git_tracked_release_files',
    'next': 'run scripts/generate_release_manifest.py after these notes are final',
    'source': current_path.relative_to(root).as_posix() if current_path.exists() else history_path.relative_to(root).as_posix(),
}, indent=2))
