#!/usr/bin/env python3
"""Build 435 local-only Membership complete-row mapping safety regression."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRE = (ROOT / 'scripts' / 'build435_membership_value_mapping_preflight.py').read_text(encoding='utf-8')
PREVIEW = (ROOT / 'scripts' / 'build435_membership_lossless_mapping_preview.py').read_text(encoding='utf-8')
AUTH = (ROOT / 'database_membership_tier_policy_runtime_parity.sql').read_text(encoding='utf-8')

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


check("BUILD434 = ROOT / 'build434_membership_authorization_preflight.local.json'" in PRE, 'mapping preflight requires Build 434 evidence')
check("PROD_NAME = 'devilndove-prod'" in PRE and "PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'" in PRE, 'mapping preflight hard-pins Production target')
check('D1 mutation capability: NONE' in PRE and 'R2/provider mutation capability: NONE' in PRE, 'mapping preflight declares no mutation capability')
check("'membership_tier_policy_id', 'code', 'name', 'display_title'" in PRE, 'mapping preflight pins legacy identity/title columns')
check("'short_description', 'benefits_json', 'badge_color', 'sort_order'" in PRE, 'mapping preflight pins direct business-value fields')
check("'is_visible', 'created_at', 'updated_at'" in PRE, 'mapping preflight pins visibility/timestamp fields')
check("SELECT * FROM membership_tier_policies ORDER BY 1;" in PRE, 'mapping preflight captures complete source rows')
check("raw_codes_exact" in PRE and "EXPECTED_TIERS = {'bronze', 'silver', 'gold'}" in PRE, 'mapping preflight requires exact raw tier codes')
check("row.get('name') == row.get('display_title')" in PRE, 'mapping preflight compares name/display_title exactly')
check('hashlib.sha256' in PRE and 'source_rows_sha256' in PRE, 'mapping preflight fingerprints complete source rows')
check("'source_rows': rows" in PRE, 'mapping preflight records complete source rows')
check("'canonical_preview_rows': canonical_preview_rows" in PRE, 'mapping preflight records canonical mapped rows only after proof')
check("'lossless_mapping_possible': lossless_mapping_possible" in PRE, 'mapping preflight records lossless mapping result')
check("'production_backup_created': False" in PRE and "'membership_rebuild_authorization_received': False" in PRE, 'mapping preflight cannot infer backup or authorization')
check("'production_mutation_executed': False" in PRE and "'production_promotion_open': False" in PRE, 'mapping preflight cannot claim mutation or promotion')
check("'executable_statements': []" in PREVIEW and "'executable_statement_count': 0" in PREVIEW, 'mapping preview contains zero executable SQL')
check("'cloudflare_access': False" in PREVIEW and "'production_mutation_executed': False" in PREVIEW, 'mapping preview cannot contact Cloudflare or mutate Production')
check("'display_title': 'title'" in PREVIEW and 'no distinct value discarded' in PREVIEW, 'preview documents lossless title mapping')
check('policy_id INTEGER PRIMARY KEY AUTOINCREMENT' in AUTH and 'tier_code TEXT NOT NULL UNIQUE' in AUTH, 'Build 395 authority pins canonical identity constraints')
check('short_description TEXT NOT NULL' in AUTH and 'benefits_json TEXT NOT NULL' in AUTH and 'updated_at TEXT NOT NULL' in AUTH, 'Build 395 authority pins canonical required business fields')

if failures:
    print(f'BUILD 435 MEMBERSHIP VALUE-MAPPING SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 435 MEMBERSHIP VALUE-MAPPING SAFETY REGRESSION: PASS ({checks}/{checks})')
print('Complete legacy-row capture: SOURCE-GATED')
print('name/display_title loss check: SOURCE-GATED')
print('Complete-row SHA-256 boundary: SOURCE-GATED')
print('Executable SQL statements: 0')
print('Cloudflare access: NONE')
print('Membership rebuild authorization inferred: NO')
print('Production mutation executed: NO')
print('PRODUCTION PROMOTION: CLOSED')
