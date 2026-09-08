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

# Historical Release 464/465 validators remain valid prerequisites; only active proof/deploy
# identity is required to be current-release neutral.
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
# or full public-route technical SEO / sitemap / internal-link convergence.
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

if FAIL:
    print('CURRENT SYSTEM GATE PROVENANCE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('CURRENT SYSTEM GATE PROVENANCE: PASS')
