#!/usr/bin/env python3
"""Build 435 inert Membership Build 395 lossless mapping preview.

Consumes only the local Build 435 read-only evidence artifact. Produces the exact
canonical row-value mapping that a later separately authorized rebuild would use.
Contains zero executable SQL and cannot contact Cloudflare.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT = ROOT / 'build435_membership_value_mapping_preflight.local.json'
OUTPUT = ROOT / 'build435_membership_lossless_mapping_preview.local.json'
CANONICAL_COLUMNS = [
    'policy_id', 'tier_code', 'title', 'short_description', 'benefits_json',
    'badge_color', 'sort_order', 'is_visible', 'created_at', 'updated_at',
]


def fail(message: str) -> None:
    print(f'BUILD 435 MEMBERSHIP LOSSLESS MAPPING PREVIEW: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    if not PREFLIGHT.exists():
        fail('Build 435 Membership value-mapping preflight artifact is missing.')
    pre = json.loads(PREFLIGHT.read_text(encoding='utf-8'))
    if pre.get('lossless_mapping_possible') is not True:
        fail('Lossless Membership mapping has not been proven.')
    if pre.get('membership_row_count') != 3 or pre.get('raw_codes_exact') is not True:
        fail('Exact three-tier source boundary is not green.')
    if pre.get('title_values_exact_equal') is not True:
        fail('name/display_title equality is not proven.')

    rows = pre.get('canonical_preview_rows') or []
    if len(rows) != 3:
        fail('Canonical preview does not contain exactly three mapped rows.')

    payload = {
        'artifact': 'Build 435 Membership Build 395 inert lossless mapping preview',
        'source_preflight': PREFLIGHT.name,
        'production_database': pre.get('production_database'),
        'production_database_id': pre.get('production_database_id'),
        'source_rows_sha256': pre.get('source_rows_sha256'),
        'source_row_count': pre.get('membership_row_count'),
        'source_columns': pre.get('source_columns'),
        'canonical_columns': CANONICAL_COLUMNS,
        'canonical_rows': rows,
        'mapping': {
            'membership_tier_policy_id': 'policy_id',
            'code': 'tier_code',
            'display_title': 'title',
            'name': 'title (proven exactly equal to display_title; no distinct value discarded)',
            'short_description': 'short_description',
            'benefits_json': 'benefits_json',
            'badge_color': 'badge_color',
            'sort_order': 'sort_order',
            'is_visible': 'is_visible',
            'created_at': 'created_at',
            'updated_at': 'updated_at',
        },
        'lossless_mapping_proven': True,
        'planned_strategy': [
            'fresh full Production D1 backup after separate explicit authorization',
            'fresh complete-row reread and SHA-256 drift check before rebuild SQL generation',
            'create canonical Build 395 shadow table',
            'copy exactly these three mapped rows without applying seed defaults over existing values',
            'validate three rows, tier uniqueness, exact mapped values, and canonical constraints before swap',
            'swap only inside the separately authorized guarded controller',
            'independent read-only semantic postcheck after rebuild',
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

    print('BUILD 435 MEMBERSHIP LOSSLESS MAPPING PREVIEW: PASS / INERT')
    print(f'Source rows protected: {payload["source_row_count"]}')
    print(f'Source-row SHA-256: {payload["source_rows_sha256"]}')
    print('name/display_title conflict: NONE / EXACT EQUALITY PROVEN')
    print('Canonical mapped rows: 3')
    print('Executable SQL statements: 0')
    print('Cloudflare access: NONE')
    print('Production backup created: NO')
    print('Membership rebuild authorization received: NO')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
