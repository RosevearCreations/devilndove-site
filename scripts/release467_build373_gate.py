#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
p=json.loads((R/'current-development-authority.json').read_text(encoding='utf-8'))
a=json.loads((R/'release467-build373-evidence-gap-execution-workbench-input-completion-continuity-viii.json').read_text(encoding='utf-8'))
assert p.get('build',0)>=373
assert a['predecessor']['development_sha']=='1a721196a9c8206b2d28263cac901c7b406836f4'
assert a['predecessor']['production_main_sha']=='e0899743b6e7e9d87b1017479a7f90c5e95018a2'
assert "run_current_contract('scripts/release467_build373_gate.py','Release 467 Build 373')" in (R/'scripts/current_system_gate_provenance_gate.py').read_text(encoding='utf-8')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build373_regression.py')],cwd=R,text=True,capture_output=True)
print(r.stdout,end='');assert r.returncode==0,(r.stderr or r.stdout)[-1900:]
print('RELEASE467_BUILD373_GATE=GREEN')
