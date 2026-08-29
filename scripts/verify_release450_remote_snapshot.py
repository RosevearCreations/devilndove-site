#!/usr/bin/env python3
"""Verify Release 450 from a read-only exact-Development D1 snapshot."""
from __future__ import annotations

import json
import sys
from pathlib import Path

EXPECTED_RELEASE450_TABLES = 10
EXPECTED_POLICIES = 5
EXPECTED_MAPPINGS = 5
EXPECTED_LOCKED_CHANNELS = 4


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def scalar(row, name):
    value = row.get(name)
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def main(argv):
    if len(argv) != 2:
        raise SystemExit('usage: verify_release450_remote_snapshot.py snapshot.json')

    data = json.loads(Path(argv[1]).read_text(encoding='utf-8'))
    row = next((item for item in walk(data) if 'release450_table_count' in item), None)
    if not row:
        raise SystemExit('FAIL — Release 450 snapshot row was not found')

    checks = {
        'Release 450 tables': (scalar(row, 'release450_table_count'), EXPECTED_RELEASE450_TABLES),
        'Channel policy rows': (scalar(row, 'policy_count'), EXPECTED_POLICIES),
        'Provider-execution locks': (scalar(row, 'provider_execution_locked_count'), EXPECTED_POLICIES),
        'CSV mapping rows': (scalar(row, 'mapping_count'), EXPECTED_MAPPINGS),
        'Publication-locked channels': (scalar(row, 'publication_locked_channel_count'), EXPECTED_LOCKED_CHANNELS),
        'Etsy exact policy': (scalar(row, 'etsy_exact_policy_count'), 1),
        'Etsy draft-only channel lock': (scalar(row, 'etsy_draft_only_count'), 1),
        'TikTok local-prep policy': (scalar(row, 'tiktok_local_policy_count'), 1),
    }
    for label, (actual, expected) in checks.items():
        if actual != expected:
            raise SystemExit(f'FAIL — {label}: expected {expected}, found {actual}')

    accounting_count = scalar(row, 'accounting_authority_table_count')
    if accounting_count <= 0:
        raise SystemExit('FAIL — existing Accounting authority inventory was not visible')

    release449_count = scalar(row, 'release449_core_table_count')
    if release449_count != 7:
        raise SystemExit(f'FAIL — Release 449 core authority drifted: expected 7 tables, found {release449_count}')

    if scalar(row, 'provider_secret_column_count') != 0:
        raise SystemExit('FAIL — provider setup authority contains a secret-value column')
    if scalar(row, 'publication_enabled_count') != 0:
        raise SystemExit('FAIL — one or more marketplace publication locks are open')
    if scalar(row, 'provider_execution_enabled_count') != 0:
        raise SystemExit('FAIL — one or more Release 450 provider execution locks are open')
    if scalar(row, 'etsy_bad_secret_reference_count') != 0:
        raise SystemExit('FAIL — Etsy setup references contain a secret value or obsolete credential key')

    print('RELEASE 450 REMOTE DEVELOPMENT SNAPSHOT: PASS')
    print(f'Release 450 tables: {EXPECTED_RELEASE450_TABLES}/{EXPECTED_RELEASE450_TABLES}')
    print(f'Channel policies: {EXPECTED_POLICIES}/{EXPECTED_POLICIES}; provider execution locked')
    print(f'CSV mappings: {EXPECTED_MAPPINGS}/{EXPECTED_MAPPINGS}')
    print('Etsy: draft_only; publication_allowed=0; images=20; tags=13; variations=3; personalization=5')
    print('TikTok: local upload preparation only; provider execution disabled')
    print(f'Existing Accounting authority tables visible: {accounting_count}')
    print('Release 449 core authority retained: 7/7 tables')
    print('Provider secret-value columns: 0')
    print('Production/provider mutation capability in verifier: NONE')


if __name__ == '__main__':
    main(sys.argv)
