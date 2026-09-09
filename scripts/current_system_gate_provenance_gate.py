#!/usr/bin/env python3
"""Guard the active System Gate against stale release-specific provenance labels."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / '.github/workflows/system-gate.yml'
FAIL = []


def req(ok, msg):
    if not ok:
        FAIL.append(msg)


text = WORKFLOW.read_text(encoding='utf-8')

for token in (
    "'current-development-authority.json'",
    "'release467-*.json'",
    'python scripts/current_system_gate_provenance_gate.py',
    'python scripts/current_regression_evidence.py',
    '/tmp/current-development-url',
    '/tmp/current-development-d1-authority.json',
    '/tmp/current-development-deploy-proof.json',
    '/tmp/current-regression-evidence.json',
    'name: current-development-deploy-proof',
    'name: current-regression-evidence',
    'Current Development Preview ${GITHUB_SHA}',
):
    req(token in text, f'missing current System Gate provenance token: {token}')

for stale in (
    'Release 465 Build 3 safety statement',
    'Release 465 Build 3 canonical Development Preview',
    'release465-build3-development-deploy-proof',
    'release465-build3-regression-evidence',
    '/tmp/release465-dev-url',
    '/tmp/release465-build3-d1-authority.json',
    '/tmp/release465-build3-development-deploy-proof.json',
):
    req(stale not in text, f'stale active System Gate provenance remains: {stale}')

for historical in (
    'scripts/release464_update2_gate.py',
    'scripts/release464_update3_gate.py',
    'scripts/release465_build1_gate.py',
    'scripts/release465_build2_gate.py',
    'scripts/release465_build3_gate.py',
    'scripts/release465_performance_budget_gate.py',
):
    req(historical in text, f'historical regression prerequisite missing: {historical}')


def run_current_contract(path, label):
    result = subprocess.run(
        [sys.executable, str(ROOT / path)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or f'{label} gate failed').strip()[-2000:]
        FAIL.append(f'{label} current reliability contract failed: {detail}')


# Current reliability contracts are chained here so later work cannot silently regress
# Product cold-start protections, the D1 read-budget layer, root-admin authority,
# bounded lazy-loading, focused Product workspaces, Product editor recovery/autosave safety,
# the single cached Catalog Options authority, Product CRUD / cleanup safety,
# canonical Inventory package/base conversion and partial-consumption safety,
# the fail-closed Inventory lifecycle, recommendation-only reorder economics,
# selected-Product Media / Photo Studio convergence, the buyer-first Storefront Product
# experience, bounded Storefront search / collection discovery and zero-result recovery,
# full public-route technical SEO / sitemap / internal-link convergence, the shared
# Canada-only storefront country/currency/address boundary, or resilient idempotent
# Cart / Checkout order creation and payment-retry recovery, or the preparation-only
# Stripe API-version/idempotency contract while real Stripe acceptance remains HOLD,
# or the preparation-only PayPal sandbox request-id/replay contract while real
# PayPal acceptance remains HOLD, or the read-only Finance/Accounting monthly
# convergence with existing write owners preserved, or the reviewed Orders / Fulfilment
# workflow with copy-only customer communication and provider/refund/accounting owners preserved,
# or the read-only Labeling / Packaging template-to-reprint release workflow that preserves
# the mature Packaging write authority and Build 44 production/reuse lane, or the read-only
# Creators / CAIP project-to-profitability journey that protects private/raw media and keeps
# Inventory, Product, Content Studio, Finance, OAuth/provider and publication owners preserved,
# or the selected-provider Development Social OAuth acceptance lane requiring intended-account
# verification plus explicit human-approved draft evidence while Production OAuth and all
# provider/automatic publication remain fail-closed, or the Build 86 read-only I.T.
# Operations & Self-Diagnostics convergence across deployment, bindings, schema/runtime,
# module authority, provider HOLDs, exact release gates and backup/recovery guidance while
# automatic repair, provider execution, restore execution and Production writes remain closed.
run_current_contract('scripts/release467_build62_gate.py', 'Release 467 Build 62')
run_current_contract('scripts/release467_build63_gate.py', 'Release 467 Build 63')
run_current_contract('scripts/release467_build64_gate.py', 'Release 467 Build 64')
run_current_contract('scripts/release467_build65_gate.py', 'Release 467 Build 65')
run_current_contract('scripts/release467_build66_gate.py', 'Release 467 Build 66')
run_current_contract('scripts/release467_build67_gate.py', 'Release 467 Build 67')
run_current_contract('scripts/release467_build68_gate.py', 'Release 467 Build 68')
run_current_contract('scripts/release467_build69_gate.py', 'Release 467 Build 69')
run_current_contract('scripts/release467_build70_gate.py', 'Release 467 Build 70')
run_current_contract('scripts/release467_build71_gate.py', 'Release 467 Build 71')
run_current_contract('scripts/release467_build72_gate.py', 'Release 467 Build 72')
run_current_contract('scripts/release467_build73_gate.py', 'Release 467 Build 73')
run_current_contract('scripts/release467_build74_gate.py', 'Release 467 Build 74')
run_current_contract('scripts/release467_build75_gate.py', 'Release 467 Build 75')
run_current_contract('scripts/release467_build76_gate.py', 'Release 467 Build 76')
run_current_contract('scripts/release467_build77_gate.py', 'Release 467 Build 77')
run_current_contract('scripts/release467_build78_gate.py', 'Release 467 Build 78')
run_current_contract('scripts/release467_build79_gate.py', 'Release 467 Build 79')
run_current_contract('scripts/release467_build80_gate.py', 'Release 467 Build 80')
run_current_contract('scripts/release467_build81_gate.py', 'Release 467 Build 81')
run_current_contract('scripts/release467_build82_gate.py', 'Release 467 Build 82')
run_current_contract('scripts/release467_build83_gate.py', 'Release 467 Build 83')
run_current_contract('scripts/release467_build84_gate.py', 'Release 467 Build 84')
run_current_contract('scripts/release467_build85_gate.py', 'Release 467 Build 85')
run_current_contract('scripts/release467_build86_gate.py', 'Release 467 Build 86')

if FAIL:
    print('CURRENT SYSTEM GATE PROVENANCE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('CURRENT SYSTEM GATE PROVENANCE: PASS')
