#!/usr/bin/env python3
from pathlib import Path
import json,sys,re
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build245-csp-browser-injection-hardening.json')
p=j('current-development-authority.json')
prev=j('release467-build244-csrf-origin-protection-mutating-routes.json')
mw=t('functions/_middleware.js')
headers=t('_headers')
rel=t('functions/api/_lib/currentReliability.js')
relpage=t('admin/reliability/index.html')
road=t('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==245 and a.get('state')=='DEVELOPMENT_CANDIDATE','Build 245 authority identity/state mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 244 predecessor must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='1d8111e948db0d3ee176f86a8a74e12dcdbec4e3','Build 244 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='f65d13c3b9d686d5e88168dcee84f25f580b6323','Build 244 Production closure missing')
q(p.get('build')==245 and p.get('next_build')==246 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 245 candidate and Build 246 successor')

for token in ('function randomCspNonce()','crypto.getRandomValues(bytes)','function cspForNonce(nonce)',"script-src 'self' 'nonce-", "script-src-attr 'unsafe-inline'",'X-DND-CSP-Revision',".on('script', { element(element) { element.setAttribute('nonce', nonce); } })"):
    q(token in mw,f'Build 245 middleware missing {token}')
q("script-src 'self' 'unsafe-inline'" not in re.search(r'function cspForNonce\(nonce\)[\s\S]*?\n}',mw).group(0),'Runtime CSP must remove script-src unsafe-inline')
q("style-src 'self' 'unsafe-inline'" in mw,'Build 245 must retain style inline compatibility for bounded migration')
q('Content-Security-Policy-Report-Only:' in headers,'Static header layer must include stricter report-only CSP')
q("script-src 'self' https://static.cloudflareinsights.com" in headers,'Report-only policy must remove script unsafe-inline')
# Build 244 inherited correction must actually execute inside onRequest before shouldBypass.
onreq=mw[mw.index('export async function onRequest(context)'):]
q('const mutationOriginDenied = protectMutationOrigin(request);' in onreq,'Build 244 mutation guard must execute in onRequest')
q(onreq.index('const mutationOriginDenied = protectMutationOrigin(request);') < onreq.index('if (shouldBypass(pathname))'),'Mutation guard must precede bypass routing')
q('Release 467 • Build 245' in relpage,'Reliability page identity must match Build 245')
q('CURRENT_RELIABILITY_BUILD=245' in rel,'Reliability API identity must match Build 245')
q('Build 246 — Abuse Resistance, Session Control & Security Operations' in road,'Build 246 successor missing')
q("run_current_contract('scripts/release467_build245_gate.py','Release 467 Build 245')" in sysgate,'System Gate must invoke Build 245')
for k in ('schema_change','request_time_schema_mutation','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','automatic_business_action','csp_style_breaking_change','legacy_inline_event_breaking_change'):
    q(a.get('safety',{}).get(k) is False,f'Build 245 safety drift: {k}')
print('RELEASE 467 BUILD 245 CSP BROWSER INJECTION SURFACE HARDENING')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
