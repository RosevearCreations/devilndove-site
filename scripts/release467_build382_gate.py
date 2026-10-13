#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
assert subprocess.run([sys.executable,str(root/'scripts/release467_build382_regression.py')],cwd=root).returncode==0
print('RELEASE467_BUILD382_GATE=GREEN')
