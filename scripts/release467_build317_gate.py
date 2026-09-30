#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build317-third-project-maker-story-readiness-evidence-selection.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='d4511f2539b03e35e0989716065888c42b008fb1' and pred.get('development_tree_sha')=='f89d348018b48ddcb9adad0229e745913051a168','Build 316 Development predecessor mismatch')
q(pred.get('production_main_sha')=='ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e' and pred.get('production_tree_sha')=='f89d348018b48ddcb9adad0229e745913051a168','Build 316 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build317_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 317 regression failed')
q("run_current_contract('scripts/release467_build317_gate.py','Release 467 Build 317')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 317')
cur=int(p.get('build') or 0);q(cur>=317,'Current pointer must retain Build 317 or successor')
if cur==317:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==318,'Build 317 current authority/successor mismatch')
print('RELEASE 467 BUILD 317 THIRD PROJECT MAKER STORY READINESS & EVIDENCE SELECTION')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 318 — Content Adoption & Discovery Outcomes Renewal III')
