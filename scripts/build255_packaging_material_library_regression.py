from pathlib import Path
import re, sqlite3, subprocess, hashlib
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(label, cond):
    checks.append(bool(cond)); print(('PASS' if cond else 'FAIL')+': '+label)

html=(ROOT/'admin/packaging-studio/index.html').read_text()
js=(ROOT/'public/js/admin-packaging-studio.js').read_text()
api=(ROOT/'functions/api/admin/packaging-studio.js').read_text()
css=(ROOT/'css/styles.css').read_text()
mig=(ROOT/'database_build255_packaging_material_library_hub.sql').read_text()
current=(ROOT/'database_upgrade_current_pass.sql').read_text()
full=(ROOT/'database_full_schema.sql').read_text()
docs=(ROOT/'PACKAGING_STUDIO.md').read_text()
handoff=(ROOT/'AI_HANDOFF.md').read_text()
roadmap=(ROOT/'PROJECT_STATUS_AND_ROADMAP.md').read_text()

check('Packaging Studio has one H1', len(re.findall(r'<h1\b',html,re.I))==1)
check('Packaging Studio cache-busts CSS at Build 255 or newer', bool(re.search(r'/css/styles\.css\?v=(?:25[5-9]|2[6-9][0-9]|[3-9][0-9]{2,})',html)))
check('Packaging Studio cache-busts JS at Build 255 or newer', bool(re.search(r'/public/js/admin-packaging-studio\.js\?v=(?:25[5-9]|2[6-9][0-9]|[3-9][0-9]{2,})',html)))
check('API reports Build 255', "const BUILD = '255'" in api)
check('Material Library is available without a selected project', 'You do not need a project to build the Material Library.' in js and 'standalone:true' in js)
check('Material Library gives explicit product-family choices', all(x in js for x in ['Soap','Candles','Bath & body','Home fragrance','Cosmetic / body','General']))
check('Material Library gives explicit source categories', all(x in js for x in ['Soap base','Candle wax / wax blend','Fragrance oil / blend','Essential-oil blend','Colourant / dye','Mica / pigment','Carrier oil / butter','Botanical / extract']))
check('Source template owns an independent Master INCI editor', 'packagingSourceInciRows' in js and 'sourceInciRowsFromDom' in js and 'setSourceInciRows' in js)
check('Supplier ingredient text can create draft rows', 'importSourceIngredientText' in js and 'Create draft rows from supplier text' in js)
check('Source editor exposes supplier evidence and colour swatch', all(x in js for x in ['packagingSourceSupplierName','packagingSourceSupplierSku','packagingSourceUrl','packagingSourceDocumentUrl','packagingSourceImageUrl','packagingSourceColourHex']))
check('Source editor exposes allergen/benefit/claim/fragrance evidence', all(x in js for x in ['packagingSourceAllergenStatement','packagingSourceBenefits','packagingSourceClaims','packagingSourceFragranceAllergens','packagingSourceFragranceReview']))
check('Base role includes soap base and candle wax', "['soap_base','candle_wax','cosmetic_base','carrier_base']" in js)
check('Non-base source materials append rather than replace formula ingredients', "sourceMaterialDefaultRole(row.material_subtype||row.material_type)==='base'" in js and 'for(const item of rows)addIngredient(item)' in js)
check('Finished formula base can come from any attached source with base role', "String(row.material_role)==='base'" in js and 'sourceMaterialDefaultRole(selectedSource.material_subtype||selectedSource.material_type)' in js)
check('Source cards have explicit Build255 grid CSS', all(x in css for x in ['.packaging-material-library-hub','.packaging-source-grid .packaging-source-card','.packaging-source-card-body','.packaging-source-editor','.packaging-source-inci-editor']))
check('Source cards have responsive CSS', '@media(max-width:800px)' in css and '@media(max-width:560px)' in css and '.packaging-source-grid' in css)
check('Metadata migration creates flexible source classification', all(x in mig for x in ['packaging_source_material_metadata','product_family','material_subtype','default_role','colour_hex']))
check('General packaging ingredient table exists in migration', 'CREATE TABLE IF NOT EXISTS packaging_project_ingredients' in mig)
check('General packaging claim table exists in migration', 'CREATE TABLE IF NOT EXISTS packaging_project_claims' in mig)
check('Existing soap rows are backfilled into general packaging rows', 'FROM soap_ingredients si' in mig and 'FROM soap_label_claims slc' in mig)
check('API persists structured ingredients for every package type before soap-only mirror', 'await syncPackagingStructuredData(db,projectId,data);' in api and "if(data.package_type!=='soap_ribbon')return null;" in api)
check('API reads general structured ingredients and claims with legacy soap fallback', 'FROM packaging_project_ingredients' in api and 'FROM packaging_project_claims' in api and 'FROM soap_ingredients' in api and 'FROM soap_label_claims' in api)
check('API maps source metadata to browser', all(x in api for x in ['product_family:text(row.product_family','material_subtype:text(row.material_subtype','default_role:text(row.default_role','colour_hex:text(row.colour_hex']))
check('API source library has migration-safe fallback', 'source_material_metadata_ready=false' in api and 'LEFT JOIN packaging_source_material_metadata' in api)
check('Source template save requires metadata migration before mutating old source row', 'Build 255 source-material metadata migration is required before saving Material Library categories.' in api)
check('Build 255 migration is retained after newer current migrations', 'build255_packaging_material_library_hub' in mig and ('build255_packaging_material_library_hub' in full))
check('Packaging docs explain where soap/candle/oil/colour data belongs', all(x in docs for x in ['Build 255 — Material Library hub','Soap base','Candle wax','essential-oil','Master INCI']))
check('Canonical handoff identifies Build 255 or newer', bool(re.match(r'# Build (?:25[5-9]|2[6-9][0-9]|[3-9][0-9]{2,}) current handoff',handoff)))
check('Canonical roadmap identifies Build 255 or newer', bool(re.match(r'# Devil n Dove Project Status and Roadmap — Build (?:25[5-9]|2[6-9][0-9]|[3-9][0-9]{2,})',roadmap)))

# JS syntax.
for f in ['public/js/admin-packaging-studio.js','functions/api/admin/packaging-studio.js']:
    p=subprocess.run(['node','--check',str(ROOT/f)],capture_output=True,text=True)
    check(f'{f} JavaScript syntax', p.returncode==0)

# CSS structural sanity.
check('CSS brace counts match', css.count('{')==css.count('}'))

# Fresh schema + Build255 twice, then verify source metadata and project tables.
con=sqlite3.connect(':memory:')
try:
    con.executescript(full)
    con.executescript(mig)
    con.executescript(mig)
    tables={r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    check('Fresh schema contains source metadata', 'packaging_source_material_metadata' in tables)
    check('Fresh schema contains general packaging ingredients', 'packaging_project_ingredients' in tables)
    check('Fresh schema contains general packaging claims', 'packaging_project_claims' in tables)
    goat=con.execute("SELECT m.product_family,m.material_subtype,m.default_role,json_array_length(s.master_inci_json) FROM packaging_source_material_templates s JOIN packaging_source_material_metadata m ON m.packaging_source_material_template_id=s.packaging_source_material_template_id WHERE s.material_key='goats-milk-melt-pour-base-owner-source-v1'").fetchone()
    check('Seed Goat Milk source is classified as Soap / Soap Base / Base with 9 source rows', goat==('soap','soap_base','base',9))
    ledger=con.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build255_packaging_material_library_hub'").fetchone()[0]
    check('Build255 ledger entry remains single after rerun', ledger==1)
    check('Fresh schema + migration has no foreign-key violations', con.execute('PRAGMA foreign_key_check').fetchall()==[])
finally:
    con.close()

print(f'\nBuild 255 Packaging Material Library regression: {sum(checks)}/{len(checks)} passed')
print('migration sha256',hashlib.sha256(mig.encode()).hexdigest())
raise SystemExit(0 if all(checks) else 1)
