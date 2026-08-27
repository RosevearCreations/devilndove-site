#!/usr/bin/env python3
"""Build 442 guard: active release, Phase A migration boundary, inherited regressions and carried HOLDs."""
from __future__ import annotations
import json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
fail=[]
doc=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
if doc != {'environment':'development','release':442,'label':'Build 442'}: fail.append('development-release.json is not exact Build 442 Development authority')
active=ROOT/'.github/workflows/build442-system-gate.yml'
if not active.exists(): fail.append('Build 442 active workflow missing')
if (ROOT/'.github/workflows/build441-system-gate.yml').exists(): fail.append('Build 441 workflow must be historical, not active')
workflow=active.read_text(encoding='utf-8') if active.exists() else ''
if re.search(r'contents:\s*write',workflow.lower()): fail.append('active workflow grants contents: write')
if re.search(r'\bgit\s+push\b',workflow): fail.append('active workflow self-pushes')
for required in ('build442_cross_mutation_responsive_acceptance_test.py','build442_it_platform_migration_regression.py','build440_product_inventory_tools_source_gate.py','build441_repository_hygiene_test.py'):
    if required not in workflow: fail.append(f'active gate does not retain {required}')
for historical in ('scripts/build441_cross_mutation_responsive_acceptance_test.py','scripts/build441_development_release_alignment_test.py','docs/releases/BUILD441_RELEASE_GATE.md'):
    if not (ROOT/historical).exists(): fail.append(f'Build 441 provenance missing: {historical}')
for rel in ('docs/releases/BUILD442_RELEASE_GATE.md','PROJECT_STATUS_AND_ROADMAP.md','docs/architecture/IT_MODULE_ARCHITECTURE.md','database_build442_it_platform_user_access.sql','scripts/build442_apply_development_it_platform.py'):
    if not (ROOT/rel).exists(): fail.append(f'missing current Build 442 authority: {rel}')
gate=(ROOT/'docs/releases/BUILD442_RELEASE_GATE.md').read_text(encoding='utf-8') if (ROOT/'docs/releases/BUILD442_RELEASE_GATE.md').exists() else ''
for marker in ('Build 442','CAIP','HOLD','IT-442-H1','96e3256b608190a8780829ea9e6409670a898fb4','Production promotion: **CLOSED**'):
    if marker not in gate: fail.append(f'Build 442 release gate missing marker: {marker}')
if 'runtime enforcement remains intentionally off' not in gate.lower(): fail.append('Build 442 Phase A gate must explicitly keep runtime I.T. enforcement off before D1 proof')
migration=(ROOT/'database_build442_it_platform_user_access.sql').read_text(encoding='utf-8') if (ROOT/'database_build442_it_platform_user_access.sql').exists() else ''
if 'app_module_user_access' not in migration or "'it-platform'" not in migration: fail.append('Build 442 migration does not define fourth-module user authority')
print('BUILD 442 RELEASE CONTRACT INTEGRITY')
print('Build 441 exact source/deploy checkpoint: 96e3256b608190a8780829ea9e6409670a898fb4')
print('Build 442 Phase A: MIGRATION PACKAGE / NO RUNTIME ENFORCEMENT')
print('CAIP and unresolved evidence: CARRIED AS BUILD 442 HOLDS')
print('Workflow repository mutation: FORBIDDEN')
print('Production mutation capability: NONE')
if fail:
    for i,f in enumerate(fail,1): print(f'{i:03d}. FAIL — {f}')
    raise SystemExit(1)
print('BUILD 442 RELEASE CONTRACT INTEGRITY: PASS')
