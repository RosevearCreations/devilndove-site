#!/usr/bin/env python3
"""Build 444 Development D1/R2 infrastructure authority regression."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)

release = json.loads((ROOT / 'development-release.json').read_text(encoding='utf-8'))
require(release == {'environment': 'development', 'release': 444, 'label': 'Build 444'}, 'development-release.json is not exact Build 444 Development authority')

wrangler = (ROOT / 'wrangler.toml').read_text(encoding='utf-8')
for marker, message in (
    ('name = "devilndove-site-dev"', 'Development Pages project authority missing'),
    ('binding = "DB"', 'D1 DB binding missing'),
    ('database_name = "devilndove-dev"', 'Development D1 name missing'),
    ('database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"', 'Development D1 id missing'),
    ('binding = "PRODUCT_MEDIA_BUCKET"', 'public media R2 binding missing'),
    ('bucket_name = "devilndove-toolshed-images-dev"', 'Development public media R2 bucket missing'),
    ('binding = "CAIP_PRIVATE_MEDIA_BUCKET"', 'private media R2 binding missing'),
    ('bucket_name = "devilndove-caip-media-dev"', 'Development private R2 bucket missing'),
):
    require(marker in wrangler, message)

backend = (ROOT / 'functions/api/admin/infrastructure-readiness.js').read_text(encoding='utf-8')
for marker, message in (
    ("const BUILD = '444';", 'infrastructure readiness build marker missing'),
    ("development_infrastructure_readiness_v2", 'Build 444 infrastructure contract missing'),
    ('SELECT 1 AS ok', 'D1 ping probe missing'),
    ('sqlite_master', 'D1 schema probe missing'),
    ('bucket.list({ limit: 1 })', 'R2 read-only list probe missing'),
    ('current_release_sql_required: false', 'Build 444 no-new-SQL authority missing'),
    ('d1_write: false', 'D1 write prohibition missing'),
    ('r2_write: false', 'R2 write prohibition missing'),
    ('destructive_probe_performed: false', 'destructive-probe prohibition missing'),
    ('build442_apply_development_it_platform.py', 'carried Build 442 correction runner missing'),
    ('build443_apply_development_home_carousel.py', 'carried Build 443 correction runner missing'),
):
    require(marker in backend, message)
for table in ('users', 'sessions', 'products', 'app_module_user_access', 'home_carousel_slides', 'home_carousel_events'):
    require(table in backend, f'D1 required-table check missing: {table}')
for forbidden in ('CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'INSERT INTO', 'DELETE FROM'):
    require(forbidden not in backend.upper(), f'readiness endpoint contains mutation SQL: {forbidden}')
require('captureRuntimeIncident' not in backend, 'read-only readiness endpoint must not write incident records')

frontend = (ROOT / 'public/js/admin-it-platform.js').read_text(encoding='utf-8')
for marker, message in (
    ('Build 444', 'I.T. bridge is not current Build 444'),
    ('it444InfrastructureBridge', 'Build 444 infrastructure bridge id missing'),
    ('Verify D1 / R2 now', 'operator readiness action missing'),
    ('No Build 444 D1 SQL migration is required', 'operator no-new-SQL status copy missing'),
    ('carried_migrations', 'carried migration renderer missing'),
    ('/api/admin/infrastructure-readiness', 'I.T. infrastructure endpoint bridge missing'),
):
    require(marker in frontend, message)

page = (ROOT / 'admin/it-platform/index.html').read_text(encoding='utf-8')
for marker, message in (
    ('Development: Build 444', 'I.T. page current release is not Build 444'),
    ('CAR-444-H1', 'carousel HOLD was not bridged to Build 444'),
    ('IT-444-H1', 'I.T. D1 HOLD was not bridged to Build 444'),
    ('PAY-444-H1', 'Stripe HOLD was not bridged to Build 444'),
    ('PAY-444-H2', 'PayPal HOLD was not bridged to Build 444'),
    ('CAIP-444-H1', 'CAIP HOLD was not bridged to Build 444'),
    ('Build 444 D1 rule:', 'Build 444 D1 operator rule missing'),
    ('build442_apply_development_it_platform.py', 'historical Build 442 correction mechanic missing'),
    ('build443_apply_development_home_carousel.py', 'historical Build 443 correction mechanic missing'),
):
    require(marker in page, message)
require(page.lower().count('<h1') == 1, 'I.T. page must expose exactly one H1')

if errors:
    raise SystemExit('FAIL\n- ' + '\n- '.join(errors))

print('PASS')
print('- Build 444 Development D1/R2 authority is exact and read-only')
print('- Build 444 adds no D1 SQL migration')
print('- Carried Build 442/443 schema requirements remain explicit HOLDs until verified')
print('- Production mutation capability: NONE')
