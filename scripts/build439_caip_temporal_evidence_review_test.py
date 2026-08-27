#!/usr/bin/env python3
"""Build 439 local-only CAIP temporal evidence / ranged-review regression."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'database_build439_caip_temporal_evidence_review.sql'
SERVICE = ROOT / 'functions/api/_lib/caipEvidenceReview.js'
API = ROOT / 'functions/api/admin/caip-evidence-review.js'
REVIEW_PROXY = ROOT / 'functions/api/admin/creative-asset-review.js'
PAGE = ROOT / 'admin/creative-assets/index.html'
UI = ROOT / 'public/js/admin-caip-evidence-review.js'
AUDIT_UI = ROOT / 'public/js/admin-caip-storage-audit.js'
CSS = ROOT / 'css/caip-evidence-review.css'
SYNC = ROOT / 'scripts/build439_sync_full_schema.py'
ROUTE_MAP = ROOT / 'functions/api/_lib/appModuleRoutes.js'


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8') if path.exists() else ''


def base_schema(conn: sqlite3.Connection) -> None:
    conn.executescript('''
    PRAGMA foreign_keys=OFF;
    CREATE TABLE creative_projects(creative_project_id INTEGER PRIMARY KEY AUTOINCREMENT);
    CREATE TABLE creative_assets(creative_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,creative_project_id INTEGER,asset_key TEXT,media_type TEXT,asset_status TEXT DEFAULT 'active');
    CREATE TABLE caip_media_upload_files(caip_media_upload_file_id INTEGER PRIMARY KEY AUTOINCREMENT,creative_project_id INTEGER,creative_asset_id INTEGER);
    CREATE TABLE creative_story_evidence(
      creative_story_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,creative_project_id INTEGER,creative_asset_id INTEGER,evidence_key TEXT,evidence_type TEXT,
      source_reference TEXT,claim_text TEXT,visibility TEXT,verification_status TEXT,review_status TEXT,evidence_json TEXT,copy_locked INTEGER DEFAULT 0,
      created_at TEXT,updated_at TEXT,UNIQUE(creative_project_id,evidence_key)
    );
    CREATE TABLE creative_story_segments(
      creative_story_segment_id INTEGER PRIMARY KEY AUTOINCREMENT,creative_project_id INTEGER,segment_key TEXT,segment_type TEXT,sort_order INTEGER,title TEXT,
      narrative_text TEXT,evidence_keys_json TEXT,segment_status TEXT,copy_locked INTEGER DEFAULT 0,reviewer_notes TEXT,created_at TEXT,updated_at TEXT
    );
    CREATE TABLE caip_media_processing_jobs(
      caip_media_processing_job_id INTEGER PRIMARY KEY AUTOINCREMENT,creative_project_id INTEGER,creative_asset_id INTEGER,caip_media_upload_file_id INTEGER,
      job_key TEXT UNIQUE,job_type TEXT,job_status TEXT,provider_key TEXT,input_object_key TEXT,output_prefix TEXT,attempt_count INTEGER DEFAULT 0,max_attempts INTEGER DEFAULT 3,
      result_json TEXT DEFAULT '{}',last_error TEXT,requested_by_user_id INTEGER,created_at TEXT,updated_at TEXT,started_at TEXT,completed_at TEXT
    );
    CREATE TABLE creative_provider_profiles(
      creative_provider_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,provider_key TEXT UNIQUE,display_name TEXT,capability_key TEXT,lifecycle_status TEXT,
      endpoint_policy TEXT,config_redacted_json TEXT,consent_required INTEGER,default_budget_cap_cents INTEGER,created_at TEXT,updated_at TEXT
    );
    CREATE TABLE schema_migration_ledger(
      schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,migration_key TEXT UNIQUE,file_name TEXT,applied_at TEXT,notes TEXT
    );
    ''')


def simulate() -> dict:
    migration = read(MIGRATION)
    conn = sqlite3.connect(':memory:')
    try:
        base_schema(conn)
        conn.executescript(migration)
        tables = {row[0] for row in conn.execute("SELECT name FROM sqlite_schema WHERE type='table'")}
        indexes = {row[0] for row in conn.execute("SELECT name FROM sqlite_schema WHERE type='index'")}
        triggers = {row[0] for row in conn.execute("SELECT name FROM sqlite_schema WHERE type='trigger'")}
        providers = conn.execute("SELECT provider_key,lifecycle_status FROM creative_provider_profiles ORDER BY provider_key").fetchall()

        conn.execute("INSERT INTO creative_projects(creative_project_id) VALUES(1)")
        conn.execute("INSERT INTO creative_assets(creative_asset_id,creative_project_id,asset_key,media_type,asset_status) VALUES(10,1,'video-1','video','active')")
        conn.execute("INSERT INTO caip_media_upload_files(caip_media_upload_file_id,creative_project_id,creative_asset_id) VALUES(20,1,10)")
        conn.execute("INSERT INTO creative_media_evidence_ranges(creative_project_id,creative_asset_id,caip_media_upload_file_id,marker_key,marker_type,evidence_category,start_seconds,end_seconds,title) VALUES(1,10,20,'m1','range','technique',1.5,4.25,'Technique proof')")
        valid_marker = conn.execute("SELECT marker_key,start_seconds,end_seconds,evidence_category FROM creative_media_evidence_ranges WHERE marker_key='m1'").fetchone()

        bad_range_blocked = False
        try:
            conn.execute("INSERT INTO creative_media_evidence_ranges(creative_project_id,creative_asset_id,marker_key,marker_type,evidence_category,start_seconds,end_seconds,title) VALUES(1,10,'bad','range','problem',8,2,'Bad')")
        except sqlite3.DatabaseError:
            bad_range_blocked = True

        conn.execute("INSERT INTO caip_media_processing_jobs(caip_media_processing_job_id,creative_project_id,creative_asset_id,job_key,job_type,job_status,result_json) VALUES(30,1,10,'proxy-job','proxy_video','planned','{}')")
        completion_blocked = False
        completion_message = ''
        try:
            conn.execute("UPDATE caip_media_processing_jobs SET job_status='complete' WHERE caip_media_processing_job_id=30")
        except sqlite3.DatabaseError as exc:
            completion_blocked = True
            completion_message = str(exc)

        conn.execute("INSERT INTO caip_media_processing_artifacts(caip_media_processing_job_id,creative_project_id,creative_asset_id,artifact_key,artifact_role,object_key,verification_status) VALUES(30,1,10,'proxy-artifact','proxy_video','projects/1/proxy.mp4','head_verified')")
        conn.execute("UPDATE caip_media_processing_jobs SET job_status='complete' WHERE caip_media_processing_job_id=30")
        completed = conn.execute("SELECT job_status FROM caip_media_processing_jobs WHERE caip_media_processing_job_id=30").fetchone()[0]

        insert_complete_blocked = False
        try:
            conn.execute("INSERT INTO caip_media_processing_jobs(creative_project_id,creative_asset_id,job_key,job_type,job_status,result_json) VALUES(1,10,'thumb-complete','thumbnail','complete','{}')")
        except sqlite3.DatabaseError:
            insert_complete_blocked = True

        conn.execute("INSERT INTO caip_media_processing_jobs(creative_project_id,creative_asset_id,job_key,job_type,job_status,result_json) VALUES(1,10,'metadata-complete','metadata','complete','{}')")
        metadata_complete = conn.execute("SELECT job_status FROM caip_media_processing_jobs WHERE job_key='metadata-complete'").fetchone()[0]

        conn.executescript(migration)
        provider_count = conn.execute("SELECT COUNT(*) FROM creative_provider_profiles WHERE provider_key IN ('caip_frame_builder','caip_audio_extractor')").fetchone()[0]
        ledger_count = conn.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build_439_caip_temporal_evidence_review'").fetchone()[0]
        return {
            'tables': tables,'indexes': indexes,'triggers': triggers,'providers': providers,
            'valid_marker': valid_marker,'bad_range_blocked': bad_range_blocked,
            'completion_blocked': completion_blocked,'completion_message': completion_message,
            'completed': completed,'insert_complete_blocked': insert_complete_blocked,'metadata_complete': metadata_complete,
            'provider_count': provider_count,'ledger_count': ledger_count,
        }
    finally:
        conn.close()


def main() -> int:
    migration = read(MIGRATION); service = read(SERVICE); api = read(API); proxy = read(REVIEW_PROXY)
    page = read(PAGE); ui = read(UI); audit_ui = read(AUDIT_UI); css = read(CSS); sync = read(SYNC); route_map = read(ROUTE_MAP)
    release = json.loads(read(ROOT / 'development-release.json') or '{}')
    asset_version = str(release.get('release') or 439)
    sim = simulate(); checks = []
    expected_tables = {'creative_media_evidence_ranges','creative_story_segment_evidence_links','caip_media_processing_artifacts'}
    expected_indexes = {
        'idx_creative_media_evidence_project','idx_creative_media_evidence_asset','idx_creative_media_evidence_story',
        'idx_creative_segment_evidence_links_segment','idx_creative_segment_evidence_links_range',
        'idx_caip_processing_artifacts_job','idx_caip_processing_artifacts_project',
    }
    expected_triggers = {'trg_caip_processing_complete_requires_verified_artifact','trg_caip_processing_insert_complete_requires_verified_artifact'}
    checks.extend([
        ('three additive Build 439 authorities exist', expected_tables <= sim['tables']),
        ('seven bounded indexes exist', expected_indexes <= sim['indexes']),
        ('two verified-artifact completion triggers exist', expected_triggers <= sim['triggers']),
        ('migration is rerun-safe for provider and ledger seed', sim['provider_count'] == 2 and sim['ledger_count'] == 1),
        ('new provider profiles remain disabled', all(status == 'disabled' for _, status in sim['providers'])),
        ('valid point/range temporal evidence persists', sim['valid_marker'] == ('m1', 1.5, 4.25, 'technique')),
        ('invalid end-before-start evidence is rejected', sim['bad_range_blocked']),
        ('media-output job completion fails closed without verified artifact', sim['completion_blocked'] and 'CAIP_PROCESSING_ARTIFACT_VERIFICATION_REQUIRED' in sim['completion_message']),
        ('verified artifact permits media-output job completion', sim['completed'] == 'complete'),
        ('direct insert as complete is blocked for media-output jobs', sim['insert_complete_blocked']),
        ('metadata-only jobs are not incorrectly subject to artifact trigger', sim['metadata_complete'] == 'complete'),
        ('runtime evidence service contains no request-time DDL', all(token not in service for token in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'))),
        ('evidence service extends existing story evidence and segment authorities', 'creative_story_evidence' in service and 'creative_story_segments' in service and 'creative_story_segment_evidence_links' in service),
        ('story drafting requires approved temporal and story evidence', "marker.review_status !== 'approved'" in service and "marker.evidence_review_status !== 'approved'" in service),
        ('processing artifact verification uses bound R2 HEAD only', 'resolveCaipBucket' in service and 'bucket.head' in service and 'fetch(' not in service),
        ('Admin API degrades reads and blocks writes until migration exists', 'schema_ready: false' in api and "required_migration: 'database_build439_caip_temporal_evidence_review.sql'" in api and 'status = 409' in api),
        ('Admin API audits mutations and caps request body', 'auditAdminAction' in api and '262144' in api and 'captureRuntimeIncident' in api),
        ('private review proxy sanitizes browser headers and streams R2 ranges', 'r2GetOptions(request)' in proxy and "rangeHeaders.set('Range', rangeValue)" in proxy and "options.range = rangeHeaders" in proxy and "options.onlyIf = conditionalHeaders" in proxy and "request.headers.get('If-Range')" in proxy and 'object.body' in proxy and 'status = 206' in proxy and 'arrayBuffer' not in proxy and 'range: request.headers' not in proxy and 'onlyIf: request.headers' not in proxy),
        ('video range seeking does not write an audit row for every chunk', 'shouldRecordGrantUse' in proxy and 'access_count' in proxy),
        ('new UI is mounted, cache-busted and responsive', 'caipEvidenceReviewMount' in page and f'admin-caip-evidence-review.js?v={asset_version}' in page and f'caip-evidence-review.css?v={asset_version}' in page and '@media' in css),
        ('storage audit UI is mounted and user-triggered', 'caipStorageAuditMount' in page and f'admin-caip-storage-audit.js?v={asset_version}' in page and 'Audit all temporal media' in audit_ui and 'scope=all' in audit_ui),
        ('storage audit UI is bounded and contains no polling', 'PAGE_SIZE = 8' in audit_ui and 'setInterval' not in audit_ui and 'setTimeout' not in audit_ui),
        ('review UI has no polling and supports secure private review', 'setInterval' not in ui and 'create_secure_review_link' in ui and 'max_access_count: 100' in ui),
        ('review UI captures timecodes, promotes evidence and drafts internal story', 'caip439CaptureStart' in ui and 'caip439CaptureEnd' in ui and "action: 'promote_marker'" in ui and "action: 'draft_story_segment'" in ui),
        ('review UI never calls shared Inventory mutation contracts or provider endpoints', 'inventory-post' not in ui and 'inventory-reverse' not in ui and 'provider_url' not in ui),
        ('full-schema sync helper is local-only and expects three Build 439 tables', 'Cloudflare/D1/R2 access: NONE' in sync and all(table in sync for table in expected_tables)),
        ('Creative module route ownership covers CAIP evidence API', "'/api/admin/caip'" in route_map or "'/api/admin/creative-assets'" in route_map),
        ('migration contains no explicit transaction statements', all(f'\n{token}' not in migration.upper() for token in ('BEGIN;','COMMIT;','ROLLBACK;','SAVEPOINT '))),
        ('migration never performs source-media DELETE or R2/provider execution', 'DELETE FROM' not in migration.upper() and 'fetch(' not in migration and 'CAIP_PROCESSING_ARTIFACT_VERIFICATION_REQUIRED' in migration),
    ])

    failures = []
    print('BUILD 439 CAIP TEMPORAL EVIDENCE REVIEW REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
        if not ok: failures.append(label)
    print()
    if failures:
        print(f'BUILD 439 CAIP TEMPORAL EVIDENCE REVIEW REGRESSION: FAIL ({len(failures)}/{len(checks)} failed)')
        for failure in failures: print(' -', failure)
        return 1
    print(f'BUILD 439 CAIP TEMPORAL EVIDENCE REVIEW REGRESSION: PASS ({len(checks)}/{len(checks)})')
    print('Temporal point/range authority: SOURCE READY')
    print('Reviewed evidence -> existing story ledger: SOURCE READY')
    print('Verified processing artifact gate: FAIL-CLOSED / SOURCE READY')
    print('Private R2 review: RANGE-STREAMED / SANITIZED HEADERS / NO BUFFERING')
    print('Storage integrity audit: USER-TRIGGERED / PAGINATED / READ-ONLY')
    print('Provider execution: DISABLED')
    print('Automatic publication: NONE')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
