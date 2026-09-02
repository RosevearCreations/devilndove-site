#!/usr/bin/env python3
"""Historical compatibility entrypoint for the current Development runtime gate.

Release 461 established the original runtime-acceptance contract. Active runtime
acceptance is now owned by the Release 467 I.T./Admin reliability gate; this filename
is retained only because historical aggregate source proof still invokes it.
"""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CURRENT_GATE = ROOT / 'scripts' / 'release467_it_admin_runtime_gate.py'
if not CURRENT_GATE.is_file():
    raise SystemExit('Current Development runtime reliability gate is missing.')
subprocess.run([sys.executable, str(CURRENT_GATE)], cwd=ROOT, check=True)
print('HISTORICAL RELEASE 461 RUNTIME GATE ENTRYPOINT: PASS -> CURRENT RELEASE 467 I.T./ADMIN RUNTIME GATE')
