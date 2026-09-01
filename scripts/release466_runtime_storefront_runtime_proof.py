#!/usr/bin/env python3
"""Assemble Release 466 Build 2 read-only runtime evidence."""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def find_row(payload, required):
    for row in walk(payload):
        if all(key in row for key in required):
            return row
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--d1', required=True)
    parser.add_argument('--synthetic', required=True)
    parser.add_argument('--seo', required=True)
    parser.add_argument('--source-sha', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    d1 = json.loads(Path(args.d1).read_text(encoding='utf-8'))
    synthetic = json.loads(Path(args.synthetic).read_text(encoding='utf-8'))
    seo = json.loads(Path(args.seo).read_text(encoding='utf-8'))
    required = ['runtime_incidents_table', 'search_console_batches_table', 'search_console_rows_table', 'client_runtime_rows', 'rum_rows', 'search_console_rows']
    row = find_row(d1, required)
    failures = []
    if not row:
        failures.append('Development D1 proof row was not found.')
        row = {key: 0 for key in required}
    for key in ('runtime_incidents_table', 'search_console_batches_table', 'search_console_rows_table'):
        if int(row.get(key) or 0) != 1:
            failures.append(f'{key} must equal 1; got {row.get(key)!r}.')
    if synthetic.get('state') == 'RED' or synthetic.get('failures'):
        failures.append(f"Synthetic storefront monitor reported failures: {synthetic.get('failures') or synthetic.get('state')}")
    if not int(seo.get('pages_crawled') or 0):
        failures.append('Production SEO crawler returned zero HTML pages.')

    report = {
        'release': 466,
        'build': 2,
        'source_sha': args.source_sha,
        'state': 'GREEN' if not failures else 'RED',
        'development_schema': {
            'runtime_incidents_table': int(row.get('runtime_incidents_table') or 0),
            'search_console_batches_table': int(row.get('search_console_batches_table') or 0),
            'search_console_rows_table': int(row.get('search_console_rows_table') or 0),
        },
        'observed_counts': {
            'client_runtime_rows': int(row.get('client_runtime_rows') or 0),
            'rum_rows': int(row.get('rum_rows') or 0),
            'search_console_rows': int(row.get('search_console_rows') or 0),
        },
        'synthetic': {
            'state': synthetic.get('state'),
            'routes': len(synthetic.get('observations') or []),
            'warnings': len(synthetic.get('warnings') or []),
            'failures': len(synthetic.get('failures') or []),
        },
        'production_seo': {
            'pages_crawled': int(seo.get('pages_crawled') or 0),
            'sitemap_urls': int(seo.get('sitemap_urls') or 0),
            'issue_counts': seo.get('issue_counts') or {},
            'measurement_only': True,
        },
        'safety': {
            'production_business_mutation': False,
            'production_schema_mutation': False,
            'provider_execution': False,
            'payment_execution': False,
            'search_console_external_authorization_used': False,
        },
        'failures': failures,
    }
    Path(args.output).write_text(json.dumps(report, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2, sort_keys=True))
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
