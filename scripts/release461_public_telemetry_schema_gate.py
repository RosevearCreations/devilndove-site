from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
ROUTES=[ROOT/'functions/api/track/cart.js',ROOT/'functions/api/track/visit.js']
MIGRATION=ROOT/'migrations/dev/20260829_release461_public_telemetry_authority.sql'
DDL=re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE)\b',re.I)
for p in ROUTES: assert not DDL.search(p.read_text(encoding='utf-8')),f'public telemetry DDL remains in {p}'
cart=ROUTES[0].read_text(encoding='utf-8'); visit=ROUTES[1].read_text(encoding='utf-8')
assert 'analytics_write_unavailable' in cart and 'analytics_write_unavailable' in visit
m=MIGRATION.read_text(encoding='utf-8'); assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b',m,re.I)
for t in ('site_visitors','site_visitor_sessions','site_page_views','site_search_events','cart_activity','PRAGMA foreign_key_check'): assert t in m
print('RELEASE 461 PUBLIC TELEMETRY SCHEMA SOURCE GATE: PASS')
