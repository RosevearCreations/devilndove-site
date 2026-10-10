#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build369-grey-hair-source-review-story-plan-completion-continuity-viii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='d36a643fc8b8805f1b4dbdb3fc0963ba375c07c3' and pred.get('development_tree_sha')=='18b63f5f1910fe48ac40497f217e99d08132c00b','Build 368 Development predecessor mismatch')
q(pred.get('production_main_sha')=='253824ef52cc4faa90b4f5fe42cc177264bf2df1' and pred.get('production_tree_sha')=='18b63f5f1910fe48ac40497f217e99d08132c00b','Build 368 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build369_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 369 regression failed')
q("run_current_contract('scripts/release467_build369_gate.py','Release 467 Build 369')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 369')
cur=int(p.get('build') or 0);q(cur>=369,'Current pointer must retain Build 369 or successor')
if cur==369:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==370,'Build 369 current authority/successor mismatch')
print('RELEASE 467 BUILD 369 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY VIII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 370 — Search Console Real Export & Fresh Discovery Intake X')
