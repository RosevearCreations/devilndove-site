#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 81."""
from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def req(ok, message):
    if not ok:
        FAIL.append(message)


def run(command, label):
    result = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"{label} failed: {(result.stderr or result.stdout).strip()[-2000:]}")


helper = read('functions/api/_lib/financeAccountingCockpit.js')
api = read('functions/api/admin/finance-accounting-cockpit.js')
expense_service = read('functions/api/_lib/accountingExpensesReadService.js')
client = read('public/js/admin-finance-accounting-cockpit-v81.js')
legacy_client = read('public/js/admin-accounting-operations.js')
page = read('admin/finance/index.html')
css = read('css/admin-accounting-operations.css')
doc = read('docs/operations/RELEASE_467_BUILD_81_FINANCE_ACCOUNTING_COCKPIT.md')
provenance = read('scripts/current_system_gate_provenance_gate.py')
manifest = json.loads(read('migrations/canonical/manifest.json'))

for token in (
    "'orders-payments-refunds'", "'accounts-receivable'", "'accounts-payable'",
    "'bank-reconciliation'", "'expenses'", "'inventory-costs'", "'journals'",
    "'month-end-accountant-export'", 'READY_FOR_ACCOUNTANT_REVIEW', 'PARTIAL_SOURCE_FAILURE',
    'purchase_order_is_not_accounts_payable: true', 'readiness_is_not_posting_authorization: true',
    'payment_execution: false', 'refund_execution: false', 'accounting_posting: false',
    'purchasing: false', 'period_close: false', 'automatic_export: false',
):
    req(token in helper, f'Finance cockpit helper missing token: {token}')

for forbidden in (r'\bfetch\s*\(', r'\blocalStorage\.', r'\bsessionStorage\.', r'\bsetInterval\s*\('):
    req(not re.search(forbidden, helper), f'pure Finance derivation gained forbidden behavior: {forbidden}')

for token in (
    'readAccountingCloseWorkflow', 'readAccountingExpenses', 'readAccountingItemCosting',
    'readAccountingJournal', 'readAccountingReconciliation', 'buildFinanceAccountingCockpit',
    "reconciliationType: 'processor_fees'", "readAccountingExpenses(db, { month: period, limit: 500 })",
    'supplier_purchase_orders', "text(line.ledger_code) === '2100'",
    'Cache-Control', "'no-store'",
):
    req(token in api, f'Finance cockpit API missing token: {token}')
req('onRequestPost' not in api, 'Build 81 cockpit endpoint must expose no POST handler')
for forbidden in ('INSERT INTO', 'UPDATE ', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'):
    req(forbidden not in api.upper(), f'Build 81 cockpit API contains forbidden DML/DDL: {forbidden}')
for token in ('periodMonth', "substr(COALESCE(ae.expense_date, ae.created_at, ''), 1, 7) = ?", 'period_month: periodMonth || null'):
    req(token in expense_service, f'Accounting expense monthly read bound missing token: {token}')

for token in (
    '/api/admin/finance-accounting-cockpit?period_month=', 'window.DDAuth.apiFetch',
    'Purchase orders are commitments, not booked Accounts Payable', 'HOLD_EXTERNAL',
    'one authenticated GET and no financial action',
):
    req(token in client, f'Finance cockpit client missing token: {token}')
for forbidden in ("method:'POST'", 'method: "POST"', "method:'PUT'", "method:'DELETE'", 'setInterval('):
    req(forbidden not in client.replace(' ', ''), f'Finance cockpit client gained forbidden behavior: {forbidden}')

req('data-finance-cockpit-build="81"' in page, 'Finance page does not select the Build 81 cockpit')
req('admin-finance-accounting-cockpit-v81.js?v=467b81' in page, 'Finance page does not load Build 81 client')
req('admin-accounting-operations.css?v=467b81' in page, 'Finance page does not load the Build 81 responsive CSS revision')
req(len(re.findall(r'<h1(?:\s|>)', page, re.I)) == 1, 'Finance page must retain exactly one H1')
req("mount.dataset.financeCockpitBuild==='81'" in legacy_client, 'legacy Build 12 Finance loader is not suppressed under Build 81')
for token in ('.finance-cockpit-stages', '.finance-cockpit-stage', '@media(max-width:640px)'):
    req(token in css, f'Finance cockpit responsive CSS missing token: {token}')

for token in ('Build 80 checkpoint', 'nine of nine successful', 'read-only', 'HOLD_EXTERNAL', 'Build 82'):
    req(token in doc, f'Build 81 operating document missing token: {token}')

expected = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]
req([row.get('file') for row in manifest.get('migrations', [])] == expected, 'Build 81 must keep canonical migrations 0001-0004 exactly')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 81 must remain schema-neutral')
req('release467_build81_gate.py' in provenance and 'Release 467 Build 81' in provenance, 'Current System Gate does not chain Build 81')

for path in (
    'functions/api/_lib/financeAccountingCockpit.js',
    'functions/api/admin/finance-accounting-cockpit.js',
    'public/js/admin-finance-accounting-cockpit-v81.js',
):
    run(['node', '--check', path], f'JavaScript syntax {path}')
run(['node', 'scripts/release467_build81_finance_cockpit_runtime_test.mjs'], 'Build 81 runtime proof')
run(['python3', 'scripts/release467_build80_gate.py'], 'carried Build 80 boundary')

if FAIL:
    print('RELEASE 467 BUILD 81 FINANCE & ACCOUNTING COCKPIT: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('RELEASE 467 BUILD 81 FINANCE & ACCOUNTING COCKPIT: PASS')
print('Monthly financial stages: 8 / CONVERGED READ-ONLY')
print('Accounting write owners: PRESERVED')
print('Partial source failure: FAILS CLOSED')
print('Provider/payment/refund/purchase/post/close/export actions: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
