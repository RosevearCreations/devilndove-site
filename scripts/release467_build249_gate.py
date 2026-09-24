#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build249-refinement-runtime-measurement-outcome-baseline.json')
b248=j('release467-build248-refinement-outcomes-review-roadmap-renewal.json')
p=j('current-development-authority.json')
runtime=t('public/js/admin-route-usage.js')
admin=t('admin/index.html')
products=t('admin/products/index.html')
budget=t('public/js/admin-read-budget-v240.js')
road=t('docs/operations/RELEASE_467_REFINEMENT_OUTCOMES_AUTONOMOUS_BUILDS_249_256.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==249 and a.get('state')=='DEVELOPMENT_CANDIDATE','Build 249 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='2f46181a3c92568c2b192a83929a85f72a2b4374','Build 249 predecessor dev SHA mismatch')
q(pred.get('production_main_sha')=='e6ed352b5fe9f32b2cd6d049b00239fd643ebbc6','Build 249 predecessor main SHA mismatch')
q(pred.get('development_tree_sha')=='2db3a312cd0e7a6e24b07de4495d1d97898c7028' and pred.get('production_tree_sha')=='2db3a312cd0e7a6e24b07de4495d1d97898c7028','Build 249 predecessor tree mismatch')
q(pred.get('state')=='PRODUCTION_GREEN' and pred.get('same_tree') is True,'Build 248 Production GREEN predecessor not retained')
q(b248.get('state')=='PRODUCTION_GREEN','Build 248 successor-ingested state must be Production GREEN')

scope=a.get('scope') or {}
for key in ('query_value_capture','request_payload_capture','response_payload_capture','header_capture','secret_capture','remote_telemetry','synthetic_samples'):
    q(scope.get(key) is False,f'Build 249 privacy/synthetic boundary drift: {key}')
q(scope.get('route_transition_measurement')=='BROWSER_LOCAL_SESSION_ONLY','route measurement must stay browser local')
q(scope.get('startup_request_measurement')=='FIRST_15_SECONDS_PER_ADMIN_PAGE','startup window contract missing')

for token in (
    'DDRefinementRuntimeV249','STARTUP_WINDOW_MS=15_000','sessionStorage',
    'sameOriginApiPath','endpoint_counts','route_visits','transitions',
    'cache_hits','cache_misses','duplicate_reads_suppressed',
    'query_value_capture:false','request_payload_capture:false',
    'response_payload_capture:false','remote_recording:false',
    'captureBaseline','baseline_role'
):
    q(token in runtime,f'Build 249 runtime measurement missing {token}')

q("u.pathname" in runtime and "u.search" not in runtime[runtime.find('function sameOriginApiPath'):runtime.find('function sameOriginAdminPath')],'API measurement must return pathname only')
q('refinementRuntimeBaselineMount' in admin,'Admin home Build 249 baseline surface missing')
q(admin.index('admin-route-usage.js') < admin.index('admin-read-budget-v240.js') < admin.index('admin-home-dashboard-v123.js'),'Build 249 measurement must load before Build 240/dashboard clients')
q('admin-route-usage.js?v=249' in products and products.index('admin-route-usage.js?v=249') < products.index('admin-products-browser-v162.js'),'Product browser must load Build 249 shared measurement before Product client')

for token in ('TTL_MS=60_000','coalesced_reads','cache_hits','live_reads'):
    q(token in budget,f'Build 240 retained read-budget contract missing {token}')

q('Build 250 — Startup & Provider Read-Budget Verification' in road,'Build 250 successor missing')
q("run_current_contract('scripts/release467_build249_gate.py','Release 467 Build 249')" in sysgate,'System Gate must invoke Build 249')
q(p.get('build')==249 and p.get('next_build')==250 and p.get('state')=='DEVELOPMENT_GREEN','current authority must expose Build 249 and successor 250')

for k,v in (a.get('safety') or {}).items():
    q(v is False,f'Build 249 safety drift: {k}')

print('RELEASE 467 BUILD 249 REFINEMENT RUNTIME MEASUREMENT OUTCOME BASELINE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Runtime measurement: browser-local, payload-free, real-session-only')
print('Future queue: OPEN; next Build 250')
