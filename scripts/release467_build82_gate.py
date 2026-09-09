#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 82."""
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
    req(result.returncode == 0, f"{label} failed: {(result.stderr or result.stdout).strip()[-2400:]}")


helper = read('functions/api/_lib/orderFulfillmentWorkflow.js')
api = read('functions/api/admin/order-fulfillment-workflow.js')
contract = read('functions/api/admin/contracts/operations-order-fulfillment-workflow-write.js')
client = read('public/js/admin-order-fulfillment-workflow-v82.js')
page = read('admin/order-fulfillment-care/index.html')
orders_page = read('admin/orders/index.html')
legacy_client = read('public/js/admin-order-fulfillment-care.js')
css = read('css/admin-order-fulfillment-care.css')
doc = read('docs/operations/RELEASE_467_BUILD_82_ORDERS_FULFILLMENT_WORKFLOW.md')
provenance = read('scripts/current_system_gate_provenance_gate.py')
manifest = json.loads(read('migrations/canonical/manifest.json'))

for token in (
    "'awaiting_payment'", "'paid'", "'preparing'", "'making'", "'packing'",
    "'evidence'", "'ready'", "'fulfilled'", "'returned'", "'refunded'",
    "'cancelled'", "'review'", 'ORDER_FULFILLMENT_WRITE_STATUSES',
    "customer_message_send: false", "provider_shipping_execution: false",
    "payment_execution: false", "refund_execution: false", "accounting_posting: false",
    "request_time_schema_mutation: false", "audit_authority: 'order_status_history'",
    'send_automatically: false', 'fulfillmentReadyLabel',
):
    req(token in helper, f'Build 82 workflow helper missing token: {token}')
for forbidden in (r'\bfetch\s*\(', r'\blocalStorage\.', r'\bsessionStorage\.', r'\bsetInterval\s*\('):
    req(not re.search(forbidden, helper), f'pure Build 82 derivation gained forbidden behavior: {forbidden}')

for token in (
    'buildFulfillmentWorkflow', 'payment_summary', 'order_status_history',
    'latest_history_note', 'history_count', 'DEFAULT_LIMIT = 80', 'MAX_LIMIT = 120',
    "'Cache-Control': 'no-store'", 'read_only_projection: true',
):
    req(token in api, f'Build 82 read API missing token: {token}')
req('onRequestPost' not in api, 'Build 82 read endpoint must expose no POST handler')
for forbidden in ('INSERT INTO', 'UPDATE ', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'):
    req(forbidden not in api.upper(), f'Build 82 read endpoint contains forbidden DML/DDL: {forbidden}')

for token in (
    "CONTRACT_ID = 'operations-order-fulfillment-workflow-write'",
    "new Set(['preparing', 'making', 'packing', 'evidence', 'ready', 'fulfilled', 'returned'])",
    "if (current === 'packing') return ['evidence']", "if (current === 'evidence') return ['ready']",
    "if (current === 'ready') return ['fulfilled']", "return ['returned']",
    "['evidence', 'returned'].includes(newStatus)", 'Payment must be confirmed before fulfilment work advances.',
    'UPDATE orders SET order_status=?', 'INSERT INTO order_status_history',
    "action_type: 'order_fulfillment_workflow_transition'", 'customer_message_sent: false',
    'provider_action_executed: false', 'payment_or_refund_executed: false',
    'accounting_posted: false', 'request_time_schema_mutation: false',
):
    req(token in contract, f'Build 82 reviewed write contract missing token: {token}')
for forbidden in ('CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'queueNotification(', 'processNotificationOutbox(', 'fetch('):
    req(forbidden not in contract, f'Build 82 write contract gained forbidden external/schema behavior: {forbidden}')
req(contract.count('UPDATE orders SET order_status=?') == 1, 'Build 82 write contract must have one narrow Orders status update')
req(contract.count('INSERT INTO order_status_history') == 1, 'Build 82 write contract must have one status-history append')

for token in (
    "/api/admin/order-fulfillment-workflow?limit=100",
    "/api/admin/contracts/operations-order-fulfillment-workflow-write",
    "method: 'POST'", 'Customer update draft', 'copy-only — never sent automatically',
    'Copy customer update', 'Nothing was sent.', 'dd:order-updated',
):
    req(token in client, f'Build 82 client missing token: {token}')
req('setInterval(' not in client, 'Build 82 client must not poll automatically')
req('queueNotification' not in client and 'processNotificationOutbox' not in client, 'Build 82 client must not own notification sending')

req('data-order-fulfillment-workflow-build="82"' in page, 'Build 82 page marker missing')
req('admin-order-fulfillment-workflow-v82.js?v=467b82' in page, 'Build 82 page client missing')
req('admin-order-fulfillment-care.js?v=467b18' in page, 'Existing Build 18 attention client must remain available')
req('fulfillmentCareMount' in page, 'Existing fulfilment/customer-care attention queue mount was removed')
req(len(re.findall(r'<h1(?:\s|>)', page, re.I)) == 1, 'Fulfilment page must contain exactly one H1')
for token in ('value="preparing"', 'value="making"', 'value="packing"', 'value="evidence"', 'value="ready"', 'value="returned"', 'Build 82 fulfilment workflow'):
    req(token in orders_page, f'Orders page missing Build 82 status/filter token: {token}')
req('/api/admin/order-fulfillment-care' in legacy_client, 'Build 18 read-only attention queue consumer was unexpectedly changed')
for token in ('.ofw-orders', '.ofw-progress', '.ofw-actions', '@media(max-width:700px)'):
    req(token in css, f'Build 82 responsive workflow CSS missing token: {token}')

for token in (
    'Build 81 checkpoint', 'c447c9e346443dcde1d75066a825fed74e874daf',
    'nine of nine successful', 'order_status_history', 'DRAFT/COPY ONLY',
    'HOLD_EXTERNAL', 'Build 83',
):
    req(token in doc, f'Build 82 operating document missing token: {token}')

expected = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]
req([row.get('file') for row in manifest.get('migrations', [])] == expected, 'Build 82 must keep canonical migrations 0001-0004 exactly')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 82 must remain schema-neutral')
req("run_current_contract('scripts/release467_build82_gate.py', 'Release 467 Build 82')" in provenance, 'Current System Gate does not chain Build 82')

for path in (
    'functions/api/_lib/orderFulfillmentWorkflow.js',
    'functions/api/admin/order-fulfillment-workflow.js',
    'functions/api/admin/contracts/operations-order-fulfillment-workflow-write.js',
    'public/js/admin-order-fulfillment-workflow-v82.js',
):
    run(['node', '--check', path], f'JavaScript syntax {path}')
run(['node', 'scripts/release467_build82_orders_fulfillment_runtime_test.mjs'], 'Build 82 runtime proof')
run(['python3', 'scripts/release467_build81_gate.py'], 'carried Build 81 boundary')

if FAIL:
    print('RELEASE 467 BUILD 82 ORDERS / FULFILMENT WORKFLOW: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('RELEASE 467 BUILD 82 ORDERS / FULFILMENT WORKFLOW: PASS')
print('Reviewed workflow statuses: 7 WRITE / 12 READ STATES')
print('Customer communication: DRAFT/COPY ONLY')
print('Payment/refund/provider/accounting execution: NONE')
print('Audit authority: order_status_history / PRESERVED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
