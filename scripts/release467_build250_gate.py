#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
def node(p):
    x=subprocess.run(['node','--check',str(R/p)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(x.returncode==0,f'JS syntax failed {p}: {(x.stderr or x.stdout)[-1200:]}')

a=j('release467-build250-startup-provider-read-budget-verification.json')
b249=j('release467-build249-refinement-runtime-measurement-outcome-baseline.json')
p=j('current-development-authority.json')
js=t('public/js/admin-startup-read-budget-v250.js')
admin=t('admin/index.html')
today=t('scripts/release467_build250_today_tasks_measurement.sql')
seller=t('scripts/release467_build250_seller_daily_measurement.sql')
wf=t('.github/workflows/release467-build250-startup-provider-read-budget-verification.yml')
road=t('docs/operations/RELEASE_467_REFINEMENT_OUTCOMES_AUTONOMOUS_BUILDS_249_256.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==250 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 250 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='fe7ac18156f2cbe83c67536be27b77756d29c696','Build 249 predecessor dev SHA mismatch')
q(pred.get('production_main_sha')=='94e4561f6b47337538a23ef2404f456237961ca3','Build 249 predecessor main SHA mismatch')
q(pred.get('development_tree_sha')=='bec700bf173ef7cc07b74aafdde4db6d362faad1' and pred.get('production_tree_sha')=='bec700bf173ef7cc07b74aafdde4db6d362faad1','Build 249 predecessor tree mismatch')
q(pred.get('state')=='PRODUCTION_GREEN' and pred.get('same_tree') is True,'Build 249 exact-tree Production GREEN predecessor missing')
q(b249.get('state')=='PRODUCTION_GREEN','Build 249 successor-ingested state must be Production GREEN')

m=a.get('measurement') or {}
q(m.get('state')=='EXACT_DEVELOPMENT_MEASURED_GREEN','Build 250 exact Development provider measurement must be recorded')
q(m.get('source_dev_sha')=='14f1d1f9d29988d39902dc6667230a611fb0018e','Build 250 measurement source dev SHA mismatch')
q(m.get('source_dev_tree')=='42e3797d5a575af10da0aa9d1d367b41d85908ed','Build 250 measurement source tree mismatch')
q(m.get('provider_workflow_run')==35998730536 and m.get('provider_evidence_artifact_id')==10807715341,'Build 250 measurement proof identifiers mismatch')
q(m.get('today_tasks_provider_rows_read')==1132 and m.get('today_tasks_provider_rows_read')<=15000,'Build 250 Today Tasks measured rows_read mismatch/over budget')
q(m.get('seller_daily_provider_rows_read')==1046 and m.get('seller_daily_provider_rows_read')<=10000,'Build 250 Seller Daily measured rows_read mismatch/over budget')
q(m.get('aggregate_provider_rows_read')==2178 and m.get('aggregate_provider_rows_read')<=25000,'Build 250 aggregate measured rows_read mismatch/over budget')
q(m.get('highest_provider_read_hotspot')=='operations-today-tasks-read','Build 250 measured hotspot mismatch')
q(m.get('provider_measurement_mutation') is False and m.get('production_d1_contact') is False,'Build 250 provider measurement safety drift')

scope=a.get('scope') or {}
q(scope.get('automatic_api_path_ceiling')==4,'browser safe GET ceiling drift')
q(scope.get('provider_bound_live_read_ceiling')==2,'provider-bound browser live-read ceiling drift')
q(scope.get('today_tasks_provider_rows_read_ceiling')==15000,'Today Tasks provider ceiling drift')
q(scope.get('seller_daily_provider_rows_read_ceiling')==10000,'Seller Daily provider ceiling drift')
q(scope.get('aggregate_provider_rows_read_ceiling')==25000,'aggregate provider ceiling drift')
for k in ('query_value_capture','request_payload_capture','response_payload_capture','header_capture','secret_capture','remote_browser_telemetry'):
    q(scope.get(k) is False,f'Build 250 privacy boundary drift: {k}')

for token in ('DDStartupReadBudgetV250','STARTUP_WINDOW_MS=15_000','SAFE_GET_CEILING=4','PROVIDER_BOUND_LIVE_READ_CEILING=2','sessionStorage','endpoint_counts','repeated_read_hotspots','remote_recording:false','query_value_capture:false','request_payload_capture:false','response_payload_capture:false'):
    q(token in js,f'Build 250 browser budget missing {token}')
segment=js[js.find('function pathOnly'):js.find('function bump')]
q('u.pathname' in segment and 'u.search' not in segment,'Build 250 browser measurement must use pathname only')
q('admin-startup-read-budget-v250.js?v=250' in admin,'Admin Home Build 250 verifier missing')
q(admin.index('admin-read-budget-v240.js') < admin.index('admin-startup-read-budget-v250.js?v=250') < admin.index('admin-home-dashboard-v123.js'),'Build 250 verifier must wrap Build 240 before startup consumers')
for token in ('build250StartupSafeGets','build250ProviderReads','build250ReadBudgetState','build250ReadHotspot'):
    q(token in admin,f'Admin Home Build 250 surface missing {token}')

for sql,label,expected in ((today,'Today Tasks',13),(seller,'Seller Daily',1)):
    q(not re.search(r'(?im)^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|PRAGMA|VACUUM|REINDEX)\b',sql),f'{label} provider probe contains mutation/DDL')
    q(len(re.findall(r'(?im)^\s*SELECT\b',sql))==expected,f'{label} provider probe statement count must be {expected}')
q("task_key='failed_api'" in today and "site_visitor_sessions" in seller,'Build 250 probe SQL does not mirror startup reads')

for token in (
    "github.event_name == 'push' && github.ref == 'refs/heads/dev'",
    'database_name = "devilndove-dev"','dbc1615b-dcbe-4951-973b-b47c99c73bfa',
    'TODAY_TASKS_PROVIDER_ROWS_READ','SELLER_DAILY_PROVIDER_ROWS_READ','AGGREGATE_PROVIDER_ROWS_READ',
    'today_rows_read <= 15000','seller_rows_read <= 10000','aggregate_rows_read <= 25000',
    'build250-provider-read-budget-','D1 mutation: ZERO','R2 mutation: ZERO','PRODUCTION D1 CONTACT: ZERO'
):
    q(token in wf,f'Build 250 workflow missing {token}')
q("! grep -q 'devilndove-prod' wrangler.toml" in wf,'Build 250 workflow must explicitly reject Production D1 binding')
q('f34a741b-0000-45b0-9a96-6be08754d563' not in wf,'Build 250 workflow must not contain Production D1 id')
q('d1 execute devilndove-prod' not in wf and 'd1 info devilndove-prod' not in wf,'Build 250 workflow must not execute against Production D1')

q('Build 251 — CSP Style Injection-Surface Hardening' in road,'Build 251 successor missing')
q("run_current_contract('scripts/release467_build250_gate.py','Release 467 Build 250')" in sysgate,'System Gate must invoke Build 250')
pb=int(p.get('build') or 0)
if pb==250:
    q(p.get('next_build')==251 and p.get('state')=='DEVELOPMENT_GREEN','current authority must expose Build 250 and successor 251')
elif pb>=251:
    q(p.get('state')=='DEVELOPMENT_GREEN' and 'release467-build250-startup-provider-read-budget-verification.json' in (p.get('current_release_authorities') or []),'verified successors must retain Build 250 compatibility authority')
else:
    q(False,'current authority must be Build 250 or a verified successor')
if a.get('state')=='PRODUCTION_GREEN':
    final=a.get('final_closure') or {};prod=a.get('production_checkpoint') or {}
    q(final.get('dev_sha')=='f2eb36f2cae76e44a7e225c38fb4102cf1f9a84d','Build 250 final dev SHA mismatch')
    q(final.get('tree_sha')=='41409f1d0a50793d9dda1f1184a2b8dcc8a2fda1','Build 250 final tree mismatch')
    q((final.get('proofs') or {}).get('system_gate_run')==35999263313,'Build 250 final System proof mismatch')
    q(prod.get('main_sha')=='4bbd5ffdd7063bdc7bb864c416b8a6f08cf2582e','Build 250 Production main mismatch')
    q(prod.get('tree_sha')=='41409f1d0a50793d9dda1f1184a2b8dcc8a2fda1','Build 250 Production tree mismatch')
    q(prod.get('production_pages_deploy_run')==35999481927 and prod.get('production_live_resource_integrity_run')==35999606857,'Build 250 Production proof mismatch')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 250 safety drift: {k}')
node('public/js/admin-startup-read-budget-v250.js')

print('RELEASE 467 BUILD 250 STARTUP & PROVIDER READ-BUDGET VERIFICATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Browser budget: <=4 safe GETs / <=2 provider-bound live reads')
print('Measured provider rows_read: Today Tasks 1132; Seller Daily 1046; aggregate 2178 — GREEN')
print('Future queue: OPEN; next Build 251')
