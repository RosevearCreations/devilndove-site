#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
close_route = ROOT / 'functions/api/admin/accounting-close-workflow.js'
close_read_service = ROOT / 'functions/api/_lib/accountingCloseWorkflowReadService.js'
period_helper = ROOT / 'functions/api/admin/_accountingPeriods.js'
notification_helper = ROOT / 'functions/api/_lib/notificationOutbox.js'
close_migration = ROOT / 'migrations/dev/20260830_release461_accounting_close_workflow_schema_authority.sql'
release_marker = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE|DROP\s+INDEX)\b', re.I)

for path in (close_route, close_read_service, period_helper, notification_helper):
    text = path.read_text(encoding='utf-8')
    assert not DDL.search(text), f'accounting close runtime DDL remains in {path}'

route_text = close_route.read_text(encoding='utf-8')
for token in (
    'PRAGMA table_info(', 'PRAGMA index_list(', 'ensureSchema',
    'accounting_payment_applications', 'accounting_hst_gst_reviews',
    'accountant_export_packages', 'accounting_evidence_attachments',
    'idx_accounting_payment_applications_period', 'idx_accounting_hst_gst_reviews_period',
    'idx_accountant_export_packages_period', 'remittance_evidence_url', 'reminder_date',
    'Apply the current Development migration authority.', 'queueNotification',
):
    assert token in route_text, f'close workflow route is missing authority token: {token}'
assert 'CREATE TABLE IF NOT EXISTS notification_outbox' not in route_text, 'close workflow must not own notification schema'
assert 'idx_notification_outbox_status' not in route_text, 'close workflow must not recreate notification indexes'
assert 'ensureColumn(' not in route_text, 'close workflow must not retain request-time column repair helper'

read_text = close_read_service.read_text(encoding='utf-8')
for token in (
    "'accounting_payment_applications'", "'accounting_hst_gst_reviews'",
    "'accounting_period_closures'", "'accountant_export_packages'",
    "'accounting_evidence_attachments'", 'request_time_schema_mutation:false',
    'PRAGMA table_info(',
):
    assert token in read_text, f'close read service is missing read-only token: {token}'

migration_text = close_migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', migration_text, re.I)
assert 'notification_outbox' not in migration_text, 'close migration must not duplicate notification authority'
for token in (
    'CREATE TABLE IF NOT EXISTS accounting_payment_applications',
    'accounting_payment_application_id', 'payment_id', 'order_id', 'period_month',
    'application_status', 'applied_amount_cents', 'fee_amount_cents', 'tax_component_cents',
    'provider', 'transaction_reference', 'application_notes', 'created_by_user_id', 'reviewed_by_user_id', 'reviewed_at',
    'CREATE TABLE IF NOT EXISTS accounting_hst_gst_reviews',
    'accounting_hst_gst_review_id', 'review_status', 'sales_tax_collected_cents', 'input_tax_credit_cents',
    'net_tax_payable_cents', 'filing_reference', 'filing_due_date', 'remittance_status',
    'remittance_evidence_url', 'reminder_date',
    'CREATE TABLE IF NOT EXISTS accountant_export_packages',
    'accountant_export_package_id', 'package_key', 'tax_year', 'package_status', 'manifest_json',
    'finalized_by_user_id', 'finalized_at',
    'CREATE TABLE IF NOT EXISTS accounting_evidence_attachments',
    'accounting_evidence_attachment_id', 'evidence_kind', 'title', 'evidence_url', 'object_key',
    'original_filename', 'mime_type', 'file_size_bytes', 'attachment_status',
    'idx_accounting_payment_applications_period', 'idx_accounting_hst_gst_reviews_period',
    'idx_accountant_export_packages_period', 'PRAGMA foreign_key_check',
):
    assert token in migration_text, f'close workflow migration is missing authority token: {token}'

release_text = release_marker.read_text(encoding='utf-8')
assert re.search(r'"release"\s*:\s*460\b', release_text), 'development-release.json must remain at accepted Release 460 until manual D1 acceptance'

for path in (close_route, close_read_service):
    subprocess.run(['node', '--check', str(path)], cwd=ROOT, check=True)

print('RELEASE 461 ACCOUNTING CLOSE WORKFLOW SCHEMA SOURCE GATE: PASS')
