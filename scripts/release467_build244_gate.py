#!/usr/bin/env python3
from pathlib import Path
import json,sys,re
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build244-csrf-origin-protection-mutating-routes.json')
p=j('current-development-authority.json')
prev=j('release467-build243-session-architecture-hardening.json')
guard=t('functions/api/_lib/csrfOriginProtection.js')
mw=t('functions/_middleware.js')
road=t('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==244 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 244 authority identity/state mismatch')
if a.get('state')=='PRODUCTION_GREEN':
    q((a.get('final_closure') or {}).get('dev_sha')=='1d8111e948db0d3ee176f86a8a74e12dcdbec4e3','Build 244 successor closure must retain exact final dev SHA')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='f65d13c3b9d686d5e88168dcee84f25f580b6323','Build 244 successor closure must retain exact Production main')
q(prev.get('state')=='PRODUCTION_GREEN','Build 243 predecessor must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='146b588a0ad060d8b68914440eef485d32d2bd35','Build 243 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='c725b19e6dd9c051e8efb552abab734ff0532894','Build 243 production checkpoint missing')
q(int(p.get('build') or 0)>=244 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 244 or a verified successor')
if int(p.get('build') or 0)==244:
    q(p.get('next_build')==245,'Build 244 successor pointer mismatch')
else:
    q((a.get('final_closure') or {}).get('dev_sha')=='1d8111e948db0d3ee176f86a8a74e12dcdbec4e3','Build 245+ must retain exact Build 244 Development closure')

for token in ("READ_METHODS = new Set(['GET','HEAD','OPTIONS'])","'/api/stripe-webhook'","'/api/paypal-webhook'","'/api/social/meta/data-deletion'","origin === url.origin","refOrigin === url.origin","fetchSite === 'same-origin'","fetchSite === 'cross-site' || fetchSite === 'same-site'","mode:'bearer_automation'","mode:'headerless_api_compatibility'","code:'csrf_origin_rejected'"):
    q(token in guard,f'Build 244 guard missing {token}')
q("import { protectMutationOrigin } from './api/_lib/csrfOriginProtection.js';" in mw,'Build 244 middleware import missing')
q("const mutationOriginDenied = protectMutationOrigin(request);" in mw,'Build 244 middleware enforcement missing')
q(mw.index("const mutationOriginDenied = protectMutationOrigin(request);") < mw.index("if (shouldBypass(pathname))"),'Build 244 origin guard must run before bypass logic')
q('Build 245 — CSP & Browser Injection-Surface Hardening' in road,'Build 245 successor missing')
q("run_current_contract('scripts/release467_build244_gate.py','Release 467 Build 244')" in sysgate,'System Gate must invoke Build 244')

for k in ('schema_change','request_time_schema_mutation','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','automatic_business_action','webhook_signature_authority_replaced','non_browser_bearer_compatibility_removed'):
    q(a.get('safety',{}).get(k) is False,f'Build 244 safety drift: {k}')

print('RELEASE 467 BUILD 244 CSRF ORIGIN PROTECTION FOR MUTATING ROUTES')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
