#!/usr/bin/env python3
from pathlib import Path
import json, re, sqlite3, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,cond): checks.append((name,bool(cond))); print(('PASS' if cond else 'FAIL'),name)
def txt(p): return (ROOT/p).read_text(encoding='utf-8',errors='ignore')

runtime=txt('public/js/media-content-runtime.js')
adminjs=txt('public/js/admin-media-content-studio.js')
adminhtml=txt('admin/media-content-studio/index.html')
api=txt('functions/api/admin/media-content-studio.js')
css=txt('css/styles.css')
cat=json.loads(txt('public/data/media-content-slot-catalog.json'))
visual=[]
for s in cat.get('sitewide',[]):
    if s.get('slot_type') in ('image','background'): visual.append(s)
for g in cat.get('groups',[]):
    for p in g.get('pages',[]):
        for s in p.get('slots',[]):
            if s.get('slot_type') in ('image','background'): visual.append(s)
status={k:sum(1 for s in visual if s.get('baseline_visual_status')==k) for k in ['required_replacement','recommended_replacement','optional_enhancement','authored_default']}

check('Build 278 catalog version',cat.get('version')==278)
check('139 explicit visual spaces',len(visual)==139)
check('71 image slots',sum(s.get('slot_type')=='image' for s in visual)==71)
check('68 background slots',sum(s.get('slot_type')=='background' for s in visual)==68)
check('Visual recommendations present',all(int(s.get('recommended_width_px') or 0)>0 and int(s.get('recommended_height_px') or 0)>0 and s.get('recommended_aspect') for s in visual))
check('Baseline replacement counts',status=={'required_replacement':6,'recommended_replacement':23,'optional_enhancement':68,'authored_default':42})
check('Image requirements markdown exists',(ROOT/'docs/media-content/IMAGE_SPACE_REQUIREMENTS.md').exists())
check('Image requirements CSV has 139 rows',len((ROOT/'docs/media-content/IMAGE_SPACE_REQUIREMENTS.csv').read_text(encoding='utf-8-sig').splitlines())==140)

check('Page-wide admin edit toolbar exists','mediaPageEditToolbar' in runtime and 'Admin page preview' in runtime)
check('Page edit mode uses one toggle','data-media-page-edit-toggle' in runtime and 'Editing ON' in runtime and 'Edit page' in runtime)
check('Per-slot badges hidden until edit mode', '.media-inline-admin-edit{display:none!important}' in css and '.media-page-edit-mode .media-inline-admin-edit{display:inline-flex!important' in css)
check('Admin controls require admin-ready event',"document.addEventListener('dd:admin-ready'" in runtime and 'if(!e.detail?.ok)return' in runtime)
check('Edit mode survives page navigation per tab','sessionStorage' in runtime and 'dd-media-page-edit-mode' in runtime)
check('Deep-link edit mode retained','media-edit' in runtime and 'focusHash' in runtime)

check('Media Studio image plan section visible','mediaImagePlanPanel' in adminhtml and 'Editable image spaces & outstanding artwork' in adminhtml)
check('Live visual-plan API mode exists','mode === "visual_plan"' in api and 'visualPlanSlots' in api)
check('Visual plan query is bounded','LIMIT 250' in api and "s.slot_type IN ('image','background')" in api)
check('Live image-plan filters available',all(x in adminhtml for x in ['data-image-plan-filter="outstanding"','data-image-plan-filter="required"','data-image-plan-filter="all"']))
check('Live CSV download available','mediaDownloadImagePlan' in adminhtml and 'downloadImagePlan' in adminjs)
check('Slot cards display recommendation','Recommended image:' in adminjs and 'recommended_width_px' in adminjs)
check('Image assignment refreshes live checklist','await loadVisualPlan()' in adminjs)
check('Media Studio catalog cache-busted','media-content-slot-catalog.json?v=278' in adminjs and 'admin-media-content-studio.js?v=278' in adminhtml)
check('Media Studio CSS cache-busted','styles.css?v=278' in adminhtml)

managed=[]
for f in ROOT.rglob('*.html'):
    rel=f.relative_to(ROOT).as_posix()
    if rel.startswith('admin/'): continue
    t=f.read_text(encoding='utf-8',errors='ignore')
    if 'media-content-runtime.js?v=' in t: managed.append((rel,t))
check('Managed public pages cache-busted to 278',len(managed)>=30 and all('media-content-runtime.js?v=278' in t for _,t in managed))

for f in ['public/js/media-content-runtime.js','public/js/admin-media-content-studio.js','functions/api/admin/media-content-studio.js']:
    try:
        subprocess.run(['node','--check',str(ROOT/f)],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        check(f'JavaScript syntax {f}',True)
    except Exception as e:
        print(e);check(f'JavaScript syntax {f}',False)

try:
    c=sqlite3.connect(':memory:');c.executescript(txt('database_full_schema.sql'))
    check('Aggregate schema still executes',True)
    check('Aggregate schema foreign keys clean',len(c.execute('PRAGMA foreign_key_check').fetchall())==0)
except Exception as e:
    print(e);check('Aggregate schema still executes',False);check('Aggregate schema foreign keys clean',False)
check('No Build 278 D1 migration introduced',not (ROOT/'database_build278_media_edit_mode_image_plan.sql').exists())

failed=[n for n,ok in checks if not ok]
print(f'\nBuild 278: {len(checks)-len(failed)}/{len(checks)} checks passed')
if failed:
    print('FAILED:');[print('-',x) for x in failed];sys.exit(1)
