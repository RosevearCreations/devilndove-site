from pathlib import Path
import re, sqlite3, tempfile, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
js=(ROOT/'public/js/admin-packaging-studio.js').read_text(encoding='utf-8')
api=(ROOT/'functions/api/admin/packaging-studio.js').read_text(encoding='utf-8')
html=(ROOT/'admin/packaging-studio/index.html').read_text(encoding='utf-8')
css=(ROOT/'css/styles.css').read_text(encoding='utf-8')
checks=[]
def ck(cond, msg): checks.append((bool(cond),msg))

ck('Active source-material template' in js and 'packagingSourceMaterialTemplateId' in js,'Material Library uses active source-template dropdown')
ck('packagingSourceActiveCard' in js,'Only selected source template has active-card mount')
ck('packagingReusableContentSelect' in js,'Reusable ingredient/blend/colourant library uses dropdown')
ck('Saving a source-material template automatically adds its Master INCI ingredients here' in js,'UI explains automatic source ingredient reuse')
ck('syncSourceMaterialReusableContent' in api and 'await syncSourceMaterialReusableContent' in api,'Source-template save synchronizes reusable content')
ck("materialType==='fragrance_oil'?'fragrance_oil':materialType==='colourant'?'colourant':''" in api,'Fragrance and colourant source templates become reusable dropdown entries')
ck('let printers=[]' in api and 'printers,' in api,'Packaging API returns known printer inventory')
ck('Print optimized 8.5 × 11 sheet' in js,'Print Test has optimized Letter-sheet action')
ck('printTestPrinterProfile' in js and 'printerProfileOptions' in js,'Print Test has saved/known printer profile dropdown')
ck('sheetPlan(template,profile' in js and 'rotated' in js and 'orientation' in js,'Print planner tests orientation/rotation for maximum labels')
ck('id="printProfileGap" type="number" value="0"' in js and 'num(profile.gap_mm,0)' in js,'Default label gap is zero for maximum sheet yield')
ck('<th>Printer</th>' in js and 'test.printer_name' in js,'Print-test history records printer name')
ck('const LETTER_MM = { width: 215.9, height: 279.4 };' in js,'Letter paper dimensions are explicit')
ck('admin-packaging-studio.js?v=262' in html and 'styles.css?v=262' in html,'Packaging Studio assets are cache-busted to v262')
ck('.packaging-printer-callout' in css and '.packaging-sheet-plan' in css,'Printer/profile layout CSS exists')

# Soap print geometry checks.
ck("fr:{x:20" in js and "en:{x:570" in js,'French ingredients are left of oval and English ingredients are right')
ck('bandY+14+index*10.2' in js,'Claims start lower and use compressed vertical spacing')
ck('bandY+58' in js and 'bandY+65' in js,'Weight separator and weight line are lowered')
ck('const frontTextX=428' in js and 'text-anchor="middle"' in js,'Front title hierarchy is centered relative to rose/artwork')
ck('r="28"' in js and 'font-size="3.55"' in js,'Small inner circle enlarged and wording reduced')
ck('clipPath id="soap-en-ingredients"' in js and 'bandHeight-38' in js,'Ingredient text is clipped inside safe print zones')

# Code-only build: current migration remains earlier boundary and no Build 262 SQL is required.
ck(not (ROOT/'database_build262.sql').exists(),'No unnecessary Build 262 migration introduced')

passed=sum(1 for ok,_ in checks if ok)
for ok,msg in checks:
    print(('PASS' if ok else 'FAIL')+': '+msg)
print(f'\n{passed}/{len(checks)} checks passed')
if passed!=len(checks): sys.exit(1)
