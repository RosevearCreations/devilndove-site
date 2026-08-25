#!/usr/bin/env python3
"""Build 402 local fresh-install parity smoke.

No Cloudflare resource is contacted.

Current install composition is intentionally two-stage:
1. install the retained aggregate so Core/prerequisite parents such as users, orders,
   payments and products exist;
2. remove only the tables now owned by newer parity overlays, then apply those overlays
   in build/dependency order so current table shapes and seed authorities win.

This avoids both failure modes we have already proven:
- overlay-first can fail when a migration seed resolves a foreign key to a Core table
  that the aggregate has not created yet;
- aggregate-only / aggregate-last can preserve stale CREATE TABLE IF NOT EXISTS shapes
  instead of the current migration-owned definitions.
"""

from __future__ import annotations

from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]

OVERLAYS = [
    'database_gift_card_runtime_parity.sql',
    'database_today_task_actions_runtime_parity.sql',
    'database_membership_tier_policy_runtime_parity.sql',
    'database_customer_documents_runtime_parity.sql',
    'database_accounting_runtime_parity.sql',
    'database_notification_runtime_parity.sql',
]
FULL_SCHEMA = 'database_full_schema.sql'
CREATE_TABLE_RE = re.compile(
    r'CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+[`"\']?([A-Za-z_][A-Za-z0-9_]*)',
    re.I,
)

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
    'notification_outbox': {
        'notification_outbox_id','notification_kind','channel','destination','related_order_id',
        'related_payment_id','related_product_id','payload_json','metadata_json','status',
        'attempt_count','last_attempt_at','next_attempt_at','provider_message_id','error_text',
        'created_at','updated_at',
    },
    'notification_dispatch_log': {
        'notification_dispatch_log_id','notification_outbox_id','notification_kind','destination',
        'status','provider_message_id','error_text','created_at',
    },
    'notification_exclusions': {
        'notification_exclusion_id','notification_kind','destination','product_id','order_id',
        'reason','is_active','created_at','updated_at',
    },
    'notification_cooldown_rules': {
        'notification_cooldown_rule_id','notification_kind','cooldown_hours','is_enabled',
        'created_at','updated_at',
    },
    'notification_automation_settings': {
        'notification_automation_setting_id','notification_kind','is_enabled','send_after_hours',
        'max_age_days','order_statuses_json','payment_statuses_json','notes','created_at','updated_at',
    },
    'customer_engagement_runs': {
        'customer_engagement_run_id','run_type','actor_user_id','summary_json','created_at',
    },
    'gift_card_delivery_audit': {
        'gift_card_delivery_audit_id','gift_card_id','audience','notification_kind','destination',
        'notification_outbox_id','notification_dispatch_log_id','actor_user_id','action_type',
        'details_json','created_at',
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


def overlay_tables(path: Path) -> set[str]:
    text = path.read_text(encoding='utf-8')
    return {match.group(1) for match in CREATE_TABLE_RE.finditer(text)}


def columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {str(row[1]) for row in conn.execute(f'PRAGMA table_info("{table}")').fetchall()}


def main() -> int:
    sources = [ROOT / name for name in [FULL_SCHEMA] + OVERLAYS]
    for path in sources:
        assert path.exists(), f'Missing schema source: {path.name}'

    conn = sqlite3.connect(':memory:')
    conn.execute('PRAGMA foreign_keys = ON')

    # Core/prerequisite authorities must exist before overlay seeds with foreign keys run.
    execute_script(conn, ROOT / FULL_SCHEMA)
    print(f'Applied retained aggregate prerequisites: {FULL_SCHEMA}')

    owned_tables: set[str] = set()
    for name in OVERLAYS:
        owned_tables.update(overlay_tables(ROOT / name))
    assert owned_tables, 'No parity-overlay tables were detected.'

    # Replace stale aggregate copies with migration-owned current shapes. This is safe in
    # the in-memory fresh-install smoke because there is no business data to preserve.
    conn.commit()
    conn.execute('PRAGMA foreign_keys = OFF')
    for table in sorted(owned_tables):
        conn.execute(f'DROP TABLE IF EXISTS "{table}"')
    conn.commit()
    conn.execute('PRAGMA foreign_keys = ON')
    print(f'Removed stale aggregate copies for {len(owned_tables)} overlay-owned tables.')

    for name in OVERLAYS:
        execute_script(conn, ROOT / name)
        print(f'Applied current overlay: {name}')

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

    cooldown_kinds = {
        str(row[0]) for row in conn.execute(
            "SELECT notification_kind FROM notification_cooldown_rules"
        ).fetchall()
    }
    for kind in ['checkout_recovery','review_request','back_in_stock','gift_card_issued','gift_card_purchase_confirmation']:
        assert kind in cooldown_kinds, f'Notification cooldown seed missing: {kind}'

    automation_kinds = {
        str(row[0]) for row in conn.execute(
            "SELECT notification_kind FROM notification_automation_settings"
        ).fetchall()
    }
    for kind in ['checkout_recovery','review_request','back_in_stock','gift_card_issued','gift_card_purchase_confirmation']:
        assert kind in automation_kinds, f'Notification automation seed missing: {kind}'

    fk_errors = conn.execute('PRAGMA foreign_key_check').fetchall()
    assert not fk_errors, f'Foreign-key violations after fresh install: {fk_errors[:20]}'

    table_count = int(conn.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'").fetchone()[0])
    print(f'Fresh-install table count: {table_count}')
    print(f'Current overlay-owned table count: {len(owned_tables)}')
    print('Current parity overlays: PASS')
    print('Foreign-key check: PASS')
    print('BUILD 402 FRESH INSTALL PARITY SMOKE: PASS')
    print('PRODUCTION DATA COPY GATE: CLOSED — live Production read-only parity/data mapping is still required.')
    print('No Cloudflare resource was contacted.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
