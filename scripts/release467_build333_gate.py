#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build333-grey-hair-source-review-story-plan-completion-continuity-ii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='d4fcede4adf76a511d754012042ba91a98693812' and pred.get('development_tree_sha')=='4ff23c38bbe0acb7ce6ff6f9ad5ef964b329d229','Build 332 Development predecessor mismatch')
q(pred.get('production_main_sha')=='69fd16b6322e7cbd52c5341ef2b7e871529a65ee' and pred.get('production_tree_sha')=='4ff23c38bbe0acb7ce6ff6f9ad5ef964b329d229','Build 332 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build333_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 333 regression failed')
q("run_current_contract('scripts/release467_build333_gate.py','Release 467 Build 333')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 333')
q(int(p.get('build') or 0)>=333,'Current pointer must retain Build 333 or successor')
print('RELEASE 467 BUILD 333 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY II')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 334 — Search Console Real Export & Fresh Discovery Intake IV')
