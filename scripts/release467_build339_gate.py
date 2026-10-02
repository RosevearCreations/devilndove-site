#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build339-grey-hair-source-review-story-plan-completion-continuity-iii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='eb674de5006a63404d2a8076bef2024ba47272b3' and pred.get('development_tree_sha')=='e10e2ca3b275e55d44b585c51b94bb26ca0bf8df','Build 338 Development predecessor mismatch')
q(pred.get('production_main_sha')=='cfdc10632bd5fe605b7cf60eef7e664e35cd11fb' and pred.get('production_tree_sha')=='e10e2ca3b275e55d44b585c51b94bb26ca0bf8df','Build 338 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build339_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 339 regression failed')
q("run_current_contract('scripts/release467_build339_gate.py','Release 467 Build 339')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 339')
cur=int(p.get('build') or 0);q(cur>=339,'Current pointer must retain Build 339 or successor')
if cur==339:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==340,'Build 339 current authority/successor mismatch')
print('RELEASE 467 BUILD 339 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 340 — Search Console Real Export & Fresh Discovery Intake V')
