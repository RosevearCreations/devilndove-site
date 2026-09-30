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
    q(cur==289 or int(p.get('next_build') or 0)>=271,'Build 270 must advance beyond Build 270 successor')
elif cur==271:
    q((p.get('production_checkpoint') or {}).get('main_sha')=='9c3ed0664d71ab66a3087047b35989c5ed5b6904','Build 271 current Production baseline must be exact Build 270')
    q(cur==289 or int(p.get('next_build') or 0)>=272,'Build 271 must advance beyond Build 271 successor')
elif cur==272:
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
    expected_main={278:'552fe0fb1b192c7fd123c9a7369eea9f352f639e',279:'5d418eb1160caa7af855a247e1ff3510e4c1c9b8',280:'048c67562efc20892cf9652841edd6b0b1a845d6',281:'94e46cae035769ba61de379add1f7c1a6a1c21f0',282:'707ecef36d8e6fbdcee2d15809441fafd8573ac4',283:'034ab92e57b17765a7b946182256fb32ae25cf87',284:'5bc70281e8ea2cb9818b14f216bef30f2d7d1463',285:'0ad2adcec970d3dc96336bdee88192fea32531a9',286:'2056cc46ebb5589dddc0b5172d90ffbd0e3c4241',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',287:'11a4924ce8f5a83bc6b688489404140e89456662',288:'27a48e505b42c399fac0801cbd4e6394490957a4',289:'10ca103d83a2f0517eb1bbf3aac26cebd5e0e451',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',290:'238a7732049bbf9c5fead7b3ec4cc2c1e779fcd6',291:'a56c163c8c417a90b3e6a35da128cdaeaf73b668',292:'b9cd4d8c27b64e9b2c892575e38673681a8367fa',293:'6891ba76bb9fc07e97962ae36b94cad143412bfd',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',294:'229f9299561a820c029d1eec69e8f088b94c9a09',295:'d731d823cbcf7708a6d978c9f399c2a72af55635',296:'9da8d3c7dc6ace186de0d69141e19fed998f5ddf',297:'120b5b607bfe3b7ddcf36abf4aefaad772477ba9',298:'043799f8d89a6df392b4416a7908da4f9d92d537',299:'5da8e2457ec64a9a54523bd56eb523c9abd5ec8c',300:'9689e81f23722d58421df87b2ea6b41ca39005fb',301:'e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2',302:'3eec733afd9b8c585efaab1c8a89fa244d9f65d8',303:'fffbafc4e9f27e830494140b48d9a3d266abd81e',304:'5fe6e3b5c47f948d8e931fd7357801ca639cb7dd',305:'9666c57fd02b199359e2420db0f147c27e5c9386',306:'436eb9fac8ee3d9ee1a25b8fdad9a3820ceaa34e',307:'1eb9df6dd6db02ad61fd4a32852e7f37a46c1ecd',308:'f8b3f7281ccd6e4bfc739abe1ba2566db336281a',309:'498ddd776ea3c52b243a5ef8800fc33570d159a4',310:'a65463ee79a50ec16741958bc2913cf67b198966',311:'43120a39d39aa0b0a2b0299967ad2e7b97eab0ee',312:'e6c48ac204393ee53859dc0366e36a13f15a5460',313:'c5e7bb72ec990118057d6955223e60ddaf691eac',314:'14375bce8e1749b309e60ef3baf1804ee01bdc47',315:'8bea4144e1a50d43b85e94218ce7f878a6023904',316:'7c8605c627c25443df24d08b5ffecb3fa315c084',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e',317:'ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e'}.get(cur,'')
    q((p.get('production_checkpoint') or {}).get('main_sha')==expected_main,'Build 278+ current Production baseline must track the exact immediate verified predecessor')
    q(cur==289 or int(p.get('next_build') or 0)>=279,'Build 278+ must advance beyond Build 278 successor')

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
