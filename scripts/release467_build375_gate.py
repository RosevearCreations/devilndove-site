#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
a=json.loads((R/'release467-build375-grey-hair-source-review-story-plan-completion-continuity-ix.json').read_text(encoding='utf-8'));p=json.loads((R/'current-development-authority.json').read_text(encoding='utf-8'))
assert a['predecessor']['development_sha']=='e87a0f86c833ff581c9d5ef62ac37a39b6db5408' and a['predecessor']['production_main_sha']=='2ea0373d6054c6f45edab22d1b58b4a9c037f8eb'
assert p.get('build',0)>=375
assert "run_current_contract('scripts/release467_build375_gate.py','Release 467 Build 375')" in (R/'scripts/current_system_gate_provenance_gate.py').read_text(encoding='utf-8')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build375_regression.py')],cwd=R,text=True,capture_output=True)
print(r.stdout,end='');assert r.returncode==0,(r.stderr or r.stdout)[-1800:]
print('RELEASE467_BUILD375_GATE=GREEN')
