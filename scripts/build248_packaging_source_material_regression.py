from pathlib import Path
import hashlib
import re
import sqlite3

root=Path(__file__).resolve().parents[1]
js=(root/'public/js/admin-packaging-studio.js').read_text()
api=(root/'functions/api/admin/packaging-studio.js').read_text()
html=(root/'admin/packaging-studio/index.html').read_text()
css=(root/'css/styles.css').read_text()
mig=(root/'database_build248_packaging_source_material_templates_compliance.sql').read_bytes()
current=(root/'database_upgrade_current_pass.sql').read_bytes()
full=(root/'database_full_schema.sql').read_text()
roadmap=(root/'PROJECT_STATUS_AND_ROADMAP.md').read_text()
handoff=(root/'AI_HANDOFF.md').read_text()
index=(root/'MARKDOWN_INDEX.md').read_text()
checks=[]

def check(name, condition):
    checks.append((name,bool(condition)))
    if not condition:
        raise AssertionError(name)

# Build/release wiring.
check('current pass is Build 248 or newer', mig==current or bool(re.search(rb'Devil n Dove Build (?:24[9]|25[0-9]|2[6-9][0-9]|[3-9][0-9]{2,})',current)))
check('single packaging H1',len(re.findall(r'<h1\b',html,re.I))==1)
check('Build 248 JS cache key or newer', bool(re.search(r'admin-packaging-studio\.js\?v=(?:248|249|25[0-9]|2[6-9][0-9]|[3-9][0-9]{2,})',html)))
check('Build 248 CSS cache key or newer', bool(re.search(r'styles\.css\?v=(?:248|249|25[0-9]|2[6-9][0-9]|[3-9][0-9]{2,})',html)))
check('service worker shell v24',"devilndove-shell-v24" in (root/'sw.js').read_text())
check('API build 248 or newer', bool(re.search(r"const BUILD = '(?:248|249|25[0-9]|2[6-9][0-9]|[3-9][0-9]{2,})'",api)))
check('Build 248 source-material behavior retained','sourceMaterialManagerMarkup' in js and 'sourceMaterialDefaultRole' in js)

# Build 247 retained Packaging Studio behavior.
check('delete label UI','id="deletePackagingProject"' in js and 'confirm_project_key' in js)
check('delete project API',"action==='delete_project'" in api and 'exact packaging project key' in api)
check('template gallery','packaging-template-grid' in js and 'data-use-packaging-template' in js)
check('finished formula controls',all(x in js for x in ['applyPackagingFormulaLibrary','savePackagingFormulaLibrary','deletePackagingFormulaLibrary']))
check('Truth ingredient clipping',all(x in js for x in ['clipPath id="soap-en-ingredients"','clipPath id="soap-fr-ingredients"']) and ('width="144"' in js or 'zones.fr' in js))
check('rose renderer authority','rosePreset?.path' in js and 'roseAsset' in js)
check('custom rose palette',all(x in js for x in ['rose-oatmeal-v1','rose-lavender-v1','rose-blue-green-v1','rose-charcoal-v1','rose-honey-v1','rose-custom-v1']))
required_assets=['purple','lavender','red','pink','white','off-white','yellow','coral','orange','peach','green','blue','blue-green','brown','black','grey','charcoal','silver','gold','honey','copper','bronze','oatmeal']
for name in required_assets:
    path=root/f'assets/packaging/soap/roses/botanical/{name}-rose-v1.webp'
    check(f'rose asset {name}',path.exists() and path.stat().st_size>1000)

# Build 248 source-material model and UI.
for table in ['packaging_source_material_templates','packaging_project_source_materials','packaging_formula_source_material_links']:
    check(f'migration table {table}',table in mig.decode())
check('source types',all(x in mig.decode() for x in ["'soap_base'","'fragrance_oil'","'colourant'","'additive'"]))
check('supplier reference fields',all(x in mig.decode() for x in ['supplier_name','supplier_sku','supplier_product_name','source_url','source_image_url','supplier_document_url']))
check('source evidence fields',all(x in mig.decode() for x in ['ingredient_declaration_raw','master_inci_json','allergen_statement','benefits_json','supplier_claims_json','fragrance_allergens_json']))
check('project source snapshot','source_snapshot_json' in mig.decode() and 'source_snapshot' in api)
check('source save/apply/detach/delete API',all(x in api for x in ["action==='save_source_material_template'","action==='apply_source_material_template'","action==='detach_source_material_template'","action==='delete_source_material_template'"]))
check('base-role formula inheritance retained','default_role' in api and 'sourceRole' in api)
check('source UI sections',all(x in js for x in ['Purchased/source material templates','Finished formula / recipe library','Supplier benefits / characteristics','Supplier allergen statement / characteristics']))
check('source image/document UI',all(x in js for x in ['packagingSourceImageUrl','packagingSourceDocumentUrl','packaging-source-thumb']))
check('source fallback image',(root/'assets/packaging/placeholders/soap-base-source-template.svg').exists())
check('mobile source CSS',all(x in css for x in ['.packaging-source-thumb','.packaging-source-benefits','.packaging-source-editor .grid.cols-3']))
check('fragrance threshold UI','0.01% in rinse-off products' in js and '0.001% in leave-on products' in js and 'August 1, 2026' in js)
check('fragrance preflight gate','2026 fragrance-allergen review' in api)
check('unapproved supplier claim inheritance','is_approved:0' in js and 'supplier claim suggestions were added only as unapproved drafts' in js)
check('formula apply attaches source dependency',"action:'apply_source_material_template'" in js and 'source review' in js)

# Owner-provided seed facts preserved as source evidence.
seed=mig.decode()
for value in ['Coconut Oil','Sorbitol','Vegetable Propylene Glycol','Stearic Acid','Water','Sodium Hydroxide','Vegetable Glycerin','Goat Milk','Titanium Dioxide']:
    check(f'goat base ingredient {value}',value in seed)
for value in ['Make the unique gift','Easy to work with','Great family time spending','Beneficial to your skin','Safe to work with','Ready to use instantly']:
    check(f'goat base benefit {value}',value in seed)
check('supplier allergen statement preserved','does not contain any of the eight major allergens listed by the supplier' in seed)
check('seed Master INCI review-required','"verification_status":"needs_review"' in seed)
check('seed benefits not auto-label','"label_candidate":0' in seed)

# Schema execution and idempotency.
con=sqlite3.connect(':memory:')
con.executescript(full)
check('aggregate source template seed',con.execute("select count(*) from packaging_source_material_templates where material_key='goats-milk-melt-pour-base-owner-source-v1'").fetchone()[0]==1)
check('aggregate goat INCI rows',con.execute("select json_array_length(master_inci_json) from packaging_source_material_templates where material_key='goats-milk-melt-pour-base-owner-source-v1'").fetchone()[0]==9)
check('aggregate goat benefit rows',con.execute("select json_array_length(benefits_json) from packaging_source_material_templates where material_key='goats-milk-melt-pour-base-owner-source-v1'").fetchone()[0]==6)
check('aggregate migration ledger',con.execute("select count(*) from schema_migration_ledger where migration_key='build248_packaging_source_material_templates_compliance'").fetchone()[0]==1)
con.executescript(mig.decode())
check('Build 248 migration rerun idempotent',con.execute("select count(*) from packaging_source_material_templates where material_key='goats-milk-melt-pour-base-owner-source-v1'").fetchone()[0]==1)
check('source image column',any(row[1]=='source_image_url' for row in con.execute('pragma table_info(packaging_source_material_templates)')))
check('supplier document column',any(row[1]=='supplier_document_url' for row in con.execute('pragma table_info(packaging_source_material_templates)')))
con.close()

# Documentation consolidation and authority.
check('Build 248 handoff retained under current handoff', bool(re.match(r'# Devil n Dove AI Handoff — Build (?:248|249|25[0-9]|2[6-9][0-9]|[3-9][0-9]{2,})',handoff)))
check('Build 248 roadmap retained under current roadmap', bool(re.match(r'# Devil n Dove Project Status and Roadmap — Build (?:248|249|25[0-9]|2[6-9][0-9]|[3-9][0-9]{2,})',roadmap)))
check('source-material roadmap','Purchased Source Material' in roadmap and 'Master INCI' in roadmap)
check('Build 248 index retained under current index', bool(re.match(r'# Devil n Dove Markdown Index — Build (?:248|249|25[0-9]|2[6-9][0-9]|[3-9][0-9]{2,})',index)))
check('two canonical authority index',('Only two mutable current authorities' in index or 'Two current authorities' in index) and 'AI_HANDOFF.md' in index and 'PROJECT_STATUS_AND_ROADMAP.md' in index)
check('historical Build 248 documentation authority remains indexed','BUILD*.md' in index and 'historical' in index.lower())

print(f'Build 248 packaging/source-material regression: {sum(ok for _,ok in checks)}/{len(checks)} checks passed')
print('migration sha256',hashlib.sha256(mig).hexdigest())
