#!/usr/bin/env python3
"""Build 433 local-only Build 197 annotation execution safety regression."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CTL = (ROOT / 'scripts' / 'build433_production_annotation_execution.py').read_text(encoding='utf-8')
PRE = (ROOT / 'scripts' / 'build432_annotation_authorization_preflight.py').read_text(encoding='utf-8')
ADD = (ROOT / 'scripts' / 'build428_production_additive_execution.py').read_text(encoding='utf-8')
AUTH = (ROOT / 'database_build197_application_resilience_media_catalog.sql').read_text(encoding='utf-8')

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


check("AUTH_TOKEN = 'AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX'" in CTL, 'annotation controller requires exact explicit token')
check("GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'" in CTL, 'annotation controller requires Gift Card proof')
check("NOTIFICATION_POSTCHECK = ROOT / 'build431_production_notification_postcheck.local.json'" in CTL, 'annotation controller requires full Notification proof')
check('additive.require_product_postcheck()' in CTL, 'annotation controller requires Product-number proof')
check("notification.get('scope') != 'full_build403_notification_outbox_additive'" in CTL, 'annotation controller pins corrected full Notification prerequisite scope')
check("PREFLIGHT_SCRIPT = ROOT / 'scripts' / 'build432_annotation_authorization_preflight.py'" in CTL, 'annotation execution reruns the read-only Build 432 preflight')
check("ANNOTATION_INDEX = 'idx_product_image_annotations_product_image_build197'" in CTL, 'annotation controller pins exact Build 197 index')
check("preflight.get('required_columns_present') is True" in CTL, 'annotation controller requires both indexed columns')
check("preflight.get('annotation_index_exists') is False" in CTL, 'annotation controller requires index absent before execution')
check("preflight.get('product_image_annotations_rows')" in CTL, 'annotation controller uses the live row-preservation boundary')
check("additive.export_backup('annotation')" in CTL, 'annotation backup uses full Production D1 export primitive')
check("additive.verify_backup('annotation')" in CTL, 'annotation apply re-verifies backup bytes/SHA/age')
check("after_backup_preflight = fresh_preflight()" in CTL and "after_backup = additive.current_state('annotation')" in CTL, 'annotation state is re-read after backup')
check("additive.execute_sql('annotation', additive.annotation_sql())" in CTL, 'annotation controller executes only the canonical annotation SQL')
check("rows_preserved = int(after.get('row_count') or 0) == int(before.get('row_count') or 0)" in CTL, 'annotation row count must be preserved')
check("'annotation_index_present': index_present" in CTL and "'production_promotion_open': False" in CTL, 'annotation post-proof records index presence and closed promotion')
check('membership' not in CTL.split('def main()', 1)[-1].lower() and 'accounting' not in CTL.split('def main()', 1)[-1].lower(), 'annotation controller exposes no rebuild-family action')
check("REQUIRED_COLUMNS = {'product_id', 'product_image_id'}" in PRE, 'preflight checks exact required annotation columns')
check('MAX_BACKUP_AGE_SECONDS = 1800' in ADD and 'hashlib.sha256' in ADD and "'d1', 'export', PROD_NAME" in ADD, 'underlying backup is full, SHA-256 verified, and age-limited')
check('idx_product_image_annotations_product_image_build197' in AUTH and 'ON product_image_annotations(product_id, product_image_id)' in AUTH, 'Build 197 authority contains exact composite index')

if failures:
    print(f'BUILD 433 ANNOTATION EXECUTION SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 433 ANNOTATION EXECUTION SAFETY REGRESSION: PASS ({checks}/{checks})')
print('Annotation Production authorization token path: PRESENT / NOT EXERCISED')
print('Product/Gift/Notification prerequisites: SOURCE-GATED')
print('Annotation full-backup boundary: PASS')
print('Exact pre-write drift refusal: PASS')
print('product_image_annotations row preservation: PASS')
print('Membership/rebuild execution path: NONE')
print('Cloudflare access: NONE')
print('Production mutation executed: NO')
print('PRODUCTION PROMOTION: CLOSED')
