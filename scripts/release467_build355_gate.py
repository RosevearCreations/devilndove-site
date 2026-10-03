#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build355-evidence-gap-execution-workbench-input-completion-continuity-v.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='eac5ebfca9b04ed8e8cbed937053398bb0dec13a' and pred.get('development_tree_sha')=='95b6c61cbfd0808a84663d557143bb53bed81f1d','Build 354 Development predecessor mismatch')
q(pred.get('production_main_sha')=='e925852b63a4258d91c19ad4c6256f16501bac3a' and pred.get('production_tree_sha')=='95b6c61cbfd0808a84663d557143bb53bed81f1d','Build 354 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build355_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 355 regression failed')
q("run_current_contract('scripts/release467_build355_gate.py','Release 467 Build 355')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 355')
cur=int(p.get('build') or 0);q(cur>=355,'Current pointer must retain Build 355 or successor')
if cur==355:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==356,'Build 355 current authority/successor mismatch')
print('RELEASE 467 BUILD 355 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY V')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 356 — 35th Promo Factual Evidence Completion Continuity VI')
