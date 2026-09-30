#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build307-maker-story-review-state-publication-traceability.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='a0d04fb1fcbf22a714031c65e256f885b725d1c5' and pred.get('development_tree_sha')=='0a80465e014d949ba750092b0154d78103d0760a','Build 306 Development predecessor mismatch')
q(pred.get('production_main_sha')=='1eb9df6dd6db02ad61fd4a32852e7f37a46c1ecd' and pred.get('production_tree_sha')=='0a80465e014d949ba750092b0154d78103d0760a','Build 306 Production predecessor mismatch')
c=a.get('contract') or {};q(c.get('story_review_status')=='reviewed' and c.get('public_story_candidate')==1 and c.get('media_rights_scope')=='separate_never_inferred','Build 307 traceability contract mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('media_rights_inference') is False and s.get('provider_execution') is False and s.get('production_d1_contact') is False,'Build 307 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build307_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 307 regression failed')
q("run_current_contract('scripts/release467_build307_gate.py','Release 467 Build 307')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 307')
cur=int(p.get('build') or 0);q(cur>=307,'Current pointer must retain Build 307 or successor')
if cur==307:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==308,'Build 307 current authority/successor mismatch')
print('RELEASE 467 BUILD 307 MAKER STORY REVIEW-STATE & PUBLICATION TRACEABILITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 308 — Second Real Maker Story Adoption & Evidence Selection')
