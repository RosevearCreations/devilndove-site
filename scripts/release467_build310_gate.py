#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build310-review-first-publication-distribution-continuity.json');p=j('current-development-authority.json')
q(a.get('build')==310 and a.get('title')=='Review-First Publication & Distribution Continuity','Build 310 identity mismatch')
pred=a.get('predecessor') or {}
q(pred.get('state')=='PRODUCTION_GREEN' and pred.get('development_sha')=='6c432524d8fad7eea5eabbd85f4f4a80e7aa1ec0' and pred.get('development_tree_sha')=='9216756424a22feb66e6f0b69047ab340496a240','Build 309 Development predecessor mismatch')
q(pred.get('production_main_sha')=='a65463ee79a50ec16741958bc2913cf67b198966' and pred.get('production_tree_sha')=='9216756424a22feb66e6f0b69047ab340496a240','Build 309 Production predecessor mismatch')
c=a.get('contract') or {};q(c.get('existing_maker_story_profile_requires_explicit_publication_review') is True and c.get('second_story_publication_action')=='BLOCKED_UNTIL_EXPLICIT_MAKER_STORY_REVIEW','Build 310 review-first contract mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('media_rights_inference') is False and s.get('maker_story_approval_inference') is False and s.get('provider_execution') is False and s.get('production_d1_contact') is False,'Build 310 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build310_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 310 regression failed')
q("run_current_contract('scripts/release467_build310_gate.py','Release 467 Build 310')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 310')
cur=int(p.get('build') or 0);q(cur>=310,'Current pointer must retain Build 310 or successor')
if cur==310:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==311,'Build 310 current authority/successor mismatch')
print('RELEASE 467 BUILD 310 REVIEW-FIRST PUBLICATION & DISTRIBUTION CONTINUITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 311 — Buyer Discovery Evidence Freshness & Search Intake')
