#!/usr/bin/env python3
from pathlib import Path
import json, sqlite3, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,cond):
    checks.append((name,bool(cond)));print(('PASS' if cond else 'FAIL'),name)
def txt(p):return (ROOT/p).read_text(encoding='utf-8',errors='ignore')
html=txt(Path('admin/media-content-studio/index.html'))
js=txt(Path('public/js/admin-media-content-studio.js'))
api=txt(Path('functions/api/admin/media-content-studio.js'))
pub=txt(Path('functions/api/public-media-content-manifest.js'))
css=txt(Path('css/styles.css'))
catalog=json.loads(txt(Path('public/data/media-content-page-catalog.json')))
pages=[p for g in catalog['groups'] for p in g['pages']]
paths={p['path'] for p in pages}

check('Build 257 Studio assets cache-busted', ('styles.css?v=257' in html or 'styles.css?v=258' in html) and ('admin-media-content-studio.js?v=257' in html or 'admin-media-content-studio.js?v=258' in html))
check('Manual public path textbox removed', 'type="hidden" value="/"' in html and 'Public page path' not in html)
check('Automatic static page selector present', 'id="mediaPageSelect"' in html and ('media-content-page-catalog.json?v=257' in js or 'media-content-page-catalog.json?v=258' in js))
check('Core friendly pages listed', all(p in paths for p in ['/','/about/','/gallery/','/creations/','/workshop-journal/']))
check('Core labels include Gallery, Showcase and Workroom', all(x in txt(Path('public/data/media-content-page-catalog.json')) for x in ['"Gallery"','"Showcase / Creations"','"Workshop / Workroom Journal"']))
check('Product/tools/supplies routes excluded from catalog', all(p not in paths for p in ['/shop/','/shop/product/','/tools/','/supplies/','/toolshed/']))
check('Sitewide header/background/footer controls present', all(x in html for x in ['data-sitewide-area="header"','data-sitewide-area="background"','data-sitewide-area="footer"']))
check('Home banner/hero quick control present', 'Home Banner / Hero' in html and 'data-section="banner"' in html)
check('Product media type removed from Studio filter', '<option>product</option>' not in html and 'data-type="product"' not in html)
check('Studio explains specialist ownership boundary', 'finished-product pictures, product/catalog media, inventory items, supplies, tools and tool photos' in html)
check('Server excludes product-linked media', 'ma.product_id IS NULL' in api)
check('Server excludes product media type/source types', "LOWER(COALESCE(mm.media_type,'photo')) <> 'product'" in api and 'BLOCKED_SOURCE_TYPES' in api)
check('Server excludes product/inventory/tool/supply object prefixes', all(x in api for x in ["NOT LIKE 'products/%'","NOT LIKE 'inventory/%'","NOT LIKE 'supplies/%'","NOT LIKE 'tools/%'","NOT LIKE 'toolshed/%'"]))
check('R2 product prefix removed from Studio', 'products/' not in html.split('mediaR2Prefix',1)[1].split('</select>',1)[0])
check('R2 sync skips blocked media keys', 'isBlockedMediaKey(key)' in api)
check('Static scanner ignores dynamic product/catalog mounts', all(x in js for x in ["'#grid'","'#catalog'","'#movieGrid'","'.product-grid'","'[data-product-id]'"]))
check('Normal page scan excludes repeated header/footer', "section==='header'||section==='footer'" in js)
check('Static scanner finds general body headings/text', "const textSelector='h1,h2,h3,p,li,a.btn,.badge" in js)
check('Static scanner categorizes banner/gallery/background', all(x in js for x in ["return 'banner'","return 'gallery'","return 'background'"]))
check('Sitewide pseudo page supported by admin API', 'if (path === "@site") return "@site"' in api)
check('Public manifest loads sitewide plus current page', "s.page_path IN ('@site', ?)" in pub)
check('Page-specific overrides are applied after sitewide', "CASE WHEN s.page_path='@site' THEN 0 ELSE 1 END" in pub)
check('Public runtime cache-busted across site', sum('media-content-runtime.js?v=257' in f.read_text(encoding='utf-8',errors='ignore') for f in ROOT.rglob('*.html') if not f.relative_to(ROOT).as_posix().startswith('admin/'))>=50)
check('Build-time page catalog audit exists', (ROOT/'scripts/build_media_content_page_catalog.py').exists())
check('Responsive page-directory CSS present', '.media-sitewide-area-grid' in css and '.media-page-directory-row' in css and '@media(max-width:760px)' in css)
check('No new D1 migration needed', (ROOT/'database_upgrade_current_pass.sql').read_bytes()==(ROOT/'database_build256_media_content_studio.sql').read_bytes())

try:
    subprocess.run([sys.executable,str(ROOT/'scripts/build_media_content_page_catalog.py')],cwd=ROOT,check=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
    check('Static page catalog matches repository files',True)
except Exception as exc:
    print(exc);check('Static page catalog matches repository files',False)

for f in ['public/js/admin-media-content-studio.js','public/js/media-content-runtime.js','functions/api/admin/media-content-studio.js','functions/api/public-media-content-manifest.js']:
    try:
        subprocess.run(['node','--check',str(ROOT/f)],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        check(f'JavaScript syntax {f}',True)
    except Exception as exc:
        print(exc);check(f'JavaScript syntax {f}',False)

for schema in ['database_full_schema.sql','database_schema.sql','database_store_schema.sql']:
    try:
        c=sqlite3.connect(':memory:');c.executescript('PRAGMA foreign_keys=ON;\n'+txt(Path(schema)))
        check(f'{schema} executes',True);check(f'{schema} foreign keys clean',len(c.execute('PRAGMA foreign_key_check').fetchall())==0)
    except Exception as exc:
        print(schema,exc);check(f'{schema} executes',False);check(f'{schema} foreign keys clean',False)

failed=[name for name,ok in checks if not ok]
print(f'\nBuild 257: {len(checks)-len(failed)}/{len(checks)} checks passed')
if failed:
    print('FAILED:');[print('-',x) for x in failed];sys.exit(1)
