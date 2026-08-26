#!/usr/bin/env python3
"""Build 434 local-only Membership Build 395 authorization safety regression."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRE = (ROOT / 'scripts' / 'build434_membership_authorization_preflight.py').read_text(encoding='utf-8')
PREVIEW = (ROOT / 'scripts' / 'build434_membership_rebuild_preview.py').read_text(encoding='utf-8')
AUTH = (ROOT / 'database_membership_tier_policy_runtime_parity.sql').read_text(encoding='utf-8')

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


check("PRODUCT_POSTCHECK = ROOT / 'build427_production_product_number_postcheck.local.json'" in PRE, 'Membership preflight requires Product-number proof')
check("GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'" in PRE, 'Membership preflight requires Gift Card proof')
check("NOTIFICATION_POSTCHECK = ROOT / 'build431_production_notification_postcheck.local.json'" in PRE, 'Membership preflight requires full Notification proof')
check("ANNOTATION_POSTCHECK = ROOT / 'build433_production_annotation_postcheck.local.json'" in PRE, 'Membership preflight requires completed annotation proof')
check("PROD_NAME = 'devilndove-prod'" in PRE and "PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'" in PRE, 'Membership preflight hard-pins Production')
check('D1 mutation capability: NONE' in PRE and 'R2/provider mutation capability: NONE' in PRE, 'Membership preflight declares no mutation capability')
check("'policy_id', 'tier_code', 'title', 'short_description', 'benefits_json'" in PRE, 'Membership preflight pins canonical Build 395 columns')
check("'badge_color', 'sort_order', 'is_visible', 'created_at', 'updated_at'" in PRE, 'Membership preflight covers all ten canonical columns')
check("EXPECTED_TIERS = {'bronze', 'silver', 'gold'}" in PRE, 'Membership preflight pins the three canonical tier identities')
check("'membership_tier_policy_id': 'policy_id'" in PRE and "'code': 'tier_code'" in PRE, 'Membership preflight preserves reviewed id/code aliases')
check("'name': 'title'" in PRE and "'display_title': 'title'" in PRE, 'Membership preflight preserves reviewed title aliases')
check('SELECT * FROM membership_tier_policies ORDER BY 1;' in PRE, 'Membership preflight reads complete live tier rows')
check('canonical_column_names_exact' in PRE and 'rebuild_required' in PRE, 'Membership preflight classifies canonical-vs-legacy shape')
check("'production_backup_created': False" in PRE and "'production_mutation_executed': False" in PRE, 'Membership preflight cannot claim backup or mutation')
check("'membership_rebuild_authorization_received': False" in PRE and "'production_promotion_open': False" in PRE, 'Membership preflight cannot infer authorization or promotion')
check("'executable_statements': []" in PREVIEW and "'executable_statement_count': 0" in PREVIEW, 'Membership rebuild preview has zero executable SQL')
check("'cloudflare_access': False" in PREVIEW and "'production_mutation_executed': False" in PREVIEW, 'Membership preview has no Cloudflare or mutation path')
check('policy_id INTEGER PRIMARY KEY AUTOINCREMENT' in AUTH and 'tier_code TEXT NOT NULL UNIQUE' in AUTH, 'Build 395 authority defines canonical id/tier uniqueness')
check(all(value in AUTH for value in ["('bronze'", "('silver'", "('gold'"]), 'Build 395 authority contains exactly the canonical tier seed identities')
check('ON CONFLICT(tier_code) DO NOTHING' in AUTH and 'request handlers must not create or seed this table' in AUTH, 'Build 395 authority is migration-owned and idempotent at seed boundary')

if failures:
    print(f'BUILD 434 MEMBERSHIP AUTHORIZATION SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 434 MEMBERSHIP AUTHORIZATION SAFETY REGRESSION: PASS ({checks}/{checks})')
print('Completed Product/Gift/Notification/Annotation prerequisites: SOURCE-GATED')
print('Membership rebuild preview executable statements: 0')
print('Membership rebuild authorization inferred: NO')
print('Cloudflare access: NONE')
print('Production mutation executed: NO')
print('Later rebuild authorizations inferred: NO')
print('PRODUCTION PROMOTION: CLOSED')
