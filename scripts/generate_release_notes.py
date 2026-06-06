#!/usr/bin/env python3
"""Generate RELEASE_NOTES.md from data/site/release-notes.json.

Build 174 can also read data/site/release-package-manifest.json so release notes include
changed-file and D1 migration summaries backed by the generated package manifest.
"""
from __future__ import annotations
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'data/site/release-notes.json').read_text(encoding='utf-8'))
manifest_path=root/'data/site/release-package-manifest.json'
manifest={}
if manifest_path.exists():
    try:
        manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    except Exception:
        manifest={}
changed=data.get('changed_files',[])
if not changed and manifest.get('files'):
    changed=[item.get('path') for item in manifest.get('files',[]) if item.get('path')]
lines=['# '+data.get('build_label','Release Notes'),'','## Summary','']
lines += [f"- {x}" for x in data.get('summary',[])]
if manifest_path.exists():
    lines += ['', '## Release package manifest', '', '- Static manifest: `data/site/release-package-manifest.json`', '- The manifest is regenerated after release notes so its own hash does not create a documentation loop.']
lines += ['','## Changed files',''] + [f"- `{x}`" for x in changed]
lines += ['','## D1 migration summary',''] + [f"- {x}" for x in data.get('d1_migrations',[])]
post=data.get('post_deploy_actions') or data.get('required_post_deploy_actions') or []
if post:
    lines += ['','## Required post-deploy actions',''] + [f"- {x}" for x in post]
validation=data.get('validation') or []
if validation:
    lines += ['','## Validation',''] + [f"- {x}" for x in validation]
(root/'RELEASE_NOTES.md').write_text('\n'.join(lines)+'\n', encoding='utf-8')
print('RELEASE_NOTES.md generated')
