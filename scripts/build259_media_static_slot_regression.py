#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json,sqlite3,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,cond): checks.append((name,bool(cond)));print(('PASS' if cond else 'FAIL'),name)
def txt(p): return (ROOT/p).read_text(encoding='utf-8',errors='ignore')
html=txt(Path('admin/media-content-studio/index.html'));js=txt(Path('public/js/admin-media-content-studio.js'));runtime=txt(Path('public/js/media-content-runtime.js'));api=txt(Path('functions/api/admin/media-content-studio.js'));css=txt(Path('css/styles.css'))
reg=json.loads(txt(Path('public/data/media-content-slot-catalog.json')))
pages=[p for g in reg['groups'] for p in g['pages']]; slots=list(reg['sitewide'])+[s for p in pages for s in p['slots']]
check('Build 259 admin assets cache-busted','styles.css?v=259' in html and 'admin-media-content-studio.js?v=259' in html)
check('Scanner workflow removed from admin screen','Scan selected area' not in html and 'Make scanned locations editable' not in html and 'mediaInspectPage' not in html)
check('Scanner workflow removed from admin JavaScript','inspectPage' not in js and 'registerSlots' not in js and 'srcdoc' not in js)
check('Explicit slot catalog version 259',reg.get('version')==259)
check('29 static/public pages represented',len(pages)==29)
check('Shared site slots included',len(reg.get('sitewide',[]))==4 and {x['slot_key'] for x in reg['sitewide']}=={'site.header.logo','site.header.background','site.page.background','site.footer.background'})
check('Large explicit site-slot coverage',len(slots)>=450)
check('Image/background/text slot coverage',all(any(s['slot_type']==t for s in slots) for t in ['image','background','text']))
check('No product/shop page in explicit catalog',all(not p['path'].startswith(('/shop/','/tools/','/toolshed/','/supplies/','/admin/')) for p in pages))
check('Studio wording excludes specialist records',all(x in html.lower() for x in ['finished-product','inventory','supplies','tools']))
check('Server excludes product-linked media','ma.product_id IS NULL' in api)
check('Server excludes catalog/finished-product source types','catalog' in api and 'finished_product' in api)
check('Server excludes specialist R2 key patterns',all(x in api for x in ["NOT LIKE 'products/%'","NOT LIKE 'inventory/%'","NOT LIKE 'supplies/%'","NOT LIKE 'tools/%'"]))
check('Admin UI is site map + slot board','id="mediaPageMap"' in html and 'id="mediaSlotBoard"' in html and 'Website areas' in html)
check('Image picker is slot-driven','openPicker' in js and 'Use in this slot' in js and 'Upload & use here' in html)
check('Use original/default supported','Use original/default' in js and 'remove_assignment' in js)
check('Text draft/publish/original supported',all(x in js for x in ['save_content_block','unpublish_content','Save draft','Publish text']))
check('Public runtime has admin-only deep edit links','dd:admin-ready' in runtime and 'Replace placeholder' in runtime and '/admin/media-content-studio/' in runtime)
check('Public runtime applies explicit selectors only','querySelector' in runtime and 'media-content-manifest' in runtime and 'srcdoc' not in runtime and 'DOMParser' not in runtime)
check('Collections keeps existing image as default','/assets/images/site/collection-overview.webp' in next(s['source_snapshot'] for p in pages if p['path']=='/collections/' for s in p['slots'] if s['slot_key']=='collections.hero.image'))
check('Creations keeps existing image as default','/assets/images/site/creation-in-progress.webp' in next(s['source_snapshot'] for p in pages if p['path']=='/creations/' for s in p['slots'] if s['slot_key']=='creations.hero.image'))
check('Art/Gallery keeps existing image as default','/assets/images/site/gallery-item-specific-collage.webp' in next(s['source_snapshot'] for p in pages if p['path']=='/gallery/' for s in p['slots'] if s['slot_key']=='gallery.hero.image'))
placeholder_slots=[s for s in slots if str(s.get('source_snapshot','')).startswith('/assets/placeholders/media-content/')]
check('Branded SVG placeholders seeded across site',len(placeholder_slots)>=15 and all((ROOT/s['source_snapshot'].lstrip('/')).exists() for s in placeholder_slots))
# Public HTML slot wiring and runtime boundaries
managed_files=[]
for p in pages:
 f=ROOT/'index.html' if p['path']=='/' else ROOT/p['path'].strip('/')/'index.html'; managed_files.append(f)
 soup=BeautifulSoup(f.read_text(encoding='utf-8',errors='ignore'),'html.parser')
 check(f'{p["label"]} has explicit managed selectors',bool(soup.select('[data-media-slot],[data-content-slot],[data-media-background-slot]')))
 check(f'{p["label"]} loads v259 runtime','media-content-runtime.js?v=259' in f.read_text(encoding='utf-8',errors='ignore'))
for rel in ['shop/index.html','shop/product/index.html','tools/index.html','toolshed/index.html','supplies/index.html','members/index.html','admin/index.html']:
 f=ROOT/rel
 if f.exists(): check(f'{rel} does not load Media Studio runtime','media-content-runtime' not in f.read_text(encoding='utf-8',errors='ignore'))
# CSS covers responsive editor and public placeholders
check('Slot editor responsive CSS present','.media-slot-studio-layout' in css and '.media-slot-board' in css and '.media-inline-admin-edit' in css and '@media(max-width:640px)' in css)
# JavaScript syntax
for f in ['public/js/admin-media-content-studio.js','public/js/media-content-runtime.js','functions/api/admin/media-content-studio.js','functions/api/public-media-content-manifest.js']:
 try: subprocess.run(['node','--check',str(ROOT/f)],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);check(f'JavaScript syntax {f}',True)
 except Exception as exc: print(exc);check(f'JavaScript syntax {f}',False)
# Database execution + migration repeat
try:
 c=sqlite3.connect(':memory:');c.executescript(txt(Path('database_full_schema.sql')));c.executescript(txt(Path('database_build259_media_static_slot_catalog.sql')))
 active=c.execute('SELECT COUNT(*) FROM media_content_slots WHERE is_active=1').fetchone()[0]
 blocked=c.execute("SELECT COUNT(*) FROM media_content_slots WHERE is_active=1 AND (page_path LIKE '/shop%' OR page_path LIKE '/tools%' OR page_path LIKE '/toolshed%' OR page_path LIKE '/supplies%' OR page_path LIKE '/admin%')").fetchone()[0]
 fk=c.execute('PRAGMA foreign_key_check').fetchall()
 check('Full schema executes and migration repeats',True);check('D1 active slot count matches catalog',active==len(slots));check('D1 has no blocked specialist slots',blocked==0);check('D1 foreign keys clean',not fk)
except Exception as exc:
 print(exc);check('Full schema executes and migration repeats',False);check('D1 active slot count matches catalog',False);check('D1 has no blocked specialist slots',False);check('D1 foreign keys clean',False)
check('Current-pass migration matches Build 259',(ROOT/'database_upgrade_current_pass.sql').read_bytes()==(ROOT/'database_build259_media_static_slot_catalog.sql').read_bytes())
failed=[n for n,ok in checks if not ok]
print(f'\nBuild 259: {len(checks)-len(failed)}/{len(checks)} checks passed')
if failed:
 print('FAILED:');[print('-',x) for x in failed];sys.exit(1)
