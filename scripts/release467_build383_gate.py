#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
R=Path(__file__).resolve().parents[1]
assert subprocess.run([sys.executable,str(R/'scripts/release467_build383_regression.py')],cwd=R).returncode==0
print('RELEASE467_BUILD383_GATE=GREEN')
