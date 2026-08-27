#!/usr/bin/env python3
"""Current Build 441 source-only sanity runner."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
steps=[
 ('release alignment',[sys.executable,'scripts/build441_development_release_alignment_test.py']),
 ('release contract',[sys.executable,'scripts/build441_release_contract_integrity_test.py']),
 ('repository hygiene',[sys.executable,'scripts/build441_repository_hygiene_test.py']),
 ('cross-mutation responsive regression',[sys.executable,'scripts/build441_cross_mutation_responsive_acceptance_test.py']),
]
for label,cmd in steps:
    print(f'\n=== {label.upper()} ===')
    r=subprocess.run(cmd,cwd=ROOT,check=False)
    if r.returncode: raise SystemExit(r.returncode)
print('\nBUILD 441 CURRENT SANITY: PASS')
print('Build 440 Product/Inventory/Tool implementation evidence: RETAINED AS REGRESSION PROVENANCE')
print('CAIP private-media live evidence: HOLD / carried forward, not false-passed')
print('Separate live Production mutation capability: NONE')
