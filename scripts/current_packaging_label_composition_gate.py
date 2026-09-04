#!/usr/bin/env python3
"""Release-neutral forward gate for Packaging Label Composition & Overrides."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SERVICE = ROOT / 'functions/api/admin/packaging-label-composition.js'
BROWSER = ROOT / 'public/js/admin-packaging-label-composition-v43.js'
MATERIAL = ROOT / 'functions/api/admin/packaging-material-intelligence.js'
COMPAT = ROOT / 'public/js/admin-packaging-compatibility-v301.js'


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f'PACKAGING LABEL COMPOSITION GATE: FAIL — {message}')


for path in (SERVICE, BROWSER, MATERIAL, COMPAT):
    require(path.exists(), f'missing {path.relative_to(ROOT)}')

service = SERVICE.read_text(encoding='utf-8')
browser = BROWSER.read_text(encoding='utf-8')
material = MATERIAL.read_text(encoding='utf-8')
compat = COMPAT.read_text(encoding='utf-8')
compact_service = re.sub(r'\s+', '', service)

require('constBUILD=43;' in compact_service, 'service must retain Build 43 identity')
require("newSet(['inherit','print','omit'])" in compact_service, 'label-level decision states changed or disappeared')
require("action!=='save_label_composition'" in compact_service, 'label-composition save action missing')
require('label_composition_overrides' in service, 'project JSON override authority missing')
require('artwork_json' in service, 'existing project JSON persistence boundary missing')
require('packaging_project_ingredients' in service and 'required_on_label' in service, 'existing ingredient print authority missing')
require('authoritative_readback:true' in compact_service, 'authoritative D1 read-back proof missing')
require("decision==='omit'&&policy==='required'" in compact_service, 'Required rows must fail closed against omission')
require("decision==='print'&&policy==='internal_only'" in compact_service, 'Internal Only rows must fail closed against forced printing')
require('ingredients_inci' in service and 'ingredients_en' in service and 'ingredients_fr' in service, 'saved project aggregate ingredient text must converge with effective composition')
require('claims' in service and 'warnings_en' in service and 'net_quantity_text' in service, 'What Will Print payload must include non-ingredient label content')

# Build 43 is deliberately zero-schema and may only perform normal Packaging business-data writes.
ddl_patterns = (
    r'\bCREATE\s+(?:TABLE|INDEX|VIEW|TRIGGER)\b',
    r'\bALTER\s+TABLE\b',
    r'\bDROP\s+(?:TABLE|INDEX|VIEW|TRIGGER)\b',
    r'\bPRAGMA\s+foreign_keys\b',
)
for pattern in ddl_patterns:
    require(not re.search(pattern, service, flags=re.I), f'request-time DDL detected: {pattern}')

require('const BUILD = 43' in browser, 'browser Label Composition identity missing')
require("const ENDPOINT = '/api/admin/packaging-label-composition'" in browser, 'browser endpoint authority changed')
require('What Will Print' in browser, 'What Will Print inspector missing')
require('data-build43-decision' in browser and 'data-build43-save' in browser, 'per-label override controls missing')
require('authoritative_readback' in browser, 'browser must require authoritative read-back')
require('syncNativeIngredientCheckboxes' in browser, 'saved effective composition must converge with native Packaging preview controls')
require('schemaChange: false' in browser and 'requestTimeDdl: false' in browser, 'browser safety status must remain explicit')
require('productionContacted: false' in browser, 'browser safety status must preserve Production isolation')

# Build 42 inheritance remains reusable-template authority, but it must preserve Build 43 project decisions.
require('projectOverrideMap' in material, 'Build 42 normalizer must read project-level Build 43 overrides')
require('effectiveWithOverride' in material, 'Build 42 normalizer must apply reviewed label decisions')
require('overrides_preserved' in material, 'normalization must report preserved label overrides')
require('label_composition_overrides' in material, 'Build 42 normalizer lost the Build 43 JSON compatibility bridge')
require('ingredients_inci' in material and 'ingredients_en' in material and 'ingredients_fr' in material, 'inheritance normalization must converge aggregate project ingredient text')

require('/public/js/admin-packaging-label-composition-v43.js?v=46743' in compat, 'Packaging compatibility checkpoint must load Build 43 browser layer')
require("document.addEventListener('dd:packaging-label-composition-active', publishState)" in compat, 'compatibility status must observe Build 43 activation')
require('labelCompositionBuild' in compat and 'labelCompositionActive' in compat, 'compatibility snapshot must project Build 43 state')

require(not list((ROOT / 'migrations').glob('*467*43*')) if (ROOT / 'migrations').exists() else True, 'Build 43 must not introduce a Release 467 canonical schema migration')

print('CURRENT PACKAGING LABEL COMPOSITION GATE: PASS')
