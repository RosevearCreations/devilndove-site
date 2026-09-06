#!/usr/bin/env python3
"""Read-only source inventory for HTML select/datalist population wiring.

A control with meaningful static options is static-populated. An empty control is
considered dynamic-wired when its id/name is referenced by JavaScript or inline script.
Everything else is reported as suspect for targeted runtime review. This audit never
mutates D1, R2, source data, or provider state.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {'.git', 'node_modules', '.wrangler', 'dist', 'coverage', '__pycache__'}
SELECT_RE = re.compile(r'<select\b(?P<attrs>[^>]*)>(?P<body>.*?)</select\s*>', re.I | re.S)
DATALIST_RE = re.compile(r'<datalist\b(?P<attrs>[^>]*)>(?P<body>.*?)</datalist\s*>', re.I | re.S)
OPTION_RE = re.compile(r'<option\b(?P<attrs>[^>]*)>(?P<body>.*?)</option\s*>', re.I | re.S)
SCRIPT_RE = re.compile(r'<script\b[^>]*>(?P<body>.*?)</script\s*>', re.I | re.S)
ATTR_RE = re.compile(r'([:\w-]+)\s*=\s*(["\'])(.*?)\2', re.S)
TAG_RE = re.compile(r'<[^>]+>')


def clean_text(value: str) -> str:
    return re.sub(r'\s+', ' ', TAG_RE.sub('', value or '')).strip()


def attrs(value: str) -> dict[str, str]:
    return {m.group(1).lower(): m.group(3) for m in ATTR_RE.finditer(value or '')}


def source_paths():
    for path in ROOT.rglob('*'):
        if not path.is_file() or any(part in EXCLUDED_PARTS for part in path.parts):
            continue
        if path.suffix.lower() in {'.html', '.js', '.mjs'}:
            yield path


def js_corpus(paths: list[Path]) -> str:
    parts = []
    for path in paths:
        text = path.read_text(encoding='utf-8', errors='replace')
        if path.suffix.lower() in {'.js', '.mjs'}:
            parts.append(text)
        elif path.suffix.lower() == '.html':
            parts.extend(m.group('body') for m in SCRIPT_RE.finditer(text))
    return '\n'.join(parts)


def ref_count(corpus: str, value: str) -> int:
    if not value:
        return 0
    return len(re.findall(re.escape(value), corpus))


def analyze_control(path: Path, kind: str, match, corpus: str) -> dict:
    a = attrs(match.group('attrs'))
    body = match.group('body')
    options = []
    meaningful = []
    for opt in OPTION_RE.finditer(body):
        oa = attrs(opt.group('attrs'))
        label = clean_text(opt.group('body'))
        value = oa.get('value', '')
        item = {'value': value, 'label': label, 'disabled': 'disabled' in opt.group('attrs').lower()}
        options.append(item)
        if value.strip() or (label and not re.search(r'\b(select|choose|loading|none)\b', label, re.I)):
            meaningful.append(item)

    control_id = a.get('id', '')
    control_name = a.get('name', '')
    id_refs = ref_count(corpus, control_id)
    name_refs = ref_count(corpus, control_name) if control_name and control_name != control_id else 0
    static = bool(meaningful)
    dynamic = (not static) and bool(control_id or control_name) and (id_refs + name_refs > 0)
    classification = 'static-populated' if static else ('dynamic-wired' if dynamic else 'suspect-unpopulated')

    return {
        'kind': kind,
        'file': path.relative_to(ROOT).as_posix(),
        'id': control_id,
        'name': control_name,
        'static_option_count': len(options),
        'meaningful_static_option_count': len(meaningful),
        'javascript_reference_count': id_refs + name_refs,
        'classification': classification,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    paths = list(source_paths())
    corpus = js_corpus(paths)
    controls = []
    for path in paths:
        if path.suffix.lower() != '.html':
            continue
        text = path.read_text(encoding='utf-8', errors='replace')
        controls.extend(analyze_control(path, 'select', m, corpus) for m in SELECT_RE.finditer(text))
        controls.extend(analyze_control(path, 'datalist', m, corpus) for m in DATALIST_RE.finditer(text))

    counts = {}
    for row in controls:
        counts[row['classification']] = counts.get(row['classification'], 0) + 1
    suspects = [row for row in controls if row['classification'] == 'suspect-unpopulated']

    payload = {
        'authority': 'dropdown_population_static_audit',
        'files_scanned': len(paths),
        'controls_found': len(controls),
        'classification_counts': counts,
        'suspect_count': len(suspects),
        'suspects': suspects,
        'controls': controls,
        'd1_mutation': False,
        'r2_mutation': False,
        'provider_execution': False,
        'note': 'Dynamic-wired means source wiring exists; runtime population still requires targeted endpoint/runtime acceptance.',
    }
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(json.dumps({k: payload[k] for k in ('files_scanned','controls_found','classification_counts','suspect_count')}, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
