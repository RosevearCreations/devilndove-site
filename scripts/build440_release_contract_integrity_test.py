#!/usr/bin/env python3
"""Build 440: ensure Development has one current release contract and no self-mutating CI."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
failures: list[str] = []
release_doc = json.loads((ROOT / 'development-release.json').read_text(encoding='utf-8'))
release = int(release_doc.get('release') or 0)
expected = 440

if release != expected:
    failures.append(f'Canonical Development release is {release}; expected Build {expected}.')

workflow_dir = ROOT / '.github' / 'workflows'
workflows = sorted([*workflow_dir.glob('*.yml'), *workflow_dir.glob('*.yaml')])
if not workflows:
    failures.append('No active GitHub Actions workflow exists for Development.')

for path in workflows:
    text = path.read_text(encoding='utf-8')
    builds = {int(value) for value in re.findall(r'\bBuild\s+(\d{3,})\b', text, flags=re.I)}
    stale = sorted(value for value in builds if value != release)
    if stale:
        failures.append(f'{path.relative_to(ROOT)} contains stale active Build labels: {stale}.')
    if 'contents: write' in text:
        failures.append(f'{path.relative_to(ROOT)} grants contents: write; active validation workflows must not mutate source.')
    for token in ('git push', 'git commit', 'git add --'):
        if token in text:
            failures.append(f'{path.relative_to(ROOT)} contains source-mutating CI command: {token!r}.')

canonical_workflow = workflow_dir / f'build{release}-source-gate.yml'
if not canonical_workflow.exists():
    failures.append(f'Canonical Build {release} source-gate workflow is missing.')
else:
    gate = canonical_workflow.read_text(encoding='utf-8')
    for marker in (
        "- '.github/workflows/**'",
        f'python scripts/build{release}_development_release_alignment_test.py',
        f'python scripts/build{release}_release_contract_integrity_test.py',
        f'python scripts/build{release}_cross_mutation_responsive_acceptance_test.py',
        f'python scripts/build{release}_product_inventory_tools_source_gate.py',
    ):
        if marker not in gate:
            failures.append(f'Canonical source gate is missing current-release marker: {marker}')

retired_paths = (
    ROOT / '.github' / 'workflows' / 'build440-mobile-product-resource-authority-sync.yml',
    ROOT / 'scripts' / 'build440_sync_mobile_product_resource_authority.py',
)
for path in retired_paths:
    if path.exists():
        failures.append(f'One-time transition authority is still active: {path.relative_to(ROOT)}')

print('BUILD 440 RELEASE CONTRACT INTEGRITY')
print(f'Canonical Development release: Build {release}')
print(f'Active workflow files: {len(workflows)}')
print('Historical migrations/tests may retain their original build numbers; they are compatibility evidence, not active release authorities.')
print('Cloudflare/D1/R2/provider access: NONE')
print('Production mutation capability: NONE')
print()

if failures:
    for index, failure in enumerate(failures, 1):
        print(f'{index:02d}. FAIL — {failure}')
    print(f'\nBUILD 440 RELEASE CONTRACT INTEGRITY: FAIL ({len(failures)})')
    raise SystemExit(1)

print('BUILD 440 RELEASE CONTRACT INTEGRITY: PASS')
print('Active CI: READ-ONLY SOURCE VALIDATION')
print('Self-writing workflow commits: NONE')
print('Current release authority: ONE / Build 440')
