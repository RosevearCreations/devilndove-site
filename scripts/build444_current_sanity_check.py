#!/usr/bin/env python3
"""Current Build 444 source-only sanity runner."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
steps = [
    ('release alignment', [sys.executable, 'scripts/build444_development_release_alignment_test.py']),
    ('release contract', [sys.executable, 'scripts/build444_release_contract_integrity_test.py']),
    ('infrastructure authority', [sys.executable, 'scripts/build444_infrastructure_authority_regression.py']),
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
print('\nBUILD 444 CURRENT SANITY: PASS')
print('Build 443 exact source checkpoint: GREEN')
print('Build 444 infrastructure authority: SOURCE GREEN / live authenticated D1-R2 evidence required after deployment')
print('Build 444 new D1 SQL migration: NONE')
print('Carousel, I.T., Stripe, PayPal and CAIP: CURRENT BUILD 444 HOLDS until exact evidence clears them')
print('Separate live Production mutation capability: NONE')
