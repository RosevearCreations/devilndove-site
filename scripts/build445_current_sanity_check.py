#!/usr/bin/env python3
"""Build 445 aggregate source sanity without remote/provider mutation."""
from __future__ import annotations
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
steps = [
    ('repository retirement and forward sanity', [sys.executable, 'scripts/build445_repository_forward_sanity.py']),
    ('repository hygiene', [sys.executable, 'scripts/build441_repository_hygiene_test.py']),
    ('carried Home carousel', [sys.executable, 'scripts/build443_home_carousel_regression.py']),
    ('carried I.T. migration', [sys.executable, 'scripts/build442_it_platform_migration_regression.py']),
    ('carried cross-mutation responsive regression', [sys.executable, 'scripts/build442_cross_mutation_responsive_acceptance_test.py']),
]
for label, cmd in steps:
    print(f'\n=== {label.upper()} ===')
    result = subprocess.run(cmd, cwd=ROOT, check=False)
    if result.returncode:
        raise SystemExit(result.returncode)
print('\nBUILD 445 CURRENT SANITY: PASS')
print('Historical build-report bulk: RETIRED FROM DEPLOYABLE TREE')
print('Build 442/443 guarded D1 authorities: RETAINED WHILE CURRENTLY REQUIRED')
print('Build 445 new D1/R2 mutation: NONE')
print('Separate live Production mutation capability: NONE')
