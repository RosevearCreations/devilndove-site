#!/usr/bin/env python3
from pathlib import Path
import re, sqlite3, subprocess, tempfile, zipfile

ROOT=Path(__file__).resolve().parents[1]
js=(ROOT/'public/js/admin-packaging-studio.js').read_text(encoding='utf-8')
api=(ROOT/'functions/api/admin/packaging-studio.js').read_text(encoding='utf-8')
html=(ROOT/'admin/packaging-studio/index.html').read_text(encoding='utf-8')
css=(ROOT/'css/styles.css').read_text(encoding='utf-8')
handoff=(ROOT/'AI_HANDOFF.md').read_text(encoding='utf-8')
roadmap=(ROOT/'PROJECT_STATUS_AND_ROADMAP.md').read_text(encoding='utf-8')
packaging=(ROOT/'PACKAGING_STUDIO.md').read_text(encoding='utf-8')
manifest=(ROOT/'functions/api/_lib/fullSchemaRequirements.js').read_text(encoding='utf-8')
migration=(ROOT/'database_build276_packaging_inventory_inci_capacity.sql').read_text(encoding='utf-8')
verification=(ROOT/'BUILD276_D1_VERIFICATION.sql').read_text(encoding='utf-8')
checks=[]
def ck(name, cond):
    checks.append((name,bool(cond)))
    if not cond:
        raise AssertionError(name)
def ver(pattern,text):
    m=re.search(pattern,text)
    return int(m.group(1)) if m else 0

ck('Packaging API is Build 276+', ver(r"const BUILD = '(\d+)'",api)>=276)
ck('Packaging JS cache is Build 276+', ver(r'admin-packaging-studio\.js\?v=(\d+)',html)>=276)
ck('Packaging CSS cache is Build 276+', ver(r'styles\.css\?v=(\d+)',html)>=276)

# Inventory identity is reference-only: linked for traceability, never stock consumption.
ck('Structured ingredients carry Inventory reference', 'site_item_inventory_id' in js and 'site_item_inventory_id' in api)
ck('Ingredient tab exposes Inventory search/add', 'Add ingredient/source from Devil n Dove Inventory' in js and 'addPackagingInventoryIngredient' in js)
ck('Ingredient UI explicitly says no stock change', 'Inventory reference only — no stock change.' in js and 'no Inventory movement' in js)
ck('No ingredient quantity/pinch field was introduced', 'formula_quantity' not in js and 'ingredient_quantity' not in js and 'A pinch' not in js and 'a pinch' not in js)
ck('Structured ingredients have manual printed-order controls', 'data-move-ingredient-up' in js and 'data-move-ingredient-down' in js and 'Use the row arrows to set the reviewed printed INCI order.' in js)
ck('Ingredient order controls are responsive', '.packaging-ingredient-row-actions' in css)
ck('Inventory ingredient application does not call inventory movement API', 'applyInventoryToIngredientRow' in js and 'inventory_movements' not in js.lower())
ck('API validates referenced Inventory IDs are active', 'Ingredient Inventory reference #' in api and 'COALESCE(is_active,1)=1' in api)
ck('Structured ingredient persistence writes Inventory reference', 'INSERT INTO packaging_project_ingredients (packaging_project_id,sort_order,site_item_inventory_id' in api)
ck('Purchased/source material inheritance propagates Inventory identity', 'linkedInventoryId' in api and 'site_item_inventory_id:linkedInventoryId' in api)
ck('Canonical INCI summary derives from structured rows', 'structured_ingredients' in api and 'ingredients_inci' in api and 'inci_name' in api)

# Long-INCI behavior: one ordered INCI list, two physical panels, fail closed on overflow.
ck('Ribbon has adaptive INCI layout helper', 'function ribbonIngredientLayout' in js and 'function wrapIngredientDeclaration' in js)
ck('Ribbon uses one bilingual heading for INCI declaration', 'INGREDIENTS / INGRÉDIENTS :' in js)
ck('Ribbon second panel is continuation, not duplicated translation', 'CONTINUED / SUITE :' in js)
ck('Overflow is visible rather than clipped silently', 'EXTENDED INCI LABEL REQUIRED' in js)
ck('Frontend blocks approval when full INCI exceeds tested ribbon capacity', 'Extended ingredient label required for full INCI' in js)
ck('Server blocks over-capacity ribbon declaration', 'tested two-panel ribbon capacity' in api and 'extended/peel-back label' in api)
ck('Ingredient guidance mentions Parfum not marketing shorthand', 'Parfum' in js and 'Essential Oil scent' in js)
ck('Fragrance guidance preserves allergen disclosure warning', 'fragrance allergens' in js.lower())

# Claims spacing.
ck('Claim renderer has Build 276 horizontal separation', 'const textX=zones.claims.x+35' in js and 'zones.claims.x+8' in js)
ck('Claim editor spacing is increased', '.packaging-claim-editor-row{gap:18px}' in css and '.packaging-claim-icon{width:44px;height:44px}' in css)

# Migration/schema parity.
ck('Build 276 migration adds reference column', 'ADD COLUMN site_item_inventory_id INTEGER' in migration)
ck('Build 276 migration creates ingredient Inventory index', 'idx_packaging_project_ingredients_inventory' in migration)
ck('Build 276 migration explicitly avoids stock movement', 'does NOT create Inventory movements' in migration)
ck('Build 276 migration ledger key is stable', "build276_packaging_inventory_inci_capacity" in migration)
ck('Verification audits orphan Inventory links', 'sii.site_item_inventory_id IS NULL' in verification)

for schema_name in ['database_full_schema.sql','database_schema.sql','database_store_schema.sql']:
    schema=(ROOT/schema_name).read_text(encoding='utf-8')
    ck(f'{schema_name} includes structured ingredient Inventory reference', 'CREATE TABLE IF NOT EXISTS packaging_project_ingredients' in schema and 'site_item_inventory_id INTEGER' in schema)
    ck(f'{schema_name} includes Build 276 ingredient index', 'idx_packaging_project_ingredients_inventory' in schema)
    con=sqlite3.connect(':memory:')
    con.executescript(schema)
    cols={r[1] for r in con.execute("PRAGMA table_info('packaging_project_ingredients')")}
    ck(f'{schema_name} runtime column exists', 'site_item_inventory_id' in cols)
    ck(f'{schema_name} foreign keys clean', len(con.execute('PRAGMA foreign_key_check').fetchall())==0)
    con.close()

ck('Full schema requirements reports Build 276+', ver(r'\"schema_build\"\s*:\s*(\d+)',manifest)>=276)
ck('Full schema requirements includes ingredient Inventory reference', 'site_item_inventory_id' in manifest and 'packaging_project_ingredients' in manifest)

# Documentation boundaries.
ck('AI handoff carries Build 276 Packaging behavior', 'Build 276' in handoff and 'reference-only' in handoff.lower() and 'Parfum' in handoff)
ck('Roadmap carries Build 276 deployment/next work', 'Build 276' in roadmap and 'mica' in roadmap.lower())
ck('Packaging specialist doc carries Build 276 behavior', 'Build 276' in packaging and 'Inventory' in packaging and 'INCI' in packaging)

# Syntax.
subprocess.run(['node','--check',str(ROOT/'public/js/admin-packaging-studio.js')],check=True)
subprocess.run(['node','--check',str(ROOT/'functions/api/admin/packaging-studio.js')],check=True)
ck('Packaging JavaScript syntax',True)

# Additive migration applies to a representative Build 275-era structure and preserves rows.
con=sqlite3.connect(':memory:')
con.executescript('''
PRAGMA foreign_keys=ON;
CREATE TABLE schema_migration_ledger(
 migration_key TEXT PRIMARY KEY,
 file_name TEXT,
 status TEXT,
 destructive INTEGER NOT NULL DEFAULT 0,
 applied_at TEXT,
 notes TEXT,
 updated_at TEXT
);
CREATE TABLE packaging_projects(packaging_project_id INTEGER PRIMARY KEY);
CREATE TABLE packaging_project_ingredients(
 packaging_project_ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
 packaging_project_id INTEGER NOT NULL,
 sort_order INTEGER NOT NULL DEFAULT 0,
 inci_name TEXT,
 display_name_en TEXT,
 display_name_fr TEXT,
 organic_flag INTEGER NOT NULL DEFAULT 0,
 allergen_note TEXT,
 required_on_label INTEGER NOT NULL DEFAULT 1,
 created_at TEXT,
 updated_at TEXT,
 FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE
);
INSERT INTO packaging_projects(packaging_project_id) VALUES(1);
INSERT INTO packaging_project_ingredients(packaging_project_id,sort_order,inci_name,display_name_en,display_name_fr,required_on_label)
VALUES(1,1,'Mica','Mica','Mica',1);
''')
con.executescript(migration)
cols={r[1] for r in con.execute("PRAGMA table_info('packaging_project_ingredients')")}
ck('Migration adds column to old Packaging ingredient table', 'site_item_inventory_id' in cols)
ck('Migration preserves existing ingredient rows', con.execute('SELECT COUNT(*) FROM packaging_project_ingredients').fetchone()[0]==1)
ck('Migration creates Inventory reference index', con.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_packaging_project_ingredients_inventory'").fetchone()[0]==1)
ck('Migration records ledger entry', con.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build276_packaging_inventory_inci_capacity'").fetchone()[0]==1)
ck('Migration leaves foreign keys clean', len(con.execute('PRAGMA foreign_key_check').fetchall())==0)
con.close()

print(f'Build 276 Packaging Inventory/INCI regression: {sum(ok for _,ok in checks)}/{len(checks)} passed')
for name,ok in checks:
    print(('PASS' if ok else 'FAIL')+': '+name)
