#!/usr/bin/env python3
"""Build 428 inert Membership Build 395 rebuild preview.

Consumes Build 428 live evidence and writes a comment-only SQL review artifact.
It never contacts Cloudflare and emits zero executable SQL statements.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'build428_live_remaining_parity_evidence.local.json'
OUTPUT = ROOT / 'build428_membership_rebuild_preview.local.sql'
AUTHORITY = ROOT / 'database_membership_tier_policy_runtime_parity.sql'

ALIASES = {
    'membership_tier_policy_id': 'policy_id',
    'code': 'tier_code',
    'name': 'title',
    'display_title': 'title',
}
CANONICAL = [
    'policy_id', 'tier_code', 'title', 'short_description', 'benefits_json',
    'badge_color', 'sort_order', 'is_visible', 'created_at', 'updated_at',
]


def main() -> int:
    if not EVIDENCE.exists():
        raise SystemExit('BUILD 428 MEMBERSHIP PREVIEW: FAIL — live evidence artifact missing.')
    evidence = json.loads(EVIDENCE.read_text(encoding='utf-8'))
    membership = evidence.get('membership') or {}
    if int(membership.get('production_rows') or 0) != 3:
        raise SystemExit('BUILD 428 MEMBERSHIP PREVIEW: BLOCKED — expected exactly 3 Production membership rows.')
    if membership.get('requires_rebuild') is not True:
        raise SystemExit('BUILD 428 MEMBERSHIP PREVIEW: BLOCKED — live evidence does not require the Build 395 rebuild.')
    authority = AUTHORITY.read_text(encoding='utf-8', errors='replace')
    if not all(column in authority for column in CANONICAL):
        raise SystemExit('BUILD 428 MEMBERSHIP PREVIEW: FAIL — canonical Build 395 authority is incomplete.')

    prod_cols = membership.get('production_columns') or []
    dev_cols = membership.get('development_columns') or []
    rows = membership.get('row_snapshot') or []
    lines = [
        '-- Build 428 Membership Build 395 data-preserving rebuild PREVIEW ONLY',
        '-- ZERO EXECUTABLE STATEMENTS. Every operation is intentionally commented.',
        '-- Production mutation authorization: NOT RECEIVED',
        f'-- Production rows to preserve exactly: {len(rows)}',
        f'-- Production columns: {prod_cols}',
        f'-- Development/canonical columns: {dev_cols}',
        '-- Legacy aliases:',
    ]
    for old, new in ALIASES.items():
        lines.append(f'--   {old} -> {new}')
    lines.extend([
        '--',
        '-- PREVIEW PHASE 1: create a Build 395 shadow table using the canonical 10-column shape.',
        '-- PREVIEW PHASE 2: copy exactly 3 live rows with explicit legacy->canonical expressions.',
        '-- PREVIEW PHASE 3: assert 3 rows, 3 unique tier_code values, and no NULL canonical identity fields.',
        '-- PREVIEW PHASE 4: rename original table to a rollback shadow and rename the canonical shadow into place.',
        '-- PREVIEW PHASE 5: rerun row/tier/value assertions before any old-table retirement.',
        '-- PREVIEW PHASE 6: retain the old table until a later explicit cleanup authority; do not drop it in the initial rebuild transaction.',
        '--',
        '-- Suggested canonical target columns:',
        '--   policy_id, tier_code, title, short_description, benefits_json, badge_color, sort_order, is_visible, created_at, updated_at',
        '--',
        '-- No CREATE/INSERT/ALTER/DROP/UPDATE statement is executable in this file.',
        '-- Production promotion remains CLOSED.',
    ])
    OUTPUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    executable = [line for line in lines if line.strip() and not line.lstrip().startswith('--')]
    if executable:
        raise SystemExit('BUILD 428 MEMBERSHIP PREVIEW: FAIL — executable SQL unexpectedly generated.')
    print('BUILD 428 MEMBERSHIP NON-EXECUTING PREVIEW: PASS')
    print('Production rows represented: 3')
    print('Legacy alias map entries: 4')
    print('Executable SQL statements generated: ZERO')
    print(f'Local preview: {OUTPUT.name}')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
