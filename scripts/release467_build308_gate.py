#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build308-second-real-maker-story-adoption-evidence-selection.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='3ff916d9f1e7cc6aa9c29d9c998ace3731caf120' and pred.get('development_tree_sha')=='70c9408afd2df7a3359b83937eda15161f49b4e2','Build 307 Development predecessor mismatch')
q(pred.get('production_main_sha')=='f8b3f7281ccd6e4bfc739abe1ba2566db336281a' and pred.get('production_tree_sha')=='70c9408afd2df7a3359b83937eda15161f49b4e2','Build 307 Production predecessor mismatch')
c=a.get('contract') or {};q(c.get('second_real_project_id')==5 and c.get('second_story_review_state')=='needs_review' and c.get('second_story_public_candidate')==0,'Build 308 adoption contract mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('media_rights_inference') is False and s.get('provider_execution') is False and s.get('production_d1_contact') is False,'Build 308 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build308_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 308 regression failed')
q("run_current_contract('scripts/release467_build308_gate.py','Release 467 Build 308')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 308')
cur=int(p.get('build') or 0);q(cur>=308,'Current pointer must retain Build 308 or successor')
if cur==308:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==309,'Build 308 current authority/successor mismatch')
print('RELEASE 467 BUILD 308 SECOND REAL MAKER STORY ADOPTION & EVIDENCE SELECTION')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 309 — Second Story Content Studio Review & Approval')
