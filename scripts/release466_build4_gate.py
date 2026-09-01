#!/usr/bin/env python3
"""Fail-closed source contract for Release 466 Build 4 — External Acceptance & Commercial Readiness."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):
 p=ROOT/path
 if not p.is_file():FAIL.append(f'missing required file: {path}');return''
 return p.read_text(encoding='utf-8',errors='replace')
def has(body,*tokens,label='file'):
 for token in tokens:req(token in body,f'{label} missing required contract: {token}')

a=json.loads(read('release466-build4-external-commercial-readiness.json') or '{}');state=a.get('state')
req(a.get('release')==466 and a.get('build')==4,'authority must identify Release 466 Build 4')
req(state in {'implementation_in_progress','technical_green_external_acceptance_pending','development_green'},'unexpected Build 4 state')
req(a.get('schema_change_required') is False and a.get('migration') is None,'Build 4 must remain schema-neutral')
items={int(x.get('id') or 0):x for x in a.get('items',[]) if isinstance(x,dict)}
req(set(items)=={16,17,18,19,20},'Build 4 must own exactly items 16-20')
req(all(items[i].get('status') in {'implementation_in_progress','technical_green_external_acceptance_pending','development_green'} for i in items),'Build 4 item lifecycle drifted')
for key in ('production_business_mutation','production_schema_mutation','production_payment_execution','production_provider_execution','production_provider_publication','automatic_provider_authorization','automatic_payment_execution','automatic_refund_execution','automatic_oauth_connect','automatic_oauth_revoke','raw_r2_delete','request_time_schema_ddl','secrets_in_source_or_evidence'):
 req((a.get('safety') or {}).get(key) is False,f'safety flag must remain false: {key}')
req((a.get('safety') or {}).get('preview_access_must_remain_enforced') is True,'Preview Access must remain enforced')
req((a.get('safety') or {}).get('main_must_remain_release465_until_deliberate_promotion') is True,'main must remain Release 465')

api=read('functions/api/admin/release466-external-commercial-readiness.js');alias=read('functions/api/admin/release-external-commercial-readiness.js');page=read('admin/release-control/external-commercial-readiness/index.html');client=read('public/js/admin-release466-external-commercial-readiness.js');guide=read('LIVE_TESTING_GUIDE.md');workflow=read('.github/workflows/release466-build4-proof.yml');runtime=read('scripts/release466_build4_runtime_proof.py')
has(api,'loadPaymentAcceptance','loadCaipAcceptance','loadSocialOauthAcceptance','launchBlockers','paymentExecutionStatus','it_provider_readiness_checks','creative_asset_access_audit','oauth_provider_connections','pending_authenticated_browser_range_evidence','pending_provider_selection','native_github_ruleset_external_pending','current_live_production_seo_findings','release466_seo_source_fix_staged',label='Build 4 API')
req('export async function onRequestGet' in api,'Build 4 API must expose GET')
req(not re.search(r'\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE)\b',api,re.I),'Build 4 API must remain SQL read-only')
req('onRequestPost' not in api and 'onRequestPut' not in api and 'onRequestDelete' not in api,'Build 4 API must remain GET-only')
req("export { onRequestGet }" in alias and 'onRequestPost' not in alias,'Build 4 release-route alias must export GET only')
req(page.lower().count('<h1')==1,'Build 4 cockpit must have exactly one H1')
has(page,'External Acceptance &amp; Commercial Readiness','GET-only','/admin/it-integrations/','/admin/runtime-acceptance/','/admin/release-control/runtime-storefront-intelligence/','/admin/release-control/revenue-business-intelligence/',label='Build 4 cockpit')
has(client,'/api/admin/release-external-commercial-readiness','Stripe Development','PayPal sandbox','CAIP private media','Social / OAuth','Production launch',label='Build 4 client')

has(guide,'Development I.T. Test Environment — Release 466','/admin/release-control/external-commercial-readiness/','PAYMENT_PROVIDER_EXECUTION_MODE=development-explicit','CAIP private-media browser/range-streaming acceptance','Stripe Development acceptance','PayPal sandbox acceptance','Social / OAuth controlled acceptance','Production-launch readiness','A truthful HOLD is the correct state',label='current live testing guide')
req('devilndove-site-dev.pages.dev' not in guide,'current testing guide must not restore the retired Development project host')

sitemap=read('sitemap.xml')
for path in ('/cart/','/checkout/','/checkout/confirmation/','/supplies/health/','/tools/health/','/toolshed/duplicates/'):
 req(f'https://devilndove.com{path}' not in sitemap,f'Release 466 sitemap must exclude noindex utility route {path}')
for path in ('/','/shop/','/collections/','/custom-request/','/gift-cards/'):
 req(f'https://devilndove.com{path}' in sitemap,f'Release 466 sitemap lost expected public route {path}')

payment=read('functions/api/_lib/paymentExecution.js');caip=read('functions/api/admin/creative-asset-review.js');oauth_start=read('functions/api/admin/oauth-start.js');oauth_connections=read('functions/api/admin/oauth-connections.js');readiness=read('functions/api/admin/it-provider-readiness.js')
has(payment,"PAYMENT_PROVIDER_EXECUTION_MODE","development-explicit","payment_live_credentials_forbidden","production_execution: false",label='payment execution boundary')
has(caip,"headers.set('Content-Range'","status = 206","Accept-Ranges","private, no-store","ranged_streaming",label='CAIP range review authority')
has(oauth_start,'oauthRemoteAuthorizationOpen','development-explicit','encryptOAuthSecret','intended_account_configured',label='OAuth start authority')
has(oauth_connections,'decryptOAuthSecret','verifyOAuthIdentity','local_token_material_destroyed','provider_subject_values_emitted:false',label='OAuth lifecycle authority')
has(readiness,'secret_value_refused','provider_execution_allowed:false','provider_publication_allowed:false',label='I.T. provider readiness authority')

has(runtime,'HOLD_EXTERNAL_ACCEPTANCE','--strict-external','configuration alone is never promoted to acceptance','development_d1_operation','SELECT only',label='Build 4 runtime proof')
has(workflow,'Release 466 Build 4 Proof','scripts/release466_build4_gate.py','scripts/release466_build4_runtime_proof.py','Read Development Build 4 acceptance authority','SELECT','External provider calls from CI: ZERO','HOLD is expected until deliberate real external acceptance exists',label='Build 4 workflow')
req('stripe.com' not in workflow.lower() and 'paypal.com' not in workflow.lower(),'Build 4 CI must not call payment providers')

manifest=json.loads(read('migrations/canonical/manifest.json') or '{}')
req([x.get('file') for x in manifest.get('migrations',[])]==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'Build 4 must preserve exact canonical migrations 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('*466*build4*')),'Build 4 declared schema-neutral but a Build 4 migration exists')

build3=json.loads(read('release466-build3-revenue-business-intelligence.json') or '{}');req(build3.get('state')=='development_green','Build 4 must start from closed Build 3 authority')
release=json.loads(read('development-release.json') or '{}')
req(release.get('convergence_state')=='release466_build3_development_green_external_ruleset_pending','Build 4 implementation must start from Build 3 Development-green convergence')
req(release.get('production_infrastructure',{}).get('current_production_release')==465,'Production must remain Release 465')
req(release.get('production_infrastructure',{}).get('current_production_source_sha')=='d5009d9c622bdf84232b3aa7bd24a1c3d61581b2','Production SHA boundary drifted')
planned={int(x.get('build') or 0):x for x in release.get('planned_builds',[]) if isinstance(x,dict)}
req(set(planned)=={4} and planned[4].get('items')==[16,17,18,19,20] and planned[4].get('state')=='next','Build 4 must remain the current next bounded work during implementation')

print('RELEASE 466 BUILD 4 SOURCE CONTRACT')
print('Items: 16 CAIP private media; 17 Stripe Development; 18 PayPal sandbox; 19 Social/OAuth; 20 Production launch readiness')
print('Schema change: NONE')
print('CI provider/payment/OAuth execution: ZERO')
print('Production mutation/publication/raw R2 delete: ZERO')
print('Missing external evidence: HOLD, never inferred PASS')
if FAIL:
 print('RELEASE 466 BUILD 4 SOURCE CONTRACT: FAIL');[print(f'{i:03d}. {m}') for i,m in enumerate(FAIL,1)];raise SystemExit(1)
print('RELEASE 466 BUILD 4 SOURCE CONTRACT: PASS')
