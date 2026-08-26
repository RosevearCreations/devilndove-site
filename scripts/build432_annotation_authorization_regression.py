#!/usr/bin/env python3
"""Build 432 local-only Build 197 annotation-index authorization safety regression."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRE = (ROOT / 'scripts' / 'build432_annotation_authorization_preflight.py').read_text(encoding='utf-8')
EXEC = (ROOT / 'scripts' / 'build428_production_additive_execution.py').read_text(encoding='utf-8')
AUTH = (ROOT / 'database_build197_application_resilience_media_catalog.sql').read_text(encoding='utf-8')

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


check("PRODUCT_POSTCHECK = ROOT / 'build427_production_product_number_postcheck.local.json'" in PRE, 'annotation preflight requires Product-number prerequisite')
check("GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'" in PRE, 'annotation preflight requires Gift Card prerequisite')
check("NOTIFICATION_POSTCHECK = ROOT / 'build431_production_notification_postcheck.local.json'" in PRE, 'annotation preflight requires full Notification prerequisite')
check("PROD_NAME = 'devilndove-prod'" in PRE and "PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'" in PRE, 'annotation preflight hard-pins Production name and UUID')
check("stream.reconfigure(encoding='utf-8', errors='replace')" in PRE, 'annotation preflight is Windows UTF-8 safe')
check('D1 mutation capability: NONE' in PRE and 'R2/provider mutation capability: NONE' in PRE, 'annotation preflight declares no mutation capability')
check("ANNOTATION_INDEX = 'idx_product_image_annotations_product_image_build197'" in PRE, 'annotation preflight targets only the Build 197 composite index')
check("REQUIRED_COLUMNS = {'product_id', 'product_image_id'}" in PRE, 'annotation preflight requires the indexed columns')
check('product_image_annotations_rows' in PRE, 'annotation preflight captures annotation row-preservation boundary')
check("'production_backup_created': False" in PRE and "'annotation_authorization_received': False" in PRE, 'annotation preflight cannot infer backup or authorization')
check("'production_mutation_executed': False" in PRE and "'production_promotion_open': False" in PRE, 'annotation preflight cannot claim mutation or promotion')
check("'annotation': 'AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX'" in EXEC, 'annotation executor requires exact separate authorization token')
check('def export_backup(stage: str)' in EXEC and "'d1', 'export', PROD_NAME" in EXEC and "'--remote'" in EXEC, 'annotation executor requires a full remote Production D1 backup')
check('hashlib.sha256' in EXEC and 'backup_sha256' in EXEC and 'MAX_BACKUP_AGE_SECONDS = 1800' in EXEC, 'annotation backup records SHA-256 and has a 30-minute age limit')
check("additive" not in PRE.lower() and 'execute_sql' not in PRE and 'export_backup' not in PRE, 'annotation preflight contains no hidden mutation helper')
check("return 'CREATE INDEX IF NOT EXISTS idx_product_image_annotations_product_image_build197 ON product_image_annotations(product_id, product_image_id);\\n'" in EXEC, 'annotation execution SQL is exactly the Build 197 composite index')
check("rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM product_image_annotations;'" in EXEC, 'annotation executor captures row count around execution')
check("after['row_count'] == before['row_count']" in EXEC and 'stage_complete(stage, after)' in EXEC, 'annotation apply requires row preservation plus index completion')
check('CREATE INDEX IF NOT EXISTS idx_product_image_annotations_product_image_build197' in AUTH and 'ON product_image_annotations(product_id, product_image_id)' in AUTH, 'Build 197 authority contains the exact composite index')
check('This migration is additive and safe to rerun.' in AUTH and 'CREATE TABLE IF NOT EXISTS schema_migration_ledger' in AUTH, 'Build 197 authority is additive/rerunnable and migration-ledger aware')

if failures:
    print(f'BUILD 432 ANNOTATION AUTHORIZATION SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 432 ANNOTATION AUTHORIZATION SAFETY REGRESSION: PASS ({checks}/{checks})')
print('Full Notification Production prerequisite: SOURCE-GATED')
print('Annotation Production authorization inferred: NO')
print('Production backup created by regression: NO')
print('Production mutation executed: NO')
print('Rebuild authorization inferred: NO')
print('PRODUCTION PROMOTION: CLOSED')
