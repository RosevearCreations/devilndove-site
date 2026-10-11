#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
a=json.loads((R/'release467-build374-35th-promo-factual-evidence-completion-continuity-ix.json').read_text(encoding='utf-8'));p=json.loads((R/'current-development-authority.json').read_text(encoding='utf-8'))
assert a['predecessor']['development_sha']=='c4ddd12b9e3fcd1cbeafaf88de6cfaf3e653f734' and a['predecessor']['production_main_sha']=='5834a775772f4935794536dbfe0d5f0c679b9580'
assert p.get('build',0)>=374
assert "run_current_contract('scripts/release467_build374_gate.py','Release 467 Build 374')" in (R/'scripts/current_system_gate_provenance_gate.py').read_text(encoding='utf-8')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build374_regression.py')],cwd=R,text=True,capture_output=True)
print(r.stdout,end='');assert r.returncode==0,(r.stderr or r.stdout)[-1800:]
print('RELEASE467_BUILD374_GATE=GREEN')
