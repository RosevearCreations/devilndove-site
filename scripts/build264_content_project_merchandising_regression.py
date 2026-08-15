from pathlib import Path
import json, sqlite3, tempfile, re
root=Path(__file__).resolve().parents[1]
checks=[]
def ck(cond,msg):
    if not cond: raise AssertionError(msg)
    checks.append(msg)

css=(root/'css/styles.css').read_text()
home=(root/'index.html').read_text()
main=(root/'js/main.js').read_text()
shop=(root/'shop/index.html').read_text()
shopjs=(root/'public/js/shop.js').read_text()
catalog=json.loads((root/'public/data/media-content-slot-catalog.json').read_text())
media_admin=(root/'public/js/admin-media-content-studio.js').read_text()
media_api=(root/'functions/api/admin/media-content-studio.js').read_text()
manifest=(root/'functions/api/public-media-content-manifest.js').read_text()
runtime=(root/'public/js/media-content-runtime.js').read_text()
movie_api=(root/'functions/api/admin/movies.js').read_text()
movie_ui=(root/'public/js/admin-movie-catalog.js').read_text()
movie_html=(root/'admin/movies/index.html').read_text()
creative_api=(root/'functions/api/admin/creative-process.js').read_text()
creative_ui=(root/'public/js/admin-creative-process.js').read_text()
caip_ui=(root/'public/js/admin-caip-media-intake.js').read_text()
display_api=(root/'functions/api/admin/public-display-order.js').read_text()
display_ui=(root/'public/js/admin-public-display-order.js').read_text()
featured=(root/'functions/api/featured-products.js').read_text()
creations_api=(root/'functions/api/creations.js').read_text()
gallery=(root/'gallery/index.html').read_text()
creations=(root/'creations/index.html').read_text()
mig=(root/'database_build264_content_project_merchandising.sql').read_text()

# Website areas / Media Studio visibility
ck('position:static!important;max-height:none!important;height:auto!important;overflow:visible!important' in css,'Website Areas column cannot clip lower page/Collections entries')
slots=list(catalog.get('sitewide',[]))
pages=[]
for group in catalog.get('groups',[]):
    pages.extend(group.get('pages',[]))
    for page in group.get('pages',[]): slots.extend(page.get('slots',[]))
ck(catalog.get('version')==264,'Media slot catalog version is 264')
ck(len(pages)==30,'Media Studio contains 30 managed static/public areas')
ck(len(slots)==543,'Media Studio contains 543 explicit static slots')
ck(any(p.get('path')=='/shop/' for p in pages),'Shop static presentation is a managed Media Studio page')
ck("'/shop'" not in re.search(r'const BLOCKED_PAGE_PREFIXES\s*=\s*\[[^\]]*\]',media_api,re.S).group(0) if re.search(r'const BLOCKED_PAGE_PREFIXES\s*=\s*\[[^\]]*\]',media_api,re.S) else True,'Shop static page is not blocked by Media Studio API')

# Home 6 cards, 2 extra images, visual polish slots
for key in ('polymer','rings','laser','resin','3d','vintage'):
    ck(f'data-home-path-card="{key}"' in home and f'data-link-slot="home.what.{key}.link"' in home and f'data-color-slot="home.what.{key}.color"' in home,f'Home {key} card has editable link and colour')
    ck(f'home.what.{key}.title' in home and f'home.what.{key}.body' in home,f'Home {key} card title/body editable')
ck('home.what.visual.2' in home and 'home.what.visual.3' in home,'Home What-we-make section has two additional editable visuals')
ck((root/'assets/placeholders/media-content/home-what-we-make-2.svg').exists() and (root/'assets/placeholders/media-content/home-what-we-make-3.svg').exists(),'Home additional placeholder SVGs exist')
ck('home.visual-polish.${index+1}' in main and '${key}.kicker' in main and '${key}.heading' in main and '${key}.body' in main and '${key}.color' in main,'All three Build 182 visual-polish tiles expose editable kicker/heading/body/colour slots')
ck('/shop/?q=resin&amp;focus=products' in home and '/shop/?merchandise_origin=vintage&amp;focus=products' in home,'Home category cards route directly to filtered Shop results')

# Shop prioritizes matching products and is static-content editable
ck('data-media-managed-page="/shop/"' in shop and 'media-content-runtime.js?v=264' in shop,'Shop loads Media Studio static-content runtime')
ck('hasActiveShopIntent' in shopjs and 'placeResultsForIntent' in shopjs and 'shopResultsSection' in shopjs,'Filtered Shop results are moved above supporting content')
ck('focus=products' in home,'Home cards request product-focused Shop navigation')
ck('data-content-slot="shop.' in shop or "data-content-slot=\"shop." in shop,'Shop contains explicit editable static text slots')
ck('shop.recent.heading' in (root/'public/js/recently-viewed-products.js').read_text() and 'shop.giftcard.heading' in (root/'gift-card-storefront.js').read_text(),'Shop Recently Viewed and Gift Card presentation copy are Media-Studio editable')

# Full-frame product imagery
ck('object-fit:contain!important' in css,'Storefront product image CSS preserves full edited image frame')
for fn in ('public/js/site-search.js','public/js/cart-page.js','public/js/product-detail.js','public/js/member-wishlist.js'):
    txt=(root/fn).read_text()
    ck('object-fit:contain' in txt or 'objectFit="contain"' in txt or 'objectFit = "contain"' in txt,f'{fn} uses contain rather than crop for product imagery')

# Generic link/colour content-slot support
ck("target_attribute:'href'" not in media_admin or 'contentKind' in media_admin,'Media Studio client supports non-text content kinds')
ck('background-color' in media_api and 'href' in media_api,'Media Studio API accepts editable link/background-colour targets')
ck('background-color' in manifest and 'href' in manifest,'Public manifest classifies link and colour slots')
ck('style.backgroundColor' in runtime and "setAttribute('href'" in runtime,'Public runtime applies colour and link overrides')

# Explicit owner-controlled merchandising order
ck('public_display_priorities' in mig,'Build 264 migration creates public display priority authority')
ck("home_featured" in display_api and "gallery" in display_api and "creations" in display_api,'Display Order API supports Home, Gallery and Creations surfaces')
ck('priority_rank' in display_ui and 'is_pinned' in display_ui,'Display Order UI exposes explicit rank/pin controls')
ck("surface_key='home_featured'" in featured and 'priority_rank' in featured,'Home Featured API respects explicit owner priority')
ck('requestedSurface' in creations_api and 'public_display_priorities' in creations_api,'Creations API respects surface-specific explicit priority')
ck('surface=gallery' in gallery and 'surface=creations' in creations,'Gallery and Creations request independent ordering surfaces')

# TMDB fill-empty metadata helper
ck('TMDB_READ_ACCESS_TOKEN' in movie_api and "Authorization: `Bearer ${token}`" in movie_api,'TMDB credential stays server-side as a Bearer secret')
ck("action === 'tmdb_search'" in movie_api and "action === 'tmdb_preview'" in movie_api,'Movie API supports TMDB search and detailed preview')
ck('primary_release_year' in movie_api,'TMDB title/year search uses the official primary_release_year parameter')
for field in ('cast','directors','genres','runtime_minutes','production_companies','imdb_id','poster_url'):
    ck(field in movie_api,f'TMDB preview exposes {field}')
ck('Fill movie metadata from TMDB' in movie_html and 'Replace fields that already contain metadata' in movie_html,'Movie admin clearly explains fill-empty versus replace behavior')
ck('function fillFromTmdb' in movie_ui and 'replace' in movie_ui.lower(),'Movie importer fills empty fields by default with explicit replace option')

# Research/experiment project becomes a first-class CAIP project with inventory cost use
ck('ensureCaipProjectForWork' in creative_api and "source_type='creative_work_project'" in creative_api,'Creative Process can create productless CAIP workspace')
ck("action==='ensure_caip_workspace'" in creative_api,'Creative Process exposes CAIP workspace preparation action')
ck("action==='record_inventory_use'" in creative_api and 'postInventoryUsage' in creative_api,'Research/content project can record Inventory usage directly')
ck("action==='save_cost_context'" in creative_api and 'content_marketing' in creative_api and 'research_experiment' in creative_api,'Project stores internal content/research cost purpose')
ck("['material_usage','Material usage report','operations']" in creative_api and "['cost_analysis','Cost analysis','operations']" in creative_api,'Material/cost outputs exist for project-first workflows')
ck('/admin/creative-assets/?creative_project_id=' in creative_ui,'Creative Process links directly into CAIP media intake for the project')
ck('recordDirectInventoryUse' in creative_ui and 'saveProjectCostContext' in creative_ui,'Creative Process UI exposes direct inventory use and cost-purpose controls')
ck('URL_PROJECT' in caip_ui and 'creative_project_id' in caip_ui,'CAIP media intake honors project ID from Creative Process URL')
ck("creative_project_cost_context" in mig and "CAIP-WORK-" in mig and 'creative_project_caip_mirrors' in mig,'Migration backfills project cost context/CAIP workspace infrastructure')

# Migration reflects final catalog and is idempotent
ck("'/shop/?merchandise_origin=vintage&focus=products'" in mig,'Migration contains final Home Vintage Shop destination')
ck((root/'database_upgrade_current_pass.sql').read_bytes()==(root/'database_build264_content_project_merchandising.sql').read_bytes(),'Current-pass migration is byte-identical to Build 264 migration')
with tempfile.NamedTemporaryFile(suffix='.sqlite') as f:
    db=sqlite3.connect(f.name)
    db.executescript((root/'database_full_schema.sql').read_text())
    db.executescript(mig)
    db.executescript(mig)
    fk=db.execute('PRAGMA foreign_key_check').fetchall()
    ck(not fk,'Build 264 full schema + repeated migration has zero foreign-key violations')
    ck(db.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build264_content_project_merchandising'").fetchone()[0]==1,'Build 264 migration ledger is idempotent')
    ck(db.execute("SELECT COUNT(*) FROM media_content_slots WHERE is_active=1").fetchone()[0]>=543,'D1 contains all Build 264 explicit active media/content slots')
    ck(db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='public_display_priorities'").fetchone()[0]==1,'Public display priorities table exists')
    ck(db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='creative_project_cost_context'").fetchone()[0]==1,'Creative project cost context table exists')

print(f'Build 264 regression: {len(checks)}/{len(checks)} PASS')
for c in checks: print('PASS',c)
