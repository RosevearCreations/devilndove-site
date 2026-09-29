#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build293-css-design-system-responsive-consolidation.json')
p=j('current-development-authority.json')
q(a.get('release')==467 and a.get('build')==293 and a.get('title')=='CSS Design-System & Responsive Consolidation','Build 293 identity mismatch')
q((a.get('safety') or {}).get('schema_change') is False and (a.get('safety') or {}).get('d1_mutation') is False,'Build 293 must remain schema/D1 mutation neutral')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build293_css_budget.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');print(r.stderr,end='',file=sys.stderr);q(r.returncode==0,'Build 293 CSS budget failed')
mw=t('functions/_middleware.js')
for token in ("DESIGN_SYSTEM_REVISION = '467b293-design-system-v1'","data-dd-design-system-v293","/css/design-system-v293.css?v=","data-dd-admin-design-system-v293","/css/admin-design-system-v293.css?v="):
    q(token in mw,'Build 293 middleware design-system wiring missing '+token)
responsive=t('css/current-responsive.css')
q('margin-inline:auto!important' not in responsive,'Build 293 responsive convergence still relies on important for shell centering')
q('margin-inline:auto' in responsive,'Build 293 responsive shell centering missing')
erg=t('css/admin-ergonomics-v237.css')
q('outline:3px solid var(--dd-color-focus,currentColor)' in erg,'Build 293 focus treatment did not converge on canonical focus token')
styles=t('css/styles.css')
for token in ('.movie-summary-pending{color:var(--muted)}','.dd-product-draft-media-panel{display:grid','.caip-status-stack{display:flex'):
    q(styles.count(token)==1,'Build 293 exact duplicate consolidation missing for '+token)
q('Build 294 — CAIP Workshop Follies & Maker Story Foundation' in t('docs/operations/RELEASE_467_UX_SEARCH_DATABASE_EFFICIENCY_BUILDS_290_300.md'),'Build 293 successor roadmap drift')
q("run_current_contract('scripts/release467_build293_gate.py','Release 467 Build 293')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 293')
q(int(p.get('build') or 0)>=293,'Current authority must retain Build 293 or successor')
if int(p.get('build') or 0)==293:
    q(p.get('title')=='CSS Design-System & Responsive Consolidation' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 293 pointer mismatch')
    q(int(p.get('next_build') or 0)==294 and p.get('next_build_title')=='CAIP Workshop Follies & Maker Story Foundation','Build 293 successor pointer mismatch')
for path in ('functions/_middleware.js',):
    x=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(x.returncode==0,path+' syntax failed: '+(x.stderr or x.stdout))
print('RELEASE 467 BUILD 293 CSS DESIGN-SYSTEM & RESPONSIVE CONSOLIDATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Canonical design tokens: ACTIVE')
print('Public/Admin CSS separation: ACTIVE')
print('Contrast/overflow/dropdown/modal/dense-table/touch checks: GREEN')
print('Next: Build 294 — CAIP Workshop Follies & Maker Story Foundation')
