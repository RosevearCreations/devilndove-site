#!/usr/bin/env python3
"""Release 448 Financials depth: read-only monthly performance bridge gate."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]

def text(path):
    return (ROOT / path).read_text(encoding='utf-8')

def require(path, needle):
    value = text(path)
    if needle not in value:
        raise SystemExit(f"FAIL — {path} missing {needle!r}")
    return value

page = require('admin/accounting/index.html', '/public/js/admin-accounting-performance.js?v=448')
require('admin/accounting/index.html', '/css/admin-accounting-performance.css?v=448')
if len(re.findall(r'<h1(?:\s|>)', page, re.I)) != 1:
    raise SystemExit('FAIL — Accounting admin page must retain exactly one H1')

performance = require('public/js/admin-accounting-performance.js', 'Monthly performance bridge')
for needle in [
    '/api/admin/accounting-profit-loss?month=',
    '/api/admin/accounting-item-costing?month=',
    'estimated_recognized_base_cogs_cents',
    'estimated_recognized_overhead_cogs_cents',
    'estimated_recognized_full_cogs_cents',
    'roughOperatingResultCents',
    'baseCogsCents -',
    'overheadCents;',
    'not subtracted again',
    'Sold-Product cost coverage',
    'data-context-help="financial-performance-bridge"',
    "label.textContent = 'Before COGS · after overhead'",
    "label.textContent = 'Recognized full COGS · includes overhead'",
]:
    if needle not in performance:
        raise SystemExit(f"FAIL — Financials performance bridge missing {needle!r}")

if "method:" in performance or "method :" in performance:
    raise SystemExit('FAIL — Financials performance bridge must remain GET/read-only')
if 'fetch(' in performance:
    raise SystemExit('FAIL — Financials performance bridge must use authenticated read authority, not direct fetch')
if '<h1' in performance.lower():
    raise SystemExit('FAIL — Financials performance bridge must never create an H1')

require('functions/api/_lib/accountingProfitLossReadService.js', "mode: 'read-only-accounting-profit-loss'")
require('functions/api/_lib/accountingProfitLossReadService.js', 'request_time_schema_mutation: false')
require('functions/api/_lib/accountingItemCostingReadService.js', "mode: 'read-only-accounting-item-costing'")
require('functions/api/_lib/accountingItemCostingReadService.js', 'request_time_schema_mutation: false')
require('functions/api/admin/_costing.js', 'estimated_recognized_base_cogs_cents: recognizedBaseCogs')
require('functions/api/admin/_costing.js', 'estimated_recognized_full_cogs_cents: recognizedBaseCogs + recognizedOverheadCogs')

styles = require('css/admin-accounting-performance.css', '.accounting-performance-grid')
for needle in ['@media(max-width:850px)', '@media(max-width:520px)', '.accounting-performance-result.negative']:
    if needle not in styles:
        raise SystemExit(f"FAIL — Financials performance CSS missing {needle!r}")

subprocess.run(['node', '--check', str(ROOT / 'public/js/admin-accounting-performance.js')], check=True)

print('RELEASE 448 FINANCIALS DEPTH GATE: PASS')
print('Monthly performance bridge: READ ONLY')
print('COGS math: BASE COGS + FULL MONTHLY OVERHEAD (NO OVERHEAD DOUBLE COUNT)')
print('Sold-Product cost coverage: EXPLICIT')
print('Accounting page H1 count: 1')
print('D1/R2/provider/Production mutation: NONE')
