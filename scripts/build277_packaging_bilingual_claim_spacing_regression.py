#!/usr/bin/env python3
from pathlib import Path
import re, subprocess

ROOT=Path(__file__).resolve().parents[1]
js=(ROOT/'public/js/admin-packaging-studio.js').read_text(encoding='utf-8')
api=(ROOT/'functions/api/admin/packaging-studio.js').read_text(encoding='utf-8')
html=(ROOT/'admin/packaging-studio/index.html').read_text(encoding='utf-8')
css=(ROOT/'css/styles.css').read_text(encoding='utf-8')
handoff=(ROOT/'AI_HANDOFF.md').read_text(encoding='utf-8')
roadmap=(ROOT/'PROJECT_STATUS_AND_ROADMAP.md').read_text(encoding='utf-8')
packaging=(ROOT/'PACKAGING_STUDIO.md').read_text(encoding='utf-8')
release=(ROOT/'RELEASE_NOTES.md').read_text(encoding='utf-8')
manifest=(ROOT/'functions/api/_lib/fullSchemaRequirements.js').read_text(encoding='utf-8')
checks=[]
def ck(name, cond):
    checks.append((name,bool(cond)))
    if not cond: raise AssertionError(name)
def ver(pattern,text):
    m=re.search(pattern,text)
    return int(m.group(1)) if m else 0

ck('Packaging API is Build 277+', ver(r"const BUILD = '(\d+)'",api)>=277)
ck('Packaging JS cache is Build 277+', ver(r'admin-packaging-studio\.js\?v=(\d+)',html)>=277)
ck('Packaging CSS cache is Build 277+', ver(r'styles\.css\?v=(\d+)',html)>=277)
ck('Admin packaging page remains noindex', '<meta name="robots" content="noindex,nofollow"' in html)

# Owner-requested bilingual ingredient presentation.
ck('Dedicated English ingredient heading restored', '>INGREDIENTS:</text>' in js)
ck('Dedicated French ingredient heading restored', '>INGRÉDIENTS :</text>' in js)
ck('Build 276 continuation heading retired', 'CONTINUED / SUITE :' not in js)
ck('English panel is populated from structured rows', 'englishFromRows' in js and 'display_name_en||row.inci_name' in js)
ck('French panel is populated from structured rows', 'frenchFromRows' in js and 'row.display_name_fr' in js)
ck('French fallback stays draft/helper based', 'curatedFrenchDraft' in js and 'French ingredient names are using a generated/fallback preview' in js)
ck('Frontend fits languages independently', 'const englishLayout=ribbonIngredientLayout(englishItems)' in js and 'const frenchLayout=ribbonIngredientLayout(frenchItems)' in js)
ck('English overflow is visible', 'EXTENDED LABEL REQUIRED' in js)
ck('French overflow is visible', 'ÉTIQUETTE ÉTENDUE REQUISE' in js)
ck('Frontend blocks approval if either language overflows', 'Extended bilingual ingredient label required for complete English and French lists' in js)
ck('Server requires saved French display names', "missing.push('French display name for each required ingredient row')" in api)
ck('Server checks dedicated English/French panel capacity', 'englishLines>11||frenchLines>11' in api and 'tested dedicated-panel capacity' in api)
ck('Server recommends extended label rather than clipping', 'extended/peel-back label' in api and 'rather than clipping either language' in api)

# Build 276 Inventory identity model remains intact.
ck('Ingredient Inventory traceability remains reference-only in UI', 'Inventory reference only — no stock change.' in js)
ck('No packaging ingredient quantity field', 'formula_quantity' not in js and 'ingredient_quantity' not in js and 'a pinch' not in js.lower())
ck('Ingredient row order controls remain', 'data-move-ingredient-up' in js and 'data-move-ingredient-down' in js)
ck('No Build 277 migration exists', not (ROOT/'database_build277_packaging_bilingual_claim_spacing.sql').exists())
ck('Schema build remains compatible with Build 276+', ver(r'"schema_build"\s*:\s*(\d+)',manifest)>=276)

# Claim clearance: fix both the horizontal collision and the near-touching stacked circles.
ck('Printed claim icon moved farther right from panel edge', 'const iconX=zones.claims.x+12' in js)
ck('Printed claim copy starts farther right', 'const textX=zones.claims.x+44' in js)
ck('Printed claim row centres have 12-unit separation', 'index*12.0' in js)
icon_radius=13*0.42
horizontal_clearance=44-(12+icon_radius)
vertical_clearance=12-(2*icon_radius)
ck('Printed icon-to-copy horizontal clearance exceeds 24 viewBox units', horizontal_clearance>24)
ck('Stacked claim icon circles no longer overlap', vertical_clearance>0)
ck('Claim editor has larger horizontal column gap', '.packaging-claim-editor-row{column-gap:24px;row-gap:18px}' in css)
ck('Claim editor icon box is larger', '.packaging-claim-icon{width:46px;height:46px}' in css)

# Documentation authority.
ck('AI handoff is Build 277+', ver(r'# Devil n Dove AI Handoff — Build (\d+)',handoff)>=277)
ck('AI handoff records dedicated bilingual panels', 'dedicated English `INGREDIENTS` panel' in handoff and 'dedicated French `INGRÉDIENTS` panel' in handoff)
ck('Roadmap is Build 277+', ver(r'# Devil n Dove Project Status and Roadmap — Build (\d+)',roadmap)>=277)
ck('Packaging specialist doc marks Build 277 current rendering', 'Build 277 restores the owner-requested bilingual ingredient presentation' in packaging)
ck('Release notes include Build 277', 'Build 277' in release)

subprocess.run(['node','--check',str(ROOT/'public/js/admin-packaging-studio.js')],check=True)
subprocess.run(['node','--check',str(ROOT/'functions/api/admin/packaging-studio.js')],check=True)
ck('Packaging JavaScript syntax', True)

print(f'Build 277 Packaging bilingual/claim-spacing regression: {sum(ok for _,ok in checks)}/{len(checks)} passed')
for name,ok in checks:
    print(('PASS' if ok else 'FAIL')+': '+name)
