#!/usr/bin/env python3
"""Release 467 Build 269 — Private Raw Media Intake Integrity fail-closed gate."""
from pathlib import Path
import json,re,sqlite3,sys

R=Path(__file__).resolve().parents[1]
F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok: F.append(msg)

a=j('release467-build269-private-raw-media-intake-integrity.json')
p=j('current-development-authority.json')
prev=j('release467-build268-caip-private-media-recovery-hardening-closure.json')
migration=t('database_build269_caip_social_project_dedupe_integrity.sql')
aggregate=t('database_schema.sql')
root=t('_lib/caipMediaIntake.js')
api=t('functions/api/_lib/caipMediaIntake.js')
browser=t('public/js/admin-caip-storage-audit.js')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
doc=t('docs/operations/RELEASE_467_BUILD_269_PRIVATE_RAW_MEDIA_INTAKE_INTEGRITY.md')
raw=t('docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md')
ingest=t('docs/creative-asset-intelligence-platform/04_Project_Ingestion_Pipeline.md')
ops=t('docs/creative-asset-intelligence-platform/09_Operations_Reliability_and_Observability.md')
accept=t('docs/creative-asset-intelligence-platform/12_Testing_and_Acceptance.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
wf=t('.github/workflows/release467-build269-private-raw-media-intake-integrity.yml')

q(a.get('build')==269 and a.get('title')=='Private Raw Media Intake Integrity','Build 269 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 269 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='139310232fb103cb2c843dc4d409ecdb7d4bb701','Build 268 Development SHA mismatch')
q(pred.get('production_main_sha')=='44da8087958eb0c64df3de892ca8628293a96231','Build 268 Production SHA mismatch')
q(pred.get('proof_recovery')=='LIVE_BY_EXACT_SHA_COMPOSITION','Build 268 proof recovery mode mismatch')
q(prev.get('build')==268 and (prev.get('closure') or {}).get('classification')=='RECOVERY_HARDENING_PREREQUISITES_CLOSED_BUILD269_FAIL_CLOSED_READY','Build 268 recovery-hardening authority missing')

act=a.get('activation') or {}
q(act.get('standalone_migration')=='database_build269_caip_social_project_dedupe_integrity.sql','Build 269 migration authority mismatch')
q(act.get('content_fingerprint_version')=='sample_sha256_v1','Build 269 fingerprint version mismatch')
q(act.get('server_side_same_project_reclassification') is True,'Server-side duplicate classification must be retained')
q(act.get('renamed_file_duplicate_prevention') is True,'Renamed-file duplicate prevention must be retained')
q(act.get('legacy_metadata_fingerprint_authoritative') is False,'Legacy metadata fingerprint must not become authoritative')
q(act.get('clean_recovery_new_identity') is True and act.get('recovery_lineage_field')=='recovery_of_file_id','Clean recovery lineage mismatch')
q(act.get('completed_raw_original_immutable') is True,'Completed raw originals must remain immutable')
for k in ('exact_multipart_part_count_required','exact_multipart_byte_sum_required','all_part_etags_required','r2_head_exact_size_required','bounded_part_plan','bounded_fingerprint_backfill'):
    q(act.get(k) is True,f'Build 269 integrity flag missing: {k}')
q(int(act.get('fingerprint_backfill_max_rows_per_request') or 0)==20,'Build 269 fingerprint backfill ceiling drift')
q(act.get('classification')=='PRIVATE_RAW_MEDIA_INTAKE_INTEGRITY_SOURCE_READY_DEPLOYED_ACCEPTANCE_EVIDENCE_PENDING','Build 269 classification mismatch')

ready=a.get('fail_closed_readiness') or {}
q(ready.get('required_build241_private_media_tables') is True and ready.get('required_build269_duplicate_safe_columns') is True,'Schema readiness prerequisites missing')
q(ready.get('required_private_r2_binding')=='CAIP_PRIVATE_MEDIA_BUCKET','Private R2 readiness binding mismatch')
q(ready.get('binary_transfer_before_readiness') is False and ready.get('binary_transfer_before_content_classification') is False,'Binary transfer must remain fail closed')
q(len(a.get('unresolved_deployed_acceptance') or [])>=5,'Build 269 deployed acceptance gaps must remain explicit')

# The standalone migration was the concrete missing deployment artifact.
for token in (
    'ALTER TABLE caip_media_upload_files ADD COLUMN content_fingerprint TEXT;',
    'ALTER TABLE caip_media_upload_files ADD COLUMN content_fingerprint_version TEXT;',
    'ALTER TABLE caip_media_upload_files ADD COLUMN recovery_of_file_id INTEGER;',
    'idx_caip_media_files_content_fingerprint',
    'idx_caip_media_files_recovery',
    "'build269_caip_social_project_dedupe_integrity'",
    "'database_build269_caip_social_project_dedupe_integrity.sql'"
):
    q(token in migration,f'Build 269 migration missing: {token}')
q(not re.search(r'\bDROP\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b',migration,re.I),'Build 269 migration must not drop schema objects')
q(not re.search(r'\bDELETE\s+FROM\b',migration,re.I),'Build 269 migration must not delete data')
q(not re.search(r'\bUPDATE\s+caip_media_upload_files\b',migration,re.I),'Build 269 migration must not rewrite existing media rows')

# Execute the additive migration once against the exact prerequisite shape needed by its indexes/ledger.
try:
    db=sqlite3.connect(':memory:')
    db.executescript("""
      CREATE TABLE schema_migration_ledger(
        schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_key TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        checksum TEXT,
        status TEXT NOT NULL DEFAULT 'applied',
        destructive INTEGER NOT NULL DEFAULT 0,
        applied_by_user_id INTEGER,
        applied_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE caip_media_upload_files(
        caip_media_upload_file_id INTEGER PRIMARY KEY AUTOINCREMENT,
        creative_project_id INTEGER NOT NULL,
        file_size_bytes INTEGER NOT NULL DEFAULT 0,
        upload_status TEXT NOT NULL DEFAULT 'waiting'
      );
    """)
    db.executescript(migration)
    cols={row[1] for row in db.execute("PRAGMA table_info(caip_media_upload_files)")}
    idx={row[1] for row in db.execute("PRAGMA index_list(caip_media_upload_files)")}
    ledger=db.execute("SELECT file_name,status,destructive FROM schema_migration_ledger WHERE migration_key='build269_caip_social_project_dedupe_integrity'").fetchone()
    q({'content_fingerprint','content_fingerprint_version','recovery_of_file_id'} <= cols,'Build 269 migration smoke missing required columns')
    q({'idx_caip_media_files_content_fingerprint','idx_caip_media_files_recovery'} <= idx,'Build 269 migration smoke missing required indexes')
    q(ledger==('database_build269_caip_social_project_dedupe_integrity.sql','applied',0),'Build 269 migration ledger smoke mismatch')
finally:
    try: db.close()
    except Exception: pass

for token in (
    'content_fingerprint TEXT',
    'content_fingerprint_version TEXT',
    'recovery_of_file_id INTEGER',
    'idx_caip_media_files_content_fingerprint',
    'idx_caip_media_files_recovery',
    "'build269_caip_social_project_dedupe_integrity'"
):
    q(token in aggregate,f'Aggregate schema missing Build 269 token: {token}')

q(root==api,'CAIP media intake helper copies must remain byte-identical')
for token in (
    "CONTENT_FINGERPRINT_VERSION = 'sample_sha256_v1'",
    'fingerprintSampleRanges',
    'contentFingerprintFromChunks',
    'content_fingerprint_version',
    'recovery_of_file_id',
    'createUploadSession',
    'duplicate_action',
    '[CAIP_MULTIPART_INCOMPLETE]',
    'upload.complete(',
    'const head=await bucket.head(file.object_key);',
    '[CAIP_R2_SIZE_MISMATCH]',
    'backfillCaipContentFingerprints',
    'Math.min(20,'
):
    q(token in api,f'CAIP Build 269 runtime contract missing: {token}')
for token in ("CONTENT_FINGERPRINT_VERSION = 'sample_sha256_v1'","file.slice","crypto.subtle.digest"):
    q(token in browser,f'Browser Build 269 fingerprint contract missing: {token}')

for token in ('Build 269 — Private Raw Media Intake Integrity','Build 270 — Strong-Fingerprint Backfill & Recovery Reconciliation'):
    q(token in road,f'Roadmap missing {token}')
for token in ('database_build269_caip_social_project_dedupe_integrity.sql','sample_sha256_v1','[CAIP_MULTIPART_INCOMPLETE]','[CAIP_R2_SIZE_MISMATCH]','Build 270'):
    q(token in doc,f'Build 269 document missing {token}')
for token in ('Before D1 creates a new physical upload identity','same-project match is classified as skip, registration-only, resume, clean recovery, or new'):
    q(token in ingest,f'Ingestion authority missing {token}')
for token in ('Build 269 integrity and duplicate observability','content_fingerprint_version=sample_sha256_v1'):
    q(token in ops,f'Operations authority missing {token}')
for token in ('Apply `database_build269_caip_social_project_dedupe_integrity.sql`','Rename a local copy without changing its bytes','physical duplicate-object deletion gated on verified whole-object checksum'):
    q(token in accept,f'Acceptance authority missing {token}')
for token in ('sample_sha256_v1','before raw binary transfer','Physical private-R2 deletion remains more conservative'):
    q(token.lower() in raw.lower(),f'Private raw-media authority missing {token}')

q('development_sha: 139310232fb103cb2c843dc4d409ecdb7d4bb701' in wf,'Build 269 workflow Development predecessor drift')
q('production_sha: 44da8087958eb0c64df3de892ca8628293a96231' in wf,'Build 269 workflow Production predecessor drift')
q('Release 467 Build 268 CAIP Private-Media Recovery Hardening Closure' in wf,'Build 269 workflow predecessor proof name drift')
q("run_current_contract('scripts/release467_build269_gate.py','Release 467 Build 269')" in sysgate,'System Gate missing Build 269')

cur=int(p.get('build') or 0)
q(p.get('release')==467 and cur>=269,'Current authority must retain Build 269 or a verified successor')
proj=p.get('caip_private_raw_media_intake_integrity') or {}
q(proj.get('classification')=='PRIVATE_RAW_MEDIA_INTAKE_INTEGRITY_SOURCE_READY_DEPLOYED_ACCEPTANCE_EVIDENCE_PENDING','Current authority missing Build 269 integrity projection')
q(proj.get('standalone_migration_present') is True and proj.get('request_time_ddl') is False,'Current authority migration boundary mismatch')
if cur==269:
    q(p.get('title')=='Private Raw Media Intake Integrity','Current authority Build 269 title mismatch')
    q(p.get('state')=='DEVELOPMENT_GREEN','Build 269 candidate pointer must retain inherited Development GREEN state')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='44da8087958eb0c64df3de892ca8628293a96231','Build 269 candidate must retain exact Build 268 Production baseline')
    q(int(p.get('next_build') or 0)==270 and p.get('next_build_title')=='Strong-Fingerprint Backfill & Recovery Reconciliation','Build 269 successor pointer mismatch')
elif cur==270:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='61cc1346f838a5dd742b0dbaeff345d95447ba6e','Build 270 current Production baseline must be exact Build 269')
    q(int(p.get('next_build') or 0)>=271,'Build 270 must advance beyond Build 270 successor')
elif cur==271:
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
q(s.get('schema_migration_artifact_added') is True,'Build 269 must record the bounded schema migration artifact')
for k,v in s.items():
    if k!='schema_migration_artifact_added': q(v is False,f'Build 269 safety drift: {k}')

if F:
    print('RELEASE 467 BUILD 269 PRIVATE RAW MEDIA INTAKE INTEGRITY: FAIL')
    for x in F: print('-',x)
    sys.exit(1)
print('RELEASE 467 BUILD 269 PRIVATE RAW MEDIA INTAKE INTEGRITY')
print('PASS')
print('Standalone Build 269 migration aligns runtime and aggregate schema without request-time DDL.')
print('Duplicate-safe sample fingerprinting, recovery lineage, exact multipart completion and R2 HEAD-size integrity are retained.')
print('Live Production private-media acceptance remains evidence-dependent and fail closed.')
print('Next: Build 270 — Strong-Fingerprint Backfill & Recovery Reconciliation')
