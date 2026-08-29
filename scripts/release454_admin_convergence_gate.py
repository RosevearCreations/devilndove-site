#!/usr/bin/env python3
"""Release 454 source gate for shared Admin navigation, workspace state and responsive convergence."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
NAV='public/js/admin-module-nav.js';STATE='public/js/admin-workspace-state.js';CSS='css/admin-convergence.css'
for p in (NAV,STATE,CSS):req((ROOT/p).exists(),f'missing Release 454 shared asset: {p}')
nav,state,css=map(read,(NAV,STATE,CSS))
for key in ('storefront','creators','socials','financials','it-platform'):req(f"key:'{key}'" in nav,f'module navigation missing {key}')
for label in ('Storefront','Creators','Socials / CAIP','Financials','I.T.'):req(label in nav,f'module navigation missing label {label}')
req('fetch(' not in nav and 'fetch(' not in state,'Release 454 shared shell must not make network calls')
req('MutationObserver' in state and "'loading'" in state and "'empty'" in state and "'error'" in state and 'Try again' in state,'workspace state/retry contract incomplete')
req('@media(max-width:900px)' in css and '@media(max-width:640px)' in css,'shared responsive breakpoints missing')
req('overflow-x:auto' in css and 'min-height:42px' in css,'mobile overflow/tap-target protections missing')
pages={
 'admin/storefront-merchandising/index.html':'storefront',
 'admin/creative-automation/index.html':'creators',
 'admin/caip-content-handoff/index.html':'socials',
 'admin/accounting/index.html':'financials',
 'admin/it-integrations/index.html':'it-platform',
 'admin/inventory-intelligence/index.html':'storefront',
 'admin/tool-lifecycle/index.html':'storefront'
}
for path,module in pages.items():
 html=read(path);req(f'data-admin-module="{module}"' in html,f'{path} missing module ownership');req('/css/admin-convergence.css?v=454' in html,f'{path} missing shared responsive CSS');req('/public/js/admin-module-nav.js?v=454' in html and '/public/js/admin-workspace-state.js?v=454' in html,f'{path} missing shared Admin shell runtime');req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{path} must contain exactly one H1');req('noindex,nofollow' in html,f'{path} must remain private/noindex')
for path in ('admin/storefront-merchandising/index.html','admin/creative-automation/index.html','admin/caip-content-handoff/index.html','admin/accounting/index.html','admin/it-integrations/index.html','admin/inventory-intelligence/index.html','admin/tool-lifecycle/index.html'):
 req('data-admin-workspace-status' in read(path),f'{path} missing shared workspace status surface')
release=json.loads(read('development-release.json'));req(release.get('release')==454,'current release must be 454');req(release.get('label')=='Admin Navigation, State & Responsive Convergence','Release 454 label drifted');req(release.get('current_release_migrations')==[],'Release 454 must not introduce a D1 migration');d1=release.get('development_infrastructure',{}).get('d1',{});req(d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','exact Development D1 authority drifted');req(d1.get('schema_current_through_release')==453,'Release 454 must carry Release 453 D1 forward unchanged');db=release.get('current_release_database_state',{});req(db.get('new_migration_required') is False and db.get('last_verified_schema_release')==453,'Release 454 D1 state must remain verified through 453');req(db.get('historical_migration_replay') is False,'historical migration replay must remain forbidden');history={x.get('release'):x for x in release.get('release_history',[])};r453=history.get(453,{});req(r453.get('mutation_workflow_run')==33258377328 and r453.get('verification_workflow_run')==33258415391,'Release 453 D1 evidence drifted');req(len(release.get('release454_batch',[]))==12 and all(x.get('status')=='implemented' for x in release.get('release454_batch',[])),'Release 454 batch is incomplete');policy=release.get('release_policy',{});req(policy.get('production_promotion')=='closed' and policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','Production/provider boundaries must remain closed');wrangler=read('wrangler.toml');req('account_id =' not in wrangler,'wrangler.toml must never pin account_id')
print('RELEASE 454 ADMIN CONVERGENCE GATE');print('Five-module shared navigation: PRESENT');print('Workspace loading/empty/error/retry state: PRESENT');print('Tablet/mobile shared responsive shell: PRESENT');print('Development D1 migration: NONE');print('Development D1 schema: CARRIED FORWARD / VERIFIED THROUGH RELEASE 453');print('Production/provider execution: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('RELEASE 454 ADMIN CONVERGENCE GATE: PASS')
