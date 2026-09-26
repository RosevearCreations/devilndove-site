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
    q((cur==268 and (p.get('production_checkpoint') or {}).get('main_sha')=='d60e1ac4d29ebc745643dda4297c8946ddae37fb') or (cur==269 and (p.get('production_checkpoint') or {}).get('main_sha')=='44da8087958eb0c64df3de892ca8628293a96231') or (cur==270 and (p.get('production_checkpoint') or {}).get('main_sha')=='61cc1346f838a5dd742b0dbaeff345d95447ba6e') or (cur==271 and (p.get('production_checkpoint') or {}).get('main_sha')=='9c3ed0664d71ab66a3087047b35989c5ed5b6904') or (cur>=272 and (p.get('production_checkpoint') or {}).get('main_sha')=='fce84316c0b5b22781b2ee30d35b205d96b39c09'),'Build 268+ current Production baseline must track the exact immediate verified predecessor')
    q(int(p.get('next_build') or 0)>=269,'Build 268+ must advance beyond Build 268 successor')
q((p.get('caip_duplicate_orphan_recovery_classification') or {}).get('classification')=='DUPLICATE_ORPHAN_RECOVERY_CLASSES_DEFINED_CLEANUP_NOT_AUTHORIZED','current classification projection missing')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 267 safety drift: {k}')
print('RELEASE 467 BUILD 267 CAIP DUPLICATE & ORPHAN RECOVERY CLASSIFICATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Duplicate, orphan and recovery states are classified fail-closed; Build 267 executes no cleanup.')
print('Next: Build 268 — CAIP Private-Media Recovery Hardening Closure')
