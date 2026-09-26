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
    q(int(p.get('next_build') or 0)>=270,'Build 269 must expose Build 270 or later')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 269 must retain Build 268 closure projection')
elif cur==270:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='61cc1346f838a5dd742b0dbaeff345d95447ba6e','Build 270 current Production baseline must be exact Build 269')
    q(int(p.get('next_build') or 0)>=271,'Build 270 must advance beyond the Build 270 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 270 must retain Build 268 closure projection')
elif cur==271:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='9c3ed0664d71ab66a3087047b35989c5ed5b6904','Build 271 current Production baseline must be exact Build 270')
    q(int(p.get('next_build') or 0)>=272,'Build 271 must advance beyond the Build 271 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 271 must retain Build 268 closure projection')
elif cur==272:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='fce84316c0b5b22781b2ee30d35b205d96b39c09','Build 272 current Production baseline must be exact Build 271')
    q(int(p.get('next_build') or 0)>=273,'Build 272 must advance beyond the Build 272 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 272 must retain Build 268 closure projection')
elif cur==273:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f','Build 273 current Production baseline must be exact Build 272')
    q(int(p.get('next_build') or 0)>=274,'Build 273 must advance beyond the Build 273 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 273 must retain Build 268 closure projection')
else:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 274+ current Production baseline must be exact Build 273')
    q(int(p.get('next_build') or 0)>=275,'Build 274+ must advance beyond the Build 274 successor')
    q((p.get('caip_private_media_recovery_hardening_closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 274+ must retain Build 268 closure projection')
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
