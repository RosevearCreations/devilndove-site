#!/usr/bin/env python3
from pathlib import Path
import sqlite3, re, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name, cond):
    checks.append((name,bool(cond)))
    print(('PASS' if cond else 'FAIL'),name)

def txt(path): return (ROOT/path).read_text(encoding='utf-8',errors='ignore')

pack=txt(Path('public/js/admin-packaging-studio.js'))
amz=txt(Path('functions/api/admin/amazon-link-preview.js'))
packhtml=txt(Path('admin/packaging-studio/index.html'))
css=txt(Path('css/styles.css'))
mediahtml=txt(Path('admin/media-content-studio/index.html'))
mediajs=txt(Path('public/js/admin-media-content-studio.js'))
mediaapi=txt(Path('functions/api/admin/media-content-studio.js'))
pubapi=txt(Path('functions/api/public-media-content-manifest.js'))
runtime=txt(Path('public/js/media-content-runtime.js'))
replaceapi=txt(Path('functions/api/admin/media-content-replace.js'))
mig=txt(Path('database_build256_media_content_studio.sql'))

check('Amazon material importer is visible', 'Create draft from Amazon link' in pack and 'packagingSourceAmazonUrl' in pack)
check('Amazon preview returns packaging source draft', 'packaging_source_draft' in amz and 'inferPackagingMaterial' in amz)
check('Amazon inference covers soap base', "material_subtype: 'soap_base'" in amz)
check('Amazon inference covers essential oil blend', "material_subtype: 'essential_oil_blend'" in amz)
check('Amazon inference covers colourant/mica', "material_subtype: 'colourant'" in amz and "material_subtype: 'mica'" in amz)
check('Amazon import is review-first, not auto-save', 'Nothing has been saved yet' in pack and 'needs_review' in amz)
check('Amazon preview bounds remote response size', 'readBoundedText' in amz and '2500000' in amz)
check('Amazon importer carries product-detail benefits as evidence', 'amazonFeatureBullets' in amz and 'label_candidate: 0' in amz and 'benefits:' in amz)
check('Amazon source rows stay independent from current label ingredients', 'sourceInciRowsFromDom' in pack and 'packaging_source_draft' in pack)
check('Packaging assets cache-busted to 256', 'styles.css?v=256' in packhtml and 'admin-packaging-studio.js?v=256' in packhtml)
check('Soap renderer uses reference v3', 'data-soap-layout="reference-v3"' in pack and "soap_reference_v3" in pack)
check('Soap renderer has five fixed zones', all(v in pack for v in ["en:{x:16,w:154}","front:{cx:365,rx:190}","fr:{x:566,w:150}","rear:{cx:792,r:61}","claims:{x:872,w:212}"]))
check('Ingredient and claim zones are clipped', all(v in pack for v in ['soap-en-ingredients','soap-fr-ingredients','soap-claims']))
check('Soap preview has layout directions', 'Soap ribbon alignment guide' in pack and 'approved reference image' in pack)
check('Soap preview CSS forces stable wide SVG', 'svg[data-soap-layout="reference-v3"]' in css and 'min-width:1100px' in css)

check('Media Studio admin page exists', (ROOT/'admin/media-content-studio/index.html').exists())
check('Media Studio directions preserve authored media', ('Existing website images remain exactly as authored' in mediahtml or 'Existing website content remains unchanged' in mediahtml or 'Existing website content remains' in mediahtml))
check('Media Studio has numbered owner workflow', all(f'{i}.' in mediahtml for i in range(1,5)))
check('Media Studio supports upload and explicit R2 sync', 'mediaUploadButton' in mediahtml and 'mediaSyncR2' in mediahtml)
check('Media Studio exposes metadata editor', all(v in mediahtml for v in ['mediaAltText','mediaCaption','mediaFocalX','mediaConsentNotes']))
check('Media Studio exposes page text draft/publish', 'Publish text' in mediajs and 'Save draft' in mediajs)
check('Media Studio page inspector discovers image backgrounds', 'getComputedStyle' in mediajs and 'backgroundImage' in mediajs)
check('Media Studio confirms occupied replacement', 'Only this placement was changed' in mediaapi and 'is occupied by' in mediajs)
check('Media Studio safe deletion checks active assignments', 'Cannot delete this image. It is currently used in' in mediaapi)
check('Media Studio supports same-key replacement while preserving placements', 'media-content-replace' in mediajs and 'Replace file, keep placements' in mediahtml and 'Replaced file while preserving media identity and assignments' in replaceapi)
check('Same-key replacement requires admin step-up', 'requireAdminStepUp' in replaceapi and 'confirm_password' in replaceapi)
check('Media Studio archive checks active assignments', 'Remove or replace those placements before archiving' in mediaapi)
check('R2 sync is explicit, bounded and preserves assignments', 'action === "sync_r2"' in mediaapi and 'Math.min(250' in mediaapi and 'Existing assignments and authored metadata were preserved' in mediaapi)
check('R2 sync uses binding list only in admin API', '.list({' in mediaapi and '.list(' not in pubapi)
check('Public manifest is bounded D1-only', 'LIMIT 350' in pubapi and 'PRODUCT_MEDIA_BUCKET' not in pubapi)
check('Public runtime changes only returned selectors', 'querySelector' in runtime and 'media-content-manifest' in runtime)
check('Public runtime retries dynamic DOM briefly', 'MutationObserver' in runtime and '8000' in runtime)
check('No manifest assignment leaves authored content alone', 'authored page content is untouched' in runtime)
check('Dashboard links Media Studio', '/admin/media-content-studio/' in txt(Path('admin/index.html')))
check('Packaging links Media/Artwork Studio', '/admin/media-content-studio/?media_type=artwork' in packhtml)
check('Attached Studio specification preserved in repo', (ROOT/'docs/media-content/DEVIL_N_DOVE_MEDIA_CONTENT_MANAGEMENT_STUDIO.md').exists())

public_html=[]
for f in ROOT.rglob('*.html'):
    rel=f.relative_to(ROOT).as_posix()
    if rel.startswith('admin/'): continue
    if ('media-content-runtime.js?v=256' in f.read_text(encoding='utf-8',errors='ignore') or 'media-content-runtime.js?v=257' in f.read_text(encoding='utf-8',errors='ignore')): public_html.append(rel)
check('Public runtime installed site-wide', len(public_html)>=50)

for table in ['managed_media_metadata','media_content_slots','media_content_assignments','managed_content_blocks','media_content_change_audit']:
    check(f'Migration creates {table}', f'CREATE TABLE IF NOT EXISTS {table}' in mig)
check('Active assignment uniqueness enforced', 'idx_media_content_assignments_active_slot' in mig and 'WHERE active=1' in mig)
check('Current migration is byte-identical', (ROOT/'database_upgrade_current_pass.sql').read_bytes()==(ROOT/'database_build256_media_content_studio.sql').read_bytes())

try:
    conn=sqlite3.connect(':memory:')
    conn.executescript('PRAGMA foreign_keys=ON;\n'+txt(Path('database_full_schema.sql')))
    check('Fresh full schema executes', True)
    check('Fresh schema has no foreign-key violations', len(conn.execute('PRAGMA foreign_key_check').fetchall())==0)
    conn.executescript(mig); conn.executescript(mig)
    check('Build 256 migration is idempotent', True)
    check('Build 256 ledger row remains singular', conn.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build256_media_content_studio'").fetchone()[0]==1)
except Exception as exc:
    print('SCHEMA ERROR',exc)
    check('Fresh full schema executes',False);check('Fresh schema has no foreign-key violations',False);check('Build 256 migration is idempotent',False);check('Build 256 ledger row remains singular',False)


for schema_name in ['database_schema.sql','database_store_schema.sql']:
    try:
        c=sqlite3.connect(':memory:')
        c.executescript('PRAGMA foreign_keys=ON;\n'+txt(Path(schema_name)))
        check(f'{schema_name} executes with Build 256', True)
        check(f'{schema_name} has no foreign-key violations', len(c.execute('PRAGMA foreign_key_check').fetchall())==0)
    except Exception as exc:
        print(schema_name,'ERROR',exc)
        check(f'{schema_name} executes with Build 256', False)
        check(f'{schema_name} has no foreign-key violations', False)

failed=[n for n,ok in checks if not ok]
print(f'\nBuild 256: {len(checks)-len(failed)}/{len(checks)} checks passed')
if failed:
    print('FAILED:');[print('-',x) for x in failed]
    sys.exit(1)
