#!/usr/bin/env python3
"""Current Build 442 Phase A source-only sanity runner."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
steps=[
 ('release alignment',[sys.executable,'scripts/build442_development_release_alignment_test.py']),
 ('release contract',[sys.executable,'scripts/build442_release_contract_integrity_test.py']),
 ('repository hygiene',[sys.executable,'scripts/build441_repository_hygiene_test.py']),
 ('I.T. migration and runner',[sys.executable,'scripts/build442_it_platform_migration_regression.py']),
 ('cross-mutation responsive regression',[sys.executable,'scripts/build442_cross_mutation_responsive_acceptance_test.py']),
]
for label,cmd in steps:
    print(f'\n=== {label.upper()} ===')
    result=subprocess.run(cmd,cwd=ROOT,check=False)
    if result.returncode: raise SystemExit(result.returncode)
print('\nBUILD 442 CURRENT SANITY: PASS')
print('Build 441 exact green checkpoint: 96e3256b608190a8780829ea9e6409670a898fb4')
print('Build 442 I.T. D1 migration: PACKAGED / REMOTE APPLY NOT PERFORMED BY CI')
print('Build 442 runtime I.T. enforcement: HOLD UNTIL D1 PROOF')
print('CAIP private-media live evidence: HOLD / carried forward')
print('Separate live Production mutation capability: NONE')
