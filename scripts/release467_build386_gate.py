#!/usr/bin/env python3
"""Release 467 Build 386 exact-source regression gate."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
assert subprocess.run([sys.executable,str(ROOT/'scripts/release467_build386_regression.py')],cwd=ROOT).returncode==0
print('RELEASE467_BUILD386_GATE=GREEN')
