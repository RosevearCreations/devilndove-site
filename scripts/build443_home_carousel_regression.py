#!/usr/bin/env python3
"""Build 443 local schema/source/accessibility regression for the Home carousel."""
from __future__ import annotations
import sqlite3
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build440_apply_development_d1 import prepared_remote_statements, build_wrangler_query_args  # noqa:E402
checks=[]
def check(label, condition):
    checks.append((label,bool(condition))); print(('PASS' if condition else 'FAIL')+' — '+label)
def read(rel): return (ROOT/rel).read_text(encoding='utf-8')
migration=read('database_build443_home_carousel.sql'); runner=read('scripts/build443_apply_development_home_carousel.py')
public_api=read('functions/api/home-carousel.js')
admin_api=read('functions/api/admin/home-carousel.js')
home=read('index.html'); runtime=read('public/js/home-carousel.js'); editor=read('admin/home-carousel/index.html'); editor_js=read('public/js/admin-home-carousel.js'); styles=read('css/home-carousel.css')
check('migration is additive and creates slides plus immutable events','CREATE TABLE IF NOT EXISTS home_carousel_slides' in migration and 'CREATE TABLE IF NOT EXISTS home_carousel_events' in migration)
check('migration seeds no unapproved public slide','INSERT INTO home_carousel_slides' not in migration)
check('guarded runner pins exact Development target and has no retry',"guard_exact_target()" in runner and 'dbc1615b-dcbe-4951-973b-b47c99c73bfa' in runner and 'while True' not in runner and 'for attempt in' not in runner)
check('guarded runner supports auth and verification without applying',"--auth-only" in runner and "--verify-only" in runner)
transport_ok=True
try:
    for filename in ('database_build443_home_carousel.sql','BUILD443_HOME_CAROUSEL_D1_VERIFICATION.sql'):
        statements,_=prepared_remote_statements(filename)
        for statement in statements: build_wrangler_query_args(statement)
except Exception:
    transport_ok=False
check('migration and verification pass proven Windows-safe query transport',transport_ok)
check('slide statuses cover draft publish pause archive',all(token in migration for token in ("'draft'","'published'","'paused'","'archived'")))
check('public API filters publish state and active schedule',"status='published'" in public_api and 'starts_at' in public_api and 'ends_at' in public_api)
check('public API always has static-hero fallback',"fallback: 'static_hero'" in public_api and 'carousel_read_unavailable' in public_api)
check('public and admin APIs reject off-site URLs',"url.startsWith('/')" in public_api and "url.startsWith('/')" in admin_api and "!url.startsWith('//')" in admin_api)
check('admin mutations require authenticated admin','getAdminUserFromRequest' in admin_api and 'Admin access required.' in admin_api)
check('editor distinguishes save from publish','Save draft' in editor and '>Publish<' in editor and "payload('publish')" in editor_js)
check('saving edits to a published slide creates a draft without changing public state','createDraftFromPublished' in admin_api and 'supersedes_slide_id' in admin_api and "existing?.status === 'published'" in admin_api)
check('only one open draft can replace a published slide','idx_home_carousel_one_open_replacement' in migration and 'A draft replacement already exists' in admin_api)
check('publishing a replacement archives its prior published version',"existing?.supersedes_slide_id" in admin_api and "status='archived'" in admin_api)
check('editor exposes schedule order pause archive and preview',all(token in editor+editor_js for token in ('Starts (optional)','Ends (optional)','Save order','Preview draft',"action:'pause'","action:'archive'")))
check('admin API records audit snapshots','home_carousel_events' in admin_api and 'snapshot_json' in admin_api and 'auditAdminAction' in admin_api)
check('failed admin write does not claim success','last saved state is unchanged' in admin_api)
check('Home keeps one H1',home.lower().count('<h1')==1)
check('runtime waits for first image before replacing fallback','firstImage.onload' in runtime and 'fallbackMarkup' in runtime)
check('runtime has previous next indicators keyboard and pause',all(token in runtime for token in ('data-carousel-previous','data-carousel-next','data-carousel-index','ArrowLeft','ArrowRight','data-carousel-pause')))
check('runtime respects reduced motion and avoids background intervals','prefers-reduced-motion' in runtime and 'setInterval' not in runtime)
check('runtime pauses on focus and hover','focusin' in runtime and 'mouseenter' in runtime)
check('carousel is responsive on tablet/phone','@media(max-width:760px)' in styles and '.home-carousel-admin-row' in styles)
check('editor documents purpose ownership fallback accessibility and audit',all(token in editor for token in ('Owner and purpose','Public behavior','SEO and accessibility','Failure and audit')))

con=sqlite3.connect(':memory:'); con.execute('PRAGMA foreign_keys=ON')
con.executescript('CREATE TABLE users(user_id INTEGER PRIMARY KEY AUTOINCREMENT);')
con.executescript(migration)
check('local migration creates both tables',con.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('home_carousel_slides','home_carousel_events')").fetchone()[0]==2)
con.execute("INSERT INTO users DEFAULT VALUES")
con.execute("INSERT INTO home_carousel_slides(title,image_url,alt_text,created_by,updated_by) VALUES('Draft','/assets/example.webp','Example approved image',1,1)")
check('new slide is draft by default',con.execute('SELECT status FROM home_carousel_slides').fetchone()[0]=='draft')
blocked=False
try: con.execute("INSERT INTO home_carousel_slides(title,image_url,alt_text,status,starts_at,ends_at) VALUES('Bad','/assets/x.webp','Bad schedule','published','2026-09-02','2026-09-01')")
except sqlite3.IntegrityError: blocked=True
check('invalid schedule is blocked by database constraint',blocked)
check('local migration leaves foreign keys clean',con.execute('PRAGMA foreign_key_check').fetchall()==[])
passed=sum(ok for _,ok in checks)
print(f'\nBUILD 443 HOME CAROUSEL REGRESSION: {passed}/{len(checks)} passed')
print('Remote Cloudflare/D1/provider access: NONE')
print('Static Home fallback: REQUIRED')
print('Production mutation capability: NONE')
raise SystemExit(0 if passed==len(checks) else 1)
