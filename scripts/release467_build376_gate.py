#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
a=json.loads((R/'release467-build376-search-console-real-export-fresh-discovery-intake-xi.json').read_text(encoding='utf-8'));p=json.loads((R/'current-development-authority.json').read_text(encoding='utf-8'))
assert a['predecessor']['development_sha']=='c59a7a7c82b705462a378d6b5eb4a2aac10cfdfe' and a['predecessor']['production_main_sha']=='8e5400227cb209b9f821aaf987b809062fe3eb87'
assert p.get('build',0)>=376
assert "run_current_contract('scripts/release467_build376_gate.py','Release 467 Build 376')" in (R/'scripts/current_system_gate_provenance_gate.py').read_text(encoding='utf-8')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build376_regression.py')],cwd=R,text=True,capture_output=True)
print(r.stdout,end='');assert r.returncode==0,(r.stderr or r.stdout)[-2200:]
print('RELEASE467_BUILD376_GATE=GREEN')
