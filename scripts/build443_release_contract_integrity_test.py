#!/usr/bin/env python3
"""Build 443 release/checkpoint/HOLD contract guard."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
fail=[]
doc=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
if doc != {'environment':'development','release':443,'label':'Build 443'}: fail.append('active release is not exact Build 443 Development')
active=ROOT/'.github/workflows/build443-system-gate.yml'
if not active.exists(): fail.append('Build 443 workflow missing')
if (ROOT/'.github/workflows/build442-system-gate.yml').exists(): fail.append('Build 442 workflow must be retired after its exact checkpoint')
workflow=active.read_text(encoding='utf-8') if active.exists() else ''
if re.search(r'contents:\s*write',workflow.lower()) or re.search(r'\bgit\s+push\b',workflow): fail.append('active workflow may not mutate the repository')
for required in ('build443_home_carousel_regression.py','build442_it_platform_migration_regression.py','build442_cross_mutation_responsive_acceptance_test.py','build440_product_inventory_tools_source_gate.py','build441_repository_hygiene_test.py'):
    if required not in workflow: fail.append(f'active workflow does not retain {required}')
gate=read=(ROOT/'docs/releases/BUILD443_RELEASE_GATE.md').read_text(encoding='utf-8') if (ROOT/'docs/releases/BUILD443_RELEASE_GATE.md').exists() else ''
for marker in ('Build 443','b8868c9b77ad12de4fee4984274fe80e1d096613','b72eb8b4-ac52-4b12-bdd2-cd85ea6b400d','IT-443-H1','PAY-443-H1','PAY-443-H2','CAIP-443-H1','CAR-443-H1','Production promotion: **CLOSED**'):
    if marker not in gate: fail.append(f'Build 443 gate missing {marker}')
print('BUILD 443 RELEASE CONTRACT INTEGRITY')
print('Build 442 exact Development checkpoint: b8868c9b77ad12de4fee4984274fe80e1d096613')
print('Unresolved work: CARRIED AS BUILD 443 HOLDS')
print('Production mutation capability: NONE')
if fail:
    for i,item in enumerate(fail,1): print(f'{i:03d}. FAIL — {item}')
    raise SystemExit(1)
print('BUILD 443 RELEASE CONTRACT INTEGRITY: PASS')
