from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
route = ROOT / 'functions/api/community-content.js'
service = ROOT / 'functions/api/_lib/publicCommunityReadService.js'
helper = ROOT / 'functions/api/_communityContent.js'
migration = ROOT / 'migrations/dev/20260829_release461_public_community_authority.sql'
release_marker = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE|DROP\s+INDEX)\b', re.I)

for path in (route, service, helper):
    text = path.read_text(encoding='utf-8')
    assert not DDL.search(text), f'community runtime DDL remains in {path}'

route_text = route.read_text(encoding='utf-8')
assert 'ensureCommunityEventsTable' not in route_text
assert 'ensurePickupProfilesTable' not in route_text
assert 'ensureEventVendorApplicationsTable' not in route_text
assert 'hasPublicCommunitySchema' in route_text
assert 'community_schema_unavailable' in route_text

helper_text = helper.read_text(encoding='utf-8')
for token in (
    'PRAGMA table_info(',
    'PRAGMA index_list(',
    'requireCommunityTableSchema',
    'ensureCommunityEventsTable',
    'ensurePickupProfilesTable',
    'ensureEventVendorApplicationsTable',
    'idx_community_events_active_start',
    'idx_pickup_profiles_active_sort',
    'idx_event_vendor_applications_event_status',
):
    assert token in helper_text, f'missing read-only shared community readiness token: {token}'

migration_text = migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', migration_text, re.I)
for token in (
    'community_events',
    'pickup_profiles',
    'event_vendor_applications',
    'recurrence_rule',
    'recurrence_interval',
    'application_mode',
    'vendor_capacity',
    'idx_community_events_active_start',
    'idx_pickup_profiles_active_sort',
    'idx_event_vendor_applications_event_status',
    'PRAGMA foreign_key_check',
):
    assert token in migration_text, f'migration is missing community authority token: {token}'

release_text = release_marker.read_text(encoding='utf-8')
assert re.search(r'"release"\s*:\s*460\b', release_text), 'development-release.json must remain at accepted Release 460 until manual D1 acceptance'

subprocess.run(['node', '--check', str(helper)], cwd=ROOT, check=True)
print('RELEASE 461 PUBLIC/SHARED COMMUNITY SCHEMA SOURCE GATE: PASS')
