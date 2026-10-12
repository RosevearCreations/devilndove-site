#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
p=subprocess.run([sys.executable,str(root/'scripts/release467_build380_regression.py')],cwd=root)
assert p.returncode==0
print('RELEASE467_BUILD380_GATE=GREEN')
