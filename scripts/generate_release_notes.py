#!/usr/bin/env python3
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'data/site/release-notes.json').read_text())
lines=['# '+data.get('build_label','Release Notes'),'','## Summary','']
lines += [f"- {x}" for x in data.get('summary',[])]
lines += ['','## Changed files',''] + [f"- `{x}`" for x in data.get('changed_files',[])]
lines += ['','## D1 migration summary',''] + [f"- {x}" for x in data.get('d1_migrations',[])]
(root/'RELEASE_NOTES.md').write_text('\n'.join(lines)+'\n')
print('RELEASE_NOTES.md generated')
