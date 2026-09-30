#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build276-caip-acceptance-evidence-freshness-baseline.json')
prev=j('release467-build275-caip-production-acceptance-outcomes-renewal.json')
p=j('current-development-authority.json')
doc=t('docs/operations/RELEASE_467_BUILD_276_CAIP_ACCEPTANCE_EVIDENCE_FRESHNESS_BASELINE.md')
road=t('docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md')
wf=t('.github/workflows/release467-build276-caip-acceptance-evidence-freshness-baseline.yml')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==276 and a.get('title')=='CAIP Acceptance Evidence Freshness Baseline','Build 276 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 276 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='2453c99e4c459d7d31b16bd2004fa4afca081054' and pred.get('development_tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Build 275 Development predecessor mismatch')
q(pred.get('production_main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587' and pred.get('production_tree_sha')=='521888446fa549701da7109d266e0b73f7b40816' and pred.get('same_tree') is True,'Build 275 Production predecessor mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36213517078,'Build 275 Development dedicated proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36213629171,'Build 275 Production dedicated proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 275 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='2453c99e4c459d7d31b16bd2004fa4afca081054' and (prev.get('final_closure') or {}).get('tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Build 275 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Build 275 Production checkpoint missing')
b=a.get('baseline') or {};dims=b.get('evidence_dimensions') or []
q(b.get('lane')=='caip_private_media' and b.get('current_lane_state')=='EVIDENCE_DEPENDENT','Build 276 CAIP lane state mismatch')
q(b.get('freshness_rule')=='FRESH_CURRENT_RELEASE_AUTHENTICATED_EVIDENCE_REQUIRED','Build 276 freshness rule mismatch')
q(len(dims)==3 and b.get('current_release_required_dimensions')==3 and b.get('current_release_fresh_dimensions_satisfied')==0,'Build 276 dimension count mismatch')
by={x.get('key'):x for x in dims}
q((by.get('authenticated_private_review_range_streaming') or {}).get('status')=='REFRESH_REQUIRED','Fresh range evidence must remain required')
q((by.get('authenticated_private_review_range_streaming') or {}).get('timestamp_state')=='NOT_RECORDED_IN_CARRY_FORWARD_AUTHORITY','Historical timestamp gap must remain explicit')
q((by.get('deployed_private_bucket_binding_non_public_exposure') or {}).get('status')=='DEPLOYED_OPERATOR_EVIDENCE_REQUIRED','Private bucket deployed evidence must remain required')
q((by.get('multipart_interruption_reconnect_reselection_resume') or {}).get('status')=='LIVE_DRILL_EVIDENCE_REQUIRED','Interruption/resume live drill must remain required')
q(b.get('current_release_acceptance_complete') is False and b.get('synthetic_acceptance') is False,'Synthetic/current acceptance must remain false')
q((a.get('decision') or {}).get('next_build')==277 and (a.get('decision') or {}).get('future_queue_exhausted') is False,'Build 277 successor missing')
for token in ('Build 276 — CAIP Acceptance Evidence Freshness Baseline','Build 277 — Private Bucket Binding & Non-Public Exposure Evidence'): q(token in road,f'Roadmap missing {token}')
for token in ('0/3','REFRESH_REQUIRED','DEPLOYED_OPERATOR_EVIDENCE_REQUIRED','LIVE_DRILL_EVIDENCE_REQUIRED','bucket presence alone is not acceptance','Build 277'): q(token in doc,f'Build 276 document missing {token}')
q('development_sha: 2453c99e4c459d7d31b16bd2004fa4afca081054' in wf and 'production_sha: 86112270a5b0eb4bdbae4ffd418e34ecfd7b7587' in wf,'Build 276 workflow predecessor drift')
q("run_current_contract('scripts/release467_build276_gate.py','Release 467 Build 276')" in sysgate,'System Gate missing Build 276')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=276,'Current authority must retain Build 276 or successor')
if cur==276:
    q(p.get('title')=='CAIP Acceptance Evidence Freshness Baseline' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 276 pointer mismatch')
    q(p.get('accepted_dev_sha')=='2453c99e4c459d7d31b16bd2004fa4afca081054' and p.get('accepted_dev_tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Current Build 276 accepted predecessor mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587','Current Build 276 Production predecessor mismatch')
    q(int(p.get('next_build') or 0)==277 and p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md','Current Build 276 roadmap pointer mismatch')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 276 successor-ingested authority must be Production GREEN')
    q((a.get('final_closure') or {}).get('dev_sha')=='073ee3cacb7e7b7cac70e0e23db9ebebf386099f' and (a.get('final_closure') or {}).get('tree_sha')=='baed3242d5757a83832ab8526f940c971983bd73','Build 276 final Development closure mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='1bfcb248a8baf8cea42467a75c0dac53884ec5c3' and (a.get('production_checkpoint') or {}).get('tree_sha')=='baed3242d5757a83832ab8526f940c971983bd73','Build 276 final Production closure mismatch')
    if cur==277:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='1bfcb248a8baf8cea42467a75c0dac53884ec5c3','Build 277 current Production baseline must be exact Build 276')
        q(cur==289 or int(p.get('next_build') or 0)>=278,'Build 277 must advance beyond Build 277 successor')
    else:
        expected_main={278:'552fe0fb1b192c7fd123c9a7369eea9f352f639e',279:'5d418eb1160caa7af855a247e1ff3510e4c1c9b8',280:'048c67562efc20892cf9652841edd6b0b1a845d6',281:'94e46cae035769ba61de379add1f7c1a6a1c21f0',282:'707ecef36d8e6fbdcee2d15809441fafd8573ac4',283:'034ab92e57b17765a7b946182256fb32ae25cf87',284:'5bc70281e8ea2cb9818b14f216bef30f2d7d1463',285:'0ad2adcec970d3dc96336bdee88192fea32531a9',286:'2056cc46ebb5589dddc0b5172d90ffbd0e3c4241',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',303:'fffbafc4e9f27e830494140b48d9a3d266abd81e',304:'5fe6e3b5c47f948d8e931fd7357801ca639cb7dd',305:'9666c57fd02b199359e2420db0f147c27e5c9386',306:'436eb9fac8ee3d9ee1a25b8fdad9a3820ceaa34e',307:'1eb9df6dd6db02ad61fd4a32852e7f37a46c1ecd',308:'f8b3f7281ccd6e4bfc739abe1ba2566db336281a',309:'498ddd776ea3c52b243a5ef8800fc33570d159a4',310:'a65463ee79a50ec16741958bc2913cf67b198966',311:'43120a39d39aa0b0a2b0299967ad2e7b97eab0ee',312:'e6c48ac204393ee53859dc0366e36a13f15a5460',313:'c5e7bb72ec990118057d6955223e60ddaf691eac',314:'14375bce8e1749b309e60ef3baf1804ee01bdc47',315:'8bea4144e1a50d43b85e94218ce7f878a6023904',316:'7c8605c627c25443df24d08b5ffecb3fa315c084',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',319:'e51706c73352af58cac0640a12e915c5b4b2796d',320:'c753fe35a36096fa539f304a6b2fbd5f1d159a43',321:'e84cda2db64f0af93aa1f88cc71fb7079fe5fd54',322:'e761df76426a52e7bc3553189988058037979ad2'}.get(cur,'')
        q((p.get('production_checkpoint') or {}).get('main_sha')==expected_main,'Build 278+ current Production baseline must track the exact immediate verified predecessor')
        q(cur==289 or int(p.get('next_build') or 0)>=279,'Build 278+ must advance beyond Build 278 successor')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 276 safety drift: {k}')
print('RELEASE 467 BUILD 276 CAIP ACCEPTANCE EVIDENCE FRESHNESS BASELINE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Current Release 467 fresh CAIP acceptance dimensions: 0/3')
print('CAIP private-media: EVIDENCE_DEPENDENT / historical and source proof remain non-current')
print('Next: Build 277 — Private Bucket Binding & Non-Public Exposure Evidence')
