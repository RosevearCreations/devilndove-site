#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
a=json.loads((R/'release467-build377-multi-project-portfolio-workflow-evidence-routing-foundation.json').read_text(encoding='utf-8'));p=json.loads((R/'current-development-authority.json').read_text(encoding='utf-8'))
assert a['predecessor']['development_sha']=='94c5c0868054108998a648b4e169a464f83c1e93' and a['predecessor']['production_main_sha']=='f91124ccc8f93a64ce2a2afb939776e629e41ccc'
assert p.get('build',0)>=377
assert "run_current_contract('scripts/release467_build377_gate.py','Release 467 Build 377')" in (R/'scripts/current_system_gate_provenance_gate.py').read_text(encoding='utf-8')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build377_regression.py')],cwd=R,text=True,capture_output=True)
print(r.stdout,end='');assert r.returncode==0,(r.stderr or r.stdout)[-2200:]
print('RELEASE467_BUILD377_GATE=GREEN')
