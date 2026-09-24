#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys
R=Path(__file__).resolve().parents[1]; F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok: F.append(msg)
def node(p):
    x=subprocess.run(['node','--check',str(R/p)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(x.returncode==0,f'JS syntax failed {p}: {(x.stderr or x.stdout)[-1200:]}')

a=j('release467-build252-cross-device-accessibility-acceptance-refresh.json')
b251=j('release467-build251-csp-style-injection-surface-hardening.json')
p=j('current-development-authority.json')
responsive=t('css/current-responsive.css')
ergcss=t('css/admin-ergonomics-v237.css')
ergjs=t('public/js/admin-ergonomics-v237.js')
adaptive=t('css/adaptive-shell.css')
storefront=t('css/storefront-discovery.css')
carousel=t('public/js/media-carousel.js')
mw=t('functions/_middleware.js')
road=t('docs/operations/RELEASE_467_REFINEMENT_OUTCOMES_AUTONOMOUS_BUILDS_249_256.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
it=t('functions/api/admin/it-operations-control-tower.js')
reliability=t('functions/api/_lib/currentReliability.js')
preflight=t('functions/api/admin/current-deployment-preflight.js')
guide=t('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')

q(a.get('build')==252 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 252 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='4d0c1c54c407393db5de3b6e3a519ddd7b1ce4dd','Build 251 predecessor Development SHA mismatch')
q(pred.get('development_tree_sha')=='2d6d06e321693779cee55ed2dd892bff3b364a36','Build 251 predecessor tree mismatch')
q(pred.get('production_main_sha')=='f8e15d07e97e9a4e2953a65d09b494c73a36192a','Build 251 predecessor Production SHA mismatch')
q(pred.get('production_tree_sha')=='2d6d06e321693779cee55ed2dd892bff3b364a36' and pred.get('same_tree') is True,'Build 251 same-tree Production predecessor missing')
q(pred.get('state')=='PRODUCTION_GREEN','Build 251 predecessor must be Production GREEN')
pr=pred.get('development_proofs') or {}
q(pr.get('system_gate_run')==36031272271,'Build 251 System Gate evidence mismatch')
q(pr.get('current_application_quality_run')==36031272780,'Build 251 Quality evidence mismatch')
q(pr.get('it_admin_runtime_proof_run')==36031272416,'Build 251 I.T. evidence mismatch')
q(pr.get('branch_hygiene_run')==36031272718 and pr.get('build_specific_proof_run')==36031272407,'Build 251 Hygiene/dedicated evidence mismatch')
q((pred.get('branch_hygiene') or {}).get('run_id')==36031272718,'Build 251 exact branch hygiene evidence mismatch')

q(b251.get('state')=='PRODUCTION_GREEN','Build 251 successor-ingested authority must be Production GREEN')
final=b251.get('final_closure') or {}; prod=b251.get('production_checkpoint') or {}
q(final.get('dev_sha')=='4d0c1c54c407393db5de3b6e3a519ddd7b1ce4dd' and final.get('tree_sha')=='2d6d06e321693779cee55ed2dd892bff3b364a36','Build 251 final Development closure mismatch')
q(prod.get('main_sha')=='f8e15d07e97e9a4e2953a65d09b494c73a36192a' and prod.get('tree_sha')=='2d6d06e321693779cee55ed2dd892bff3b364a36' and prod.get('state')=='PRODUCTION_GREEN','Build 251 Production closure mismatch')
q(prod.get('production_pages_deploy_run')==36031593630 and prod.get('production_live_resource_integrity_run')==36031748408,'Build 251 Production deploy/resource evidence mismatch')
q(prod.get('products_browser_proof_run')==36031748531 and prod.get('products_route_proof_run')==36031748437 and prod.get('build_specific_proof_run')==36031593481,'Build 251 Production browser/route/build evidence mismatch')

for token in ('@media(max-width:420px)','@media(max-width:720px)','@media(min-width:721px) and (max-width:1023px)','@media(min-width:1024px)','overflow-x:auto','prefers-reduced-motion:reduce'):
    q(token in responsive,f'Current responsive contract missing {token}')
for token in ('focus-visible','min-height:46px','dd-v237-card-mode','pointer:coarse','data-dd-column'):
    q(token in ergcss,f'Build 237 ergonomics CSS missing {token}')
for token in ('keydown','Escape','aria-pressed','Card view','Table view','MutationObserver'):
    q(token in ergjs,f'Build 237 keyboard/dense-workspace runtime missing {token}')
q('fetch(' not in ergjs and 'apiFetch(' not in ergjs and 'requestSubmit(' not in ergjs,'Build 237 ergonomics must remain presentation-only')
for token in ('max-width:760px','min-width:761px','max-width:1099px','min-width:1100px','safe-area-inset-bottom','prefers-reduced-motion','pointer:coarse'):
    q(token in adaptive,f'Adaptive shell contract missing {token}')
for token in ('@media(max-width:900px)','@media(max-width:640px)','@media(prefers-reduced-motion:reduce)','min-height:44px','overflow-x:auto'):
    q(token in storefront,f'Storefront responsive contract missing {token}')
q('prefers-reduced-motion: reduce' in carousel,'Carousel reduced-motion awareness missing')
q('setInterval' not in carousel,'Carousel must not introduce background interval motion')

for token in ('/css/current-responsive.css?v=current','admin-ergonomics-v237.css','admin-ergonomics-v237.js','function cspForNonce(nonce)','style-src-elem','data-dd-style-nonce-bootstrap-v251'):
    q(token in mw,f'Shared middleware/accessibility/CSP contract missing {token}')

q('Build 253 — Session & Abuse-Control Runtime Evidence' in road,'Build 253 successor missing')
q("run_current_contract('scripts/release467_build252_gate.py','Release 467 Build 252')" in sysgate,'System Gate must invoke Build 252')
q(int(p.get('build') or 0)>=252 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 252 or a verified successor')
if int(p.get('build') or 0)==252:
    q(p.get('next_build')==253,'Build 252 successor pointer mismatch')
else:
    q((a.get('final_closure') or {}).get('dev_sha')=='ec749569908b2ebbf393ca1ec2181e586a10f548','Build 253+ must retain exact Build 252 Development closure')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='3c14d72ed481035d82f3cffa2d16f733f603f1d9','Build 253+ must retain exact Build 252 Production closure')
if int(p.get('build') or 0)==252:
    q(p.get('accepted_dev_sha')=='4d0c1c54c407393db5de3b6e3a519ddd7b1ce4dd' and p.get('accepted_dev_tree_sha')=='2d6d06e321693779cee55ed2dd892bff3b364a36','Build 252 accepted predecessor must be exact Build 251 Development')
pc=p.get('production_checkpoint') or {}
if int(p.get('build') or 0)==252:
    q(pc.get('build')==251 and pc.get('main_sha')=='f8e15d07e97e9a4e2953a65d09b494c73a36192a' and pc.get('tree_sha')=='2d6d06e321693779cee55ed2dd892bff3b364a36','Build 252 Production predecessor checkpoint mismatch')

for source,label in ((it,'I.T. tower'),(reliability,'Reliability'),(preflight,'Preflight')):
    q('252' in source and 'Cross-Device Accessibility Acceptance Refresh' in source,f'{label} must identify Build 252')
q('Build 252' in guide and ('Build 252 candidate' in guide or 'Build 253 candidate' in guide),'I.T. guide must retain Build 252 provenance')

for k,v in (a.get('safety') or {}).items():
    q(v is False,f'Build 252 safety drift: {k}')
node('functions/_middleware.js')
node('public/js/admin-ergonomics-v237.js')
node('public/js/media-carousel.js')

print('RELEASE 467 BUILD 252 CROSS-DEVICE ACCESSIBILITY ACCEPTANCE REFRESH')
if F:
    print('FAIL'); [print('-',x) for x in F]; sys.exit(1)
print('PASS')
print('Phone/tablet/desktop responsive contracts: GREEN')
print('Keyboard/focus/dense-workspace/reduced-motion source contracts: GREEN')
print('Build 251 CSP compatibility: RETAINED')
print('Future queue: OPEN; next Build 253')
