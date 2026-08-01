#!/usr/bin/env python3
"""Inject the current LocalBusiness JSON-LD into selected public pages.

This is intentionally static and no-network: it reads data/site/local-business-schema.json
and replaces the managed <script id="dd-local-business-jsonld"> block on each target page.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / 'data/site/local-business-schema.json'
TARGETS = [
    'index.html',
    'handmade-jewelry-ontario/index.html',
    'custom-gifts-southern-ontario/index.html',
    'laser-engraving-ontario/index.html',
    'custom-candle-making-ontario/index.html',
    'custom-soap-making-ontario/index.html',
    'polymer-clay-earrings-ontario/index.html',
    'vintage-finds-ontario/index.html',
    'workshop-made-gifts-ontario/index.html',
]
START = '<!-- dd-local-business-jsonld:start -->'
END = '<!-- dd-local-business-jsonld:end -->'

def managed_block(schema: dict) -> str:
    body = json.dumps(schema, indent=2, ensure_ascii=False)
    return f'{START}\n<script type="application/ld+json" id="dd-local-business-jsonld">\n{body}\n</script>\n{END}'

def inject(path: Path, block: str) -> bool:
    text = path.read_text(encoding='utf-8')
    if START in text and END in text:
        before = text.split(START, 1)[0]
        after = text.split(END, 1)[1]
        new_text = before + block + after
    elif '</head>' in text:
        new_text = text.replace('</head>', block + '\n</head>', 1)
    else:
        return False
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        return True
    return False

def main() -> int:
    schema = json.loads(SCHEMA_PATH.read_text(encoding='utf-8'))
    block = managed_block(schema)
    changed = []
    for rel in TARGETS:
        path = ROOT / rel
        if path.exists() and inject(path, block):
            changed.append(rel)
    print(json.dumps({'ok': True, 'schema_path': str(SCHEMA_PATH.relative_to(ROOT)), 'targets': TARGETS, 'changed': changed}, indent=2))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
