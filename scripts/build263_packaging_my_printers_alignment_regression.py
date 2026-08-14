from pathlib import Path
import sqlite3, tempfile, re
root=Path(__file__).resolve().parents[1]
js=(root/'public/js/admin-packaging-studio.js').read_text()
api=(root/'functions/api/admin/packaging-studio.js').read_text()
html=(root/'admin/packaging-studio/index.html').read_text()
mig=(root/'database_build263_packaging_my_printers_label_alignment.sql').read_text()
checks=[]
def ck(cond,msg):
    if not cond: raise AssertionError(msg)
    checks.append(msg)
ck('Build 263' in js and "const BUILD = '263'" in api,'Build 263 markers present')
ck('packaging_printer_profiles' in api and 'idx_packaging_printer_profiles_active_default' in mig,'My Printers persistence exists')
ck("LIKE '%printer%'" not in api,'Packaging API no longer scans Inventory for printers')
ck('print_tests||[]' not in js[:2500],'Printer dropdown no longer derives from print-test history')
ck('PRINTER_PROFILE_KEY' not in js,'Printer dropdown no longer uses browser-only saved profile list')
ck('My Printers' in js and 'Default labels' in js and 'printProfileDefaultLabel' in js,'My Printers/default controls rendered')
ck("action:'save_printer_profile'" in js and "action:'delete_printer_profile'" in js,'My Printers save/delete actions wired')
ck("action==='save_printer_profile'" in api and "action==='delete_printer_profile'" in api,'My Printers API actions exist')
ck('is_default_label=0' in api and 'is_default_label=1' in api,'Default label printer uniqueness logic exists')
ck('admin-packaging-studio.js?v=263' in html and 'styles.css?v=263' in html,'Packaging assets cache-busted to v263')
ck('const frontTextX=340' in js and 'text-anchor="start"' in js,'Oval text block moved toward rose and left-justified')
ck('x="205"' in js and 'width="126"' in js,'Rose enlarged/repositioned toward text block')
# migration idempotency over a schema copy
with tempfile.NamedTemporaryFile(suffix='.sqlite') as f:
    db=sqlite3.connect(f.name)
    db.executescript((root/'database_full_schema.sql').read_text())
    db.executescript(mig)
    db.executescript(mig)
    row=db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='packaging_printer_profiles'").fetchone()[0]
    ck(row==1,'My Printers table exists after repeated migration')
    ledger=db.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build263_packaging_my_printers'").fetchone()[0]
    ck(ledger==1,'Build 263 migration ledger idempotent')
    db.execute("INSERT INTO packaging_printer_profiles(profile_name,is_default_label) VALUES('Printer A',1)")
    db.execute("INSERT INTO packaging_printer_profiles(profile_name,is_default_label) VALUES('Printer B',0)")
    defaults=db.execute("SELECT COUNT(*) FROM packaging_printer_profiles WHERE is_active=1 AND is_default_label=1").fetchone()[0]
    ck(defaults==1,'Fixture supports one default label printer')
print(f'Build 263 regression: {len(checks)}/{len(checks)} PASS')
for c in checks: print('PASS',c)
