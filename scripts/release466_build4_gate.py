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
policy=a.get('acceptance_policy') or {}
req(policy.get('stripe_required_checks')==['credentials','checkout','webhook-signature','refund','reconciliation','idempotent-replay'],'Stripe acceptance must include refund as the sixth check')
req(policy.get('paypal_required_checks')==['credentials','approval-capture','webhook-verification','refund','reconciliation','idempotent-replay'],'PayPal acceptance must include refund as the sixth check')
req(policy.get('refund_check_requires_real_provider_sync_evidence') is True and policy.get('local_only_refund_is_not_external_acceptance') is True,'refund acceptance must require real provider synchronization')

api=read('functions/api/admin/release466-external-commercial-readiness.js');alias=read('functions/api/admin/release-external-commercial-readiness.js');page=read('admin/release-control/external-commercial-readiness/index.html');client=read('public/js/admin-release466-external-commercial-readiness.js');guide=read('LIVE_TESTING_GUIDE.md');workflow=read('.github/workflows/release466-build4-proof.yml');runtime=read('scripts/release466_build4_runtime_proof.py');payment_actions=read('functions/api/admin/payment-actions.js');payment_contract=read('functions/api/admin/contracts/operations-payment-action-write.js')
has(api,'loadPaymentAcceptance','loadProviderRefundAcceptance','payment_refunds',"provider_sync_status,''))='succeeded'",'successful_provider_refund_count','Five sanitized readiness checks plus one real provider-synchronized Development refund','loadCaipAcceptance','loadSocialOauthAcceptance','launchBlockers','paymentExecutionStatus','pending_authenticated_browser_range_evidence','pending_provider_selection','native_github_ruleset_external_pending',label='Build 4 API')
req('export async function onRequestGet' in api,'Build 4 API must expose GET')
req(not re.search(r'\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE)\b',api,re.I),'Build 4 API must remain SQL read-only')
req('onRequestPost' not in api and 'onRequestPut' not in api and 'onRequestDelete' not in api,'Build 4 API must remain GET-only')
req("export { onRequestGet }" in alias and 'onRequestPost' not in alias,'Build 4 release-route alias must export GET only')
req(page.lower().count('<h1')==1,'Build 4 cockpit must have exactly one H1')
has(client,'/api/admin/release-external-commercial-readiness','Stripe Development','PayPal sandbox','CAIP private media','Social / OAuth','Production launch',label='Build 4 client')

has(payment_actions,"paymentExecutionStatus","PAYMENT_PROVIDER_MUTATIONS_ENABLED","provider_sync_confirmed === true","const syncProvider = Number(body.sync_provider || 0) === 1","Idempotency-Key","PayPal-Request-Id","getOrCreateProviderRefundIntent","provider_refund_sync_failed","local_payment_status_changed: false","provider_network_call_performed: false",label='provider refund implementation')
req("body.sync_provider == null ? 1" not in payment_actions,'direct payment-actions must never default provider synchronization on')
req("api-m.paypal.com" not in payment_actions,'refund implementation must not carry a PayPal live API host')
has(payment_contract,'PAYMENT_PROVIDER_MUTATIONS_ENABLED','provider_sync_confirmed','release466PaymentExecutionBoundaryRequired','sync_provider:',label='operations payment contract')
req('delete safeBody.provider_sync_confirmed' not in payment_contract,'operations contract must preserve explicit provider-sync confirmation for implementation enforcement')

has(guide,'Development I.T. Test Environment — Release 466','PAYMENT_PROVIDER_EXECUTION_MODE=development-explicit','PAYMENT_PROVIDER_MUTATIONS_ENABLED=1','provider_sync_confirmed=true','six','`refund`','Idempotency-Key','PayPal-Request-Id','A truthful HOLD is the correct state',label='current live testing guide')
req('devilndove-site-dev.pages.dev' not in guide,'current testing guide must not restore the retired Development project host')

sitemap=read('sitemap.xml')
for path in ('/cart/','/checkout/','/checkout/confirmation/','/supplies/health/','/tools/health/','/toolshed/duplicates/'):
 req(f'https://devilndove.com{path}' not in sitemap,f'Release 466 sitemap must exclude noindex utility route {path}')
for path in ('/','/shop/','/collections/','/custom-request/','/gift-cards/'):
 req(f'https://devilndove.com{path}' in sitemap,f'Release 466 sitemap lost expected public route {path}')

payment=read('functions/api/_lib/paymentExecution.js');caip=read('functions/api/admin/creative-asset-review.js');oauth_start=read('functions/api/admin/oauth-start.js');oauth_connections=read('functions/api/admin/oauth-connections.js');readiness=read('functions/api/admin/it-provider-readiness.js')
has(payment,'PAYMENT_PROVIDER_EXECUTION_MODE','development-explicit','payment_live_credentials_forbidden','production_execution: false',label='payment execution boundary')
has(caip,"headers.set('Content-Range'",'status = 206','Accept-Ranges','private, no-store','ranged_streaming',label='CAIP range review authority')
has(oauth_start,'oauthRemoteAuthorizationOpen','development-explicit','encryptOAuthSecret','intended_account_configured',label='OAuth start authority')
has(oauth_connections,'decryptOAuthSecret','verifyOAuthIdentity','local_token_material_destroyed','provider_subject_values_emitted:false',label='OAuth lifecycle authority')
has(readiness,'secret_value_refused','provider_execution_allowed:false','provider_publication_allowed:false',label='I.T. provider readiness authority')

has(runtime,'HOLD_EXTERNAL_ACCEPTANCE','--strict-external','stripe_total==6','paypal_total==6','successful_provider_refunds','refund_is_derived_from_real_provider_sync','local_only_refund_counts_as_external_acceptance','development_d1_operation','SELECT only',label='Build 4 runtime proof')
has(workflow,'Release 466 Build 4 Proof','scripts/release466_build4_gate.py','scripts/release466_build4_runtime_proof.py','payment_refunds_table','stripe_successful_provider_refunds','paypal_successful_provider_refunds','External provider calls from CI: ZERO','Provider refund execution from CI: ZERO','HOLD is expected until deliberate real external acceptance exists',label='Build 4 workflow')
req('api.stripe.com' not in workflow.lower() and 'api-m.paypal.com' not in workflow.lower(),'Build 4 CI must not call payment providers')

manifest=json.loads(read('migrations/canonical/manifest.json') or '{}')
req([x.get('file') for x in manifest.get('migrations',[])]==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'Build 4 must preserve exact canonical migrations 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('*466*build4*')),'Build 4 declared schema-neutral but a Build 4 migration exists')

build3=json.loads(read('release466-build3-revenue-business-intelligence.json') or '{}');req(build3.get('state')=='development_green','Build 4 must retain closed Build 3 authority')
release=json.loads(read('development-release.json') or '{}')
req(release.get('convergence_state')=='release466_build3_development_green_external_ruleset_pending','last fully accepted convergence must remain Build 3 while Build 4 external evidence is HOLD')
req(release.get('production_infrastructure',{}).get('current_production_release')==465,'Production must remain Release 465')
req(release.get('production_infrastructure',{}).get('current_production_source_sha')=='d5009d9c622bdf84232b3aa7bd24a1c3d61581b2','Production SHA boundary drifted')

if state=='technical_green_external_acceptance_pending':
 req(items[16].get('status')=='development_green','CAIP item 16 must remain Development green')
 for item_id in (17,18,19,20):req(items[item_id].get('status')=='technical_green_external_acceptance_pending',f'Build 4 item {item_id} must remain external-pending')
 final_ev=a.get('final_technical_closure_evidence') or {};external=a.get('external_acceptance_evidence') or {};hardening=a.get('payment_refund_hardening') or {}
 req(a.get('final_technical_closure_sha')=='8f6cb19f69f102b09685dbb4cf410fe123e5775d','Build 4 final technical closure SHA drifted')
 req(final_ev.get('source_sha')=='8f6cb19f69f102b09685dbb4cf410fe123e5775d' and int(final_ev.get('system_gate_run') or 0)==33510294636 and int(final_ev.get('build4_proof_run') or 0)==33510294597,'Build 4 final technical closure evidence drifted')
 req(final_ev.get('exact_preview')=='https://83bc32a3.devilndove-site.pages.dev','Build 4 final exact Preview evidence drifted')
 req(int(final_ev.get('build4_proof_artifact_id') or 0)==9801397939 and final_ev.get('build4_proof_artifact_sha256')=='af257b6a2976b5d51f1667d2c8f045dfbe7f4d6a0e0ff753f7aa42bb7fce8508','Build 4 final artifact evidence drifted')
 req(int(final_ev.get('canonical_migrations',-1))==4 and int(final_ev.get('new_migrations_applied',-1))==0 and int(final_ev.get('development_foreign_key_violations',-1))==0,'Build 4 final D1 evidence drifted')
 req(external.get('launch_state')=='HOLD_EXTERNAL_ACCEPTANCE','Build 4 launch state must remain truthful HOLD')
 req((external.get('caip_private_media') or {}).get('accepted') is True and int((external.get('caip_private_media') or {}).get('qualifying_range_audits') or 0)==3,'CAIP acceptance drifted')
 stripe=external.get('stripe') or {};paypal=external.get('paypal') or {};social=external.get('social_oauth') or {}
 req(stripe.get('accepted') is False and int(stripe.get('required_checks',-1))==6 and int(stripe.get('passed_checks',-1))==0 and int(stripe.get('successful_provider_refunds',-1))==0,'Stripe must remain truthful 0/6 HOLD with zero synchronized refunds')
 req(paypal.get('accepted') is False and int(paypal.get('required_checks',-1))==6 and int(paypal.get('passed_checks',-1))==0 and int(paypal.get('successful_provider_refunds',-1))==0,'PayPal must remain truthful 0/6 HOLD with zero synchronized refunds')
 req(int(social.get('selected_providers') or 0)==0 and int(social.get('selected_provider_connections') or 0)==0 and int(social.get('selected_provider_security_events') or 0)==0,'Social/OAuth HOLD evidence drifted')
 req(external.get('native_github_ruleset')=='external_repository_setting_pending' and external.get('production_promotion_authorized') is False,'Build 4 governance/promotion HOLD drifted')
 req(hardening.get('source_sha')=='8f6cb19f69f102b09685dbb4cf410fe123e5775d' and hardening.get('source_gate_state')=='development_green','payment refund hardening closure state drifted')
 req(int(hardening.get('system_gate_run') or 0)==33510294636 and int(hardening.get('build4_proof_run') or 0)==33510294597 and int(hardening.get('build4_proof_artifact_id') or 0)==9801397939,'payment refund hardening proof evidence drifted')
 req(hardening.get('direct_payment_actions_default_provider_sync') is False and hardening.get('legacy_provider_mutation_gate_required') is True and hardening.get('explicit_provider_sync_confirmation_required') is True and hardening.get('release466_development_test_boundary_required') is True,'payment refund hardening boundary drifted')
 req(hardening.get('failed_provider_refund_changes_payment_or_order_status') is False and hardening.get('schema_change_required') is False and hardening.get('external_provider_calls_by_ci') is False and hardening.get('production_mutation') is False,'refund failure/schema/provider safety drifted')

 roadmap=read('docs/operations/RELEASE_466_FOUR_BUILD_ROADMAP.md');handoff=read('AI_HANDOFF.md');project=read('PROJECT_STATUS_AND_ROADMAP.md');sanity=read('SANITY_HEALTH_CHECK.md')
 has(roadmap,'Build 4 — External Acceptance & Commercial Readiness — TECHNICAL GREEN / EXTERNAL ACCEPTANCE HOLD','Stripe Development acceptance — EXTERNAL ACCEPTANCE PENDING','PayPal sandbox acceptance — EXTERNAL ACCEPTANCE PENDING',label='Build 4 roadmap closure')
 has(handoff,'Build 4 implementation is **technical green / external acceptance HOLD**','Stripe Development acceptance — EXTERNAL ACCEPTANCE PENDING','PayPal sandbox acceptance — EXTERNAL ACCEPTANCE PENDING',label='Build 4 handoff closure')
 has(project,'| Build 4 | 16–20 | External Acceptance & Commercial Readiness | Technical green / external acceptance HOLD |','Current state `HOLD_EXTERNAL_ACCEPTANCE`',label='Build 4 project closure')
 has(sanity,'Build 4 is **technical green / external acceptance HOLD**','Stripe Development acceptance — **external acceptance pending**','PayPal sandbox acceptance — **external acceptance pending**',label='Build 4 sanity closure')

print('RELEASE 466 BUILD 4 SOURCE CONTRACT')
print('Items: 16 CAIP private media; 17 Stripe Development; 18 PayPal sandbox; 19 Social/OAuth; 20 Production launch readiness')
print('Payment acceptance: SIX checks/provider including real provider-synchronized refund evidence')
print('Payment refund hardening: DEVELOPMENT GREEN on 8f6cb19f69f102b09685dbb4cf410fe123e5775d')
print('Remote refund boundary: legacy gate + explicit confirmation + Release 466 Development/test boundary')
print('Schema change: NONE')
print('CI provider/payment/refund/OAuth execution: ZERO')
print('Production mutation/publication/raw R2 delete: ZERO')
print('Missing external evidence: HOLD, never inferred PASS')
if FAIL:
 print('RELEASE 466 BUILD 4 SOURCE CONTRACT: FAIL');[print(f'{i:03d}. {m}') for i,m in enumerate(FAIL,1)];raise SystemExit(1)
print('RELEASE 466 BUILD 4 SOURCE CONTRACT: PASS')
