#!/usr/bin/env python3
from pathlib import Path
import re, sqlite3, subprocess, sys
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
js=(ROOT/'public/js/admin-packaging-studio.js').read_text(encoding='utf-8')
api=(ROOT/'functions/api/admin/packaging-studio.js').read_text(encoding='utf-8')
html=(ROOT/'admin/packaging-studio/index.html').read_text(encoding='utf-8')
css=(ROOT/'css/styles.css').read_text(encoding='utf-8')
handoff=(ROOT/'AI_HANDOFF.md').read_text(encoding='utf-8')
roadmap=(ROOT/'PROJECT_STATUS_AND_ROADMAP.md').read_text(encoding='utf-8')
packaging=(ROOT/'PACKAGING_STUDIO.md').read_text(encoding='utf-8')
checks=[]
def ck(name, cond):
    checks.append((name,bool(cond)))
    if not cond: raise AssertionError(name)

def ver(pattern,text):
    m=re.search(pattern,text); return int(m.group(1)) if m else 0

ck('Packaging API is Build 275+', ver(r"const BUILD = '(\d+)'",api)>=275)
ck('Packaging JS cache is Build 275+', ver(r'admin-packaging-studio\.js\?v=(\d+)',html)>=275)
ck('Packaging CSS cache is Build 275+', ver(r'styles\.css\?v=(\d+)',html)>=275)
ck('Source application persists project structured ingredients', 'DELETE FROM packaging_project_ingredients WHERE packaging_project_id=?' in api and 'INSERT INTO packaging_project_ingredients' in api and 'mappedSource.master_inci' in api)
ck('Source application refreshes fallback INCI and bilingual strings', 'UPDATE packaging_projects SET ingredients_inci=?,ingredients_en=?,ingredients_fr=?' in api)
ck('Non-base inheritance deduplicates ingredient keys', 'const seen=new Set(existing.map' in api and "if(role!=='base')" in api)
ck('Inherited supplier claims remain unapproved', 'supplier claim suggestions were added only as unapproved drafts' in api and 'VALUES (?,?,?,?,?,0,?' in api)
ck('Ingredients tab exposes attached-base recovery', 'reloadAttachedBaseIngredients' in js and 'Reload from attached base' in js)
ck('French draft can reconstruct missing structured rows', 'ensureStructuredIngredientsForFrenchDraft' in js and 'attachedBase?.master_inci' in js and "id('packagingInci')" in js)
ck('French action is clearly labelled', 'Translate to French / generate draft' in js and 'Draft French' in js)
ck('Goat Milk curated French wording exists', 'Lait de chèvre' in js and 'Glycérine végétale' in js and 'Hydroxyde de sodium' in js)
ck('Main soap identity uses brand script and bold weight', 'pkg-brand-title' in js and 'font-weight="700" class="pkg-brand-title"' in js and "font-family:'Brush Script MT','Segoe Script',cursive" in js)
ck('Claim renderer has extra horizontal icon/text separation', (('const textX=zones.claims.x+27' in js and 'zones.claims.x+8' in js) or ('const textX=zones.claims.x+35' in js and 'zones.claims.x+8' in js) or ('const textX=zones.claims.x+44' in js and 'const iconX=zones.claims.x+12' in js)))
ck('Claim editor spacing CSS increased', (('.packaging-claim-editor-row{gap:14px}' in css or '.packaging-claim-editor-row{gap:18px}' in css or '.packaging-claim-editor-row{column-gap:24px;row-gap:18px}' in css) and ('.packaging-claim-icon{width:42px;height:42px}' in css or '.packaging-claim-icon{width:44px;height:44px}' in css or '.packaging-claim-icon{width:46px;height:46px}' in css)))
ck('Actual rose quick palette exists', 'Actual rose quick palette' in js and 'packaging-rose-direction-palette' in js)
expected={
'generic-white':'white','soft-pink':'pink','warm-cream':'off-white','sunshine-yellow':'yellow','coral':'coral','orange':'orange','peach':'peach','botanical-green':'green','ocean-blue':'blue','cocoa-brown':'brown','midnight-black':'black','soft-grey':'grey','metallic-silver':'silver','metallic-gold':'gold','copper':'copper','bronze':'bronze'}
for key,filekey in expected.items():
    ck(f'Product rose direction {key}', f"['{key}'" in js)
    asset=ROOT/f'assets/packaging/soap/roses/botanical/{filekey}-rose-v1.webp'
    ck(f'Actual rose asset exists: {filekey}', asset.exists())
    if asset.exists():
        with Image.open(asset) as im:
            ck(f'Actual rose asset opens: {filekey}', im.width>0 and im.height>0 and im.format=='WEBP')
ck('Build 275 documented in handoff', re.search(r'# Devil n Dove AI Handoff — Build (27[5-9]|2[89]\d|[3-9]\d{2,})',handoff) is not None and 'Build 275 — Packaging source inheritance' in handoff)
ck('Build 275 documented in roadmap', re.search(r'# Devil n Dove Project Status and Roadmap — Build (27[5-9]|2[89]\d|[3-9]\d{2,})',roadmap) is not None and 'Build 275 completed' in roadmap)
ck('Packaging specialist spec carries Build 275 behavior', 'Build 275 — Source-template ingredient persistence' in packaging)
ck('No Build 275 D1 migration introduced', not any(ROOT.glob('database_build275*.sql')))
subprocess.run(['node','--check',str(ROOT/'public/js/admin-packaging-studio.js')],check=True)
subprocess.run(['node','--check',str(ROOT/'functions/api/admin/packaging-studio.js')],check=True)
ck('Packaging JavaScript syntax',True)
# Fresh aggregate schemas still execute and have clean FKs.
for schema in ['database_full_schema.sql','database_schema.sql','database_store_schema.sql']:
    con=sqlite3.connect(':memory:')
    con.executescript((ROOT/schema).read_text(encoding='utf-8'))
    fk=con.execute('PRAGMA foreign_key_check').fetchall()
    ck(f'{schema} foreign keys clean',len(fk)==0)
    if schema=='database_full_schema.sql':
        cols={r[1] for r in con.execute('PRAGMA table_info(packaging_project_ingredients)')}
        ck(f'{schema} has structured packaging ingredient authority',{'packaging_project_id','inci_name','display_name_en','display_name_fr'}.issubset(cols))
    con.close()
print(f'Build 275 Packaging Label regression: {sum(ok for _,ok in checks)}/{len(checks)} passed')
for name,ok in checks:
    print(('PASS' if ok else 'FAIL')+': '+name)
