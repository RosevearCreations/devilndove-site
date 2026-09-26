#!/usr/bin/env python3
"""Release 467 Build 270 — Strong-Fingerprint Backfill & Recovery Reconciliation fail-closed gate."""
from pathlib import Path
import json,sys

R=Path(__file__).resolve().parents[1]
F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok: F.append(msg)

a=j('release467-build270-strong-fingerprint-backfill-recovery-reconciliation.json')
p=j('current-development-authority.json')
prev=j('release467-build269-private-raw-media-intake-integrity.json')
root=t('_lib/caipMediaIntake.js')
api=t('functions/api/_lib/caipMediaIntake.js')
control=t('functions/api/admin/caip-media-intake.js')
browser=t('public/js/admin-caip-media-intake.js')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
doc=t('docs/operations/RELEASE_467_BUILD_270_STRONG_FINGERPRINT_BACKFILL_RECOVERY_RECONCILIATION.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
wf=t('.github/workflows/release467-build270-strong-fingerprint-backfill-recovery-reconciliation.yml')

q(a.get('build')==270 and a.get('title')=='Strong-Fingerprint Backfill & Recovery Reconciliation','Build 270 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 270 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='059aa3cf7854d075529ce976bb65ae2c1c6254fc','Build 269 Development SHA mismatch')
q(pred.get('production_main_sha')=='61cc1346f838a5dd742b0dbaeff345d95447ba6e','Build 269 Production SHA mismatch')
q(pred.get('tree_sha')=='65b54187a47834a7a36a3f57b16f985eb5d4cb05' and pred.get('same_tree') is True,'Build 269 exact-tree predecessor mismatch')
q(pred.get('proof_recovery')=='LIVE_BY_EXACT_SHA_COMPOSITION','Build 269 proof recovery mode mismatch')
q((pred.get('development_proofs') or {}).get('system_gate_run')==36180407045,'Build 269 System proof mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36180406990,'Build 269 dedicated Development proof mismatch')
q((pred.get('production_proofs') or {}).get('production_pages_deploy_run')==36180648384,'Build 269 Production Pages proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36180648437,'Build 269 dedicated Production proof mismatch')
q(prev.get('build')==269 and (prev.get('activation') or {}).get('classification')=='PRIVATE_RAW_MEDIA_INTAKE_INTEGRITY_SOURCE_READY_DEPLOYED_ACCEPTANCE_EVIDENCE_PENDING','Build 269 authority missing')

rec=a.get('reconciliation') or {}
q(rec.get('content_fingerprint_version')=='sample_sha256_v1','Build 270 fingerprint version mismatch')
q(int(rec.get('max_rows_per_request') or 0)==20,'Build 270 bounded ceiling drift')
q(int(rec.get('operator_default_rows') or 0)==8,'Build 270 operator default drift')
for k in ('exact_r2_head_size_before_metadata_repair','ranged_fingerprint_reads','existing_uploaded_unregistered_registration_retry','registration_requires_strong_fingerprint','integrity_failure_markers_excluded','recovery_parent_must_exist','recovery_parent_same_project','recovery_object_identity_distinct','uncertain_binary_preserved'):
    q(rec.get(k) is True,f'Build 270 reconciliation invariant missing: {k}')
q(rec.get('automatic_r2_delete') is False and rec.get('automatic_public_promotion') is False,'Build 270 automatic mutation boundary drift')
q(rec.get('classification')=='STRONG_FINGERPRINT_RECOVERY_RECONCILIATION_READY_OPERATOR_BOUNDED','Build 270 classification mismatch')

q(root==api,'CAIP media intake helper copies must remain byte-identical')
start=api.find('export async function reconcileCaipStrongFingerprintRecovery')
end=api.find('export async function createUploadSession',start)
q(start>=0 and end>start,'Build 270 reconciliation helper missing')
segment=api[start:end] if start>=0 and end>start else ''
for token in (
    'Math.min(20,',
    'backfillCaipContentFingerprints',
    "upload_status='uploaded' AND creative_asset_id IS NULL",
    "COALESCE(content_fingerprint,'')<>''",
    'bucket.head(file.object_key)',
    'retryUploadedFileRegistration',
    'recovery_of_file_id',
    'recovery_parent_missing',
    'recovery_parent_cross_project',
    'recovery_object_identity_not_distinct',
    'r2_deleted_count:0',
    'public_promotion_count:0',
    'uncertain_binaries_preserved:true'
):
    q(token in segment,f'Build 270 runtime contract missing: {token}')
q('.delete(' not in segment,'Build 270 reconciliation must not delete R2 objects')
q('requestPublicPromotion(' not in segment,'Build 270 reconciliation must not request public promotion')

for token in ('reconcileCaipStrongFingerprintRecovery',"action==='reconcile_existing_private_media'"):
    q(token in control,f'Build 270 control-plane action missing: {token}')
for token in ('caipReconcileExisting','reconcile_existing_private_media','No R2 object was deleted','no public promotion'):
    q(token in browser,f'Build 270 browser reconciliation contract missing: {token}')

for token in ('Build 270 — Strong-Fingerprint Backfill & Recovery Reconciliation','Build 271 — Standalone / Social CAIP Project Workflow'):
    q(token in road,f'Roadmap missing {token}')
for token in ('sample_sha256_v1','reconcile_existing_private_media','r2_deleted_count: 0','public_promotion_count: 0','Build 271'):
    q(token in doc,f'Build 270 document missing {token}')

q('development_sha: 059aa3cf7854d075529ce976bb65ae2c1c6254fc' in wf,'Build 270 workflow Development predecessor drift')
q('production_sha: 61cc1346f838a5dd742b0dbaeff345d95447ba6e' in wf,'Build 270 workflow Production predecessor drift')
q('Release 467 Build 269 Private Raw Media Intake Integrity' in wf,'Build 270 workflow predecessor proof name drift')
q("run_current_contract('scripts/release467_build270_gate.py','Release 467 Build 270')" in sysgate,'System Gate missing Build 270')

cur=int(p.get('build') or 0)
q(p.get('release')==467 and cur>=270,'Current authority must retain Build 270 or a verified successor')
proj=p.get('caip_strong_fingerprint_backfill_recovery_reconciliation') or {}
q(proj.get('classification')=='STRONG_FINGERPRINT_RECOVERY_RECONCILIATION_READY_OPERATOR_BOUNDED','Current authority missing Build 270 projection')
q(proj.get('max_rows_per_request')==20 and proj.get('automatic_r2_delete') is False and proj.get('automatic_public_promotion') is False,'Current authority Build 270 safety projection mismatch')
if cur==270:
    q(p.get('title')=='Strong-Fingerprint Backfill & Recovery Reconciliation','Current authority Build 270 title mismatch')
    q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 270 current authority state mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='61cc1346f838a5dd742b0dbaeff345d95447ba6e','Build 270 candidate must retain exact Build 269 Production baseline')
    q(int(p.get('next_build') or 0)==271 and p.get('next_build_title')=='Standalone / Social CAIP Project Workflow','Build 270 successor pointer mismatch')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 271+ requires verified Build 270 closure')
    q((a.get('final_closure') or {}).get('dev_sha')=='b51e15f9c150e1d740fe1383d8df98a962990b21','Build 270 final Development SHA mismatch')
    q((a.get('final_closure') or {}).get('tree_sha')=='9dc39ed9dde4946ad54e51b58c7b66ca38b75634','Build 270 final Development tree mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='9c3ed0664d71ab66a3087047b35989c5ed5b6904','Build 270 final Production SHA mismatch')
    q((a.get('production_checkpoint') or {}).get('tree_sha')=='9dc39ed9dde4946ad54e51b58c7b66ca38b75634','Build 270 final Production tree mismatch')
    if cur==271:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='9c3ed0664d71ab66a3087047b35989c5ed5b6904','Build 271 current Production baseline must be exact Build 270')
        q(int(p.get('next_build') or 0)>=272,'Build 271 must advance beyond Build 271 successor')
    elif cur==272:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='fce84316c0b5b22781b2ee30d35b205d96b39c09','Build 272 current Production baseline must be exact Build 271')
        q(int(p.get('next_build') or 0)>=273,'Build 272 must advance beyond Build 272 successor')
    elif cur==273:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f','Build 273 current Production baseline must be exact Build 272')
        q(int(p.get('next_build') or 0)>=274,'Build 273 must advance beyond Build 273 successor')
    elif cur==274:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 274 current Production baseline must be exact Build 273')
        q(int(p.get('next_build') or 0)>=275,'Build 274 must advance beyond Build 274 successor')
    else:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='af5e99b3baa1d28f3949e7956905a0325d328d06','Build 275+ current Production baseline must be exact Build 274')
        q(int(p.get('next_build') or 0)>=276,'Build 275+ must advance beyond Build 275 successor')

s=a.get('safety') or {}
q(s.get('operator_triggered_private_metadata_reconciliation') is True,'Build 270 must identify the explicit bounded operator reconciliation')
for k,v in s.items():
    if k!='operator_triggered_private_metadata_reconciliation':
        q(v is False,f'Build 270 safety drift: {k}')

if F:
    print('RELEASE 467 BUILD 270 STRONG-FINGERPRINT BACKFILL RECOVERY RECONCILIATION: FAIL')
    for x in F: print('-',x)
    sys.exit(1)
print('RELEASE 467 BUILD 270 STRONG-FINGERPRINT BACKFILL RECOVERY RECONCILIATION')
print('PASS')
print('Bounded strong-fingerprint backfill and exact-size private registration reconciliation are fail closed.')
print('Recovery lineage conflicts remain preserved for review; Build 270 performs no R2 deletion or public promotion.')
print('Next: Build 271 — Standalone / Social CAIP Project Workflow')
