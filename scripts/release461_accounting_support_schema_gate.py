from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
gifi_helper = ROOT / 'functions/api/admin/_accountingGifi.js'
gifi_route = ROOT / 'functions/api/admin/accounting-gifi-notes.js'
attachment_helper = ROOT / 'functions/api/admin/_accountingAttachments.js'
attachment_route = ROOT / 'functions/api/admin/accounting-attachments.js'
fixed_assets_route = ROOT / 'functions/api/admin/accounting-fixed-assets.js'
period_helper = ROOT / 'functions/api/admin/_accountingPeriods.js'
period_route = ROOT / 'functions/api/admin/accounting-period-locks.js'
reconciliation_helper = ROOT / 'functions/api/admin/_accountingReconciliation.js'
statement_import_helper = ROOT / 'functions/api/admin/_accountingStatementImports.js'
vendor_helper = ROOT / 'functions/api/admin/_accountingVendors.js'
expenses_route = ROOT / 'functions/api/admin/accounting-expenses.js'
writeoffs_route = ROOT / 'functions/api/admin/accounting-writeoffs.js'
recurring_expense_route = ROOT / 'functions/api/admin/accounting-recurring-expense-rules.js'
general_ledger_route = ROOT / 'functions/api/admin/general-ledger-accounts.js'
support_migration = ROOT / 'migrations/dev/20260829_release461_accounting_support_schema_authority.sql'
statement_import_migration = ROOT / 'migrations/dev/20260830_release461_accounting_statement_import_schema_authority.sql'
expense_migration = ROOT / 'migrations/dev/20260830_release461_accounting_expense_runtime_schema_authority.sql'
general_ledger_migration = ROOT / 'migrations/dev/20260830_release461_accounting_general_ledger_schema_authority.sql'
release_marker = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE|DROP\s+INDEX)\b', re.I)

runtime_paths = (
    gifi_helper, gifi_route, attachment_helper, attachment_route,
    fixed_assets_route, period_helper, period_route, reconciliation_helper,
    statement_import_helper, vendor_helper, expenses_route, writeoffs_route,
    recurring_expense_route, general_ledger_route,
)
for path in runtime_paths:
    text = path.read_text(encoding='utf-8')
    assert not DDL.search(text), f'accounting runtime DDL remains in {path}'

for path, tokens in (
    (gifi_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingGifiNotesTable', 'idx_accounting_gifi_review_notes_year')),
    (attachment_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingAttachmentsTable', 'idx_accounting_attachments_expense', 'idx_accounting_attachments_vendor', 'idx_accounting_attachments_period', 'idx_accounting_attachments_scope')),
    (fixed_assets_route, ('PRAGMA table_info(accounting_fixed_assets)', 'ensureFixedAssetsTable', 'accounting_fixed_asset_id', 'business_use_percent')),
    (period_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingPeriodClosuresTable', 'idx_accounting_period_closures_period')),
    (reconciliation_helper, ('PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingReconciliationReviewsTable', 'idx_accounting_reconciliation_reviews_type_period')),
    (statement_import_helper, (
        'PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingStatementImportsTables',
        'accounting_statement_imports', 'accounting_statement_import_rows', 'accounting_reconciliation_exceptions',
        'idx_accounting_statement_imports_period', 'idx_accounting_statement_import_rows_import',
        'idx_accounting_statement_import_rows_provider_ref', 'idx_accounting_reconciliation_exceptions_period',
        'idx_accounting_reconciliation_exceptions_queue', 'Apply the current Development migration authority.',
    )),
    (vendor_helper, (
        'PRAGMA table_info(', 'PRAGMA index_list(', 'ensureAccountingVendorsTable',
        'accounting_vendors', 'idx_accounting_vendors_active_name', 'Apply the current Development migration authority.',
    )),
    (expenses_route, (
        'PRAGMA table_info(', 'PRAGMA index_list(', 'accounting_expenses',
        'idx_accounting_expenses_date', 'idx_accounting_expenses_vendor', 'idx_accounting_expenses_recurring',
        'Apply the current Development migration authority.',
    )),
    (writeoffs_route, (
        'PRAGMA table_info(', 'accounting_writeoffs', 'Apply the current Development migration authority.',
    )),
    (recurring_expense_route, (
        'PRAGMA table_info(', 'PRAGMA index_list(', 'ensureExpenseTableExtensions', 'ensureRecurringRulesTable',
        'accounting_expenses', 'accounting_recurring_expense_rules', 'idx_accounting_expenses_recurring',
        'idx_accounting_recurring_expense_rules_due', 'Apply the current Development migration authority.',
    )),
    (general_ledger_route, (
        'PRAGMA table_info(', 'PRAGMA index_list(', 'ensureTable', 'general_ledger_accounts',
        'idx_general_ledger_accounts_category_sort', 'idx_general_ledger_accounts_gifi',
        'idx_general_ledger_accounts_review_state', 'apply_starter_gifi_mappings',
        'Apply the current Development migration authority.',
    )),
):
    text = path.read_text(encoding='utf-8')
    for token in tokens:
        assert token in text, f'missing read-only accounting readiness token {token} in {path}'

support_migration_text = support_migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', support_migration_text, re.I)
for token in (
    'CREATE TABLE IF NOT EXISTS accounting_gifi_review_notes',
    'idx_accounting_gifi_review_notes_year',
    'CREATE TABLE IF NOT EXISTS accounting_attachments',
    'attachment_status', 'attachment_scope', 'document_date', 'scope_key', 'provider_scope',
    'statement_gross_cents', 'statement_fee_cents', 'statement_net_cents', 'statement_tax_cents',
    'statement_shipping_cents', 'statement_txn_count', 'statement_period_start', 'statement_period_end', 'statement_detail_json',
    'idx_accounting_attachments_expense', 'idx_accounting_attachments_vendor', 'idx_accounting_attachments_period', 'idx_accounting_attachments_scope',
    'CREATE TABLE IF NOT EXISTS accounting_fixed_assets', 'business_use_percent',
    'CREATE TABLE IF NOT EXISTS accounting_period_closures', 'idx_accounting_period_closures_period',
    'CREATE TABLE IF NOT EXISTS accounting_reconciliation_reviews', 'statement_reference', 'difference_reason', 'detail_json',
    'expected_rate_basis_points', 'observed_rate_basis_points', 'unresolved_item_count', 'idx_accounting_reconciliation_reviews_type_period',
    'PRAGMA foreign_key_check',
):
    assert token in support_migration_text, f'accounting support migration is missing authority token: {token}'

statement_migration_text = statement_import_migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', statement_migration_text, re.I)
for token in (
    'CREATE TABLE IF NOT EXISTS accounting_statement_imports',
    'provider_scope', 'import_status', 'source_filename', 'source_format', 'period_month', 'period_start', 'period_end',
    'currency', 'row_count', 'gross_cents', 'fee_cents', 'net_cents', 'tax_cents', 'shipping_cents',
    'deposit_cents', 'withdrawal_cents', 'txn_count', 'statement_reference', 'detail_json', 'created_by_user_id',
    'CREATE TABLE IF NOT EXISTS accounting_statement_import_rows',
    'accounting_statement_import_id', 'txn_date', 'txn_type', 'description', 'reference_number', 'debit_cents',
    'credit_cents', 'running_balance_cents', 'raw_json', 'matched_scope_key',
    'CREATE TABLE IF NOT EXISTS accounting_reconciliation_exceptions',
    'reconciliation_type', 'scope_key', 'exception_status', 'severity', 'reference_label', 'statement_amount_cents',
    'book_amount_cents', 'difference_cents', 'tolerance_cents', 'notes', 'assigned_to_user_id', 'accountant_review_flag',
    'resolved_by_user_id', 'resolved_at', 'reopened_by_user_id', 'reopened_at', 'source_import_id',
    'idx_accounting_statement_imports_period', 'idx_accounting_statement_import_rows_import',
    'idx_accounting_statement_import_rows_provider_ref', 'idx_accounting_reconciliation_exceptions_period',
    'idx_accounting_reconciliation_exceptions_queue', 'PRAGMA foreign_key_check',
):
    assert token in statement_migration_text, f'accounting statement import migration is missing authority token: {token}'

expense_migration_text = expense_migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', expense_migration_text, re.I)
for token in (
    'CREATE TABLE IF NOT EXISTS accounting_vendors',
    'accounting_vendor_id', 'vendor_name', 'default_ledger_code', 'default_tax_percent', 'payment_terms',
    'contact_name', 'contact_email', 'contact_phone', 'website_url', 'is_active', 'idx_accounting_vendors_active_name',
    'CREATE TABLE IF NOT EXISTS accounting_expenses',
    'expense_id', 'expense_date', 'vendor_id', 'amount', 'tax_amount', 'ledger_code', 'ledger_name',
    'recurring_expense_rule_id', 'source_mode', 'reference_number', 'idx_accounting_expenses_date',
    'idx_accounting_expenses_vendor', 'idx_accounting_expenses_recurring',
    'CREATE TABLE IF NOT EXISTS accounting_writeoffs', 'writeoff_id', 'writeoff_date', 'item_name', 'reason_code',
    'CREATE TABLE IF NOT EXISTS accounting_recurring_expense_rules', 'rule_name', 'frequency', 'due_day', 'next_due_date',
    'auto_create_mode', 'last_generated_at', 'last_generated_expense_id', 'created_by_user_id', 'updated_by_user_id',
    'idx_accounting_recurring_expense_rules_due', 'PRAGMA foreign_key_check',
):
    assert token in expense_migration_text, f'accounting expense migration is missing authority token: {token}'

general_ledger_migration_text = general_ledger_migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', general_ledger_migration_text, re.I)
assert not re.search(r'\bINSERT\s+INTO\s+general_ledger_accounts\b', general_ledger_migration_text, re.I), 'General Ledger migration must not implicitly seed starter mappings'
for token in (
    'CREATE TABLE IF NOT EXISTS general_ledger_accounts',
    'gl_account_id', 'code', 'name', 'category', 'parent_group', 'normal_balance', 'sort_order',
    'gifi_code', 'gifi_label', 'gifi_section', 'gifi_review_state', 'gifi_review_note',
    'gifi_reviewed_by_user_id', 'gifi_reviewed_at', 'tax_deductibility_percent', 'is_active',
    'idx_general_ledger_accounts_category_sort', 'idx_general_ledger_accounts_gifi',
    'idx_general_ledger_accounts_review_state', 'PRAGMA foreign_key_check',
):
    assert token in general_ledger_migration_text, f'General Ledger migration is missing authority token: {token}'

release_text = release_marker.read_text(encoding='utf-8')
assert re.search(r'"release"\s*:\s*460\b', release_text), 'development-release.json must remain at accepted Release 460 until manual D1 acceptance'

for path in runtime_paths:
    subprocess.run(['node', '--check', str(path)], cwd=ROOT, check=True)

print('RELEASE 461 ACCOUNTING SUPPORT SCHEMA SOURCE GATE: PASS')
