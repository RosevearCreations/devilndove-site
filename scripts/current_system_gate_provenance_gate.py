#!/usr/bin/env python3
"""Guard the active System Gate against stale release-specific provenance labels."""
from pathlib import Path
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

if FAIL:
    print('CURRENT SYSTEM GATE PROVENANCE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('CURRENT SYSTEM GATE PROVENANCE: PASS')
