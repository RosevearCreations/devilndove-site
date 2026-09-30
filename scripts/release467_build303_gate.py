#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build303-content-studio-draft-review-approval-adoption.json');p=j('current-development-authority.json')
q(a.get('build')==303 and a.get('title')=='Content Studio Draft Review & Approval Adoption','Build 303 identity mismatch')
q((a.get('predecessor') or {}).get('development_sha')=='a6827f4ee093fcf0799ddb99c7a7957469bf3a2c','Build 302 Development predecessor mismatch')
q((a.get('predecessor') or {}).get('production_main_sha')=='fffbafc4e9f27e830494140b48d9a3d266abd81e','Build 302 Production predecessor mismatch')
s=a.get('scope') or {}
q(s.get('reuse_existing_content_package') is True and s.get('duplicate_content_package_tolerance')==0,'Build 303 package identity contract mismatch')
q(s.get('explicit_refresh_only') is True and s.get('refresh_requested') is False and s.get('preserve_locked_copy') is True,'Build 303 refresh/lock boundary mismatch')
q(s.get('review_factual_template_drafts') is True and s.get('automatic_approval') is False and s.get('automatic_publication') is False,'Build 303 review-first boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build303_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 303 regression failed')
q("run_current_contract('scripts/release467_build303_gate.py','Release 467 Build 303')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 303')
q(int(p.get('build') or 0)>=303,'Current pointer must retain Build 303 or successor')
print('RELEASE 467 BUILD 303 CONTENT STUDIO DRAFT REVIEW & APPROVAL ADOPTION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 304 — Workshop Journal & Social Review-First Publication Acceptance')
