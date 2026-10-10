#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
def need(ok,why):
    if not ok:raise SystemExit('RELEASE467_BUILD371_GATE_FAILED: '+why)
p=json.loads((R/'current-development-authority.json').read_text(encoding='utf-8'))
r=subprocess.run([sys.executable,str(R/'scripts/release467_build371_regression.py')],cwd=R,capture_output=True,text=True)
print(r.stdout,end='');need(r.returncode==0,(r.stderr or r.stdout).strip())
need("run_current_contract('scripts/release467_build371_gate.py','Release 467 Build 371')" in (R/'scripts/current_system_gate_provenance_gate.py').read_text(encoding='utf-8'),'system gate registration')
need(p.get('build',0)>=371,'current build predecessor')
if p.get('build')==371:
    need(p.get('state') in ('DEVELOPMENT_CLOSURE_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'allowed Build 371 state')
    need(p.get('next_build')==372,'next queued Build 372')
print('RELEASE467_BUILD371_GATE=GREEN')
