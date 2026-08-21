from pathlib import Path
import re, sqlite3, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name, cond):
    checks.append((name,bool(cond)))
    print(('PASS' if cond else 'FAIL'), name)
    if not cond: raise AssertionError(name)
def text(rel): return (ROOT/rel).read_text(encoding='utf-8')

track=text('functions/api/track/visit.js')
client=text('public/js/site-analytics.js')
live=text('public/js/admin-live-activity.js')
summary=text('functions/api/admin/dashboard-summary.js')
summary_client=text('public/js/admin-dashboard-summary.js')
mobile=text('public/js/admin-mobile-dashboard.js')
today=text('public/js/admin-today-tasks.js')
smoke=text('public/js/admin-dashboard-smoke-badges.js')
preflight=text('public/js/admin-dashboard-preflight-badge.js')
auth=text('public/js/auth.js')
checkout=text('public/js/checkout.js')
caip=text('functions/api/_lib/caipMediaIntake.js')
caip_mirror=text('_lib/caipMediaIntake.js')
caip_route=text('functions/api/admin/caip-media-intake.js')
part_route=text('functions/api/admin/caip-media-upload-part.js')
caip_client=text('public/js/admin-caip-media-intake.js')
wrangler=text('wrangler.toml')

# Analytics hot path
check('Track endpoint marked Build 279 lightweight', 'Build 279' in track and 'lightweight public analytics' in track)
check('Track endpoint has no sqlite_master probe', 'sqlite_master' not in track)
check('Track endpoint has no PRAGMA probe', 'PRAGMA table_info' not in track)
check('Track endpoint has no request-time ALTER TABLE', 'ALTER TABLE' not in track)
check('Track endpoint removed IP hashing', 'sha256Hex' not in track and 'CF-Connecting-IP' not in track)
check('Track endpoint excludes admin paths', "path.startsWith('/admin/')" in track)
check('Track endpoint excludes bots cheaply', 'automated_client' in track)
check('Visitor insert is one UPSERT', 'ON CONFLICT(visitor_token) DO UPDATE SET' in track and 'RETURNING site_visitor_id' in track)
check('Session insert is one UPSERT', 'ON CONFLICT(site_visitor_id, session_token) DO UPDATE SET' in track and 'RETURNING site_visitor_session_id' in track)
check('Analytics fails open', "reason: 'analytics_write_unavailable'" in track)
check('Client excludes admin before POST', "if (isAdmin) return" in client)
check('Client throttles page views 15 minutes', 'PAGE_VIEW_WINDOW_MS = 15 * 60 * 1000' in client)
check('Client omits credentials for public analytics', "credentials: 'omit'" in client)
check('No generic cart-active exit event', 'cart_active_exit' not in client)
check('Checkout abandonment limited to checkout path', "path.includes('/checkout/')" in client and 'cart_abandoned' in client)

# Checkout and retry amplification
check('Checkout recovery is throttled', 'RECOVERY_WRITE_WINDOW_MS = 60 * 1000' in checkout)
check('Checkout unload uses beacon', "captureRecoveryLead({ force: true, beacon: true })" in checkout)
check('Checkout no duplicate checkout_started call', "source: 'checkout_ready'" not in checkout)
check('Shared API helper does not retry Cloudflare resource limit', 'error?.isCloudflareResourceLimit' in auth)

# Admin idle request reduction
check('Live Activity no setInterval polling', 'setInterval' not in live)
check('Live Activity exposes manual refresh', 'Refresh Live Feed' in live)
check('Dashboard summary uses compact view', '/api/admin/dashboard-summary?view=compact' in summary_client)
check('Mobile dashboard uses mobile_health view', '/api/admin/dashboard-summary?view=mobile_health' in mobile)
check('Dashboard summary uses scoped compact/mobile queries', "view === 'mobile_health'" in summary and 'compactSummary' in summary and 'mobileHealthSummary' in summary)
check('Today tasks has no automatic retry amplification', 'retries:0' in today)
check('Smoke status is opt-in', 'Load smoke status' in smoke and 'DDWhenAdminReady(shell' in smoke and 'DDWhenAdminReady(load' not in smoke)
check('Release status is opt-in', 'Load release status' in preflight and 'DDWhenAdminReady(shell' in preflight and 'DDWhenAdminReady(load' not in preflight)
check('Release/preflight GETs set retries zero', preflight.count('retries:0') >= 2)

# Public schema probes reduced
seo=text('functions/api/seo-page-overrides.js')
reviews=text('functions/api/product-reviews.js')
trust=text('functions/api/trust-blocks.js')
featured=text('functions/api/featured-products.js')
check('SEO override hot path has no sqlite_master/PRAGMA', 'sqlite_master' not in seo and 'PRAGMA table_info' not in seo)
check('Product reviews hot path has no sqlite_master/PRAGMA', 'sqlite_master' not in reviews and 'PRAGMA table_info' not in reviews)
check('Trust blocks hot path has no sqlite_master/PRAGMA', 'sqlite_master' not in trust and 'PRAGMA table_info' not in trust)
check('Featured schema capabilities cached', 'FEATURED_SCHEMA_CACHE_MS' in featured and 'featuredSchemaCache' in featured and 'schemaCapabilities' in featured)
check('Featured table existence checks consolidated', "name IN ('public_display_priorities','product_image_annotations','media_consent_records')" in featured)

# CAIP request multiplication reductions + integrity retention
check('CAIP helper and mirror remain identical', caip == caip_mirror)
check('CAIP helper reports Build 279', "CAIP_MEDIA_INTAKE_BUILD = 'Build 279'" in caip)
check('CAIP successful base schema verification cached', 'caipBaseSchemaVerified' in caip and 'if (caipBaseSchemaVerified) return true' in caip)
check('CAIP Build269 column readiness cached', 'caipBuild269SchemaVerified' in caip)
check('Per-part route no schema assertion', 'assertCaipMediaIntakeSchema' not in part_route)
check('Per-part session aggregation is periodic', 'integer(partNumber) % 8 === 0' in caip)
record_block=caip[caip.index('export async function recordUploadedPart'):caip.index('export async function recordPartFailure')]
check('Per-part response no full parts reload', 'uploadedPartState' not in record_block and 'SELECT caip_media_upload_file_id' in record_block)
check('CAIP compact control-plane response exists', 'compact_response' in caip_route and 'compactResponse' in caip_route)
check('CAIP client requests compact responses', caip_client.count('compact_response:true') >= 3)
# Integrity guard remains fail-closed
check('Multipart completion requires exact part row count', 'parts.length===expectedParts' in caip)
check('Multipart completion requires uploaded count and distinct parts', 'uploaded.length===expectedParts' in caip and 'distinct.size===expectedParts' in caip)
check('Multipart completion requires contiguous range', 'first===1&&last===expectedParts' in caip)
check('Multipart completion requires exact bytes', 'uploadedBytes===expectedBytes' in caip)
check('Multipart completion verifies R2 HEAD', 'const head=await bucket.head(file.object_key)' in caip)
check('R2 HEAD size must match D1', 'numeric(head.size)!==expectedBytes' in caip)

# Observability/config
check('Workers Logs enabled in Wrangler', '[observability]' in wrangler and 'enabled = true' in wrangler)
check('Workers Logs capture invocation baseline', 'head_sampling_rate = 1' in wrangler)
check('Compatibility date deliberately unchanged', 'compatibility_date = "2026-04-08"' in wrangler)

# Cache-busting
htmls=list(ROOT.rglob('*.html'))
check('No unversioned auth.js HTML refs', all('/public/js/auth.js"' not in p.read_text(errors='ignore') for p in htmls))
check('No unversioned site analytics HTML refs', all('/public/js/site-analytics.js"' not in p.read_text(errors='ignore') for p in htmls))
check('Checkout cache-busted to 279', '/public/js/checkout.js?v=279' in text('checkout/index.html'))
check('CAIP intake cache-busted to 279', '/public/js/admin-caip-media-intake.js?v=279' in text('admin/creative-assets/index.html'))

# Aggregate schema authority / fresh install
full=text('database_full_schema.sql')
check('Fresh full schema defines session UTM columns', re.search(r'CREATE TABLE IF NOT EXISTS site_visitor_sessions \([\s\S]*?utm_source TEXT,[\s\S]*?utm_term TEXT,[\s\S]*?UNIQUE\(site_visitor_id, session_token\)', full) is not None)
check('Fresh full schema defines page-view UTM columns', re.search(r'CREATE TABLE IF NOT EXISTS site_page_views \([\s\S]*?utm_source TEXT,[\s\S]*?utm_term TEXT,[\s\S]*?FOREIGN KEY \(site_visitor_id\)', full) is not None)
admin_logs=re.search(r'CREATE TABLE IF NOT EXISTS admin_logs \(([\s\S]*?)\);',full)
check('Admin logs not accidentally changed by analytics schema sync', admin_logs is not None and 'utm_source' not in admin_logs.group(1))
for schema_name in ['database_full_schema.sql','database_schema.sql','database_store_schema.sql']:
    db=sqlite3.connect(':memory:')
    db.execute('PRAGMA foreign_keys=ON')
    try:
        db.executescript(text(schema_name))
        fk=db.execute('PRAGMA foreign_key_check').fetchall()
    finally:
        db.close()
    check(f'{schema_name} executes with clean foreign keys', len(fk)==0)

# No focused D1 migration is needed for production Build 279; schema authority sync only.
check('No Build 279 D1 migration introduced', not any(ROOT.glob('database_build279*.sql')))

print(f'\nBuild 279: {sum(v for _,v in checks)}/{len(checks)} checks passed')
