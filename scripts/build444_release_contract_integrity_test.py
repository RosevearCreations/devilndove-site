#!/usr/bin/env python3
"""Build 444 release/checkpoint/HOLD contract guard."""
from __future__ import annotations
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
fail: list[str] = []
doc = json.loads((ROOT / 'development-release.json').read_text(encoding='utf-8'))
if doc != {'environment': 'development', 'release': 444, 'label': 'Build 444'}:
    fail.append('active release is not exact Build 444 Development')

active = ROOT / '.github/workflows/build444-system-gate.yml'
if not active.exists():
    fail.append('Build 444 workflow missing')
if (ROOT / '.github/workflows/build443-system-gate.yml').exists():
    fail.append('Build 443 workflow must be retired after the Build 444 release bridge')
workflow = active.read_text(encoding='utf-8') if active.exists() else ''
if re.search(r'contents:\s*write', workflow.lower()) or re.search(r'\bgit\s+push\b', workflow):
    fail.append('active workflow may not mutate the repository')
for required in (
    'build444_infrastructure_authority_regression.py',
    'build443_home_carousel_regression.py',
    'build442_it_platform_migration_regression.py',
    'build442_cross_mutation_responsive_acceptance_test.py',
    'build440_product_inventory_tools_source_gate.py',
    'build441_repository_hygiene_test.py',
):
    if required not in workflow:
        fail.append(f'active workflow does not retain {required}')

gate_path = ROOT / 'docs/releases/BUILD444_RELEASE_GATE.md'
gate = gate_path.read_text(encoding='utf-8') if gate_path.exists() else ''
for marker in (
    'Build 444',
    'c5aa6541ec8574c2054578dce765546af9265f7c',
    'IT-444-H1',
    'PAY-444-H1',
    'PAY-444-H2',
    'CAIP-444-H1',
    'CAR-444-H1',
    'Build 444 adds no new D1 SQL migration',
    'Production promotion: **CLOSED**',
):
    if marker not in gate:
        fail.append(f'Build 444 gate missing {marker}')

print('BUILD 444 RELEASE CONTRACT INTEGRITY')
print('Build 443 exact Development source checkpoint: c5aa6541ec8574c2054578dce765546af9265f7c')
print('Unresolved work: CARRIED AS BUILD 444 HOLDS')
print('Production mutation capability: NONE')
if fail:
    for i, item in enumerate(fail, 1):
        print(f'{i:03d}. FAIL — {item}')
    raise SystemExit(1)
print('BUILD 444 RELEASE CONTRACT INTEGRITY: PASS')
