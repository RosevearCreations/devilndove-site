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

cur=int(p.get('build') or 0)
q(cur>=265,'Current authority must retain Build 265 or a verified successor')
if cur==265:
    q(p.get('title')=='CAIP Private-Media Prerequisite Inventory','Current authority must identify Build 265 while current')
    q(int(p.get('next_build') or 0)==266 and p.get('next_build_title')=='CAIP Multipart Recovery Integrity Review','Current authority must expose Build 266 successor while Build 265 is current')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='9cf042afb9b7938f160df89b49b82376eb8f9291','Build 265 candidate must retain Build 264 Production baseline')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 266+ must retain Build 265 Production closure')
    q((a.get('final_closure') or {}).get('dev_sha')=='1ac2f5f55228b3c8fbd86ea1e3d07cfb35edaa33','Build 265 final Development closure mismatch')
    q((a.get('final_closure') or {}).get('tree_sha')=='d4f1da2902442d02e23becd06b5f05af30a86ac4','Build 265 final Development tree mismatch')
    q((a.get('final_closure') or {}).get('dedicated_gate_run')==36151831255,'Build 265 final Development dedicated proof mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='28181d75fe8425244848ae5a06c86f54a446eb1b','Build 265 Production closure main mismatch')
    q((a.get('production_checkpoint') or {}).get('tree_sha')=='d4f1da2902442d02e23becd06b5f05af30a86ac4','Build 265 Production closure tree mismatch')
    q((a.get('production_checkpoint') or {}).get('build_specific_proof_run')==36152348667,'Build 265 Production dedicated proof mismatch')
    q(cur==289 or int(p.get('next_build') or 0)>=267,'Build 266+ must advance beyond the Build 266 successor')
    expected_main={266:'28181d75fe8425244848ae5a06c86f54a446eb1b',267:'1d4a1c204d19c4ecca16dd8dd6952b5107327db8',268:'d60e1ac4d29ebc745643dda4297c8946ddae37fb',269:'44da8087958eb0c64df3de892ca8628293a96231',270:'61cc1346f838a5dd742b0dbaeff345d95447ba6e',271:'9c3ed0664d71ab66a3087047b35989c5ed5b6904',272:'fce84316c0b5b22781b2ee30d35b205d96b39c09',273:'e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f',274:'3c593eee38c7a05d2a5ad4df4a6b274e2275f492',275:'af5e99b3baa1d28f3949e7956905a0325d328d06',276:'86112270a5b0eb4bdbae4ffd418e34ecfd7b7587',277:'1bfcb248a8baf8cea42467a75c0dac53884ec5c3',278:'552fe0fb1b192c7fd123c9a7369eea9f352f639e',279:'5d418eb1160caa7af855a247e1ff3510e4c1c9b8',280:'048c67562efc20892cf9652841edd6b0b1a845d6',281:'94e46cae035769ba61de379add1f7c1a6a1c21f0',282:'707ecef36d8e6fbdcee2d15809441fafd8573ac4',283:'034ab92e57b17765a7b946182256fb32ae25cf87',284:'5bc70281e8ea2cb9818b14f216bef30f2d7d1463',285:'0ad2adcec970d3dc96336bdee88192fea32531a9',286:'2056cc46ebb5589dddc0b5172d90ffbd0e3c4241',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',303:'fffbafc4e9f27e830494140b48d9a3d266abd81e',304:'5fe6e3b5c47f948d8e931fd7357801ca639cb7dd',305:'9666c57fd02b199359e2420db0f147c27e5c9386',306:'436eb9fac8ee3d9ee1a25b8fdad9a3820ceaa34e',307:'1eb9df6dd6db02ad61fd4a32852e7f37a46c1ecd',308:'f8b3f7281ccd6e4bfc739abe1ba2566db336281a',309:'498ddd776ea3c52b243a5ef8800fc33570d159a4',310:'a65463ee79a50ec16741958bc2913cf67b198966',311:'43120a39d39aa0b0a2b0299967ad2e7b97eab0ee',312:'e6c48ac204393ee53859dc0366e36a13f15a5460',313:'c5e7bb72ec990118057d6955223e60ddaf691eac',314:'14375bce8e1749b309e60ef3baf1804ee01bdc47',315:'8bea4144e1a50d43b85e94218ce7f878a6023904',316:'7c8605c627c25443df24d08b5ffecb3fa315c084',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',319:'e51706c73352af58cac0640a12e915c5b4b2796d'}.get(cur,'')
    q((p.get('production_checkpoint') or {}).get('main_sha')==expected_main,'Build 266+ current Production baseline must track the exact immediate verified predecessor closure')
q((cur<=274 and p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md') or (275<=cur<=283 and p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md') or (284<=cur<=299 and p.get('roadmap')=='docs/operations/RELEASE_467_REAL_INVENTORY_LINKAGE_ACCEPTANCE_AUTONOMOUS_BUILDS_285_289.md') or (300<=cur<=305 and p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_CONTENT_ADOPTION_BUILDS_301_306.md') or (306<=cur<=311 and p.get('roadmap')=='docs/operations/RELEASE_467_CONTENT_ADOPTION_COVERAGE_DISCOVERY_BUILDS_307_312.md') or (312<=cur<=317 and p.get('roadmap')=='docs/operations/RELEASE_467_REVIEWED_STORY_DISCOVERY_ADOPTION_BUILDS_313_318.md') or (cur>=318 and p.get('roadmap')=='docs/operations/RELEASE_467_EVIDENCE_COMPLETION_DISCOVERY_ADOPTION_BUILDS_319_324.md'),'Current authority roadmap mismatch')
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
