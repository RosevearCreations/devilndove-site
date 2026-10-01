#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build331-evidence-gap-execution-workbench-input-completion-continuity.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='9d0340a3038f05a0a80d25288ffedc316499438f' and pred.get('development_tree_sha')=='585bb8a35b46f20278b64e97aa314ee11a9f4ccc','Build 330 Development predecessor mismatch')
q(pred.get('production_main_sha')=='88b5113016acef9a0e7cc7cb7ef087b46ae01924' and pred.get('production_tree_sha')=='585bb8a35b46f20278b64e97aa314ee11a9f4ccc','Build 330 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build331_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 331 regression failed')
q("run_current_contract('scripts/release467_build331_gate.py','Release 467 Build 331')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 331')
q(int(p.get('build') or 0)>=331,'Current pointer must retain Build 331 or successor')
print('RELEASE 467 BUILD 331 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 332 — 35th Promo Factual Evidence Completion Continuity II')
