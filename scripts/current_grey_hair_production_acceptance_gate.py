#!/usr/bin/env python3
"""Fail-closed Release 467 Build 48 Grey Hair automated production acceptance gate."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions/api/admin/grey-hair-production-acceptance.js'
PAGE = ROOT / 'admin/grey-hair-production-acceptance/index.html'
CLIENT = ROOT / 'public/js/admin-grey-hair-production-acceptance-v48.js'
BUILD47_API = ROOT / 'functions/api/admin/grey-hair-story-edit-planning.js'
BUILD47_PAGE = ROOT / 'admin/grey-hair-story-edit-planning/index.html'
CANONICAL = ROOT / 'migrations/canonical'

for path in (API, PAGE, CLIENT, BUILD47_API, BUILD47_PAGE):
    if not path.is_file():
        raise SystemExit(f'FAIL — missing Build 48 authority: {path.relative_to(ROOT)}')

api = API.read_text(encoding='utf-8')
page = PAGE.read_text(encoding='utf-8')
client = CLIENT.read_text(encoding='utf-8')
b47_api = BUILD47_API.read_text(encoding='utf-8')
b47_page = BUILD47_PAGE.read_text(encoding='utf-8')

forbidden_ddl = re.compile(r'\b(?:CREATE|ALTER|DROP|RENAME)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b', re.I)
if forbidden_ddl.search(api):
    raise SystemExit('FAIL — Build 48 API contains request-time schema DDL')
if forbidden_ddl.search(client):
    raise SystemExit('FAIL — Build 48 client contains schema DDL')

canonical_files = sorted(p.name for p in CANONICAL.glob('*.sql'))
expected = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]
if canonical_files != expected:
    raise SystemExit(f'FAIL — Build 48 must not add canonical migration 0005; found {canonical_files!r}')

checks = {
    'Build 48 identity': "const BUILD = 48" in api and "Automated Production Acceptance" in api,
    'Build 47 authority composed not duplicated': "getBuild47Planning" in api and "./grey-hair-story-edit-planning.js" in api,
    'GET-only acceptance API': 'export async function onRequestGet' in api and 'onRequestPost' not in api,
    'strict Grey Hair identity': 'isGreyHair' in api and 'accepts only the dedicated Grey Hair CAIP project' in api,
    'confirmed Build 46 group required': "ready_for_build47 === true" in api and "sync_status" in api,
    'exactly four cameras protected': "cameras.length === 4" in api and "Exactly four distinct cameras" in api,
    'all synchronization tracks confirmed': "tracks.every((row) => lower(row.review_status) === 'confirmed')" in api,
    'approved Build 47 story required': "lower(story?.story_status) === 'approved'" in api,
    'story reviewer identity required': "reviewed_by_user_id" in api and "reviewed_at" in api,
    'approved Build 47 timeline required': "lower(timeline?.timeline_status) === 'approved'" in api,
    'timeline provider closed': "provider_execution_status" in api and "=== 'closed'" in api,
    'current approved evidence inherited': "evidenceById" in api and "story_evidence_current" in api and "r.marker_status='active' AND r.review_status='approved'" in b47_api,
    'exact story-to-clip evidence coverage': 'exact_story_clip_coverage' in api and 'sameCoverage' in api,
    'clip source bounds checked': 'clip_source_bounds' in api and 'sourceIn < evidenceIn' in api and 'sourceOut > evidenceOut' in api,
    'timeline continuity checked': 'timeline_contiguous' in api and 'closeEnough(timelineIn, cursor)' in api,
    'camera sync offsets preserved': 'camera_sync_preserved' in api and 'clip.sync_offset_seconds' in api and 'track.sync_offset_seconds' in api,
    'target duration checked': 'target_duration' in api and 'total <= target + TOLERANCE' in api,
    'plan and draft duration must agree': 'plan_total_matches' in api,
    'fail-closed decision': "blockers.length ? 'HOLD' : 'ACCEPTED_FOR_CONTROLLED_PRODUCTION'" in api,
    'accepted handoff authorizes no execution': 'render_execution_authorized: false' in api and 'provider_execution_authorized: false' in api and 'publication_authorized: false' in api and 'r2_mutation_authorized: false' in api,
    'provider/render/publication/R2 policy closed': all(token in api for token in ('provider_execution_active: false','media_rendering_active: false','publication_active: false','r2_mutation_active: false')),
    'main and Production untouched': 'main_mutation: false' in api and 'production_contacted: false' in api and 'automatic_production_promotion: false' in api,
    'no external provider fetch': 'fetch(' not in api and 'OPENAI' not in api.upper() and 'ANTHROPIC' not in api.upper(),
    'operator workspace exists': all(token in page for token in ('Automated Production Acceptance','Run Acceptance','Acceptance summary','Build 48 owns acceptance metadata only')),
    'client exposes read-only boundary': all(token in client for token in ('DDGreyHairProductionAcceptance','readOnly: true','providerExecution: false','mediaRendering: false','publication: false','r2Mutation: false','productionContacted: false')),
    'acceptance UI shows checks and blockers': 'Acceptance checks' in client and 'Blockers' in client and 'ACCEPTED_FOR_CONTROLLED_PRODUCTION' in client,
    'sanitized package only': 'Copy Sanitized Package' in page and 'sanitized' in client,
    'Build 47 handoff links Build 48': '/admin/grey-hair-production-acceptance/' in b47_page and 'Build 48 handoff' in b47_page,
    'Build 48 boundary explicit': 'does not authorize a renderer' in page and 'application Production promotion' in page,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('FAIL — Build 48 automated production acceptance regression: ' + '; '.join(failed))

print('CURRENT GREY HAIR PRODUCTION ACCEPTANCE GATE: PASS')
