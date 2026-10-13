#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
assert subprocess.run([sys.executable,str(ROOT/'scripts/release467_build385_regression.py')],cwd=ROOT).returncode==0
print('RELEASE467_BUILD385_GATE=GREEN')
