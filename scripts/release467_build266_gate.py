#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build266-caip-multipart-recovery-integrity-review.json')
prev=j('release467-build265-caip-private-media-prerequisite-inventory.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
doc=t('docs/operations/RELEASE_467_BUILD_266_CAIP_MULTIPART_RECOVERY_INTEGRITY_REVIEW.md')
api=t('functions/api/_lib/caipMediaIntake.js')
root=t('_lib/caipMediaIntake.js')
part=t('functions/api/admin/caip-media-upload-part.js')
browser=t('public/js/admin-caip-storage-audit.js')
raw=t('docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md')
accept=t('docs/creative-asset-intelligence-platform/12_Testing_and_Acceptance.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
workflow=t('.github/workflows/release467-build266-caip-multipart-recovery-integrity-review.yml')

q(a.get('build')==266 and a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 266 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='1ac2f5f55228b3c8fbd86ea1e3d07cfb35edaa33','Build 265 Development predecessor SHA mismatch')
q(pred.get('development_tree_sha')=='d4f1da2902442d02e23becd06b5f05af30a86ac4','Build 265 Development predecessor tree mismatch')
q(pred.get('production_main_sha')=='28181d75fe8425244848ae5a06c86f54a446eb1b','Build 265 Production predecessor SHA mismatch')
q(pred.get('production_tree_sha')=='d4f1da2902442d02e23becd06b5f05af30a86ac4' and pred.get('same_tree') is True,'Build 265 exact-tree continuity mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36151831255,'Build 265 Development dedicated proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36152348667,'Build 265 Production dedicated proof mismatch')

q(prev.get('state')=='PRODUCTION_GREEN','Build 265 successor-ingested Production closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='1ac2f5f55228b3c8fbd86ea1e3d07cfb35edaa33','Build 265 final Development closure mismatch')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='28181d75fe8425244848ae5a06c86f54a446eb1b','Build 265 final Production checkpoint mismatch')

review=a.get('review') or {}
q(review.get('classification')=='STATIC_RECOVERY_INTEGRITY_COHERENT_PRODUCTION_INTERRUPTION_EVIDENCE_PENDING','Build 266 classification mismatch')
q(review.get('runtime_helper_copies_identical') is True and api==root,'CAIP intake helper copies must remain identical')
q(review.get('defect_repair_required_by_build266') is False,'Build 266 must not fabricate a defect repair')
q(review.get('preferred_future_transport_live') is False,'Future direct multipart transport must not be claimed live')
q(len(review.get('evidence_backed_gaps') or [])==4,'Build 266 must retain four bounded deployed-evidence gaps')

for token in (
    "if(row.part_status==='uploaded'&&row.etag)return json({ok:true,already_uploaded:true",
    "if(contentLength!==expected)throw new Error",
    "resumeMultipartUpload(row.object_key,row.r2_upload_id)",
    "recordUploadedPart(db,fileId,partNumber,uploadedPart",
    "limits each part to 256 MiB"
):
    q(token in part,f'Part-upload recovery contract missing: {token}')

for token in (
    "const uploaded=parts.filter((part)=>part.part_status==='uploaded'&&text(part.etag));",
    "parts.length===expectedParts",
    "uploaded.length===expectedParts",
    "distinct.size===expectedParts",
    "first===1",
    "last===expectedParts",
    "uploadedBytes===expectedBytes",
    "[CAIP_MULTIPART_INCOMPLETE]",
    "upload.complete(",
    "const head=await bucket.head(file.object_key);",
    "[CAIP_R2_SIZE_MISMATCH]",
    "binary is retained for forensic review",
    "Uploaded raw originals are immutable and cannot be deleted from this control",
    "Previous R2 object retained unchanged"
):
    q(token in api,f'CAIP multipart integrity contract missing: {token}')

for token in (
    "parts.filter((part) => part.part_status !== 'uploaded')",
    "file.slice(num(part.byte_start), num(part.byte_end))",
    "Math.min(2, queue.length || 1)"
):
    q(token in browser,f'Browser resume contract missing: {token}')

for token in (
    'sum of uploaded part sizes equals `file_size_bytes`',
    '[CAIP_MULTIPART_INCOMPLETE]',
    '[CAIP_R2_SIZE_MISMATCH]',
    'immutable'
):
    q(token in raw,f'Raw-media authority missing: {token}')
for token in ('Interrupt a multipart upload','resume without intentionally resending completed parts','exact HEAD size'):
    q(token in accept,f'Acceptance contract missing: {token}')
for token in ('Build 266 — CAIP Multipart Recovery Integrity Review','Build 267 — CAIP Duplicate & Orphan Recovery Classification'):
    q(token in road,f'CAIP recovery roadmap missing {token}')
for token in ('completed-part/ETag','already_uploaded','CAIP_MULTIPART_INCOMPLETE','CAIP_R2_SIZE_MISMATCH','Build 267'):
    q(token in doc,f'Build 266 document missing {token}')

q('development_sha: 1ac2f5f55228b3c8fbd86ea1e3d07cfb35edaa33' in workflow,'Build 266 workflow missing exact Build 265 Development SHA')
q('production_sha: 28181d75fe8425244848ae5a06c86f54a446eb1b' in workflow,'Build 266 workflow missing exact Build 265 Production SHA')
q('Release 467 Build 265 CAIP Private-Media Prerequisite Inventory' in workflow,'Build 266 workflow missing predecessor proof name')
q("run_current_contract('scripts/release467_build266_gate.py','Release 467 Build 266')" in sysgate,'System Gate must invoke Build 266')

q(p.get('build')==266 and p.get('title')=='CAIP Multipart Recovery Integrity Review','Current authority must identify Build 266')
q(int(p.get('next_build') or 0)==267 and p.get('next_build_title')=='CAIP Duplicate & Orphan Recovery Classification','Current authority must expose Build 267 successor')
q((p.get('production_checkpoint') or {}).get('main_sha')=='28181d75fe8425244848ae5a06c86f54a446eb1b','Current Production checkpoint must identify Build 265 main')
q((p.get('caip_multipart_recovery_integrity_review') or {}).get('classification')=='STATIC_RECOVERY_INTEGRITY_COHERENT_PRODUCTION_INTERRUPTION_EVIDENCE_PENDING','Current authority missing Build 266 review result')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 266 safety drift: {k}')

print('RELEASE 467 BUILD 266 CAIP MULTIPART RECOVERY INTEGRITY REVIEW')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Resume: completed D1/ETag parts are skipped; persisted byte ranges and parallelism=2 retained')
print('Completion: exact part/ETag/byte plan required before R2 complete; exact HEAD size required before registration')
print('Immutable source: completed raw originals cannot be deleted/overwritten by intake; uncertain finalized binaries are preserved')
print('Acceptance: static integrity is coherent; live Production interruption/binding evidence remains pending')
print('Next: Build 267 — CAIP Duplicate & Orphan Recovery Classification')
