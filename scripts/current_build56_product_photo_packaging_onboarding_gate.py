#!/usr/bin/env python3
"""Build 56 regression guard: Product photo guidance + Packaging onboarding."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def require(condition, message):
    if not condition:
        FAIL.append(message)

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

provenance = json.loads(read('release467-build56-product-photo-guidance-packaging-onboarding.json'))
require(provenance.get('build') == 56, 'Build 56 provenance build number missing')
require(provenance['source_boundary']['development']['sha'] == '190a8960ab259bbb3cfb87d8215d32b2d6da13cb', 'Build 55 dev SHA not ingested')
require(provenance['source_boundary']['development']['tree'] == 'a338071e446f5b18db3f26d8a0c0ca07141cd158', 'Build 55 dev tree not ingested')
require(provenance['source_boundary']['development']['system_gate_run'] == 33936132522, 'Build 55 System proof not ingested')
require(provenance['source_boundary']['development']['quality_run'] == 33936132397, 'Build 55 Quality proof not ingested')
require(provenance['source_boundary']['development']['it_admin_runtime_run'] == 33936132405, 'Build 55 I.T. proof not ingested')
require(provenance['source_boundary']['development']['repository_hygiene_run'] == 33936132426, 'Build 55 Hygiene proof not ingested')
require(provenance['source_boundary']['production']['sha'] == 'ee42e7838a83def94e858b3d0d6c1a23947e2344', 'Build 55 Production SHA not ingested')
require(provenance['source_boundary']['production']['production_pages_deploy_run'] == 33936229477, 'Build 55 Production proof not ingested')
require(provenance['scope']['schema_migration'] is False and provenance['scope']['d1_mutation'] is False and provenance['scope']['r2_mutation'] is False, 'Build 56 must remain schema/data neutral')

admin = read('public/js/admin.js')
product = read('public/js/admin-product-image-quality-editor-bridge-v56.js')
photo = read('public/js/admin-product-image-quality-guidance-v56.js')
packaging = read('public/js/admin-packaging-onboarding-v56.js')

for expected in (
    'admin-product-image-quality-editor-bridge-v56.js',
    'admin-product-image-quality-guidance-v56.js',
    'admin-packaging-onboarding-v56.js',
):
    require(expected in admin, f'admin.js does not load {expected}')

for expected in (
    "dd:product-editor-target",
    "dd:product-editor-cleared",
    "dd:product-image-fields-updated",
    "/api/admin/product-image-quality",
    "Score unscored images",
    "Rescore all images",
    "Why this score / what to improve",
    "r448-browser-v1",
    "Release 448 deterministic browser Canvas heuristic",
    "1200 px on the shortest side",
):
    require(expected in product, f'Product Editor image-quality bridge missing contract: {expected}')

for expected in (
    'How to improve a weak score',
    'roughly 62% subject occupancy',
    '1200 px or more on the shortest side',
    'Recommended photography workflow',
    'duplicate flags as review prompts only',
):
    require(expected in photo, f'Photography coaching missing: {expected}')

for expected in (
    'First-time-user walkthrough',
    'Progress is saved in this browser and resumes when you return',
    'Advanced mode',
    'Show me',
    'Common blocker explanations',
    'Missing bilingual/INCI content',
    'Text overflow',
    'Missing physical proof',
    'Save version, approve and export',
):
    require(expected in packaging, f'Packaging onboarding missing: {expected}')

require("localStorage.setItem(storageKey()" in packaging, 'Packaging walkthrough does not persist progress')
require("data-v56-packaging-action=\"advanced\"" in packaging, 'Packaging Advanced mode action missing')
require("data-v56-packaging-action=\"guided\"" in packaging, 'Packaging Guided mode restore action missing')

if FAIL:
    print('BUILD 56 PRODUCT PHOTO / PACKAGING ONBOARDING GATE: FAIL')
    for item in FAIL:
        print(f' - {item}')
    raise SystemExit(1)

print('BUILD 56 PRODUCT PHOTO / PACKAGING ONBOARDING GATE: PASS')
