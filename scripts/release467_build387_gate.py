#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
R=Path(__file__).resolve().parents[1]
if subprocess.run([sys.executable,str(R/'scripts/release467_build387_regression.py')],cwd=R).returncode:raise SystemExit(1)
print('RELEASE467_BUILD387_GATE=GREEN')
