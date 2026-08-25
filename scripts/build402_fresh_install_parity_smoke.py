#!/usr/bin/env python3
"""Build 402 local fresh-install parity smoke.

No Cloudflare resource is contacted. The smoke creates an in-memory SQLite database,
installs current migration-owned parity overlays first, then executes the retained
canonical database_full_schema.sql. This ordering lets current table shapes win when
the Build 279 aggregate contains an older CREATE TABLE IF NOT EXISTS definition.
"""

from __future__ import annotations

from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]

OVERLAYS = [
    'database_gift_card_runtime_parity.sql',
    'database_today_task_actions_runtime_parity.sql',
    'database_membership_tier_policy_runtime_parity.sql',
    'database_customer_documents_runtime_parity.sql',
    'database_accounting_runtime_parity.sql',
]
FULL_SCHEMA = 'database_full_schema.sql'

REQUIRED_COLUMNS = {
    'gift_card_lookup_attempts': {
        'gift_card_lookup_attempt_id','code_hint','email_hash','client_key','lookup_email',
        'code_suffix','ip_hash','user_agent','result_status','was_success','created_at',
    },
    'gift_card_lookup_lockouts': {
        'gift_card_lookup_lockout_id','lookup_email','code_suffix','ip_hash','lockout_status',
        'lockout_reason','locked_by_user_id','locked_at','expires_at','released_at','notes',
    },
    'today_task_actions': {
        'today_task_action_id','task_key','task_label','action_status','notes',
        'snooze_until','created_by_user_id','created_at',
    },
    'membership_tier_policies': {
        'policy_id','tier_code','title','short_description','benefits_json','badge_color',
        'sort_order','is_visible','created_at','updated_at',
    },
    'customer_document_sequences': {'document_type','sequence_year','next_number','updated_at'},
    'customer_documents': {
        'customer_document_id','document_number','document_type','order_id','refund_id',
        'document_status','currency','document_amount_cents','tax_adjustment_cents',
        'issue_reason','customer_email','business_name','business_registration_number',
        'source_snapshot_json','issued_by_user_id','issued_at','voided_by_user_id','voided_at',
        'void_reason','created_at','updated_at',
    },
    'accounting_order_records': {
        'accounting_order_record_id','order_id','order_number','entry_status','customer_name',
        'customer_email','currency','subtotal_cents','discount_cents','shipping_cents','tax_cents',
        'total_cents','amount_paid_cents','amount_outstanding_cents','revenue_cents',
        'tax_liability_cents','source_order_status','source_payment_status','notes','created_at',
        'updated_at','last_synced_at',
    },
    'accounting_hst_gst_reviews': {
        'accounting_hst_gst_review_id','period_month','review_status','sales_tax_collected_cents',
        'input_tax_credit_cents','net_tax_payable_cents','filing_reference','filing_due_date',
        'remittance_status','remittance_evidence_url','reminder_date','reviewed_by_user_id',
        'reviewed_at','notes','created_at','updated_at',
    },
    'accountant_export_packages': {
        'accountant_export_package_id','package_key','period_month','tax_year','package_status',
        'manifest_json','created_by_user_id','finalized_by_user_id','finalized_at','created_at',
        'updated_at','notes',
    },
}


def execute_script(conn: sqlite3.Connection, path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    if not text.strip():
        raise AssertionError(f'Schema source is empty: {path.name}')
    try:
        conn.executescript(text)
    except sqlite3.DatabaseError as error:
        raise AssertionError(f'{path.name} failed fresh-install execution: {error}') from error


def columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {str(row[1]) for row in conn.execute(f'PRAGMA table_info({table})').fetchall()}


def main() -> int:
    sources = [ROOT / name for name in OVERLAYS + [FULL_SCHEMA]]
    for path in sources:
        assert path.exists(), f'Missing schema source: {path.name}'

    conn = sqlite3.connect(':memory:')
    conn.execute('PRAGMA foreign_keys = ON')

    for name in OVERLAYS:
        execute_script(conn, ROOT / name)
        print(f'Applied overlay: {name}')

    execute_script(conn, ROOT / FULL_SCHEMA)
    print(f'Applied retained aggregate: {FULL_SCHEMA}')

    missing = []
    for table, required in REQUIRED_COLUMNS.items():
        actual = columns(conn, table)
        if not actual:
            missing.append(f'{table}: table missing')
            continue
        misses = sorted(required - actual)
        if misses:
            missing.append(f'{table}: missing columns {", ".join(misses)}')

    if missing:
        raise AssertionError('Fresh-install current-shape failures:\n  - ' + '\n  - '.join(missing))

    template_keys = {
        str(row[0]) for row in conn.execute(
            "SELECT template_key FROM gift_card_delivery_templates WHERE template_key IN ('activation','reissue')"
        ).fetchall()
    }
    assert template_keys == {'activation','reissue'}, f'Gift Card template seed mismatch: {sorted(template_keys)}'

    tier_codes = {
        str(row[0]) for row in conn.execute(
            "SELECT tier_code FROM membership_tier_policies WHERE tier_code IN ('bronze','silver','gold')"
        ).fetchall()
    }
    assert tier_codes == {'bronze','silver','gold'}, f'Membership policy seed mismatch: {sorted(tier_codes)}'

    fk_errors = conn.execute('PRAGMA foreign_key_check').fetchall()
    assert not fk_errors, f'Foreign-key violations after fresh install: {fk_errors[:20]}'

    table_count = int(conn.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'").fetchone()[0])
    print(f'Fresh-install table count: {table_count}')
    print('Current parity overlays: PASS')
    print('Foreign-key check: PASS')
    print('BUILD 402 FRESH INSTALL PARITY SMOKE: PASS')
    print('PRODUCTION DATA COPY GATE: CLOSED — live Production read-only parity/data mapping is still required.')
    print('No Cloudflare resource was contacted.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
