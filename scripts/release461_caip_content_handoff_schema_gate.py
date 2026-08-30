#!/usr/bin/env python3
"""Release 461 CAIP handoff schema/query + pipeline handoff contract gate. Source-only."""
from __future__ import annotations
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WRAPPER=ROOT/'functions/api/admin/caip-content-handoff.js'
LEGACY=ROOT/'functions/api/admin/_caipContentHandoffLegacy.js'
SCHEMA=ROOT/'database_full_schema.sql'
for path in (WRAPPER,LEGACY,SCHEMA):
    if not path.is_file(): raise SystemExit(f'FAIL — missing {path.relative_to(ROOT)}')
wrapper=WRAPPER.read_text(encoding='utf-8')
legacy=LEGACY.read_text(encoding='utf-8')
schema=SCHEMA.read_text(encoding='utf-8',errors='replace')
match=re.search(r"CREATE TABLE IF NOT EXISTS\s+creative_media_evidence_ranges\s*\((.*?)\n\);",schema,re.I|re.S)
if not match: raise SystemExit('FAIL — canonical creative_media_evidence_ranges definition is missing from database_full_schema.sql')
table=match.group(1)
required_schema_columns=('creative_media_evidence_range_id','creative_project_id','creative_asset_id','marker_key','evidence_category','title','note_text','transcript_excerpt','start_seconds','end_seconds','visibility','confidence_score','linked_story_evidence_id','marker_status','review_status')
for column in required_schema_columns:
    if not re.search(rf"\b{re.escape(column)}\b",table): raise SystemExit(f'FAIL — canonical creative_media_evidence_ranges is missing {column}')
if re.search(r'\bconfidence_percent\b',table): raise SystemExit('FAIL — confidence_percent must not be invented as a D1 column')
for marker in ('const REQUIRED_COLUMNS','creative_media_evidence_ranges:',"'confidence_score'",'PRAGMA table_info','missing_columns','r.confidence_score AS confidence_percent'):
    if marker not in legacy: raise SystemExit(f'FAIL — retained CAIP handoff authority is missing schema guard: {marker}')
if 'r.confidence_percent' in legacy: raise SystemExit('FAIL — retained handoff still queries non-canonical r.confidence_percent')
forbidden=re.compile(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b',re.I)
if forbidden.search(wrapper) or forbidden.search(legacy): raise SystemExit('FAIL — CAIP handoff contains request-time schema DDL')
checks={
 'wrapper retains legacy handoff authority':"from './_caipContentHandoffLegacy.js'" in wrapper,
 'pipeline story snapshot':'caip_story_builder_drafts' in wrapper and 'story_builder' in wrapper,
 'pipeline timeline snapshot':'caip_edit_timeline_drafts' in wrapper and 'edit_timeline' in wrapper,
 'quality acceptance included':'caip_asset_quality_reviews' in wrapper and 'footage_quality' in wrapper,
 'semantic acceptance included':'caip_semantic_evidence_annotations' in wrapper and 'semantic_evidence' in wrapper,
 'reversible purge state included':'purge_requested' in wrapper and 'raw_delete_executed:false' in wrapper,
 'prepared package persists snapshot':'caip_release461_pipeline' in wrapper and 'UPDATE caip_content_handoffs SET package_json' in wrapper,
 'providers remain closed':"provider_execution_active:false" in wrapper and "publication_active:false" in wrapper,
 'source media remains references':"source_media_copied:false" in wrapper and "source_media_unchanged:true" in wrapper,
 'legacy still fails closed':'if(!data.readiness.schema_ready)return json' in legacy,
}
failed=[name for name,ok in checks.items() if not ok]
if failed: raise SystemExit('FAIL — Release 461 CAIP handoff: '+'; '.join(failed))
print('RELEASE 461 CAIP CONTENT HANDOFF SCHEMA + PIPELINE CONTRACT: PASS')
print('Canonical confidence authority: creative_media_evidence_ranges.confidence_score')
print('Existing reviewed-evidence handoff: RETAINED')
print('Story/edit/quality/semantic snapshot: INCLUDED')
print('Provider execution/publication: CLOSED')
print('R2/source-media mutation: NONE')
print('Runtime DDL: NONE')
