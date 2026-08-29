#!/usr/bin/env python3
"""Verify Release 449 against exact Development D1 evidence exported by Wrangler."""
from __future__ import annotations

import json
import sys
from pathlib import Path

EXPECTED_TABLES = {
    'provider_setup_authorities',
    'marketplace_channels',
    'marketplace_syndication_drafts',
    'sales_invoices',
    'sales_refunds',
    'commerce_transaction_costs',
    'gifi_reporting_snapshots',
}
EXPECTED_PROVIDERS = {'stripe', 'paypal', 'etsy', 'pinterest', 'meta', 'tiktok', 'youtube'}


def load(path: str):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def dicts(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from dicts(child)
    elif isinstance(value, list):
        for child in value:
            yield from dicts(child)


def rows_with(value, key):
    return [row for row in dicts(value) if key in row]


def scalar(value, keys):
    for row in dicts(value):
        for key in keys:
            if key in row:
                return row[key]
    return None


def main(argv):
    if len(argv) != 8:
        raise SystemExit('usage: verify_release449_d1.py before.json schema.json providers.json etsy.json quick.json integrity.json after.json')

    before, schema, providers, etsy, quick, integrity, after = map(load, argv[1:])

    table_names = {str(row.get('name')) for row in rows_with(schema, 'name') if str(row.get('type', 'table')) == 'table'}
    missing = sorted(EXPECTED_TABLES - table_names)
    if missing:
        raise SystemExit(f'FAIL — Release 449 tables missing: {missing}')

    provider_keys = {str(row.get('provider_key')) for row in rows_with(providers, 'provider_key')}
    missing_providers = sorted(EXPECTED_PROVIDERS - provider_keys)
    if missing_providers:
        raise SystemExit(f'FAIL — provider setup seeds missing: {missing_providers}')

    etsy_rows = [row for row in rows_with(etsy, 'channel_key') if str(row.get('channel_key')) == 'etsy']
    if len(etsy_rows) != 1:
        raise SystemExit(f'FAIL — expected one Etsy marketplace channel; found {len(etsy_rows)}')
    etsy_row = etsy_rows[0]
    if str(etsy_row.get('syndication_mode')) != 'draft_only' or int(etsy_row.get('publication_allowed') or 0) != 0:
        raise SystemExit('FAIL — Etsy channel must remain draft_only with publication_allowed=0')

    quick_value = str(scalar(quick, ('quick_check', 'integrity_check')) or '').lower()
    integrity_value = str(scalar(integrity, ('integrity_check', 'quick_check')) or '').lower()
    if quick_value != 'ok':
        raise SystemExit(f'FAIL — PRAGMA quick_check returned {quick_value!r}')
    if integrity_value != 'ok':
        raise SystemExit(f'FAIL — PRAGMA integrity_check returned {integrity_value!r}')

    before_count = scalar(before, ('accounting_authority_table_count',))
    after_count = scalar(after, ('accounting_authority_table_count',))
    before_tables = str(scalar(before, ('accounting_authority_tables',)) or '')
    after_tables = str(scalar(after, ('accounting_authority_tables',)) or '')
    if before_count is None or after_count is None:
        raise SystemExit('FAIL — Accounting preservation inventory evidence is missing')
    if int(before_count) <= 0:
        raise SystemExit('FAIL — no existing Accounting authority tables were detected before Release 449')
    if int(before_count) != int(after_count) or before_tables != after_tables:
        raise SystemExit(f'FAIL — existing Accounting authority inventory changed: {before_count}/{before_tables} -> {after_count}/{after_tables}')

    print('RELEASE 449 DEVELOPMENT D1 VERIFICATION: PASS')
    print(f'New tables: {len(EXPECTED_TABLES)} / {len(EXPECTED_TABLES)}')
    print(f'Provider setup seeds: {len(EXPECTED_PROVIDERS)} / {len(EXPECTED_PROVIDERS)}')
    print('Etsy authority: draft_only; publication_allowed=0')
    print(f'Existing Accounting authority tables preserved: {before_count}')
    print('PRAGMA quick_check: ok')
    print('PRAGMA integrity_check: ok')


if __name__ == '__main__':
    main(sys.argv)
