#!/usr/bin/env python3
"""Build 434 inert Membership Build 395 rebuild preview.

Consumes only the local read-only preflight artifact. Produces planning evidence
with zero executable SQL statements. It cannot contact Cloudflare or mutate D1.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT = ROOT / 'build434_membership_authorization_preflight.local.json'
OUTPUT = ROOT / 'build434_membership_rebuild_preview.local.json'
CANONICAL_COLUMNS = [
    'policy_id', 'tier_code', 'title', 'short_description', 'benefits_json',
    'badge_color', 'sort_order', 'is_visible', 'created_at', 'updated_at',
]
LEGACY_ALIASES = {
    'membership_tier_policy_id': 'policy_id',
    'code': 'tier_code',
    'name': 'title',
    'display_title': 'title',
}


def fail(message: str) -> None:
    print(f'BUILD 434 MEMBERSHIP REBUILD PREVIEW: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    if not PREFLIGHT.exists():
        fail('Build 434 Membership preflight artifact is missing.')
    pre = json.loads(PREFLIGHT.read_text(encoding='utf-8'))
    if pre.get('safe_to_request_membership_rebuild_authorization') is not True:
        fail('Membership preflight is not green; preview refused.')
    if pre.get('membership_row_count') != 3 or pre.get('three_expected_tiers') is not True:
        fail('Membership row/tier identity boundary is not exactly the reviewed three tiers.')
    if pre.get('legacy_aliases_present') is not True:
        fail('Reviewed legacy alias mapping is not present.')

    payload = {
        'artifact': 'Build 434 Membership Build 395 inert rebuild preview',
        'source_preflight': PREFLIGHT.name,
        'production_database': pre.get('production_database'),
        'production_database_id': pre.get('production_database_id'),
        'membership_row_count': pre.get('membership_row_count'),
        'normalized_rows': pre.get('normalized_rows'),
        'normalized_tiers': pre.get('normalized_tiers'),
        'source_columns': pre.get('production_columns'),
        'canonical_columns': CANONICAL_COLUMNS,
        'legacy_aliases': LEGACY_ALIASES,
        'planned_strategy': [
            'create a canonical shadow table only after separate rebuild authorization',
            'copy exactly the three reviewed tier identities through the documented aliases',
            'validate row count, tier uniqueness, and canonical constraints before swap',
            'retain a full Production backup and rollback boundary before any future swap',
        ],
        'executable_statements': [],
        'executable_statement_count': 0,
        'cloudflare_access': False,
        'production_backup_created': False,
        'membership_rebuild_authorization_received': False,
        'production_mutation_executed': False,
        'production_promotion_open': False,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('BUILD 434 MEMBERSHIP REBUILD PREVIEW: PASS / INERT')
    print(f'Membership rows protected: {payload["membership_row_count"]}')
    print(f'Normalized tiers: {payload["normalized_tiers"]}')
    print(f'Legacy aliases: {LEGACY_ALIASES}')
    print('Executable SQL statements: 0')
    print('Cloudflare access: NONE')
    print('Production backup created: NO')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
