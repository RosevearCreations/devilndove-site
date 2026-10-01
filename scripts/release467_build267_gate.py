#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build267-caip-duplicate-orphan-recovery-classification.json')
prev=j('release467-build266-caip-multipart-recovery-integrity-review.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
doc=t('docs/operations/RELEASE_467_BUILD_267_CAIP_DUPLICATE_ORPHAN_RECOVERY_CLASSIFICATION.md')
api=t('functions/api/_lib/caipMediaIntake.js');root=t('_lib/caipMediaIntake.js')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
wf=t('.github/workflows/release467-build267-caip-duplicate-orphan-recovery-classification.yml')
q(a.get('build')==267 and a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 267 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='c2f4a123b029853438260f06f0582a3902adf0c4','Build 266 dev SHA mismatch')
q(pred.get('development_tree_sha')=='6986989e2aa860a639ed8d6748a0c3143b32054d','Build 266 dev tree mismatch')
q(pred.get('production_main_sha')=='1d4a1c204d19c4ecca16dd8dd6952b5107327db8','Build 266 main SHA mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36156294779,'Build 266 dedicated dev proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36156595028,'Build 266 dedicated Production proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 266 successor-ingested closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='c2f4a123b029853438260f06f0582a3902adf0c4','Build 266 final closure mismatch')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='1d4a1c204d19c4ecca16dd8dd6952b5107327db8','Build 266 Production closure mismatch')
c=a.get('classification') or {}
q(c.get('classification')=='DUPLICATE_ORPHAN_RECOVERY_CLASSES_DEFINED_CLEANUP_NOT_AUTHORIZED','classification mismatch')
q(c.get('helper_copies_identical_required') is True and api==root,'CAIP helper copies drifted')
q(c.get('build267_executes_cleanup') is False and c.get('uncertain_r2_delete_authorized') is False,'cleanup must remain unauthorized')
keys={x.get('key') for x in c.get('categories') or []}
for key in ('REGISTERED_CANONICAL_IMMUTABLE','STRONG_DUPLICATE_CANDIDATE_REVIEW','VERIFIED_REDUNDANT_COPY_REVIEWABLE','LEGACY_METADATA_DUPLICATE_CANDIDATE','CHECKSUM_CONFLICT_PRESERVE','RESUMABLE_UNFINISHED_MULTIPART','INTEGRITY_FAILED_PRESERVE_NEW_IDENTITY_RECOVERY','RECOVERY_DESCENDANT_ACTIVE','D1_COMPLETED_UNREGISTERED_BINARY_REVIEW','OBJECT_ONLY_ORPHAN_CANDIDATE','D1_ONLY_MISSING_OBJECT_RECOVERY','ARCHIVED_OR_ABORTED_HISTORICAL','UNCLASSIFIED_REVIEW_REQUIRED'):
    q(key in keys,f'missing class {key}')
for x in c.get('categories') or []: q(x.get('physical_delete_authorized') is False,f"delete authorization drift: {x.get('key')}")
for token in ("COALESCE(NULLIF(f.content_fingerprint,''),'legacy:'||COALESCE(f.file_fingerprint,''))","verifiedSameChecksum","processing===0","promotions===0","delete_private_r2_copy","r2_retained","recovery_of_file_id"):
    q(token in api,f'missing evidence contract: {token}')
for token in ('Build 267 — CAIP Duplicate & Orphan Recovery Classification','Build 268 — CAIP Private-Media Recovery Hardening Closure'): q(token in road,f'roadmap missing {token}')
for token in ('D1_COMPLETED_UNREGISTERED_BINARY_REVIEW','OBJECT_ONLY_ORPHAN_CANDIDATE','CHECKSUM_CONFLICT_PRESERVE','Build 268'): q(token in doc,f'doc missing {token}')
q('development_sha: c2f4a123b029853438260f06f0582a3902adf0c4' in wf,'workflow dev predecessor drift')
q('production_sha: 1d4a1c204d19c4ecca16dd8dd6952b5107327db8' in wf,'workflow Production predecessor drift')
q("run_current_contract('scripts/release467_build267_gate.py','Release 467 Build 267')" in sysgate,'System Gate missing Build 267')
cur=int(p.get('build') or 0)
q(cur>=267,'Current authority must retain Build 267 or a verified successor')
if cur==267:
    q(p.get('title')=='CAIP Duplicate & Orphan Recovery Classification','current pointer identity')
    q(p.get('state')=='DEVELOPMENT_GREEN','current pointer must retain inherited GREEN')
    q(p.get('accepted_dev_sha')=='c2f4a123b029853438260f06f0582a3902adf0c4','accepted predecessor dev mismatch')
    q(int(p.get('next_build') or 0)==268 and p.get('next_build_title')=='CAIP Private-Media Recovery Hardening Closure','next build pointer')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='1d4a1c204d19c4ecca16dd8dd6952b5107327db8','Build 267 candidate must retain Build 266 Production baseline')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 268+ must retain Build 267 Production closure')
    q((a.get('final_closure') or {}).get('dev_sha')=='a3fe5cc3848b5f2f6bb3dfca26e0600bdd9d772c','Build 267 final Development closure mismatch')
    q((a.get('final_closure') or {}).get('tree_sha')=='d647cb64914132631047c5a9276b976920ee556f','Build 267 final tree mismatch')
    q((a.get('final_closure') or {}).get('dedicated_gate_run')==36173340842,'Build 267 final dedicated Development proof mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='d60e1ac4d29ebc745643dda4297c8946ddae37fb','Build 267 Production closure main mismatch')
    q((a.get('production_checkpoint') or {}).get('tree_sha')=='d647cb64914132631047c5a9276b976920ee556f','Build 267 Production closure tree mismatch')
    q((a.get('production_checkpoint') or {}).get('build_specific_proof_run')==36173617864,'Build 267 Production dedicated proof mismatch')
    expected_main={268:'d60e1ac4d29ebc745643dda4297c8946ddae37fb',269:'44da8087958eb0c64df3de892ca8628293a96231',270:'61cc1346f838a5dd742b0dbaeff345d95447ba6e',271:'9c3ed0664d71ab66a3087047b35989c5ed5b6904',272:'fce84316c0b5b22781b2ee30d35b205d96b39c09',273:'e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f',274:'3c593eee38c7a05d2a5ad4df4a6b274e2275f492',275:'af5e99b3baa1d28f3949e7956905a0325d328d06',276:'86112270a5b0eb4bdbae4ffd418e34ecfd7b7587',277:'1bfcb248a8baf8cea42467a75c0dac53884ec5c3',278:'552fe0fb1b192c7fd123c9a7369eea9f352f639e',279:'5d418eb1160caa7af855a247e1ff3510e4c1c9b8',280:'048c67562efc20892cf9652841edd6b0b1a845d6',281:'94e46cae035769ba61de379add1f7c1a6a1c21f0',282:'707ecef36d8e6fbdcee2d15809441fafd8573ac4',283:'034ab92e57b17765a7b946182256fb32ae25cf87',284:'5bc70281e8ea2cb9818b14f216bef30f2d7d1463',285:'0ad2adcec970d3dc96336bdee88192fea32531a9',286:'2056cc46ebb5589dddc0b5172d90ffbd0e3c4241',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',303:'fffbafc4e9f27e830494140b48d9a3d266abd81e',304:'5fe6e3b5c47f948d8e931fd7357801ca639cb7dd',305:'9666c57fd02b199359e2420db0f147c27e5c9386',306:'436eb9fac8ee3d9ee1a25b8fdad9a3820ceaa34e',307:'1eb9df6dd6db02ad61fd4a32852e7f37a46c1ecd',308:'f8b3f7281ccd6e4bfc739abe1ba2566db336281a',309:'498ddd776ea3c52b243a5ef8800fc33570d159a4',310:'a65463ee79a50ec16741958bc2913cf67b198966',311:'43120a39d39aa0b0a2b0299967ad2e7b97eab0ee',312:'e6c48ac204393ee53859dc0366e36a13f15a5460',313:'c5e7bb72ec990118057d6955223e60ddaf691eac',314:'14375bce8e1749b309e60ef3baf1804ee01bdc47',315:'8bea4144e1a50d43b85e94218ce7f878a6023904',316:'7c8605c627c25443df24d08b5ffecb3fa315c084',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',319:'e51706c73352af58cac0640a12e915c5b4b2796d',320:'c753fe35a36096fa539f304a6b2fbd5f1d159a43',321:'e84cda2db64f0af93aa1f88cc71fb7079fe5fd54',322:'e761df76426a52e7bc3553189988058037979ad2',323:'1d7ef26655905c057c6c064ef7e2d7bf4c94f6a0',324:'14418df3be9d34baa3dd3436777f7911f022f39b',325:'06e40c332b1bacf2260f954ff2ac79a25d9788cc',326:'782627bb0bc0850622abc42512e3886f5556efbd',327:'6729aaa40106553b37995892b43ff982d145c3db',328:'f5675f69194586933fe0fefa231bde9f249216ce',329:'13210bde05ea77607095f532681d78024758bd23',330:'05bf93a1deba88f4222397f7288cae2851fc7278',331:'88b5113016acef9a0e7cc7cb7ef087b46ae01924',332:'0fce96f146d63411feb401b546c12b945ab861ac',333:'69fd16b6322e7cbd52c5341ef2b7e871529a65ee',334:'7b934186dcef69d76c9ad3dd6a25c4aed8ba4de4'}.get(cur,'')
    q((p.get('production_checkpoint') or {}).get('main_sha')==expected_main,'Build 268+ current Production baseline must track the exact immediate verified predecessor')
    q(cur==289 or int(p.get('next_build') or 0)>=269,'Build 268+ must advance beyond Build 268 successor')
q((p.get('caip_duplicate_orphan_recovery_classification') or {}).get('classification')=='DUPLICATE_ORPHAN_RECOVERY_CLASSES_DEFINED_CLEANUP_NOT_AUTHORIZED','current classification projection missing')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 267 safety drift: {k}')
print('RELEASE 467 BUILD 267 CAIP DUPLICATE & ORPHAN RECOVERY CLASSIFICATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Duplicate, orphan and recovery states are classified fail-closed; Build 267 executes no cleanup.')
print('Next: Build 268 — CAIP Private-Media Recovery Hardening Closure')
