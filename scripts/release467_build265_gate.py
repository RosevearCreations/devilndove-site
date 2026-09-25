#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build265-caip-private-media-prerequisite-inventory.json')
v=j('data/site/build241-validation-summary.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
doc=t('docs/operations/RELEASE_467_BUILD_265_CAIP_PRIVATE_MEDIA_PREREQUISITE_INVENTORY.md')
raw=t('docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md')
storage=t('docs/creative-asset-intelligence-platform/03_Storage_Architecture.md')
accept=t('docs/creative-asset-intelligence-platform/12_Testing_and_Acceptance.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
workflow=t('.github/workflows/release467-build265-caip-private-media-prerequisite-inventory.yml')

q(a.get('build')==265 and a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 265 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='9017e145286f2007646a1f4de9ebdb670ca23881','Build 264 Development predecessor SHA mismatch')
q(pred.get('production_main_sha')=='9cf042afb9b7938f160df89b49b82376eb8f9291','Build 264 Production predecessor SHA mismatch')
q(pred.get('proof_recovery')=='LIVE_BY_EXACT_SHA_COMPOSITION','Build 265 exact-SHA predecessor proof mode missing')

inv=a.get('inventory') or {}; b=inv.get('build241_validation') or {}; s=inv.get('storage_authority') or {}; m=inv.get('multipart_recovery') or {}
q(b.get('status')=='ready_for_deployed_evidence','Build 241 deployed-evidence state drift')
q(b.get('private_media_tables')==6 and b.get('current_pass_identical') is True and b.get('aggregate_schemas_synchronized') is True,'Build 241 schema inventory mismatch')
q(b.get('request_time_ddl') is False and b.get('active_operational_workstreams')==21 and b.get('active_startup_gates')==46,'Build 241 validation counts/boundary mismatch')
q(s.get('private_binding')=='CAIP_PRIVATE_MEDIA_BUCKET' and s.get('public_binding')=='PRODUCT_MEDIA_BUCKET','CAIP bucket authority mismatch')
q(s.get('public_r2_dev_or_custom_domain_allowed') is False and s.get('raw_original_policy')=='immutable_after_successful_completion','Private-media/public-boundary drift')
q(s.get('public_promotion')=='review_only_no_public_copy','Public promotion must remain review-only')
q(m.get('current_transport')=='authenticated_same_origin_worker_streamed_multipart','Current multipart transport mismatch')
q(m.get('default_part_size_mib')==32 and m.get('conservative_parallel_parts')==2 and m.get('fallback_part_limit_mib')==256,'Multipart sizing/parallelism drift')
q(m.get('preferred_future_transport')=='direct_s3_presigned_multipart' and m.get('preferred_future_transport_live') is False,'Future transport must not be claimed live')
q(inv.get('classification')=='PREREQUISITES_INVENTORIED_NOT_PRODUCTION_ACCEPTED','Build 265 acceptance classification mismatch')

q(v.get('status')=='ready_for_deployed_evidence','Build 241 validation source state mismatch')
q((v.get('caip') or {}).get('private_media_tables')==6,'Build 241 validation source table count mismatch')
q((v.get('caip') or {}).get('private_r2_binding_required')=='CAIP_PRIVATE_MEDIA_BUCKET','Build 241 validation source binding mismatch')
q((v.get('caip') or {}).get('raw_original_policy')=='immutable' and (v.get('caip') or {}).get('public_promotion')=='review_only','Build 241 validation source policy mismatch')

for token in ('CAIP_PRIVATE_MEDIA_BUCKET','PRODUCT_MEDIA_BUCKET','32 MiB','two parts','256 MiB','Browser security','direct_s3_presigned_multipart','Build 269'):
    q(token in raw,f'Private raw-media authority missing {token}')
for token in ('CAIP_PRIVATE_MEDIA_BUCKET','immutable','Build 241','authenticated same-origin Worker-streamed multipart'):
    q(token in storage,f'Storage authority missing {token}')
for token in ('Create/bind the dedicated private R2 bucket','Interrupt a multipart upload','secure review grant','public promotion','Record safe production evidence'):
    q(token in accept,f'Acceptance authority missing {token}')
for token in ('Build 265 — CAIP Private-Media Prerequisite Inventory','Build 266 — CAIP Multipart Recovery Integrity Review'):
    q(token in road,f'CAIP recovery roadmap missing {token}')
for token in ('six CAIP private-media tables','32 MiB','256 MiB','PREREQUISITES_INVENTORIED_NOT_PRODUCTION_ACCEPTED','Build 266'):
    q(token in doc,f'Build 265 document missing {token}')

q('development_sha: 9017e145286f2007646a1f4de9ebdb670ca23881' in workflow,'Build 265 workflow missing exact Build 264 Development SHA')
q('production_sha: 9cf042afb9b7938f160df89b49b82376eb8f9291' in workflow,'Build 265 workflow missing exact Build 264 Production SHA')
q('Release 467 Build 264 Refinement Outcomes Renewal III' in workflow,'Build 265 workflow missing predecessor proof name')
q("run_current_contract('scripts/release467_build265_gate.py','Release 467 Build 265')" in sysgate,'System Gate must invoke Build 265')

q(p.get('build')==265 and p.get('title')=='CAIP Private-Media Prerequisite Inventory','Current authority must identify Build 265')
q(int(p.get('next_build') or 0)==266 and p.get('next_build_title')=='CAIP Multipart Recovery Integrity Review','Current authority must expose Build 266 successor')
q((p.get('production_checkpoint') or {}).get('main_sha')=='9cf042afb9b7938f160df89b49b82376eb8f9291','Current Production checkpoint must identify Build 264 main')
q(p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md','Current authority roadmap mismatch')
for k,vv in (a.get('safety') or {}).items(): q(vv is False,f'Build 265 safety drift: {k}')

print('RELEASE 467 BUILD 265 CAIP PRIVATE-MEDIA PREREQUISITE INVENTORY')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Build 241 foundation: 6 private-media tables; request-time DDL disabled')
print('Private binding: CAIP_PRIVATE_MEDIA_BUCKET; public path remains PRODUCT_MEDIA_BUCKET')
print('Multipart authority: 32 MiB parts / parallelism 2 / 256 MiB fallback cap; completed-part ETags retained')
print('Acceptance: repository prerequisites inventoried; Production binding/recovery evidence remains external')
print('Next: Build 266 — CAIP Multipart Recovery Integrity Review')
