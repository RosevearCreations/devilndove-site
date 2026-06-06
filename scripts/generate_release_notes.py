#!/usr/bin/env python3
"""Generate RELEASE_NOTES.md from data/site/release-notes.json.

Build 173 also includes static changed-file and migration summaries so release notes
stay useful when a browser/admin page cannot load.
"""
from __future__ import annotations
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'data/site/release-notes.json').read_text(encoding='utf-8'))
lines=['# '+data.get('build_label','Release Notes'),'','## Summary','']
lines += [f"- {x}" for x in data.get('summary',[])]
lines += ['','## Changed files',''] + [f"- `{x}`" for x in data.get('changed_files',[])]
lines += ['','## D1 migration summary',''] + [f"- {x}" for x in data.get('d1_migrations',[])]
post=data.get('post_deploy_actions') or data.get('required_post_deploy_actions') or []
if post:
    lines += ['','## Required post-deploy actions',''] + [f"- {x}" for x in post]
validation=data.get('validation') or []
if validation:
    lines += ['','## Validation',''] + [f"- {x}" for x in validation]
(root/'RELEASE_NOTES.md').write_text('\n'.join(lines)+'\n', encoding='utf-8')
print('RELEASE_NOTES.md generated')
