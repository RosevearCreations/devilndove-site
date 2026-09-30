#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build320-grey-hair-source-evidence-review-story-plan-readiness.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='a068ec13ec14aedf6d62dfa5e5324fd6bf876680' and pred.get('development_tree_sha')=='5c49464a39ef189845bc5406716fbd055f535370','Build 319 Development predecessor mismatch')
q(pred.get('production_main_sha')=='c753fe35a36096fa539f304a6b2fbd5f1d159a43' and pred.get('production_tree_sha')=='5c49464a39ef189845bc5406716fbd055f535370','Build 319 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build320_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 320 regression failed')
q("run_current_contract('scripts/release467_build320_gate.py','Release 467 Build 320')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 320')
cur=int(p.get('build') or 0);q(cur>=320,'Current pointer must retain Build 320 or successor')
if cur==320:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==321,'Build 320 current authority/successor mismatch')
print('RELEASE 467 BUILD 320 GREY HAIR SOURCE-EVIDENCE REVIEW & STORY-PLAN READINESS')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 321 — Search Console Real Export Intake Continuity II')
