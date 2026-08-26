#!/usr/bin/env python3
"""Build 435 local-only twenty-item Membership lossless value-mapping gate."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BUILD434 = ROOT / 'build434_membership_authorization_preflight.local.json'
PRE = ROOT / 'build435_membership_value_mapping_preflight.local.json'
PREVIEW = ROOT / 'build435_membership_lossless_mapping_preview.local.json'
EXPECTED_TIERS = {'bronze', 'silver', 'gold'}
EXPECTED_COLUMNS = [
    'membership_tier_policy_id', 'code', 'name', 'display_title',
    'short_description', 'benefits_json', 'badge_color', 'is_visible',
    'sort_order', 'created_at', 'updated_at',
]

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    print(f'{checks:02d}. {"PASS" if condition else "FAIL"} — {label}')
    if not condition:
        failures.append(label)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}


def main() -> int:
    print('BUILD 435 TWENTY-ITEM MEMBERSHIP LOSSLESS VALUE-MAPPING GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability in this gate: NONE')
    print()

    branch = subprocess.run(['git','branch','--show-current'], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False).stdout.strip()
    b434 = load(BUILD434)
    pre = load(PRE)
    preview = load(PREVIEW)

    check(branch == 'dev', 'current git branch is dev')
    check(b434.get('safe_to_request_membership_rebuild_authorization') is True, 'Build 434 Membership authorization boundary remains green')
    check(b434.get('membership_row_count') == 3 and b434.get('three_expected_tiers') is True, 'Build 434 three-tier identity boundary remains green')
    check(bool(pre), 'Build 435 complete-row value-mapping artifact exists')
    check(pre.get('build434_boundary_green') is True, 'Build 435 mapping is anchored to Build 434')
    check(pre.get('source_columns') == EXPECTED_COLUMNS and pre.get('exact_legacy_shape') is True, 'live Membership source shape is exactly the reviewed legacy shape')
    check(pre.get('membership_row_count') == 3, 'complete-row mapping boundary contains exactly three rows')
    check(set(pre.get('normalized_tiers') or []) == EXPECTED_TIERS and pre.get('normalized_tiers_expected') is True, 'normalized tier identities remain bronze/silver/gold')
    check(set(pre.get('raw_codes') or []) == EXPECTED_TIERS and pre.get('raw_codes_exact') is True, 'raw tier codes are exactly bronze/silver/gold')
    check(len(pre.get('source_rows') or []) == 3, 'all three complete source rows are captured')
    check(len(str(pre.get('source_rows_sha256') or '')) == 64, 'complete source-row SHA-256 boundary is present')
    check(len(pre.get('title_comparisons') or []) == 3, 'all three title alias comparisons are recorded')
    check(pre.get('title_values_exact_equal') is True, 'name and display_title are exactly equal for every tier')
    check(pre.get('direct_fields_present') is True, 'all direct-preservation business fields are present')
    check(pre.get('lossless_mapping_possible') is True, 'lossless legacy-to-canonical mapping is proven')
    check(pre.get('safe_to_prepare_membership_execution_boundary') is True, 'mapping evidence is safe to prepare a separate execution boundary')
    check(pre.get('production_backup_created') is False and pre.get('membership_rebuild_authorization_received') is False, 'no Membership backup or authorization is inferred')
    check(pre.get('production_mutation_executed') is False and pre.get('production_promotion_open') is False, 'mapping preflight claims no mutation or promotion')
    check(bool(preview) and preview.get('lossless_mapping_proven') is True, 'inert lossless mapping preview exists and is green')
    check(preview.get('executable_statement_count') == 0 and preview.get('cloudflare_access') is False and preview.get('production_mutation_executed') is False, 'mapping preview is zero-SQL/local-only and cannot mutate Production')

    print()
    if failures:
        print(f'BUILD 435 TWENTY-ITEM MEMBERSHIP LOSSLESS VALUE-MAPPING GATE: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 435 TWENTY-ITEM MEMBERSHIP LOSSLESS VALUE-MAPPING GATE: PASS ({checks}/{checks})')
    print('Build 434 Membership authorization boundary: COMPLETE / PROVEN')
    print('Membership source rows: 3 / COMPLETE-ROW FINGERPRINTED')
    print('Raw tier codes: bronze,silver,gold')
    print('name/display_title conflict: NONE / EXACT EQUALITY PROVEN')
    print(f'Source-row SHA-256: {pre.get("source_rows_sha256")}')
    print('Membership mapping preview executable statements: 0')
    print('Membership Production backup: NOT CREATED')
    print('Membership rebuild authorization: NOT RECEIVED')
    print('Membership Production mutation executed: NO')
    print('Later rebuild-family authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: prepare a separately token-gated Membership Build 395 rebuild execution boundary; do not execute until explicitly authorized.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
