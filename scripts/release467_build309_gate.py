#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build309-second-story-content-studio-review-approval.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='60b6a631a615c1653ecfb07b4cbf8bc117a496f8' and pred.get('development_tree_sha')=='d78e7d76fb06395ee182271044314808454f6110','Build 308 Development predecessor mismatch')
q(pred.get('production_main_sha')=='498ddd776ea3c52b243a5ef8800fc33570d159a4' and pred.get('production_tree_sha')=='d78e7d76fb06395ee182271044314808454f6110','Build 308 Production predecessor mismatch')
c=a.get('contract') or {};q(c.get('content_project_id')==23 and c.get('approved_copy_count')==2 and c.get('changes_requested_count')==17 and c.get('maker_story_state_remains')=='needs_review','Build 309 review contract mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('media_rights_inference') is False and s.get('provider_execution') is False and s.get('production_d1_contact') is False,'Build 309 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build309_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 309 regression failed')
q("run_current_contract('scripts/release467_build309_gate.py','Release 467 Build 309')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 309')
cur=int(p.get('build') or 0);q(cur>=309,'Current pointer must retain Build 309 or successor')
if cur==309:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==310,'Build 309 current authority/successor mismatch')
print('RELEASE 467 BUILD 309 SECOND STORY CONTENT STUDIO REVIEW & APPROVAL')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 310 — Review-First Publication & Distribution Continuity')
