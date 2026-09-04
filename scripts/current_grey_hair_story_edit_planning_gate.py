#!/usr/bin/env python3
"""Fail-closed Release 467 Build 47 Grey Hair story/edit planning regression gate."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions/api/admin/grey-hair-story-edit-planning.js'
PAGE = ROOT / 'admin/grey-hair-story-edit-planning/index.html'
CLIENT = ROOT / 'public/js/admin-grey-hair-story-edit-planning-v47.js'
SYNC_PAGE = ROOT / 'admin/grey-hair-sync-alignment/index.html'
LEGACY_MIGRATION = ROOT / 'migrations/dev/20260830_release461_caip_production_pipeline.sql'
CANONICAL = ROOT / 'migrations/canonical'

for path in (API, PAGE, CLIENT, SYNC_PAGE, LEGACY_MIGRATION):
    if not path.is_file():
        raise SystemExit(f'FAIL — missing Build 47 authority: {path.relative_to(ROOT)}')

api = API.read_text(encoding='utf-8')
page = PAGE.read_text(encoding='utf-8')
client = CLIENT.read_text(encoding='utf-8')
migration = LEGACY_MIGRATION.read_text(encoding='utf-8')
sync_page = SYNC_PAGE.read_text(encoding='utf-8')

forbidden_ddl = re.compile(r'\b(?:CREATE|ALTER|DROP|RENAME)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b', re.I)
if forbidden_ddl.search(api):
    raise SystemExit('FAIL — Build 47 API contains request-time schema DDL')
if forbidden_ddl.search(client):
    raise SystemExit('FAIL — Build 47 client contains schema DDL')

canonical_files = sorted(p.name for p in CANONICAL.glob('*.sql'))
if canonical_files != [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]:
    raise SystemExit(f'FAIL — Build 47 must not add canonical migration 0005; found {canonical_files!r}')

checks = {
    'Build 47 identity': "const BUILD = 47" in api and "AI Story & Edit Planning" in api,
    'existing story authority reused': all(name in api for name in ('caip_story_builder_drafts', 'caip_story_builder_items', 'caip_edit_timeline_drafts', 'caip_edit_timeline_clips')),
    'existing sync authority reused': 'caip_capture_groups' in api and 'caip_capture_tracks' in api,
    'legacy migration owns reused tables': all(f'CREATE TABLE IF NOT EXISTS {name}' in migration for name in ('caip_story_builder_drafts','caip_story_builder_items','caip_edit_timeline_drafts','caip_edit_timeline_clips','caip_capture_groups','caip_capture_tracks')),
    'confirmed Build 46 group required': "lower(group?.sync_status) !== 'confirmed'" in api and 'ready_for_build47' in api,
    'exactly four cameras required': 'cameras.length !== 4' in api and 'Exactly four confirmed camera tracks are required.' in api,
    'all sync tracks confirmed': "lower(row.review_status) !== 'confirmed'" in api and 'Every included Build 46 track must be confirmed.' in api,
    'approved evidence only': "r.marker_status='active' AND r.review_status='approved'" in api and "ct.review_status='confirmed'" in api,
    'rejected lifecycle excluded': "NOT IN ('rejected','purge_requested')" in api,
    'rejected quality excluded': "COALESCE(q.review_status,'accepted')<>'rejected'" in api,
    'source provenance retained in story items': 'creative_media_evidence_range_id' in api and 'insertStoryItems' in api,
    'deterministic review planner marker': "build47_reviewed_story_planner" in api and 'planner_score' in api,
    'human story review precedes edit generation': "if (!['review', 'approved'].includes(lower(story.story_status)))" in api,
    'edit clips remain source linked': 'creative_asset_id' in api and 'source_in_seconds' in api and 'source_out_seconds' in api and 'sync_offset_seconds' in api,
    'provider execution stays closed': "provider_execution_status='closed'" in api and 'provider_execution_active: false' in api,
    'external AI provider stays closed': 'external_ai_provider_active: false' in api,
    'media rendering stays closed': 'media_rendering_active: false' in api,
    'publication stays closed': 'publication_active: false' in api,
    'R2 mutation stays closed': 'r2_mutation_active: false' in api and 'raw_public_r2_urls: false' in api,
    'no external provider fetch in API': 'fetch(' not in api and 'OPENAI' not in api.upper() and 'ANTHROPIC' not in api.upper(),
    'reviewable story UI exists': all(token in page for token in ('Ranked reviewed evidence','Generate story plan','Story plans','Edit plans','Build 47 owns planning metadata only')),
    'story edits are source constrained': all(token in client for token in ('data-evidence-id','save_story_review','generate_edit_plan','save_edit_review')),
    'operator can reorder reviewed beats and clips': 'data-move="up"' in client and 'data-move="down"' in client and 'data-remove' in client,
    'target overflow is visible not silently dropped': 'target_exceeded' in api and 'never silently drops approved story beats' in client,
    'Build 46 handoff links Build 47': '/admin/grey-hair-story-edit-planning/' in sync_page and 'Build 47 handoff' in sync_page,
    'Build 47 boundary visible': 'No external AI/LLM provider call' in page and 'publication action' in page and 'R2 mutation' in page,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('FAIL — Build 47 story/edit planning regression: ' + '; '.join(failed))

print('CURRENT GREY HAIR STORY / EDIT PLANNING GATE: PASS')
