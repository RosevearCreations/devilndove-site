#!/usr/bin/env python3
"""Fail-closed Release 467 Build 50 reviewed CAIP to Content Studio handoff gate."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions/api/admin/grey-hair-content-studio-handoff.js'
PAGE = ROOT / 'admin/grey-hair-content-studio-handoff/index.html'
CLIENT = ROOT / 'public/js/admin-grey-hair-content-studio-handoff-v50.js'
BUILD48_API = ROOT / 'functions/api/admin/grey-hair-production-acceptance.js'
BUILD48_PAGE = ROOT / 'admin/grey-hair-production-acceptance/index.html'
CONTENT_API = ROOT / 'functions/api/admin/content-studio.js'
CONTENT_HELPER = ROOT / 'functions/api/_lib/contentAutomationStudio.js'
AUTHORITY = ROOT / 'release467-build50-reviewed-caip-content-studio-handoff.json'
CANONICAL = ROOT / 'migrations/canonical'

for path in (API, PAGE, CLIENT, BUILD48_API, BUILD48_PAGE, CONTENT_API, CONTENT_HELPER, AUTHORITY):
    if not path.is_file():
        raise SystemExit(f'FAIL — missing Build 50 authority: {path.relative_to(ROOT)}')

api = API.read_text(encoding='utf-8')
page = PAGE.read_text(encoding='utf-8')
client = CLIENT.read_text(encoding='utf-8')
b48_api = BUILD48_API.read_text(encoding='utf-8')
b48_page = BUILD48_PAGE.read_text(encoding='utf-8')
content_api = CONTENT_API.read_text(encoding='utf-8')
helper = CONTENT_HELPER.read_text(encoding='utf-8')
authority = AUTHORITY.read_text(encoding='utf-8')

forbidden_ddl = re.compile(r'\b(?:CREATE|ALTER|DROP|RENAME)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b', re.I)
if forbidden_ddl.search(api) or forbidden_ddl.search(client):
    raise SystemExit('FAIL — Build 50 API/client contains request-time schema DDL')

expected = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]
canonical_files = sorted(p.name for p in CANONICAL.glob('*.sql'))
if canonical_files != expected:
    raise SystemExit(f'FAIL — Build 50 must not add canonical migration 0005; found {canonical_files!r}')

checks = {
    'Build 50 identity': "const BUILD = 50" in api and 'Reviewed CAIP to Content Studio Handoff' in api,
    'Build 49 final closure ingested before feature mutation': all(token in authority for token in ('28307cd8939329db05dab61c336d0c7a49f8759e','0120c5ca4ccaabb00f3f4ef6f685ae0f8fabcaf7','33929301077','33929301018','33929301051','33929300999')),
    'Build 48 authority composed': "getBuild48Acceptance" in api and "./grey-hair-production-acceptance.js" in api,
    'Build 48 remains fail closed': "ACCEPTED_FOR_CONTROLLED_PRODUCTION" in b48_api and "blockers.length ? 'HOLD'" in b48_api,
    'explicit POST required for mutation': 'export async function onRequestGet' in api and 'export async function onRequestPost' in api,
    'Build 48 exact timeline re-proven before handoff': "acceptance.decision !== 'ACCEPTED_FOR_CONTROLLED_PRODUCTION'" in api and 'caip_edit_timeline_draft_id' in api,
    'approved story and timeline rechecked': "lower(story.story_status) !== 'approved'" in api and "lower(timeline.timeline_status) !== 'approved'" in api,
    'existing Creative Process identity required': "source_type) !== 'creative_work_project'" in api and 'creative_work_projects' in api,
    'existing Content Studio authority reused': 'createOrRefreshContentProjectForCreativeProject' in api and '../_lib/contentAutomationStudio.js' in api,
    'no duplicate Content Studio schema authority': 'content_projects' in helper and 'createOrRefreshContentProjectForCreativeProject' in helper,
    'exact planning provenance copied': all(token in api for token in ('build48_package_id','caip_capture_group_id','caip_story_builder_draft_id','caip_edit_timeline_draft_id','creative_media_evidence_range_id')),
    'timecodes and camera sync retained': all(token in api for token in ('source_in_seconds','source_out_seconds','timeline_in_seconds','timeline_out_seconds','camera_label','sync_offset_seconds')),
    'private raw URLs excluded from Build 50 plan': 'raw_public_r2_urls: false' in api and 'source_url' not in api,
    'handoff stays review first': "deliverable_status='ready_for_review'" in api and "approval_status='needs_review'" in api and "handoff_status='ready_for_review'" in api,
    'generated copy locked against generic refresh': "generated_by=?" in api and 'copy_locked=1' in api and 'build50_reviewed_caip_handoff' in api,
    'finished outputs and social link cleared': 'output_url=NULL' in api and 'thumbnail_url=NULL' in api and 'social_post_queue_id=NULL' in api,
    'social queue service not called': 'queueSocialDeliverable' not in api and 'send_to_social_queue' not in api,
    'provider/render/publication/social/R2 closed': all(token in api for token in ('provider_execution_active: false','media_rendering_active: false','publication_active: false','social_queue_active: false','r2_mutation_active: false')),
    'schema/main/Production closed': all(token in api for token in ('request_time_ddl: false','schema_change: false','main_mutation: false','production_contacted: false','automatic_production_promotion: false')),
    'no external provider fetch': 'fetch(' not in api and 'OPENAI' not in api.upper() and 'ANTHROPIC' not in api.upper(),
    'Content Studio publication remains separately governed': 'queueSocialDeliverable' in content_api and 'review_first_no_auto_publish' in content_api,
    'operator workspace exists': all(token in page for token in ('Reviewed CAIP → Content Studio Handoff','Re-prove Build 48 acceptance','Hand off to Content Studio review','Build boundary')),
    'workspace exposes execution boundary': all(token in page for token in ('Rendering','provider execution','publication','social queueing','R2 mutation','Production')),
    'client uses only Build 50 handoff API': '/api/admin/grey-hair-content-studio-handoff' in client and '/api/admin/content-studio' not in client,
    'client requires accepted decision': "decision === 'ACCEPTED_FOR_CONTROLLED_PRODUCTION'" in client and 'handoff.disabled' in client,
    'client has no polling or provider execution': 'setInterval' not in client and 'fetch(' not in client and 'provider' in client.lower(),
    'Build 48 links forward to Build 50': '/admin/grey-hair-content-studio-handoff/' in b48_page and 'Build 50 handoff' in b48_page,
    'canonical migrations unchanged': '"canonical_d1_migration_count": 4' in authority,
    'Production baseline preserved in Build 50 authority': '816490a9f36ffc2a730d8149549e5a2fbd609966' in authority and '2c1b4a3694779996e1bdb094be5e9e043834276e' in authority,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('FAIL — Build 50 reviewed CAIP Content Studio handoff regression: ' + '; '.join(failed))

print('CURRENT GREY HAIR CONTENT STUDIO HANDOFF GATE: PASS')
