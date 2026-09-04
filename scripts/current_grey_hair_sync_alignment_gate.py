#!/usr/bin/env python3
"""Release-neutral forward gate for Build 46 Grey Hair four-camera sync/audio alignment."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions/api/admin/grey-hair-sync-alignment.js'
PAGE = ROOT / 'admin/grey-hair-sync-alignment/index.html'
CLIENT = ROOT / 'public/js/admin-grey-hair-sync-alignment-v46.js'
B45_PAGE = ROOT / 'admin/grey-hair-media-intelligence/index.html'
LEGACY_SCHEMA = ROOT / 'migrations/dev/20260830_release461_caip_production_pipeline.sql'
CANONICAL = ROOT / 'migrations/canonical'

for path in (API, PAGE, CLIENT, B45_PAGE, LEGACY_SCHEMA):
    if not path.is_file():
        raise SystemExit(f'Missing Build 46 authority: {path.relative_to(ROOT)}')

api = API.read_text(encoding='utf-8')
page = PAGE.read_text(encoding='utf-8')
client = CLIENT.read_text(encoding='utf-8')
b45_page = B45_PAGE.read_text(encoding='utf-8')
schema = LEGACY_SCHEMA.read_text(encoding='utf-8')
combined = f'{api}\n{page}\n{client}'
low = combined.lower()

def req(condition, message):
    if not condition:
        raise SystemExit(f'BUILD 46 GREY HAIR SYNC ALIGNMENT GATE: FAIL — {message}')

# Build identity and explicit boundaries.
req('Release 467 Build 46' in api and 'Four-Camera Synchronization & Audio Alignment' in api, 'Build 46 server identity missing')
req('Release 467 • Build 46' in page and 'Four-Camera Sync &amp; Audio Alignment' in page, 'Build 46 operator identity missing')
req('story_editing: false' in api and 'provider_execution: false' in api and 'provider_publication: false' in api, 'provider/story execution boundary missing')
req('r2_mutation: false' in api and 'raw_public_r2_urls: false' in api and 'source_originals_immutable: true' in api, 'private source/R2 boundary missing')
req('waveform_processing: false' in api, 'Build 46 must not claim waveform/media processing')
req('request_time_ddl: false' in api and 'canonical_migration_added: false' in api, 'zero-schema boundary missing')

# Existing synchronization persistence is reused; no competing schema.
for name in ('caip_capture_groups', 'caip_capture_tracks'):
    req(name in api, f'existing {name} authority is not reused')
    req(f'CREATE TABLE IF NOT EXISTS {name}' in schema, f'historical persistence definition missing for {name}')
req("sync_status IN ('needs_review','suggested','confirmed','rejected')" in schema, 'group review-state constraint changed or missing')
req("source_role IN ('camera','audio','reference')" in schema, 'capture track role constraint changed or missing')
req("review_status IN ('needs_review','confirmed','rejected')" in schema, 'track review-state constraint changed or missing')
req('sync_offset_seconds REAL' in schema and 'sync_confidence INTEGER' in schema, 'persisted alignment offset/confidence authority missing')

# Four-camera + optional audio invariant and reviewed confirmation.
req("cameraIds.length !== 4" in api and 'Choose exactly four distinct camera assets.' in api, 'exact four-camera write invariant missing')
req("cameras.length !== 4" in api and 'Exactly four camera tracks are required.' in api, 'exact four-camera confirmation invariant missing')
req("audio.length > 1" in api and 'At most one dedicated audio track is allowed.' in api, 'single dedicated audio invariant missing')
req("!cameraIds.includes(anchorId)" in api and 'Anchor must be one of the four selected cameras.' in api, 'camera-anchor membership invariant missing')
req("review_status) !== 'confirmed'" in api and 'All four camera tracks require confirmed offsets.' in api, 'camera reviewed-offset confirmation missing')
req('The dedicated audio track requires a confirmed offset.' in api, 'audio reviewed-offset confirmation missing')
req("sync_status='confirmed'" in api and 'ready_for_build47: true' in api, 'confirmed-group Build 47 handoff missing')
req("sync_status='needs_review'" in api and 'save_track_adjustment' in api, 'track edits must return group to review')
req('sync_offset_seconds' in client and 'step="0.001"' in client, 'millisecond-level manual offset control missing')
req('sync_confidence' in client and 'manual_review' in client, 'manual confidence/method review controls missing')

# Build 45 dependency and source privacy.
req('build45_sync_ready_input' in api and 'build45_coverage_score' in api, 'Build 45 readiness dependency missing')
req('All four cameras must pass Build 45 media-intelligence readiness before synchronization.' in api, 'Build 45 readiness is not fail-closed at group creation')
req('/admin/grey-hair-sync-alignment/' in b45_page, 'Build 45 intelligence page does not hand off to Build 46')
req('/api/admin/grey-hair-sync-alignment' in client, 'Build 46 browser client is not wired to its authority')

# No new canonical schema or runtime DDL.
canonical_names = sorted(path.name for path in CANONICAL.glob('*.sql'))
req(len(canonical_names) == 4, f'Build 46 unexpectedly changed canonical migration count: {canonical_names}')
req(not any(name.startswith('0005_') for name in canonical_names), 'Build 46 must not add canonical migration 0005')
for forbidden in ('create table', 'alter table', 'drop table', 'create index', 'drop index'):
    req(forbidden not in api.lower(), f'Build 46 endpoint contains request-time DDL token: {forbidden}')

# Build 47 and publication remain outside this feature.
req('Build 47 may consume only a confirmed four-camera group.' in page, 'Build 47 handoff boundary missing from UI')
req('AI story engine' in page and 'publication' in page.lower(), 'later story/publication separation missing')
req('generate_story' not in api and 'generate_timeline' not in api, 'Build 46 must not implement Build 47 story/edit actions')

print('CURRENT GREY HAIR SYNC ALIGNMENT GATE: PASS')
