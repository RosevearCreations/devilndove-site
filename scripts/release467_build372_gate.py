#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
a=json.loads((R/'release467-build372-content-adoption-discovery-outcomes-renewal-xii.json').read_text(encoding='utf-8'));p=json.loads((R/'current-development-authority.json').read_text(encoding='utf-8'))
assert a['predecessor']['development_sha']=='1f34772a0e0576953d9c8184d947fa7cdd8b9beb'
assert a['predecessor']['production_main_sha']=='eaaac6af5813e4d636188a7ba2f7036d45dacb5f'
assert p.get('build',0)>=372
assert "run_current_contract('scripts/release467_build372_gate.py','Release 467 Build 372')" in (R/'scripts/current_system_gate_provenance_gate.py').read_text(encoding='utf-8')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build372_regression.py')],cwd=R,text=True,capture_output=True)
print(r.stdout,end='');assert r.returncode==0,(r.stderr or r.stdout)[-1500:]
print('RELEASE467_BUILD372_GATE=GREEN')
