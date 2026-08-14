#!/usr/bin/env python3
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,cond): checks.append((name,bool(cond))); print(('PASS' if cond else 'FAIL'),name)
def txt(rel): return (ROOT/rel).read_text(encoding='utf-8',errors='ignore')
api=txt('functions/api/admin/media-content-studio.js')
js=txt('public/js/admin-media-content-studio.js')
html=txt('admin/media-content-studio/index.html')
check('Build 260 admin bundle cache-busted','admin-media-content-studio.js?v=260' in html)
check('Catalog request cache-busted to 260','media-content-slot-catalog.json?v=260' in js)
check('Initial page load uses page-only mode',"mode:'page'" in js and "limit:'180'" not in js)
check('Media picker loads media on demand',"mode:'media'" in js and 'await loadLibrary({append:false})' in js)
check('Selected media uses load separately',"mode:'uses'" in js and 'Could not load image uses.' in js)
check('Client library page bounded to 48',"limit:'48'" in js)
check('Load-more uses keyset cursor','before_id' in js and 'mediaLoadMore' in js and 'Load more site images' in js)
check('Search only refreshes open picker',"if(!id('mediaPickerPanel').hidden)loadLibrary" in js)
check('API supports page/media/uses modes',all(x in api for x in ['mode === "media"','mode === "uses"','const slots = await pageSlots']))
get_block=api[api.index('export async function onRequestGet'):api.index('export async function onRequestPost')]
check('GET no longer uses Promise.all','Promise.all' not in get_block)
check('Default GET is compact page mode','url.searchParams.get("mode") || "page"' in get_block)
media_block=api[api.index('async function mediaList'):api.index('async function pageSlots')]
check('Library query removes assignment-count correlation','assignment_count' not in media_block and 'media_content_assignments' not in media_block)
check('Server media page bounded at 72', 'Math.min(72' in media_block and 'n(query.limit, 48)' in media_block)
check('Server media list uses primary-key keyset pagination','ma.media_asset_id < ?' in media_block and 'ORDER BY ma.media_asset_id DESC' in media_block)
check('Specialist product/inventory/tool media still excluded',all(x in media_block for x in ['ma.product_id IS NULL',"NOT LIKE 'products/%'","NOT LIKE 'inventory/%'","NOT LIKE 'supplies/%'","NOT LIKE 'tools/%'"]))
check('Page request still blocks specialist routes','isBlockedPagePath(path)' in get_block)
check('Handled API failures are distinguishable from platform 503s','error_code:"media_studio_query_failed"' in get_block and '},500);' in get_block)
# Syntax
for f in ['public/js/admin-media-content-studio.js','functions/api/admin/media-content-studio.js']:
    try:
        subprocess.run(['node','--check',str(ROOT/f)],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        check(f'JavaScript syntax {f}',True)
    except Exception as exc:
        print(exc);check(f'JavaScript syntax {f}',False)
# Migration boundary remains Build 259; no Build 260 schema is required.
check('No Build 260 migration introduced',not (ROOT/'database_build260_media_bootstrap_runtime.sql').exists())
check('Current-pass migration remains Build 259 or newer',(ROOT/'database_upgrade_current_pass.sql').read_bytes()==(ROOT/'database_build259_media_static_slot_catalog.sql').read_bytes() or b'build263_packaging_my_printers' in (ROOT/'database_upgrade_current_pass.sql').read_bytes())
failed=[n for n,ok in checks if not ok]
print(f'\nBuild 260: {len(checks)-len(failed)}/{len(checks)} checks passed')
if failed:
    print('FAILED:');[print('-',x) for x in failed];sys.exit(1)
