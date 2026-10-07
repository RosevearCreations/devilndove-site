from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
def q(v,m):
    if not v: raise SystemExit(m)
def j(p): return json.loads((R/p).read_text(encoding='utf-8'))
def t(p): return (R/p).read_text(encoding='utf-8')
a=j('release467-build365-maker-story-advancement-publication-readiness-continuity-viii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='94e61e0d2c37adce25857f41748ba28e9ff34378' and pred.get('development_tree_sha')=='db31cdf65544972babe34b2b1c57a24274fa7889','Build 364 Development predecessor mismatch')
q(pred.get('production_main_sha')=='1ef40e8926042335846372c072cdd5c000317dfd' and pred.get('production_tree_sha')=='db31cdf65544972babe34b2b1c57a24274fa7889','Build 364 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build365_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 365 regression failed')
q("run_current_contract('scripts/release467_build365_gate.py','Release 467 Build 365')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 365')
cur=int(p.get('build') or 0);q(cur>=365,'Current pointer must retain Build 365 or successor')
if cur==365:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==366,'Build 365 current authority/successor mismatch')
print('RELEASE467_BUILD365_GATE=GREEN')
