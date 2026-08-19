#!/usr/bin/env python3
from pathlib import Path
import re, sqlite3, subprocess, tempfile, hashlib

ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'admin/packaging-studio/index.html').read_text()
js=(ROOT/'public/js/admin-packaging-studio.js').read_text()
api=(ROOT/'functions/api/admin/packaging-studio.js').read_text()
invjs=(ROOT/'public/js/admin-site-item-inventory.js').read_text()
invapi=(ROOT/'functions/api/admin/site-item-inventory.js').read_text()
css=(ROOT/'css/styles.css').read_text()
handoff=(ROOT/'AI_HANDOFF.md').read_text()
roadmap=(ROOT/'PROJECT_STATUS_AND_ROADMAP.md').read_text()
full=(ROOT/'database_full_schema.sql').read_text()
current=(ROOT/'database_upgrade_current_pass.sql').read_bytes()
b259=(ROOT/'database_build259_media_static_slot_catalog.sql').read_bytes()
checks=[]

def check(name, cond):
    checks.append((name,bool(cond)))
    if not cond: raise AssertionError(name)

def version_at_least(pattern, text, minimum):
    match=re.search(pattern,text); return bool(match and int(match.group(1))>=minimum)
check('Packaging Studio CSS cache is Build 261 or newer',version_at_least(r'/css/styles\.css\?v=(\d+)',html,261))
check('Packaging Studio JS cache is Build 261 or newer',version_at_least(r'/public/js/admin-packaging-studio\.js\?v=(\d+)',html,261))
check('Packaging API reports Build 261 or newer',version_at_least(r"const BUILD = '(\d+)'",api,261))
check('Components use responsive card list','packaging-component-list' in js and 'packaging-component-card' in js)
check('Components no longer depend on wide table header', 'id="packagingComponentRows" class="packaging-component-list"' in js)
check('Inventory search is first component field','Inventory item — type to search' in js and 'data-field="inventory_search"' in js)
check('Inventory component search uses datalist','packagingComponentInventoryOptions' in js and 'type="search"' in js)
check('Component selection copies supplier SKU and cost','applyInventoryToComponentRow' in js and 'unit_cost_cents' in js and 'supplier_sku' in js)
check('Responsive component CSS added','.packaging-component-card-grid' in css and '@media(max-width:640px)' in css)
check('Claims tab exposes reusable database','Claims library and label claims' in js and 'Available reusable claims' in js)
check('Claim library cards show icons','packaging-claim-library-card' in js and 'claimIconUi' in js)
check('Claims support leaf hands recycle heart icons',all(x in js for x in ["'leaf'","'hands'","'recycle'","'heart'"]))
check('Custom reusable claim editor exists','saveClaimLibraryItem' in js and 'claimLibraryTextEn' in js and 'claimLibraryTextFr' in js)
check('Current label claims use responsive cards','packaging-claim-editor-row' in js and 'packaging-claim-editor-grid' in css)
check('Material Library is inventory-first','Start with information already in Devil n Dove Inventory' in js)
check('Amazon moved to explicit fallback','Amazon fallback — only when Inventory/source evidence is incomplete' in js)
check('Material inventory search reuses linked template','packaging_source_material_template_id' in js and 'useInventoryForSourceMaterial' in js)
check('Packaging API enriches inventory metadata','mapPackagingInventory' in api and 'inventory_source_material_links' in api and 'catalog_source_record_json' in api)
check('Packaging Studio excludes tools from material inventory',"LOWER(COALESCE(sii.source_type,''))<>'tool'" in api)
check('Saving source template links inventory record','site_item_inventory_id' in js and 'Linked from Packaging Studio; reuse inventory source metadata' in api)
check('Inventory Amazon preview retains packaging source draft','lastAmazonPackagingSourceDraft' in invjs and 'data.packaging_source_draft' in invjs)
check('Inventory save sends packaging source draft','packaging_source_draft: lastAmazonPackagingSourceDraft' in invjs)
check('Inventory API persists source draft only when source material flagged','persistPackagingSourceDraft' in invapi and 'source_material_recommended' in invapi)
check('Inventory source capture does not overwrite existing linked source','Never overwrite a source record' in invapi and 'inventory_source_material_links' in invapi)
check('Inventory admin bundle cache remains Build 261 or newer', all(re.search(r'admin-site-item-inventory\.js\?v=(?:26[1-9]|[3-9]\d{2,})',(ROOT/p).read_text()) for p in ['admin/inventory-operations/index.html','admin/products/index.html','admin/mobile-inventory/index.html']))
check('Soap renderer uses corrected v3 profile','soap_reference_v3' in js and "packageType==='soap_ribbon'?'soap_reference_v3'" in api)
check('Soap English ingredient clip bounded','soap-en-ingredients' in js and ('bandHeight-35' in js or 'bandHeight-38' in js))
check('Soap French ingredient clip bounded','soap-fr-ingredients' in js)
check('Soap title wraps to two lines',bool(re.search(r'wrapPlainLines\(family,(?:17|18|20),2\)',js)))
check('Soap claims limited to four','claims.slice(0,4)' in js)
check('Soap claim rows compressed',('index*11.6' in js or 'index*10.2' in js) and ('bandHeight-28' in js or 'bandHeight-27' in js))
check('Soap net quantity separated from claims',(('bandY+53.5' in js and 'bandY+61.5' in js) or ('bandY+58' in js and 'bandY+65' in js)))
check('Soap preview CSS preserves wide ribbon geometry','svg[data-soap-layout="reference-v3"]' in css and 'min-width:1080px' in css)
check('Canonical handoff is Build 261 or newer',version_at_least(r'# Devil n Dove AI Handoff — Build (\d+)',handoff,261))
check('Canonical roadmap is Build 261 or newer',version_at_least(r'# Devil n Dove Project Status and Roadmap — Build (\d+)',roadmap,261))
check('Current migration is Build 259 or newer additive boundary',current==b259 or b'build263_packaging_my_printers' in current or b'Build 264' in current)

for rel in ['public/js/admin-packaging-studio.js','functions/api/admin/packaging-studio.js','public/js/admin-site-item-inventory.js','functions/api/admin/site-item-inventory.js']:
    r=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True)
    check(f'JavaScript syntax {rel}',r.returncode==0)
check('CSS braces balanced',css.count('{')==css.count('}'))

with tempfile.NamedTemporaryFile(suffix='.db') as tmp:
    con=sqlite3.connect(tmp.name)
    con.executescript(full)
    claim_rows=con.execute("SELECT item_name,icon_name FROM packaging_content_library WHERE content_type='claim' AND is_active=1 ORDER BY packaging_content_library_id").fetchall()
    check('D1 reusable claim library has at least four active claims',len(claim_rows)>=4)
    icons={r[1] for r in claim_rows}
    check('D1 claim library carries icon names',{'leaf','hands','recycle'}.issubset(icons))
    columns={r[1] for r in con.execute('PRAGMA table_info(packaging_source_material_templates)').fetchall()}
    check('Packaging source table retains ingredient/allergen evidence',{'ingredient_declaration_raw','master_inci_json','allergen_statement','benefits_json','supplier_claims_json'}.issubset(columns))
    link_sql=con.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='inventory_source_material_links'").fetchone()[0]
    check('Inventory/source link roles support soap base/fragrance/colourant/additive','soap_base' in link_sql and 'fragrance' in link_sql and 'colourant' in link_sql and 'additive' in link_sql)
    fk=con.execute('PRAGMA foreign_key_check').fetchall()
    check('Fresh full schema has no foreign-key violations',not fk)
    con.close()

print(f'Build 261 Packaging/Inventory regression: {sum(ok for _,ok in checks)}/{len(checks)} checks passed')
print('current migration sha256',hashlib.sha256(current).hexdigest())
