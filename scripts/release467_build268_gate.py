#!/usr/bin/env python3
"""Fail-closed contract for Release 467 Build 268 — CAIP Private-Media Recovery Hardening Closure."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];F=[]
def q(ok,msg):
    if not ok:F.append(msg)
def j(p): return json.loads((R/p).read_text(encoding='utf-8'))
def t(p): return (R/p).read_text(encoding='utf-8')
a=j('release467-build268-caip-private-media-recovery-hardening-closure.json')
prev=j('release467-build267-caip-duplicate-orphan-recovery-classification.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
doc=t('docs/operations/RELEASE_467_BUILD_268_CAIP_PRIVATE_MEDIA_RECOVERY_HARDENING_CLOSURE.md')
ingest=t('docs/creative-asset-intelligence-platform/04_Project_Ingestion_Pipeline.md')
raw=t('docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md')
ops=t('docs/creative-asset-intelligence-platform/09_Operations_Reliability_and_Observability.md')
accept=t('docs/creative-asset-intelligence-platform/12_Testing_and_Acceptance.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
wf=t('.github/workflows/release467-build268-caip-private-media-recovery-hardening-closure.yml')
q(a.get('build')==268 and a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 268 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='a3fe5cc3848b5f2f6bb3dfca26e0600bdd9d772c' and pred.get('development_tree_sha')=='d647cb64914132631047c5a9276b976920ee556f','Build 267 Development predecessor mismatch')
q(pred.get('production_main_sha')=='d60e1ac4d29ebc745643dda4297c8946ddae37fb' and pred.get('production_tree_sha')=='d647cb64914132631047c5a9276b976920ee556f','Build 267 Production predecessor mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36173340842,'Build 267 dedicated Development proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36173617864,'Build 267 dedicated Production proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 267 successor-ingested closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='a3fe5cc3848b5f2f6bb3dfca26e0600bdd9d772c','Build 267 final Development closure mismatch')
q((prev.get('final_closure') or {}).get('tree_sha')=='d647cb64914132631047c5a9276b976920ee556f','Build 267 final tree mismatch')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='d60e1ac4d29ebc745643dda4297c8946ddae37fb','Build 267 Production checkpoint mismatch')
c=a.get('closure') or {}; f=c.get('pre_binary_transfer_fail_closed') or {}; inv=c.get('recovery_invariants') or {}
q(c.get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 268 closure classification mismatch')
for k in ('required_build241_tables','required_build269_duplicate_safe_columns','required_private_r2_binding','content_sample_fingerprint_preflight_required','server_side_reclassification_required'):
    q(f.get(k) is True,f'pre-transfer prerequisite missing: {k}')
q(f.get('binary_transfer_before_classification') is False,'binary transfer must remain blocked before classification')
for k in ('completed_part_etags_retained','exact_part_count_and_byte_sum_required_before_r2_complete','exact_r2_head_size_required_before_registration','integrity_failed_binary_preserved','clean_recovery_uses_new_identity','recovery_of_file_id_lineage_preserved','completed_raw_original_immutable'):
    q(inv.get(k) is True,f'recovery invariant missing: {k}')
for k in ('uncertain_r2_delete_authorized','duplicate_cleanup_authorized','orphan_cleanup_authorized'):
    q(inv.get(k) is False,f'destructive authority drift: {k}')
q(len(c.get('unresolved_deployed_acceptance') or [])>=4,'deployed acceptance gaps must remain explicit')
for token in ('Build 268 — CAIP Private-Media Recovery Hardening Closure','Build 269 — Private Raw Media Intake Integrity'): q(token in road,f'roadmap missing {token}')
for token in ('Before D1 creates a new physical upload identity','same-project match is classified as skip, registration-only, resume, clean recovery, or new','recovery_of_file_id'): q(token in ingest,f'ingestion contract missing: {token}')
for token in ('before raw binary transfer','sample_sha256_v1','[CAIP_MULTIPART_INCOMPLETE]','[CAIP_R2_SIZE_MISMATCH]','Physical private-R2 deletion remains more conservative'): q(token.lower() in raw.lower(),f'private raw-media contract missing: {token}')
for token in ('Build 269 integrity and duplicate observability','[CAIP_MULTIPART_INCOMPLETE]','[CAIP_R2_SIZE_MISMATCH]'): q(token in ops,f'operations contract missing: {token}')
for token in ('Production acceptance requires the real binding and real interruption/recovery evidence','Rename a local copy without changing its bytes','physical duplicate-object deletion gated on verified whole-object checksum'): q(token in accept,f'acceptance contract missing: {token}')
q('development_sha: a3fe5cc3848b5f2f6bb3dfca26e0600bdd9d772c' in wf,'workflow Development predecessor drift')
q('production_sha: d60e1ac4d29ebc745643dda4297c8946ddae37fb' in wf,'workflow Production predecessor drift')
q("run_current_contract('scripts/release467_build268_gate.py','Release 467 Build 268')" in sysgate,'System Gate missing Build 268')
cur=int(p.get('build') or 0)
q(cur>=268,'Current authority must retain Build 268 or a verified successor')
if cur==268:
    q(p.get('title')=='CAIP Private-Media Recovery Hardening Closure','current pointer identity mismatch')
    q(p.get('state')=='DEVELOPMENT_GREEN','current pointer must retain inherited GREEN')
    q(p.get('accepted_dev_sha')=='a3fe5cc3848b5f2f6bb3dfca26e0600bdd9d772c' and p.get('accepted_dev_tree_sha')=='d647cb64914132631047c5a9276b976920ee556f','accepted Build 267 baseline mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='d60e1ac4d29ebc745643dda4297c8946ddae37fb','current Production checkpoint must be exact Build 267')
    q(int(p.get('next_build') or 0)==269 and p.get('next_build_title')=='Private Raw Media Intake Integrity','next build pointer mismatch')
elif cur==269:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='44da8087958eb0c64df3de892ca8628293a96231','Build 269 current Production baseline must be exact Build 268')
    q(cur==289 or int(p.get('next_build') or 0)>=270,'Build 269 must expose Build 270 or later')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 269 must retain Build 268 closure projection')
elif cur==270:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='61cc1346f838a5dd742b0dbaeff345d95447ba6e','Build 270 current Production baseline must be exact Build 269')
    q(cur==289 or int(p.get('next_build') or 0)>=271,'Build 270 must advance beyond the Build 270 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 270 must retain Build 268 closure projection')
elif cur==271:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='9c3ed0664d71ab66a3087047b35989c5ed5b6904','Build 271 current Production baseline must be exact Build 270')
    q(cur==289 or int(p.get('next_build') or 0)>=272,'Build 271 must advance beyond the Build 271 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 271 must retain Build 268 closure projection')
elif cur==272:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='fce84316c0b5b22781b2ee30d35b205d96b39c09','Build 272 current Production baseline must be exact Build 271')
    q(cur==289 or int(p.get('next_build') or 0)>=273,'Build 272 must advance beyond the Build 272 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 272 must retain Build 268 closure projection')
elif cur==273:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f','Build 273 current Production baseline must be exact Build 272')
    q(cur==289 or int(p.get('next_build') or 0)>=274,'Build 273 must advance beyond the Build 273 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 273 must retain Build 268 closure projection')
elif cur==274:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 274 current Production baseline must be exact Build 273')
    q(cur==289 or int(p.get('next_build') or 0)>=275,'Build 274 must advance beyond the Build 274 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 274 must retain Build 268 closure projection')
elif cur==275:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='af5e99b3baa1d28f3949e7956905a0325d328d06','Build 275 current Production baseline must be exact Build 274')
    q(cur==289 or int(p.get('next_build') or 0)>=276,'Build 275 must advance beyond Build 275 successor')
elif cur==276:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587','Build 276 current Production baseline must be exact Build 275')
    q(cur==289 or int(p.get('next_build') or 0)>=277,'Build 276 must advance beyond Build 276 successor')
elif cur==277:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='1bfcb248a8baf8cea42467a75c0dac53884ec5c3','Build 277 current Production baseline must be exact Build 276')
    q(cur==289 or int(p.get('next_build') or 0)>=278,'Build 277 must advance beyond Build 277 successor')
else:
    expected_main={278:'552fe0fb1b192c7fd123c9a7369eea9f352f639e',279:'5d418eb1160caa7af855a247e1ff3510e4c1c9b8',280:'048c67562efc20892cf9652841edd6b0b1a845d6',281:'94e46cae035769ba61de379add1f7c1a6a1c21f0',282:'707ecef36d8e6fbdcee2d15809441fafd8573ac4',283:'034ab92e57b17765a7b946182256fb32ae25cf87',284:'5bc70281e8ea2cb9818b14f216bef30f2d7d1463',285:'0ad2adcec970d3dc96336bdee88192fea32531a9',286:'2056cc46ebb5589dddc0b5172d90ffbd0e3c4241',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',303:'fffbafc4e9f27e830494140b48d9a3d266abd81e',304:'5fe6e3b5c47f948d8e931fd7357801ca639cb7dd',305:'9666c57fd02b199359e2420db0f147c27e5c9386',306:'436eb9fac8ee3d9ee1a25b8fdad9a3820ceaa34e',307:'1eb9df6dd6db02ad61fd4a32852e7f37a46c1ecd',308:'f8b3f7281ccd6e4bfc739abe1ba2566db336281a',309:'498ddd776ea3c52b243a5ef8800fc33570d159a4',310:'a65463ee79a50ec16741958bc2913cf67b198966',311:'43120a39d39aa0b0a2b0299967ad2e7b97eab0ee',312:'e6c48ac204393ee53859dc0366e36a13f15a5460',313:'c5e7bb72ec990118057d6955223e60ddaf691eac',314:'14375bce8e1749b309e60ef3baf1804ee01bdc47',315:'8bea4144e1a50d43b85e94218ce7f878a6023904',316:'7c8605c627c25443df24d08b5ffecb3fa315c084',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',319:'e51706c73352af58cac0640a12e915c5b4b2796d',320:'c753fe35a36096fa539f304a6b2fbd5f1d159a43',321:'e84cda2db64f0af93aa1f88cc71fb7079fe5fd54',322:'e761df76426a52e7bc3553189988058037979ad2',323:'1d7ef26655905c057c6c064ef7e2d7bf4c94f6a0',324:'14418df3be9d34baa3dd3436777f7911f022f39b',325:'06e40c332b1bacf2260f954ff2ac79a25d9788cc',326:'782627bb0bc0850622abc42512e3886f5556efbd',327:'6729aaa40106553b37995892b43ff982d145c3db',328:'f5675f69194586933fe0fefa231bde9f249216ce',329:'13210bde05ea77607095f532681d78024758bd23',330:'05bf93a1deba88f4222397f7288cae2851fc7278',331:'88b5113016acef9a0e7cc7cb7ef087b46ae01924',332:'0fce96f146d63411feb401b546c12b945ab861ac'}.get(cur,'')
    q((p.get('production_checkpoint') or {}).get('main_sha')==expected_main,'Build 278+ current Production baseline must track the exact immediate verified predecessor')
    q(cur==289 or int(p.get('next_build') or 0)>=279,'Build 278+ must advance beyond Build 278 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 275+ must retain Build 268 closure projection')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 268 safety drift: {k}')
if F:
    print('RELEASE 467 BUILD 268 CAIP PRIVATE-MEDIA RECOVERY HARDENING CLOSURE: FAIL')
    for x in F: print('-',x)
    raise SystemExit(1)
print('RELEASE 467 BUILD 268 CAIP PRIVATE-MEDIA RECOVERY HARDENING CLOSURE')
print('PASS')
print('Builds 265-267 recovery prerequisites close coherently for Build 269 pre-transfer fail-closed intake.')
print('Live private-bucket/interruption acceptance remains explicit and pending; no Production media mutation or cleanup is authorized.')
print('Next: Build 269 — Private Raw Media Intake Integrity')
