#!/usr/bin/env python3
"""Build 401 source audit: runtime CREATE TABLE authorities vs committed SQL migrations.

This script is read-only. It does not contact Cloudflare and does not modify files.
It measures where JavaScript runtime helpers still create tables and whether those
same table names have a committed database*.sql schema authority.
"""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CREATE_RE = re.compile(r"CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+[`\"']?([A-Za-z_][A-Za-z0-9_]*)", re.I)

CRITICAL_AUTHORITIES = {
    'today_task_actions': 'database_today_task_actions_runtime_parity.sql',
    'membership_tier_policies': 'database_membership_tier_policy_runtime_parity.sql',
    'customer_document_sequences': 'database_customer_documents_runtime_parity.sql',
    'customer_documents': 'database_customer_documents_runtime_parity.sql',
    'gift_cards': 'database_gift_card_runtime_parity.sql',
    'gift_card_redemptions': 'database_gift_card_runtime_parity.sql',
    'gift_card_admin_events': 'database_gift_card_runtime_parity.sql',
    'gift_card_delivery_templates': 'database_gift_card_runtime_parity.sql',
    'gift_card_delivery_queue': 'database_gift_card_runtime_parity.sql',
    'gift_card_provider_send_logs': 'database_gift_card_runtime_parity.sql',
    'gift_card_lookup_attempts': 'database_gift_card_runtime_parity.sql',
    'gift_card_lookup_lockouts': 'database_gift_card_runtime_parity.sql',
    'accounting_order_records': 'database_accounting_runtime_parity.sql',
    'accounting_payment_applications': 'database_accounting_runtime_parity.sql',
    'accounting_hst_gst_reviews': 'database_accounting_runtime_parity.sql',
    'accounting_period_closures': 'database_accounting_runtime_parity.sql',
    'accountant_export_packages': 'database_accounting_runtime_parity.sql',
    'accounting_evidence_attachments': 'database_accounting_runtime_parity.sql',
}


def tables_in(text: str) -> set[str]:
    return {m.group(1).lower() for m in CREATE_RE.finditer(text)}


def main() -> int:
    runtime_sources: dict[str, list[str]] = defaultdict(list)
    for path in ROOT.glob('functions/**/*.js'):
        text = path.read_text(encoding='utf-8', errors='replace')
        for table in tables_in(text):
            runtime_sources[table].append(path.relative_to(ROOT).as_posix())

    sql_sources: dict[str, list[str]] = defaultdict(list)
    sql_files = sorted(p for p in ROOT.glob('database*.sql') if p.is_file())
    for path in sql_files:
        text = path.read_text(encoding='utf-8', errors='replace')
        for table in tables_in(text):
            sql_sources[table].append(path.name)

    for table, authority in CRITICAL_AUTHORITIES.items():
        path = ROOT / authority
        assert path.exists(), f'Missing critical migration authority: {authority}'
        assert table in tables_in(path.read_text(encoding='utf-8')), (
            f'{authority} does not define required table {table}'
        )

    runtime_tables = set(runtime_sources)
    migrated_tables = set(sql_sources)
    runtime_only = sorted(runtime_tables - migrated_tables)
    covered = sorted(runtime_tables & migrated_tables)

    print('BUILD 401 ACTIVE RUNTIME TABLE PARITY AUDIT')
    print(f'Runtime CREATE TABLE names: {len(runtime_tables)}')
    print(f'Covered by database*.sql authority: {len(covered)}')
    print(f'Runtime-only table names: {len(runtime_only)}')
    if runtime_only:
        print('Runtime-only tables requiring later migration/retirement review:')
        for table in runtime_only:
            print(f'  - {table}: {", ".join(sorted(runtime_sources[table]))}')
    else:
        print('Runtime-only tables requiring later migration/retirement review: none')

    print('Critical Build 393–399 migration authorities: PASS')
    print('No Cloudflare resource was contacted.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
