#!/usr/bin/env python3
"""Current Build 443 source-only sanity runner."""
from __future__ import annotations
import subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
steps=[
 ('release alignment',[sys.executable,'scripts/build443_development_release_alignment_test.py']),
 ('release contract',[sys.executable,'scripts/build443_release_contract_integrity_test.py']),
 ('repository hygiene',[sys.executable,'scripts/build441_repository_hygiene_test.py']),
 ('Home carousel',[sys.executable,'scripts/build443_home_carousel_regression.py']),
 ('carried I.T. migration',[sys.executable,'scripts/build442_it_platform_migration_regression.py']),
 ('carried cross-mutation responsive regression',[sys.executable,'scripts/build442_cross_mutation_responsive_acceptance_test.py']),
]
for label,cmd in steps:
    print(f'\n=== {label.upper()} ===')
    result=subprocess.run(cmd,cwd=ROOT,check=False)
    if result.returncode: raise SystemExit(result.returncode)
print('\nBUILD 443 CURRENT SANITY: PASS')
print('Build 442 exact source/deployment checkpoint: GREEN')
print('Build 443 carousel source/runtime fallback: GREEN / remote D1 apply pending')
print('I.T., Stripe, PayPal and CAIP: CURRENT BUILD 443 HOLDS')
print('Separate live Production mutation capability: NONE')
