#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build248-refinement-outcomes-review-roadmap-renewal.json')
p=j('current-development-authority.json')
b247=j('release467-build247-non-product-visual-coverage-media-placement-closure.json')
b245=j('release467-build245-csp-browser-injection-hardening.json')
road=t('docs/operations/RELEASE_467_REFINEMENT_OUTCOMES_AUTONOMOUS_BUILDS_249_256.md')
q(a.get('build')==248 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 248 identity/state mismatch')
q(b247.get('state')=='PRODUCTION_GREEN','Build 247 must be Production GREEN')
q((b247.get('production_checkpoint') or {}).get('main_sha')=='7a51ae487552d3b2d7bdf4a048ef33380ccaa917','Build 247 production checkpoint missing')
m=a.get('measurement') or {}
q(m.get('help_coverage')=='APPLICATION_WIDE_CONTRACT_GREEN','help coverage outcome missing')
q(m.get('runtime_outcome_telemetry')=='NOT_YET_MEASURED','runtime telemetry must remain honestly unmeasured')
q(m.get('provider_metered_delta')=='NOT_REMEASURED_IN_REFINEMENT_STREAM','provider delta must remain honestly unmeasured')
q(m.get('session_posture')=='HTTP_ONLY_COOKIE_FIRST','cookie-first outcome missing')
q(m.get('csp_script_unsafe_inline') is False and m.get('csp_style_unsafe_inline') is True,'CSP residual must be explicit')
q(m.get('unresolved_non_product_svg_placeholders')==29 and m.get('unresolved_non_product_placeholder_pages')==22,'visual residual mismatch')
q((a.get('roadmap_decision') or {}).get('future_queue_exhausted') is False and (a.get('roadmap_decision') or {}).get('next_build')==249,'successor roadmap decision missing')
for n in range(249,257): q(f'Build {n} —' in road,f'roadmap missing Build {n}')
if p.get('build')==248:
 q(p.get('next_build')==249 and p.get('state')=='DEVELOPMENT_GREEN','current authority must expose Build 248 and successor 249')
elif p.get('build')==249:
 q(p.get('next_build')==250 and p.get('state')=='DEVELOPMENT_GREEN','Build 249 successor must retain Build 248 compatibility')
else:
 q(False,'current authority must be Build 248 or direct successor Build 249')
q((b245.get('scope') or {}).get('script_src_unsafe_inline_removed') is True and (b245.get('scope') or {}).get('style_unsafe_inline_retained_for_incremental_migration') is True,'Build 245 CSP evidence drift')
if a.get('state')=='PRODUCTION_GREEN':
 final=a.get('final_closure') or {};prod=a.get('production_checkpoint') or {}
 q(final.get('dev_sha')=='2f46181a3c92568c2b192a83929a85f72a2b4374','Build 248 final dev SHA mismatch')
 q(final.get('tree_sha')=='2db3a312cd0e7a6e24b07de4495d1d97898c7028','Build 248 final tree mismatch')
 q((final.get('proofs') or {}).get('system_gate_run')==35942841810,'Build 248 final System proof mismatch')
 q(prod.get('main_sha')=='e6ed352b5fe9f32b2cd6d049b00239fd643ebbc6','Build 248 Production main mismatch')
 q(prod.get('tree_sha')=='2db3a312cd0e7a6e24b07de4495d1d97898c7028','Build 248 Production tree mismatch')
 q(prod.get('production_pages_deploy_run')==35943937792 and prod.get('production_live_resource_integrity_run')==35944021002,'Build 248 Production proof mismatch')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 248 safety drift: {k}')
print('RELEASE 467 BUILD 248 REFINEMENT OUTCOMES REVIEW ROADMAP RENEWAL')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Future queue: OPEN; next Build 249')
