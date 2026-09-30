#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build304-workshop-journal-social-review-first-publication-acceptance.json');p=j('current-development-authority.json')
q(a.get('build')==304 and a.get('title')=='Workshop Journal & Social Review-First Publication Acceptance','Build 304 identity mismatch')
q((a.get('predecessor') or {}).get('development_sha')=='2b260c9ff58ca56f75afe2f82144ba8f884d572e','Build 303 Development predecessor mismatch')
q((a.get('predecessor') or {}).get('production_main_sha')=='5fe6e3b5c47f948d8e931fd7357801ca639cb7dd','Build 303 Production predecessor mismatch')
s=a.get('scope') or {}
q(s.get('reuse_existing_release_board') is True and s.get('workshop_journal_text_only_allowed') is True,'Build 304 Release Board reuse mismatch')
q(s.get('website_gallery_media_requirement_preserved') is True and s.get('provider_execution') is False and s.get('provider_publication') is False,'Build 304 publication boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build304_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 304 regression failed')
q("run_current_contract('scripts/release467_build304_gate.py','Release 467 Build 304')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 304')
q(int(p.get('build') or 0)>=304,'Current pointer must retain Build 304 or successor')
print('RELEASE 467 BUILD 304 WORKSHOP JOURNAL & SOCIAL REVIEW-FIRST PUBLICATION ACCEPTANCE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 305 — Buyer Discovery & Search Measurement Activation')
