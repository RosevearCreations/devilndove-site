#!/usr/bin/env python3
"""Release 461 source-only gate for CAIP ingest through edit/timeline generation."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
MIG=ROOT/'migrations/dev/20260830_release461_caip_production_pipeline.sql'
API=ROOT/'functions/api/admin/caip-production-pipeline.js'
for path in (MIG,API):
    if not path.is_file(): raise SystemExit(f'Missing CAIP production-pipeline authority: {path.relative_to(ROOT)}')
migration=MIG.read_text(encoding='utf-8')
api=API.read_text(encoding='utf-8')
required_tables=(
 'caip_asset_ingest_contexts','caip_capture_groups','caip_capture_tracks','caip_asset_quality_reviews',
 'caip_asset_lifecycle_states','caip_asset_lifecycle_events','caip_semantic_evidence_annotations',
 'caip_story_builder_drafts','caip_story_builder_items','caip_edit_timeline_drafts','caip_edit_timeline_clips','caip_pipeline_events'
)
checks={
 'all pipeline tables migration-owned':all(f'CREATE TABLE IF NOT EXISTS {name}' in migration for name in required_tables),
 'migration forward additive only':not re.search(r'\b(?:ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW))\b',migration,re.I),
 'runtime contains no ddl':not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b',api,re.I),
 'existing private ingest remains source authority':"intake_source TEXT NOT NULL DEFAULT 'caip_private_media'" in migration and 'caip_media_upload_files' in api,
 'multicamera sync exists':'auto_sync_group' in api and 'sync_offset_seconds' in api and 'capture_timestamp' in api,
 'quality review exists':'save_quality_review' in api and 'overall_quality_score' in api,
 'reject purge reversible':'reject_asset' in api and 'request_purge' in api and 'cancel_purge' in api and 'restore_asset' in api,
 'purge never deletes r2':"r2_delete_active:false" in api and 'bucket.delete' not in api and '.delete(' not in api,
 'semantic evidence extends temporal authority':'creative_media_evidence_ranges' in api and 'annotate_evidence' in api,
 'story builder extends approved story/evidence':'creative_story_segments' in api and 'generate_story' in api and 'private_storyboard_notes' in api,
 'timeline uses reviewed evidence':'generate_timeline' in api and 'review_status=\'approved\'' in api and 'provider_execution_status' in api,
 'providers closed':"provider_execution_active:false" in api and "publication_active:false" in api,
}
failed=[name for name,ok in checks.items() if not ok]
if failed: raise SystemExit('Release 461 CAIP production pipeline gate failed: '+'; '.join(failed))
print('RELEASE 461 CAIP INGEST / SYNC / QUALITY / LIFECYCLE / EVIDENCE / STORY / TIMELINE: PASS')
print('Private ingest authority: PRESERVED')
print('Raw R2 delete: CLOSED')
print('Provider execution/publication: CLOSED')
print('Runtime DDL: NONE')
print('D1 / R2 / Production mutation by source gate: NONE')
