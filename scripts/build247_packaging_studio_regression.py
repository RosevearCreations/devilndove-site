from pathlib import Path
import hashlib
import re
import sqlite3

root=Path(__file__).resolve().parents[1]
js=(root/'public/js/admin-packaging-studio.js').read_text()
api=(root/'functions/api/admin/packaging-studio.js').read_text()
html=(root/'admin/packaging-studio/index.html').read_text()
css=(root/'css/styles.css').read_text()
mig=(root/'database_build247_packaging_library_truth_layout_rose_palette.sql').read_bytes()
current=(root/'database_upgrade_current_pass.sql').read_bytes()
checks=[]

def check(name, condition):
    checks.append((name,bool(condition)))
    if not condition:
        raise AssertionError(name)

check('Build 247 migration retained in aggregate schema', 'build247_packaging_library_truth_layout_rose_palette' in (root/'database_full_schema.sql').read_text())
check('single packaging H1', len(re.findall(r'<h1\b',html,re.I))==1)
check('Packaging JS cache key is Build 247 or newer', bool(re.search(r'admin-packaging-studio\.js\?v=(?:24[7-9]|2[5-9]\d|[3-9]\d{2,})',html)))
check('Packaging CSS cache key is Build 247 or newer', bool(re.search(r'styles\.css\?v=(?:24[7-9]|2[5-9]\d|[3-9]\d{2,})',html)))
check('delete label UI', 'id="deletePackagingProject"' in js and 'confirm_project_key' in js)
check('delete project API', "action==='delete_project'" in api and 'exact packaging project key' in api)
check('template gallery', 'packaging-template-grid' in js and 'data-use-packaging-template' in js)
check('formula library controls', all(x in js for x in ['applyPackagingFormulaLibrary','savePackagingFormulaLibrary','deletePackagingFormulaLibrary']))
check('content library actions', all(x in api for x in ["action==='save_content_library'","action==='delete_content_library'"]))
check('Truth ingredient clipping', all(x in js for x in ['clipPath id="soap-en-ingredients"','clipPath id="soap-fr-ingredients"','x="548"','width="144"']))
check('old purple path not renderer authority', "const roseAsset = rosePreset?.path || ''" in js)
check('advanced old purple soap path is cleared', "includes('soap-botanical-purple-rose') ? ''" in js)
required_assets=['purple','lavender','red','pink','white','off-white','yellow','coral','orange','peach','green','blue','blue-green','brown','black','grey','charcoal','silver','gold','honey','copper','bronze','oatmeal']
for name in required_assets:
    path=root/f'assets/packaging/soap/roses/botanical/{name}-rose-v1.webp'
    check(f'rose asset {name}', path.exists() and path.stat().st_size>1000)
required_ids=['rose-lavender-v1','rose-green-v1','rose-oatmeal-v1','rose-blue-green-v1','rose-charcoal-v1','rose-honey-v1','rose-red-v1','rose-custom-v1']
check('requested rose directions', all(x in js for x in required_ids))
check('library CSS', all(x in css for x in ['.packaging-library-grid','.packaging-template-grid','.packaging-library-card']))
check('health formula migration', all(x in mig.decode() for x in ['Health Oatmeal & Goat Milk','rose-oatmeal-v1','Avena Sativa Kernel Extract','Sodium Lauryl Sulfate']))
check('claims migration', all(x in mig.decode() for x in ['Natural Ingredients','Handmade with Care','Gentle & Moisturizing','Please Recycle','Ingrédients naturels','Veuillez recycler']))

# Aggregate schema execution + migration idempotency.
con=sqlite3.connect(':memory:')
con.executescript((root/'database_full_schema.sql').read_text())
check('formula seed count', con.execute('select count(*) from packaging_formula_library').fetchone()[0]>=1)
check('claim seed count', con.execute("select count(*) from packaging_content_library where content_type='claim'").fetchone()[0]>=4)
con.executescript(mig.decode())
check('formula seed idempotent', con.execute("select count(*) from packaging_formula_library where formula_key='health-oatmeal-goat-milk-v1'").fetchone()[0]==1)
check('claims seed idempotent', con.execute("select count(*) from packaging_content_library where content_key like 'claim-%'").fetchone()[0]==4)

print(f'Build 247 packaging regression: {sum(ok for _,ok in checks)}/{len(checks)} checks passed')
print('migration sha256',hashlib.sha256(mig).hexdigest())
