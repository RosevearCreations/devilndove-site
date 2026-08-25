#!/usr/bin/env python3
"""Builds 340-342 Accounting/Platform read batch regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def reject_mutation(text, label):
    for forbidden in ('CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'INSERT INTO', 'DELETE FROM', 'UPDATE '):
        assert forbidden not in text, f'{label} contains mutation/DDL token: {forbidden}'

checks = [
    (340, 'accounting-reconciliation-read', 'accounting', 'functions/api/_lib/accountingReconciliationReadService.js', 'functions/api/admin/contracts/accounting-reconciliation-read.js'),
    (341, 'platform-db-sanity-read', 'platform', 'functions/api/_lib/platformDbSanityReadService.js', 'functions/api/admin/contracts/platform-db-sanity-read.js'),
    (342, 'accounting-close-workflow-read', 'accounting', 'functions/api/_lib/accountingCloseWorkflowReadService.js', 'functions/api/admin/contracts/accounting-close-workflow-read.js'),
]

for build, contract_id, owner, service_path, contract_path in checks:
    service = read(service_path)
    contract = read(contract_path)
    assert f'export const BUILD = {build}' in service
    assert f"export const CONTRACT_ID = '{contract_id}'" in service
    assert f"export const OWNER = '{owner}'" in service
    assert 'request_time_schema_mutation:false' in service.replace(' ', '') or 'request_time_schema_mutation: false' in service
    reject_mutation(service, f'Build {build} read service')
    assert 'onRequestGet' in contract and 'onRequestPost' not in contract

reconciliation = read('functions/api/admin/accounting-reconciliation.js')
recon_get = reconciliation.split('export async function onRequestGet', 1)[1].split('export async function onRequestPost', 1)[0]
recon_post = reconciliation.split('export async function onRequestPost', 1)[1]
assert 'readAccountingReconciliation' in recon_get
for helper in ('ensureAccountingReconciliationReviewsTable', 'ensureAccountingAttachmentsTable'):
    assert helper not in recon_get
assert 'ensureAccountingReconciliationReviewsTable' in recon_post
assert 'ensureAccountingAttachmentsTable' in recon_post
assert 'INSERT INTO accounting_reconciliation_reviews' in recon_post

db_sanity = read('functions/api/admin/db-sanity.js')
assert 'readPlatformDbSanity' in db_sanity
reject_mutation(db_sanity, 'Build 341 legacy DB sanity GET')

close_workflow = read('functions/api/admin/accounting-close-workflow.js')
close_get = close_workflow.split('export async function onRequestGet', 1)[1].split('export async function onRequestPost', 1)[0]
close_post = close_workflow.split('export async function onRequestPost', 1)[1]
assert 'payload(db, periodMonth)' in close_get
assert 'ensureSchema(db)' not in close_get
assert 'readAccountingCloseWorkflow' in close_workflow
assert 'await ensureSchema(db)' in close_post
assert 'CREATE TABLE IF NOT EXISTS accounting_payment_applications' in close_workflow

contracts = read('public/js/core/dd-module-contracts.mjs')
adapters = read('public/js/core/dd-module-service-adapters.mjs')
for text in (contracts, adapters):
    match = re.search(r'export const BUILD = (\d+);', text)
    assert match and int(match.group(1)) >= 342
    for _, contract_id, _, _, _ in checks:
        assert contract_id in text

assert "contract('platform-db-sanity-read', 'platform', ['accounting', 'admin']" in contracts
assert "'platform-db-sanity-read': service('platform-db-sanity-read', 'platform'" in adapters

application_groups = read('public/js/core/dd-application-module-groups.mjs')
assert "id: 'business-administration'" in application_groups
assert "entry: null" in application_groups
assert "runtimeDomains: Object.freeze([])" in application_groups

print('BUILDS 340-342 ACCOUNTING/PLATFORM READ BATCH: PASS')
print('No Cloudflare resource was contacted.')
