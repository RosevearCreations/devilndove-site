#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build275-caip-production-acceptance-outcomes-renewal.json');prev=j('release467-build274-creative-process-planned-vs-actual-inventory-lifecycle.json');p=j('current-development-authority.json')
oldroad=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md');road=t('docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md')
doc=t('docs/operations/RELEASE_467_BUILD_275_CAIP_PRODUCTION_ACCEPTANCE_OUTCOMES_RENEWAL.md');external=t('functions/api/admin/current-external-acceptance-control-center.js')
live=t('LIVE_TESTING_GUIDE.md');historical=t('docs/operations/RELEASE_466_FOUR_BUILD_ROADMAP.md')
wf=t('.github/workflows/release467-build275-caip-production-acceptance-outcomes-renewal.yml');sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==275 and a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 275 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='434a267a5598439103f6942d1b7f58a7ce04dba6' and pred.get('development_tree_sha')=='8d69b22f4634b70f3b10f247e42e0ca2165a4ccf','Build 274 Development predecessor mismatch')
q(pred.get('production_main_sha')=='af5e99b3baa1d28f3949e7956905a0325d328d06' and pred.get('production_tree_sha')=='8d69b22f4634b70f3b10f247e42e0ca2165a4ccf' and pred.get('same_tree') is True,'Build 274 Production predecessor mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36211182028,'Build 274 Development proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36211313280,'Build 274 Production proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 274 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='434a267a5598439103f6942d1b7f58a7ce04dba6' and (prev.get('final_closure') or {}).get('tree_sha')=='8d69b22f4634b70f3b10f247e42e0ca2165a4ccf','Build 274 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='af5e99b3baa1d28f3949e7956905a0325d328d06' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='8d69b22f4634b70f3b10f247e42e0ca2165a4ccf','Build 274 Production checkpoint missing')
r=a.get('review') or {};acc=r.get('production_acceptance') or {}
q(r.get('source_builds')==list(range(265,275)) and r.get('all_source_builds_production_green') is True and r.get('exact_tree_closure_preserved') is True,'Build 275 source closure review mismatch')
q(acc.get('current_lane_state')=='EVIDENCE_DEPENDENT','CAIP lane must remain EVIDENCE_DEPENDENT')
q((acc.get('historical_development_range_evidence') or {}).get('qualifying_review_proxy_audits')==3 and (acc.get('historical_development_range_evidence') or {}).get('accepted_for_current_release') is False,'Historical range provenance mismatch')
q(acc.get('authenticated_private_review_range_streaming')=='REFRESH_REQUIRED','Fresh range evidence must remain required')
q(acc.get('production_private_bucket_binding_and_non_public_exposure')=='DEPLOYED_OPERATOR_EVIDENCE_REQUIRED','Private bucket deployed proof missing')
q(acc.get('live_interruption_reconnect_resume')=='EVIDENCE_REQUIRED','Interruption/resume proof requirement missing')
q(acc.get('synthetic_acceptance') is False and acc.get('production_acceptance_claimed') is False,'Synthetic CAIP acceptance forbidden')
d=a.get('decision') or {}
q(d.get('autonomous_queue_exhausted') is False and d.get('action')=='CREATE_EVIDENCE_DRIVEN_SUCCESSOR_ROADMAP','Build 275 renewal decision mismatch')
q(d.get('next_build')==276 and d.get('next_build_title')=='CAIP Acceptance Evidence Freshness Baseline','Build 276 successor missing')
for n in range(276,285): q(f'Build {n} —' in road,f'Successor roadmap missing Build {n}')
for token in ('EVIDENCE_DEPENDENT','3 qualifying','fresh authenticated private review/range-streaming evidence','CAIP_PRIVATE_MEDIA_BUCKET','interruption/reconnect/reselection/resume','Build 276'): q(token in doc,f'Build 275 document missing {token}')
q("acceptance_state:accepted?'ACCEPTED':'EVIDENCE_DEPENDENT'" in external and 'Capture fresh authenticated private review/range-streaming evidence.' in external,'Current CAIP acceptance contract missing')
q('Acceptance requires real authenticated Development evidence' in live and 'HTTP `206`' in live,'Live CAIP range acceptance contract missing')
q('3 qualifying' in historical and 'review_proxy_served' in historical,'Historical CAIP range provenance missing')
q('development_sha: 434a267a5598439103f6942d1b7f58a7ce04dba6' in wf and 'production_sha: af5e99b3baa1d28f3949e7956905a0325d328d06' in wf,'Workflow predecessor drift')
q("run_current_contract('scripts/release467_build275_gate.py','Release 467 Build 275')" in sysgate,'System Gate missing Build 275')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=275,'Current authority must retain Build 275 or successor')
if cur==275:
    q(p.get('title')=='CAIP Production Acceptance & Outcomes Renewal' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 275 pointer mismatch')
    q(p.get('accepted_dev_sha')=='434a267a5598439103f6942d1b7f58a7ce04dba6' and p.get('accepted_dev_tree_sha')=='8d69b22f4634b70f3b10f247e42e0ca2165a4ccf','Current Build 275 accepted predecessor mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='af5e99b3baa1d28f3949e7956905a0325d328d06','Current Build 275 Production predecessor mismatch')
    q(p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md' and int(p.get('next_build') or 0)==276,'Current Build 275 roadmap pointer mismatch')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 275 successor-ingested authority must be Production GREEN')
    q((a.get('final_closure') or {}).get('dev_sha')=='2453c99e4c459d7d31b16bd2004fa4afca081054' and (a.get('final_closure') or {}).get('tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Build 275 final Development closure mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587' and (a.get('production_checkpoint') or {}).get('tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Build 275 final Production closure mismatch')
    if cur==276:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587','Build 276 current Production baseline must be exact Build 275')
        q(cur==289 or int(p.get('next_build') or 0)>=277,'Build 276 must advance beyond Build 276 successor')
    elif cur==277:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='1bfcb248a8baf8cea42467a75c0dac53884ec5c3','Build 277 current Production baseline must be exact Build 276')
        q(cur==289 or int(p.get('next_build') or 0)>=278,'Build 277 must advance beyond Build 277 successor')
    else:
        expected_main={278:'552fe0fb1b192c7fd123c9a7369eea9f352f639e',279:'5d418eb1160caa7af855a247e1ff3510e4c1c9b8',280:'048c67562efc20892cf9652841edd6b0b1a845d6',281:'94e46cae035769ba61de379add1f7c1a6a1c21f0',282:'707ecef36d8e6fbdcee2d15809441fafd8573ac4',283:'034ab92e57b17765a7b946182256fb32ae25cf87',284:'5bc70281e8ea2cb9818b14f216bef30f2d7d1463',285:'0ad2adcec970d3dc96336bdee88192fea32531a9',286:'2056cc46ebb5589dddc0b5172d90ffbd0e3c4241',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',303:'fffbafc4e9f27e830494140b48d9a3d266abd81e',304:'5fe6e3b5c47f948d8e931fd7357801ca639cb7dd',305:'9666c57fd02b199359e2420db0f147c27e5c9386',306:'436eb9fac8ee3d9ee1a25b8fdad9a3820ceaa34e',307:'1eb9df6dd6db02ad61fd4a32852e7f37a46c1ecd',308:'f8b3f7281ccd6e4bfc739abe1ba2566db336281a',309:'498ddd776ea3c52b243a5ef8800fc33570d159a4',310:'a65463ee79a50ec16741958bc2913cf67b198966',311:'43120a39d39aa0b0a2b0299967ad2e7b97eab0ee',312:'e6c48ac204393ee53859dc0366e36a13f15a5460',313:'c5e7bb72ec990118057d6955223e60ddaf691eac',314:'14375bce8e1749b309e60ef3baf1804ee01bdc47',315:'8bea4144e1a50d43b85e94218ce7f878a6023904',316:'7c8605c627c25443df24d08b5ffecb3fa315c084',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e'}.get(cur,'')
        q((p.get('production_checkpoint') or {}).get('main_sha')==expected_main,'Build 278+ current Production baseline must track the exact immediate verified predecessor')
        q(cur==289 or int(p.get('next_build') or 0)>=279,'Build 278+ must advance beyond Build 278 successor')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 275 safety drift: {k}')
print('RELEASE 467 BUILD 275 CAIP PRODUCTION ACCEPTANCE OUTCOMES RENEWAL')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Builds 265-274: Production GREEN / exact-tree continuity retained')
print('CAIP private-media: EVIDENCE_DEPENDENT / fresh runtime evidence remains required')
print('Next: Build 276 — CAIP Acceptance Evidence Freshness Baseline')
