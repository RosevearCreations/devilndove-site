#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build327-grey-hair-evidence-review-completion-story-plan-handoff.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='2bc3b4f93ae4111773db71249dc394de8db0a08d' and pred.get('development_tree_sha')=='409c9dca0d1e0205ec496b3100e891132c71db8e','Build 326 Development predecessor mismatch')
q(pred.get('production_main_sha')=='6729aaa40106553b37995892b43ff982d145c3db' and pred.get('production_tree_sha')=='409c9dca0d1e0205ec496b3100e891132c71db8e','Build 326 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build327_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 327 regression failed')
q("run_current_contract('scripts/release467_build327_gate.py','Release 467 Build 327')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 327')
q(int(p.get('build') or 0)>=327,'Current pointer must retain Build 327 or successor')
print('RELEASE 467 BUILD 327 GREY HAIR EVIDENCE REVIEW COMPLETION & STORY-PLAN HANDOFF')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 328 — Search Console Real Export Freshness & Discovery Intake III')
