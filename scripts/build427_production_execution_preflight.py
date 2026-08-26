#!/usr/bin/env python3
"""Build 427 fresh read-only Production execution preflight.

This helper reruns the bounded Build 426 live evidence immediately before any
Production execution phase and writes a Build 427 authorization-boundary artifact.
It contains no Production mutation command.
"""
from __future__ import annotations

from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILD426 = ROOT / 'scripts' / 'build426_live_release_candidate_evidence.py'
SOURCE = ROOT / 'build426_live_release_candidate_evidence.local.json'
OUTPUT = ROOT / 'build427_production_execution_preflight.local.json'
EXPECTED_START = 1084
EXPECTED_END = 1128
EXPECTED_NEXT = 1129
EXPECTED_PRODUCTS = 45


def fail(message: str) -> None:
    print(f'BUILD 427 PRODUCTION EXECUTION PREFLIGHT: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build427_production_execution_preflight.py --run')
        return 2

    result = subprocess.run(
        [sys.executable, '-u', str(BUILD426), '--run'], cwd=ROOT,
        text=True, encoding='utf-8', errors='replace',
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False,
    )
    print(result.stdout or '', end='' if (result.stdout or '').endswith('\n') else '\n')
    if result.returncode != 0:
        fail(f'Build 426 fresh live evidence returned {result.returncode}.')
    if not SOURCE.exists():
        fail('fresh Build 426 live evidence artifact was not created.')

    evidence = json.loads(SOURCE.read_text(encoding='utf-8'))
    mapping = evidence.get('product_mapping') if isinstance(evidence.get('product_mapping'), list) else []
    numbers = [int(row['product_number']) for row in mapping] if mapping else []
    product_ready = (
        evidence.get('product_number_candidate_ready') is True
        and len(mapping) == EXPECTED_PRODUCTS
        and len({int(row['product_id']) for row in mapping}) == EXPECTED_PRODUCTS
        and len(set(numbers)) == EXPECTED_PRODUCTS
        and min(numbers or [0]) == EXPECTED_START
        and max(numbers or [0]) == EXPECTED_END
        and evidence.get('development_sequence_next') is not None
        and int(evidence['development_sequence_next']) >= EXPECTED_NEXT
        and evidence.get('production_product_numbers') == []
        and int(evidence.get('production_sequence_next') or 0) == EXPECTED_START
        and not evidence.get('production_candidate_collisions')
    )
    zero_orphans = evidence.get('zero_orphans') is True
    inventory_rows = int(((evidence.get('fractional_tables') or {}).get('site_item_inventory') or {}).get('production_rows') or 0)
    special = evidence.get('one_sided_counts') or {}
    safe = (
        product_ready
        and zero_orphans
        and inventory_rows == 1041
        and special.get('search_query_terms') == 5
        and special.get('__sql_test') == 0
        and evidence.get('caip_media_upload_files_rows') == 113
    )

    payload = {
        'artifact': 'Build 427 Production execution preflight',
        'safe_to_open_product_number_execution': safe,
        'product_number_candidate_ready': product_ready,
        'candidate_start': EXPECTED_START,
        'candidate_end': EXPECTED_END,
        'candidate_next': EXPECTED_NEXT,
        'mapping': mapping if product_ready else [],
        'zero_orphans': zero_orphans,
        'site_item_inventory_rows': inventory_rows,
        'search_query_terms_rows': special.get('search_query_terms'),
        '__sql_test_rows': special.get('__sql_test'),
        'caip_media_upload_files_rows': evidence.get('caip_media_upload_files_rows'),
        'gift_card': evidence.get('gift_card'),
        'notification': evidence.get('notification'),
        'product_image_annotations': evidence.get('product_image_annotations'),
        'membership': evidence.get('membership'),
        'fractional_tables': evidence.get('fractional_tables'),
        'orphan_counts': evidence.get('orphan_counts'),
        'production_backup_created': False,
        'production_authorization_received': False,
        'production_mutation_executed': False,
        'production_promotion_open': False,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 427 PRODUCTION AUTHORIZATION BOUNDARY ===')
    print(f'Product-number candidate fresh: {"YES" if product_ready else "NO"}')
    print(f'Candidate block: {EXPECTED_START}..{EXPECTED_END}')
    print(f'Candidate next: {EXPECTED_NEXT}')
    print(f'Product/FK zero-orphan gate: {zero_orphans}')
    print(f'site_item_inventory rows: {inventory_rows}')
    print(f'search_query_terms rows preserved: {special.get("search_query_terms")}')
    print(f'__sql_test rows untouched: {special.get("__sql_test")}')
    print(f'CAIP rows excluded: {evidence.get("caip_media_upload_files_rows")}')
    print(f'Safe to open Product-number execution phase: {"YES" if safe else "NO"}')
    print('Production backup created: NO')
    print('Production authorization received: NO')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 427 PRODUCTION EXECUTION PREFLIGHT:', 'PASS' if safe else 'BLOCKED')
    return 0 if safe else 1


if __name__ == '__main__':
    raise SystemExit(main())
