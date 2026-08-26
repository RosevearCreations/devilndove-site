#!/usr/bin/env python3
"""Build 427 local safety regression for staged Production execution tooling.

No Cloudflare access. No database access. No Production mutation capability.
"""
from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PRE = (ROOT / 'scripts' / 'build427_production_execution_preflight.py').read_text(encoding='utf-8')
PROD = (ROOT / 'scripts' / 'build427_production_product_number_execution.py').read_text(encoding='utf-8')
ADD = (ROOT / 'scripts' / 'build427_production_additive_execution.py').read_text(encoding='utf-8')

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


# 1-5 read-only preflight boundaries.
check(
    'production_mutation_executed' in PRE
    and "'production_mutation_executed': False" in PRE
    and 'configure_console()' in PRE
    and "stream.reconfigure(encoding='utf-8', errors='replace')" in PRE,
    'preflight records zero Production mutation and uses Windows-safe UTF-8 console transport',
)
check('build426_live_release_candidate_evidence.py' in PRE, 'preflight refreshes bounded live evidence instead of trusting stale local SQL')
check("'production_backup_created': False" in PRE, 'preflight does not claim a Production backup exists')
check("'production_authorization_received': False" in PRE, 'preflight does not infer Production authorization')
check("special.get('search_query_terms') == 5" in PRE and "special.get('__sql_test') == 0" in PRE, 'preflight preserves one-sided-table evidence boundaries')

# 6-13 Product-number executor safety.
check("PROD_NAME = 'devilndove-prod'" in PROD and "PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'" in PROD, 'Product-number executor hard-pins Production name and UUID')
check("DEV_NAME = 'devilndove-dev'" in PROD and "DEV_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'" in PROD, 'Product-number postcheck hard-pins Development evidence target')
check("AUTH_TOKEN = 'AUTHORIZE-BUILD427-PROD-PRODUCT-NUMBERS'" in PROD, 'Product-number executor requires a literal authorization token')
check("'d1', 'export', PROD_NAME" in PROD and "'--remote'" in PROD and "'--skip-confirmation'" in PROD, 'Product-number executor requires a remote Production export stage')
check('hashlib.sha256' in PROD and 'backup_sha256' in PROD, 'Production backup records SHA-256 evidence')
check('fresh_preflight()' in PROD and PROD.count('fresh_preflight()') >= 2, 'backup/apply paths rerun fresh live preflight')
check("scope': 'product_numbers_only'" in PROD and 'Gift Card/Notification/index/rebuild families: NOT EXECUTED' in PROD, 'first Production mutation scope is Product numbers only')
check('len(updates) != EXPECTED_PRODUCTS' in PROD and 'EXPECTED_PRODUCTS = 45' in PROD, 'Product-number SQL refuses any map other than exactly 45 guarded rows')

# 14-18 Additive stage isolation.
check("'gift': 'AUTHORIZE-BUILD427-PROD-GIFT-CARD'" in ADD, 'Gift Card stage has a separate authorization token')
check("'notification': 'AUTHORIZE-BUILD427-PROD-NOTIFICATION'" in ADD, 'Notification stage has a separate authorization token')
check("'annotation': 'AUTHORIZE-BUILD427-PROD-ANNOTATION-INDEX'" in ADD, 'Product-image annotation stage has a separate authorization token')
check('require_product_postcheck()' in ADD, 'every additive mutation requires the Product-number Production postcheck')
check('membership' not in re.sub(r'(?s)""".*?"""', '', ADD).lower(), 'additive executor contains no Membership rebuild path')

# 19-20 promotion/broad migration guards.
check('PRODUCTION PROMOTION: CLOSED' in PROD and 'PRODUCTION PROMOTION: CLOSED' in ADD, 'Product-number and additive stages keep Production promotion closed')
check('build426_production_release_candidate.local.sql' not in PROD and 'build426_production_release_candidate.local.sql' not in ADD, 'Build 427 never bulk-executes the broad Build 426 candidate file')

if failures:
    print(f'BUILD 427 PRODUCTION EXECUTION SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 427 PRODUCTION EXECUTION SAFETY REGRESSION: PASS ({checks}/{checks})')
print('Production live access: NONE')
print('Production mutation executed: NO')
print('Authorization tokens exercised: NO')
print('Broad Build 426 candidate execution path: NONE')
print('PRODUCTION PROMOTION: CLOSED')
