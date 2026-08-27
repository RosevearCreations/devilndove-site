#!/usr/bin/env python3
"""Build 441 guard: one current release, explicit HOLDs, read-only CI and current authorities."""
from __future__ import annotations
import json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
fail=[]
doc=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
if doc != {'environment':'development','release':441,'label':'Build 441'}: fail.append('development-release.json is not exact Build 441 Development authority')
active=ROOT/'.github/workflows/build441-system-gate.yml'
if not active.exists(): fail.append('Build 441 active workflow missing')
if (ROOT/'.github/workflows/build440-source-gate.yml').exists(): fail.append('Build 440 workflow must be historical, not active')
workflow=active.read_text(encoding='utf-8') if active.exists() else ''
if re.search(r'contents:\s*write',workflow.lower()): fail.append('active workflow grants contents: write')
if re.search(r'\bgit\s+push\b',workflow): fail.append('active workflow self-pushes')
for required in ('build440_cross_mutation_responsive_acceptance_test.py','build440_product_inventory_tools_source_gate.py','build441_repository_hygiene_test.py'):
    if required not in workflow: fail.append(f'active gate does not retain {required}')
for rel in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/releases/BUILD441_RELEASE_GATE.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md','docs/operations/REPOSITORY_HYGIENE.md'):
    if not (ROOT/rel).exists(): fail.append(f'missing current authority: {rel}')
gate=(ROOT/'docs/releases/BUILD441_RELEASE_GATE.md').read_text(encoding='utf-8') if (ROOT/'docs/releases/BUILD441_RELEASE_GATE.md').exists() else ''
for marker in ('Build 441','CAIP','HOLD','Production promotion: **CLOSED**'):
    if marker not in gate: fail.append(f'Build 441 release gate missing marker: {marker}')
it=(ROOT/'admin/it-platform/index.html').read_text(encoding='utf-8') if (ROOT/'admin/it-platform/index.html').exists() else ''
for route in ('/admin/startup-readiness/','/admin/deployment-preflight/','/admin/application-sanity/','/admin/runtime-incidents/','/admin/schema-drift/','/admin/operational-continuity/'):
    if route not in it: fail.append(f'I.T. hub missing route: {route}')
print('BUILD 441 RELEASE CONTRACT INTEGRITY')
print('Historical 439/440 work: REGRESSION PROVENANCE / UNRESOLVED ITEMS CARRIED AS 441 HOLDS')
print('Workflow repository mutation: FORBIDDEN')
print('Production mutation capability: NONE')
if fail:
    for i,f in enumerate(fail,1): print(f'{i:03d}. FAIL — {f}')
    raise SystemExit(1)
print('BUILD 441 RELEASE CONTRACT INTEGRITY: PASS')
