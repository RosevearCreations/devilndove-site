#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build359-maker-story-advancement-publication-readiness-continuity-vii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='66f32dd208f6337aa2212c23441652057c7fb7bd' and pred.get('development_tree_sha')=='0bf65d6acf57b6ae8b6562bfcb2b658716d13470','Build 358 Development predecessor mismatch')
q(pred.get('production_main_sha')=='88be5197b9c84814418116c4a7a3dd24ede01f34' and pred.get('production_tree_sha')=='0bf65d6acf57b6ae8b6562bfcb2b658716d13470','Build 358 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build359_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 359 regression failed')
q("run_current_contract('scripts/release467_build359_gate.py','Release 467 Build 359')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 359')
cur=int(p.get('build') or 0);q(cur>=359,'Current pointer must retain Build 359 or successor')
if cur==359:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==360,'Build 359 current authority/successor mismatch')
print('RELEASE 467 BUILD 359 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY VII')
if F:print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 360 — Content Adoption & Discovery Outcomes Renewal X')
