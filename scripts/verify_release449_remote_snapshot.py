#!/usr/bin/env python3
"""Verify a read-only Release 449 Development D1 snapshot exported by Wrangler."""
from __future__ import annotations

import json
import sys
from pathlib import Path

EXPECTED_TABLE_COUNT = 7
EXPECTED_PROVIDER_COUNT = 7


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def main(argv):
    if len(argv) != 2:
        raise SystemExit('usage: verify_release449_remote_snapshot.py snapshot.json')
    data = json.loads(Path(argv[1]).read_text(encoding='utf-8'))
    row = next((item for item in walk(data) if 'release449_table_count' in item), None)
    if not row:
        raise SystemExit('FAIL — Release 449 snapshot row not found')

    table_count = int(row.get('release449_table_count') or 0)
    provider_count = int(row.get('provider_seed_count') or 0)
    etsy_safe = int(row.get('etsy_draft_only_count') or 0)
    accounting_count = int(row.get('accounting_authority_table_count') or 0)
    secret_columns = int(row.get('provider_secret_column_count') or 0)
    publication_capable = int(row.get('etsy_publish_capable_count') or 0)

    if table_count != EXPECTED_TABLE_COUNT:
        raise SystemExit(f'FAIL — expected {EXPECTED_TABLE_COUNT} Release 449 tables; found {table_count}')
    if provider_count != EXPECTED_PROVIDER_COUNT:
        raise SystemExit(f'FAIL — expected {EXPECTED_PROVIDER_COUNT} provider setup rows; found {provider_count}')
    if etsy_safe != 1:
        raise SystemExit('FAIL — Etsy must have exactly one draft_only, publication_allowed=0 authority row')
    if accounting_count <= 0:
        raise SystemExit('FAIL — existing Accounting authority inventory was not found')
    if secret_columns != 0:
        raise SystemExit('FAIL — provider setup table must not contain secret-value columns')
    if publication_capable != 0:
        raise SystemExit('FAIL — Etsy publication capability must remain disabled')

    print('RELEASE 449 REMOTE DEVELOPMENT SNAPSHOT: PASS')
    print(f'Release 449 tables: {table_count}/{EXPECTED_TABLE_COUNT}')
    print(f'Provider setup rows: {provider_count}/{EXPECTED_PROVIDER_COUNT}')
    print(f'Existing Accounting authority tables visible: {accounting_count}')
    print('Etsy: draft_only / publication_allowed=0')
    print('Provider secret-value columns: 0')
    print('Remote mutation capability in verifier: NONE')


if __name__ == '__main__':
    main(sys.argv)
