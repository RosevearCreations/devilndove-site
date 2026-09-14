#!/usr/bin/env python3
"""Release 467 Build 152 — Site-wide Image Quality Scoring & Media QA gate."""
from pathlib import Path
import json, sys

ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try: return json.loads(read(path) or '{}')
    except Exception as exc: FAIL.append(f'{path} invalid JSON: {exc}'); return {}
def req(ok,msg):
    if not ok: FAIL.append(msg)

DEV='86cc4c2500ccb7ed8027466be7226392098a989f'; MAIN='bb0046c701a8050f9b92948fc60ad622dd1f462e'; TREE='7031e0bf710a9f2b4c4202e6858fda8c01008e01'
PROOFS={'system_gate_run':34858535578,'current_application_quality_run':34858535413,'it_admin_runtime_proof_run':34858535651,'branch_hygiene_run':34858535663}
PAGES=34858858586; LIVE=34858997196
closure=load('release467-build151-gifting-custom-work-local-pickup-event-selling.json'); pointer=load('current-development-authority.json')
req(closure.get('release')==467 and closure.get('build')==151,'Build 151 closure identity drifted')
req(closure.get('accepted_dev_sha')==DEV and closure.get('accepted_dev_tree_sha')==TREE,'Build 151 accepted Development SHA/tree drifted')
req((closure.get('acceptance') or {})==PROOFS,'Build 151 Development proof bundle drifted')
final=closure.get('final_closure') or {}; prod=closure.get('production_checkpoint') or {}
req(final.get('state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and final.get('dev_sha')==DEV and final.get('tree_sha')==TREE,'Build 151 final Development closure drifted')
req((final.get('proofs') or {})==PROOFS and final.get('ingested_by_build')==152,'Build 151 closure must be ingested by Build 152')
req(prod.get('state')=='PRODUCTION_GREEN' and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE,'Build 151 Production closure drifted')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 151 Production proof IDs drifted')
req(pointer.get('build')==151 and pointer.get('accepted_dev_sha')==DEV and pointer.get('accepted_dev_tree_sha')==TREE,'current pointer must remain on verified Build 151')
req((pointer.get('acceptance') or {})==PROOFS,'current pointer Build 151 proofs drifted')
req((pointer.get('production_checkpoint') or {}).get('main_sha')==MAIN,'current pointer Build 151 Production main drifted')
req(pointer.get('next_build')==152 and pointer.get('next_build_title')=='Site-wide Image Quality Scoring & Media QA','Build 152 candidate authorization missing')
req(pointer.get('promotion_state')=='BUILD152_CANDIDATE_NOT_YET_VERIFIED','Build 152 must not self-claim promotion')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (DEV,MAIN,TREE,*map(str,PROOFS.values()),str(PAGES),str(LIVE),'Build 152'):
        req(token in body,f'{path} missing Build 151 closure / Build 152 candidate token: {token}')

scorer=read('public/js/image-quality-scorer-v152.js'); overlay=read('public/js/site-image-quality-overlay-v152.js'); runtime=read('public/js/media-content-runtime.js'); studio=read('admin/media-content-studio/index.html'); product=read('public/js/admin-product-image-quality-editor-bridge-v56.js')
req('Release 448 deterministic browser Canvas heuristic' in scorer,'shared scorer must retain Release 448 product-photo algorithm identity')
for token in ('lighting_score','clarity_score','background_score','framing_score','resolution_score','color_balance_score','artifact_score','consistency_score'): req(token in scorer and token in product,f'shared/product scoring parity token missing: {token}')
compact=scorer.replace(' ','')
for token in ('Math.abs(metrics.mean-.56)*30','(metrics.low_clip+metrics.high_clip)*80','(metrics.sharpness-.025)*170','Math.sqrt(metrics.border_variance)*55','Math.abs(metrics.occupancy-.62)*22','metrics.center_offset*7','minDim>=1200?10:minDim>=900?8:minDim>=700?6:minDim>=500?4:2','metrics.channel_spread*22','metrics.block_boundary_energy-.11','*18'): req(token in compact,f'Build 152 scorer formula drift: {token}')
req('total_score:round(Object.values(scores).reduce((a,b)=>a+b,0))' in compact,'100-point total calculation missing')
req('#mediaSlotBoard img,#mediaLibraryGrid img,#mediaSelectedPreview' in overlay,'Media Studio images must receive scoring')
req('img[data-media-slot]' in overlay,'public editable image slots must receive scoring')
req('IntersectionObserver' in overlay,'site-wide scoring must remain lazy/visible-first')
req('Placeholder / SVG' in overlay,'SVG placeholder handling missing')
req('Image score unavailable' in overlay,'scoring failure must surface explicit unavailable state')
req('same Release 448 product-photo rubric' in overlay,'score UI must explain rubric parity')
for forbidden in ("method:'POST'",'method:"POST"',"method:'PUT'","method:'PATCH'","method:'DELETE'",'apiFetch('): req(forbidden not in scorer and forbidden not in overlay,f'Build 152 scoring must remain read-only: {forbidden}')
req('loadImageQualityTools' in runtime and 'if(enabled){buildEditLinks();loadImageQualityTools();}' in runtime.replace('\n',''),'quality tools must load only with authenticated page edit mode')
req('image-quality-scorer-v152.js' in studio and 'site-image-quality-overlay-v152.js' in studio,'Media Studio must load shared scoring assets')
req('Build 152 • Site-wide image quality' in studio and 'Scores are read-only guidance' in studio,'Media Studio Build 152 advisory boundary missing')

if FAIL:
    print('RELEASE 467 BUILD 152 GATE: FAIL'); [print('-',x) for x in FAIL]; sys.exit(1)
print('RELEASE 467 BUILD 152 GATE: PASS')
print('Build 151 six-proof Production closure: INGESTED BY BUILD 152')
print('Rubric: Release 448 deterministic 100-point Canvas scoring')
print('Surfaces: Media Studio + authenticated public page-edit mode')
print('Behavior: lazy, advisory, read-only, no D1/R2/provider mutation')
