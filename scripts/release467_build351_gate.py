#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build351-grey-hair-source-review-story-plan-completion-continuity-v.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='218bb33b7c8ef209e4cca5935bbdc0fab78ff62f' and pred.get('development_tree_sha')=='40d411814199c34847a5eb35a9beb9b097a04876','Build 350 Development predecessor mismatch')
q(pred.get('production_main_sha')=='96ecfb1cdfdff1e632da3289b3c5219ebe1fd1e3' and pred.get('production_tree_sha')=='40d411814199c34847a5eb35a9beb9b097a04876','Build 350 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build351_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 351 regression failed')
q("run_current_contract('scripts/release467_build351_gate.py','Release 467 Build 351')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 351')
cur=int(p.get('build') or 0);q(cur>=351,'Current pointer must retain Build 351 or successor')
if cur==351:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==352,'Build 351 current authority/successor mismatch')
print('RELEASE 467 BUILD 351 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY V')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 352 — Search Console Real Export & Fresh Discovery Intake VII')
