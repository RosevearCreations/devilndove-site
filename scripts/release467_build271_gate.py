#!/usr/bin/env python3
"""Release 467 Build 271 — Standalone / Social CAIP Project Workflow fail-closed gate."""
from pathlib import Path
import json,sys

R=Path(__file__).resolve().parents[1]
F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build271-standalone-social-caip-project-workflow.json')
p=j('current-development-authority.json')
prev=j('release467-build270-strong-fingerprint-backfill-recovery-reconciliation.json')
root=t('_lib/creativeAssetIntelligence.js')
api=t('functions/api/_lib/creativeAssetIntelligence.js')
control=t('functions/api/admin/creative-assets.js')
browser=t('public/js/admin-creative-assets.js')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
doc=t('docs/operations/RELEASE_467_BUILD_271_STANDALONE_SOCIAL_CAIP_PROJECT_WORKFLOW.md')
wf=t('.github/workflows/release467-build271-standalone-social-caip-project-workflow.yml')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==271 and a.get('title')=='Standalone / Social CAIP Project Workflow','Build 271 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 271 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='b51e15f9c150e1d740fe1383d8df98a962990b21','Build 270 Development SHA mismatch')
q(pred.get('production_main_sha')=='9c3ed0664d71ab66a3087047b35989c5ed5b6904','Build 270 Production SHA mismatch')
q(pred.get('tree_sha')=='9dc39ed9dde4946ad54e51b58c7b66ca38b75634' and pred.get('same_tree') is True,'Build 270 exact-tree mismatch')
q((pred.get('development_proofs') or {}).get('system_gate_run')==36206690243,'Build 270 System proof mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36206690389,'Build 270 dedicated Development proof mismatch')
q((pred.get('production_proofs') or {}).get('production_pages_deploy_run')==36206849648,'Build 270 Production Pages proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36206849597,'Build 270 dedicated Production proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 270 authority must be closed GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='b51e15f9c150e1d740fe1383d8df98a962990b21','Build 270 final closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='9c3ed0664d71ab66a3087047b35989c5ed5b6904','Build 270 Production closure missing')

workflow=a.get('workflow') or {}
for k in ('direct_caip_workspace_open','idempotent_open_refresh','product_optional','fake_product_forbidden','content_studio_package_optional','existing_content_project_link_preserved','derivative_plan_list_complete','derivative_plan_pending_first'):
    q(workflow.get(k) is True,f'Build 271 workflow invariant missing: {k}')
q(workflow.get('content_studio_package_created_by_build271') is False,'Build 271 must not create Content Studio packages')
q(workflow.get('classification')=='STANDALONE_SOCIAL_CAIP_IDENTITY_READY_REVIEW_FIRST','Build 271 classification mismatch')
q(workflow.get('identity_key')=='source_type=creative_work_project + source_id=creative_work_project_id','Build 271 identity key mismatch')

q(root==api,'Creative Asset Intelligence helper copies must remain byte-identical')
start=api.find('export async function ensureCreativeProjectFromCreativeWorkProject')
end=api.find('export async function syncCreativeProjectFromContentProject',start)
q(start>=0 and end>start,'Build 271 standalone helper missing')
segment=api[start:end] if start>=0 and end>start else ''
for token in (
    "source_type='creative_work_project'",
    'ON CONFLICT(source_type, source_id) DO UPDATE SET',
    'content_project_id',
    'product_optional',
    'fake_product_forbidden',
    'content_studio_package_optional',
    'product_created: false',
    'content_project_created: false',
    'private_media_unchanged: true'
):
    q(token in segment,f'Build 271 runtime identity contract missing: {token}')
q('INSERT INTO products' not in segment,'Build 271 helper must not create Product rows')
q('INSERT INTO content_projects' not in segment,'Build 271 helper must not create Content Studio rows')
q('.delete(' not in segment,'Build 271 helper must not delete media')

for token in ('ensureCreativeProjectFromCreativeWorkProject',"action === 'open_creative_work_project'",'creative_work_project_id'):
    q(token in control,f'Build 271 control-plane action missing: {token}')
for token in ('creativeWorkProjects','caipCreativeWorkProject','caipOpenCreativeWork','open_creative_work_project','No Product or Content Studio package was created.','caip-ops-scroll'):
    q(token in browser,f'Build 271 operator surface missing: {token}')
q('derivatives.slice(0, 6)' not in browser and 'derivatives.slice(0,6)' not in browser,'Build 271 derivative list must not clip to six')
q('orderedDerivatives.map' in browser,'Build 271 derivative list must render the complete ordered set')

for token in ('Build 271 — Standalone / Social CAIP Project Workflow','Build 272 — Upload Prerequisite & Operator Readiness'):
    q(token in road,f'Roadmap missing {token}')
for token in ("source_type = 'creative_work_project'",'A Product is optional','Build 273 remains the dedicated Content Studio bridge','STANDALONE_SOCIAL_CAIP_IDENTITY_READY_REVIEW_FIRST','Build 272'):
    q(token in doc,f'Build 271 document missing {token}')

q('development_sha: b51e15f9c150e1d740fe1383d8df98a962990b21' in wf,'Build 271 workflow Development predecessor drift')
q('production_sha: 9c3ed0664d71ab66a3087047b35989c5ed5b6904' in wf,'Build 271 workflow Production predecessor drift')
q('Release 467 Build 270 Strong-Fingerprint Backfill Recovery Reconciliation' in wf,'Build 271 workflow predecessor proof name drift')
q("run_current_contract('scripts/release467_build271_gate.py','Release 467 Build 271')" in sysgate,'System Gate missing Build 271')

cur=int(p.get('build') or 0)
q(p.get('release')==467 and cur>=271,'Current authority must retain Build 271 or a verified successor')
proj=p.get('caip_standalone_social_project_workflow') or {}
q(proj.get('classification')=='STANDALONE_SOCIAL_CAIP_IDENTITY_READY_REVIEW_FIRST','Current authority missing Build 271 projection')
q(proj.get('product_optional') is True and proj.get('fake_product_forbidden') is True and proj.get('content_studio_created_by_build271') is False,'Current authority Build 271 authority split mismatch')
if cur==271:
    q(p.get('title')=='Standalone / Social CAIP Project Workflow','Current authority Build 271 title mismatch')
    q(p.get('state')=='DEVELOPMENT_GREEN','Build 271 pointer must retain inherited Development GREEN state')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='9c3ed0664d71ab66a3087047b35989c5ed5b6904','Build 271 candidate must retain exact Build 270 Production baseline')
    q(int(p.get('next_build') or 0)==272 and p.get('next_build_title')=='Upload Prerequisite & Operator Readiness','Build 271 successor pointer mismatch')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 272+ requires verified Build 271 closure')
    q((a.get('final_closure') or {}).get('dev_sha')=='af45e733b673af8e8d7e9acb7e55e35f525bebec','Build 271 final Development SHA mismatch')
    q((a.get('final_closure') or {}).get('tree_sha')=='f0da384a9d0be6f54d5e0b441f7aa333c158e69f','Build 271 final Development tree mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='fce84316c0b5b22781b2ee30d35b205d96b39c09','Build 271 final Production SHA mismatch')
    q((a.get('production_checkpoint') or {}).get('tree_sha')=='f0da384a9d0be6f54d5e0b441f7aa333c158e69f','Build 271 final Production tree mismatch')
    if cur==272:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='fce84316c0b5b22781b2ee30d35b205d96b39c09','Build 272 current Production baseline must be exact Build 271')
        q(cur==289 or int(p.get('next_build') or 0)>=273,'Build 272 must advance beyond Build 272 successor')
    elif cur==273:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f','Build 273 current Production baseline must be exact Build 272')
        q(cur==289 or int(p.get('next_build') or 0)>=274,'Build 273 must advance beyond Build 273 successor')
    elif cur==274:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 274 current Production baseline must be exact Build 273')
        q(cur==289 or int(p.get('next_build') or 0)>=275,'Build 274 must advance beyond Build 274 successor')
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
        expected_main={278:'552fe0fb1b192c7fd123c9a7369eea9f352f639e',279:'5d418eb1160caa7af855a247e1ff3510e4c1c9b8',280:'048c67562efc20892cf9652841edd6b0b1a845d6',281:'94e46cae035769ba61de379add1f7c1a6a1c21f0',282:'707ecef36d8e6fbdcee2d15809441fafd8573ac4',283:'034ab92e57b17765a7b946182256fb32ae25cf87',284:'5bc70281e8ea2cb9818b14f216bef30f2d7d1463',285:'0ad2adcec970d3dc96336bdee88192fea32531a9',286:'2056cc46ebb5589dddc0b5172d90ffbd0e3c4241',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',303:'fffbafc4e9f27e830494140b48d9a3d266abd81e',304:'5fe6e3b5c47f948d8e931fd7357801ca639cb7dd',305:'9666c57fd02b199359e2420db0f147c27e5c9386',306:'436eb9fac8ee3d9ee1a25b8fdad9a3820ceaa34e',307:'1eb9df6dd6db02ad61fd4a32852e7f37a46c1ecd',308:'f8b3f7281ccd6e4bfc739abe1ba2566db336281a',309:'498ddd776ea3c52b243a5ef8800fc33570d159a4',310:'a65463ee79a50ec16741958bc2913cf67b198966',311:'43120a39d39aa0b0a2b0299967ad2e7b97eab0ee',312:'e6c48ac204393ee53859dc0366e36a13f15a5460',313:'c5e7bb72ec990118057d6955223e60ddaf691eac',314:'14375bce8e1749b309e60ef3baf1804ee01bdc47',315:'8bea4144e1a50d43b85e94218ce7f878a6023904',316:'7c8605c627c25443df24d08b5ffecb3fa315c084',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',318:'9d2ccc468ea810fdd6cf0e6f2527d50c6418876e',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',319:'e51706c73352af58cac0640a12e915c5b4b2796d',320:'c753fe35a36096fa539f304a6b2fbd5f1d159a43',321:'e84cda2db64f0af93aa1f88cc71fb7079fe5fd54',322:'e761df76426a52e7bc3553189988058037979ad2'}.get(cur,'')
        q((p.get('production_checkpoint') or {}).get('main_sha')==expected_main,'Build 278+ current Production baseline must track the exact immediate verified predecessor')
        q(cur==289 or int(p.get('next_build') or 0)>=279,'Build 278+ must advance beyond Build 278 successor')

s=a.get('safety') or {}
q(s.get('operator_triggered_caip_workspace_mapping') is True,'Build 271 must identify the explicit operator mapping')
for k,v in s.items():
    if k!='operator_triggered_caip_workspace_mapping':
        q(v is False,f'Build 271 safety drift: {k}')

if F:
    print('RELEASE 467 BUILD 271 STANDALONE SOCIAL CAIP PROJECT WORKFLOW: FAIL')
    for x in F: print('-',x)
    sys.exit(1)
print('RELEASE 467 BUILD 271 STANDALONE SOCIAL CAIP PROJECT WORKFLOW')
print('PASS')
print('One Creative Process identity can open one CAIP workspace without fabricating a Product or Content Studio package.')
print('Private media, evidence/story, derivative planning and publication authorities remain separated.')
print('Next: Build 272 — Upload Prerequisite & Operator Readiness')
