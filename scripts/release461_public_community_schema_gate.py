from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]; route=ROOT/'functions/api/community-content.js'; service=ROOT/'functions/api/_lib/publicCommunityReadService.js'; migration=ROOT/'migrations/dev/20260829_release461_public_community_authority.sql'
DDL=re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE)\b',re.I)
for p in (route,service): assert not DDL.search(p.read_text(encoding='utf-8')),f'public community DDL remains in {p}'
r=route.read_text(encoding='utf-8'); assert 'ensureCommunityEventsTable' not in r and 'ensurePickupProfilesTable' not in r and 'ensureEventVendorApplicationsTable' not in r; assert 'hasPublicCommunitySchema' in r and 'community_schema_unavailable' in r
m=migration.read_text(encoding='utf-8'); assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b',m,re.I)
for t in ('community_events','pickup_profiles','event_vendor_applications','PRAGMA foreign_key_check'): assert t in m
print('RELEASE 461 PUBLIC COMMUNITY SCHEMA SOURCE GATE: PASS')
