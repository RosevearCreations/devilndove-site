#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build337-evidence-gap-execution-workbench-input-completion-continuity-ii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='537cc518573159ea2c511c32f01469bbd97ccf63' and pred.get('development_tree_sha')=='334706f50429ceb0796abc98a4f516390036d6b5','Build 336 Development predecessor mismatch')
q(pred.get('production_main_sha')=='1419a505747871a5703ad087134b3b7bebafd337' and pred.get('production_tree_sha')=='334706f50429ceb0796abc98a4f516390036d6b5','Build 336 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build337_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 337 regression failed')
q("run_current_contract('scripts/release467_build337_gate.py','Release 467 Build 337')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 337')
cur=int(p.get('build') or 0);q(cur>=337,'Current pointer must retain Build 337 or successor')
if cur==337:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==338,'Build 337 current authority/successor mismatch')
print('RELEASE 467 BUILD 337 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY II')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 338 — 35th Promo Factual Evidence Completion Continuity III')
