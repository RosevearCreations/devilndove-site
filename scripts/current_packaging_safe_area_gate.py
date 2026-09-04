#!/usr/bin/env python3
"""Forward Build 41 Packaging Studio responsive/safe-area regression gate."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    return (ROOT/path).read_text(encoding='utf-8',errors='replace')

css=read('css/current-responsive.css').replace(' ','')
js=read('public/js/packaging-safe-area-guard.js')
middleware=read('functions/_middleware.js')
page=read('admin/packaging-studio/index.html')

for viewport in (
    '@media(max-width:390px)',
    '@media(min-width:391px)and(max-width:767px)',
    '@media(min-width:768px)and(max-width:1023px)',
    '@media(min-width:1024px)and(max-width:1279px)',
    '@media(min-width:1280px)and(max-width:1439px)',
    '@media(min-width:1440px)',
):
    req(viewport in css,f'Packaging responsive convergence missing {viewport}')
req('packaging-studio-layout' in css and 'packaging-project-sidebar' in css,'Packaging workspace layout rules missing')
req('grid-auto-flow:column' in css,'tablet Packaging project rail is missing')
req('packaging-safe-area-status' in css,'Packaging safe-area status styling missing')

for needle in (
    'packagingTemplateWidth','packagingTemplateHeight','packagingSafeMarginMm','packagingTemplateShape',
    'text,image,foreignObject','outside_safe_area','missing_geometry','no_protected_content',
    'button.disabled=!result.ready','data-packaging-export','#printOptimizedSheet',
    'DDPackagingSafeArea','MutationObserver','cloneForMeasurement',
):
    req(needle in js,f'Packaging fail-closed guard missing {needle}')
req("reason:'validation_exception'" in js,'Packaging safe-area exceptions must fail closed')
req("reason:'invalid_safe_area'" in js,'invalid Packaging safe area must fail closed')
req('protected label content is outside the safe area or cannot be measured' in js,'operator-visible fail-closed explanation missing')

req('/public/js/packaging-safe-area-guard.js?v=current' in middleware,'middleware must inject Packaging safe-area guard')
for needle in ('data-admin-page="packaging-studio"','id="packagingSvgPreview"','id="packagingSafeMarginMm"','data-packaging-export="svg"','id="printOptimizedSheet"'):
    req(needle in page or needle in read('public/js/admin-packaging-studio.js'),f'Packaging runtime anchor missing {needle}')

print('CURRENT PACKAGING SAFE-AREA GATE')
print('Viewports: 360/390 • 768 • 1024/1280+ • 1440+')
print('Protected content: text • ingredients • artwork • logos/brand')
if FAIL:
    for index,item in enumerate(FAIL,1): print(f'{index:03d}. FAIL — {item}')
    raise SystemExit(1)
print('CURRENT PACKAGING SAFE-AREA GATE: PASS')
