#!/usr/bin/env python3
"""Guard current Production promotion and rollback provenance against stale release-specific logic."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def req(ok, msg):
    if not ok:
        FAIL.append(msg)


promotion = (ROOT / 'scripts/main_promotion_gate.py').read_text(encoding='utf-8')
production = (ROOT / '.github/workflows/production-pages-deploy-current.yml').read_text(encoding='utf-8')
rollback = (ROOT / '.github/workflows/production-rollback-readiness.yml').read_text(encoding='utf-8')
plan = (ROOT / 'scripts/current_rollback_plan.py').read_text(encoding='utf-8')

for token in (
    'system-gate.yml',
    'current-application-quality.yml',
    'it-admin-runtime-proof.yml',
    'repository-branch-hygiene.yml',
    'current-development-authority.json',
    'required_development_proofs',
    'automatic_production_promotion',
):
    req(token in promotion, f'main promotion gate missing four-proof/current-authority contract: {token}')

for token in (
    'current-development-authority.json',
    'required Development proofs',
    'production-promotion-proof-${{ github.sha }}',
    'exact fully-green Development tree',
):
    req(token in production, f'Production workflow missing current promotion contract: {token}')

for stale in (
    'release467-build1-it-readiness-control-tower.json',
    "control['external_acceptance']['launch_state_until_proven']",
    "'release467_build': control['build']",
):
    req(stale not in production, f'Production workflow retains stale active authority: {stale}')

for token in (
    'PRODUCTION_ROLLBACK_READINESS',
    'scripts/current_rollback_plan.py',
    '/tmp/current-rollback-plan.json',
    'current-production-rollback-readiness',
):
    req(token in rollback, f'Rollback workflow missing current release-neutral contract: {token}')

for stale in (
    'RELEASE466_ROLLBACK_READINESS',
    'scripts/release466_rollback_plan.py',
    'release466-production-rollback-readiness',
    '/tmp/release466-rollback-plan.json',
):
    req(stale not in rollback, f'Rollback workflow retains stale Release 466 active identity: {stale}')

for token in (
    'current-production-rollback-readiness-plan',
    'current_authority_release',
    'current_authority_build',
    'production_mutation_performed',
):
    req(token in plan, f'Current rollback plan missing release-neutral authority contract: {token}')

req('"release": 466' not in plan and '"build": 1' not in plan, 'current rollback plan must not freeze Release 466 Build 1 identity')

if FAIL:
    print('CURRENT PRODUCTION PROMOTION / ROLLBACK PROVENANCE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT PRODUCTION PROMOTION / ROLLBACK PROVENANCE: PASS')
