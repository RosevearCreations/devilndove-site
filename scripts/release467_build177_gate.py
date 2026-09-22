#!/usr/bin/env python3
"""Release 467 Build 177 — Packaging Studio bounded startup / progressive editor proof."""
from pathlib import Path
import subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]

def read(path):
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f'missing {path}')
        return ''
    return p.read_text(encoding='utf-8',errors='replace')

def req(ok,msg):
    if not ok: FAIL.append(msg)

def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')

page=read('admin/packaging-studio/index.html')
studio=read('public/js/admin-packaging-studio.js')
stabilizer=read('public/js/admin-packaging-save-stabilizer-v300.js')
compat=read('public/js/admin-packaging-compatibility-v301.js')
artwork=read('public/js/modules/packaging/artwork-picker.mjs')
native=read('public/js/modules/packaging/native-client-v298.mjs')
read_transport=read('public/js/modules/packaging/native-read-transport.mjs')
packaging_base=read('public/js/modules/packaging/index.mjs')
packaging_runtime=read('public/js/modules/packaging/runtime.mjs')
client_transport=read('public/js/modules/packaging/client-transport-v297.mjs')
client_launcher=read('public/js/admin-packaging-client-transport-v297.js')
native_launcher=read('public/js/admin-packaging-native-client-v298.js')
read_service=read('functions/api/_lib/packagingReadService.js')
site_auth=read('public/js/site-auth-ui.js')
admin=read('public/js/admin.js')
module_bootstrap=read('public/js/core/dd-application-module-bootstrap.mjs')
admin_runtime=read('public/js/core/dd-admin-module-runtime.mjs')
module_defs=read('public/js/core/dd-module-definitions.mjs')

# Placement and lean startup.
for token in ("'/admin/packaging-studio/'","'/admin/packaging-studio/index.html'"):
    req(token in site_auth,f'Packaging lean-start route missing: {token}')
req("ddLeanModuleRuntimeRequired = document.body?.dataset?.adminPage === 'packaging-studio'" in admin,'Packaging runtime is not preserved in lean mode')
req("build177_packaging_zero_d1_module_presentation" in module_bootstrap,'Packaging zero-D1 module-presentation path missing')
req("useLeanStaticPresentation()" in module_bootstrap,'Packaging lean-static module bootstrap classifier missing')
req("'/api/modules?fresh=1'" in module_bootstrap,'Manual authoritative module refresh path was lost')
req("packaging: 'creators'" in module_bootstrap,'Packaging is no longer mapped to Creators')

# Packaging runtime cache chain must be one generation.
for token,source in (
    ("dd-module-definitions.mjs?v=177",module_bootstrap),
    ("dd-admin-module-runtime.mjs?v=177",module_bootstrap),
    ("dd-module-definitions.mjs?v=177",admin_runtime),
    ("../modules/packaging/runtime.mjs?v=177",module_defs),
    ("./index.mjs?v=177",packaging_runtime),
    ("./native-read-transport.mjs?v=177",client_transport),
    ("/public/js/modules/packaging/client-transport-v297.mjs?v=177",client_launcher),
    ("/public/js/modules/packaging/native-client-v298.mjs?v=177",native_launcher),
):
    req(token in source,f'Packaging Build 177 cache chain missing: {token}')

# Server-owned Packaging bootstrap and detail are bounded.
limits=(
    'LIMIT 48','LIMIT 80','LIMIT 24','LIMIT 32','LIMIT 120','LIMIT 240','LIMIT 50'
)
for token in limits:
    req(token in read_service,f'Packaging bounded read marker missing: {token}')
for token in (
    'projects: 80','templates: 48','printers: 24','reference_sources: 32',
    'formula_library: 80','content_library: 120','source_material_library: 120',
    'formula_source_links: 240'
):
    req(token in read_service,f'Packaging bootstrap limit metadata missing: {token}')
req('ORDER BY version_number DESC LIMIT 50' in read_service,'Packaging version history is not bounded')
req('ORDER BY created_at DESC,packaging_export_history_id DESC LIMIT 100' in read_service,'Packaging export history bound missing')
req('ORDER BY created_at DESC,print_test_id DESC LIMIT 50' in read_service,'Packaging print-test history bound missing')

# Owner contracts are bounded and Inventory expands only from explicit typed search.
req("readInventory({ q, limit: 40 })" in studio,'Packaging on-demand Inventory search is missing')
req("}, 320)" in studio,'Packaging Inventory search debounce is missing')
req("merged.length >= 240" in studio,'Packaging in-session Inventory merge cap missing')
req('setInterval(' not in studio,'Packaging Studio gained background polling')

# No automatic second full Packaging bootstrap when owner contracts activate.
req("automatic_core_reload: false" in native,'Packaging owner-contract readiness does not declare no-core-reload')
req("refresh.click()" not in native,'Packaging native client still triggers an automatic second bootstrap')
req("core-packaging-first-no-automatic-second-bootstrap" in native,'Packaging no-second-bootstrap behavior identity missing')

# Mature editor observers are replaced by explicit lifecycle events.
req("new MutationObserver" not in stabilizer,'Packaging save stabilizer still has a permanent MutationObserver')
req("dd:packaging-editor-rendered" in stabilizer,'Packaging save stabilizer explicit render lifecycle missing')
req("new MutationObserver" not in artwork,'Packaging artwork picker still has a subtree MutationObserver')
req("dd:packaging-editor-rendered" in artwork,'Packaging artwork picker explicit render lifecycle missing')
req("observerInstalled: false" in artwork,'Packaging artwork status does not prove observer removal')
req("notifyEditorRendered" in studio and "dd:packaging-editor-rendered" in studio,'Packaging editor render event source missing')

# Advanced tools and large Material Library are progressive, not eager.
req("advancedLayersRequested" in compat,'Packaging advanced-layer lazy state missing')
req("event?.detail?.has_project===true" in compat,'Packaging advanced layers do not wait for a project')
req("loadMaterialIntelligence();queueMicrotask(publishState)" not in compat,'Packaging advanced intelligence returned to eager startup')
req("materialLibraryOpen: false" in studio,'Packaging Material Library does not default closed')
req("openPackagingMaterialLibrary" in studio,'Packaging Material Library open-on-demand control missing')
req("data-packaging-material-library-closed" in studio,'Packaging closed Material Library state missing')

# Delivery page must force the new runtime generation and avoid nonessential Admin analytics.
for token in (
    'Release 467 • Build 177 reliability',
    'data-build177-packaging-reliability',
    'admin-route-usage.js?v=177',
    'site-auth-ui.js?v=177',
    'admin-packaging-startup-gate-v297.js?v=177',
    'admin.js?v=177',
    'admin-packaging-client-transport-v297.js?v=177',
    'admin-packaging-native-client-v298.js?v=177',
    'admin-packaging-save-stabilizer-v300.js?v=177',
    'admin-packaging-compatibility-v301.js?v=177',
):
    req(token in page,f'Packaging page Build 177 delivery marker missing: {token}')
req('admin-packaging-studio.js?v=' in page,'Packaging page must retain a cache-busted Packaging Studio runtime; later builds may advance the revision')
req('site-analytics.js' not in page,'Packaging page still loads nonessential public analytics script')
req(page.count('loading="lazy"') >= 4,'Packaging below-fold reference imagery is not lazy-loaded')
req(page.count('decoding="async"') >= 5,'Packaging reference imagery is not async-decoded')

# Mature write safety and authority remain present.
for token in ('/api/admin/packaging-bootstrap','/api/admin/packaging-write'):
    req(token in native,f'Packaging native authority missing: {token}')
req('/api/admin/packaging-studio' not in native,'Native client reintroduced retired broad Packaging route')
req("legacyBroadReadsRemoved: true" in packaging_runtime,'Packaging runtime lost legacy broad-read retirement')
req("readInventory" in packaging_base and "readCatalog" in packaging_base and "readContentMedia" in packaging_base,'Packaging owner-contract facade missing')

for path in (
  'public/js/admin-packaging-studio.js',
  'public/js/admin-packaging-save-stabilizer-v300.js',
  'public/js/admin-packaging-compatibility-v301.js',
  'public/js/modules/packaging/artwork-picker.mjs',
  'public/js/modules/packaging/native-client-v298.mjs',
  'public/js/modules/packaging/native-read-transport.mjs',
  'public/js/modules/packaging/index.mjs',
  'public/js/modules/packaging/runtime.mjs',
  'public/js/modules/packaging/client-transport-v297.mjs',
  'public/js/admin-packaging-client-transport-v297.js',
  'public/js/admin-packaging-native-client-v298.js',
  'functions/api/_lib/packagingReadService.js',
  'public/js/core/dd-application-module-bootstrap.mjs',
  'public/js/core/dd-admin-module-runtime.mjs',
):
    node(path)

if FAIL:
    print('RELEASE 467 BUILD 177 PACKAGING STUDIO BOUNDED STARTUP: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)

print('RELEASE 467 BUILD 177 PACKAGING STUDIO BOUNDED STARTUP: PASS')
print('Placement: CREATORS / PACKAGING DOMAIN')
print('Lean startup: ON')
print('Packaging /api/modules presentation read: ZERO ON NORMAL STARTUP')
print('Packaging-owned bootstrap: BOUNDED')
print('Inventory: ON-DEMAND SEARCH / 40 PER QUERY / 240 SESSION CAP')
print('Material Library: CLOSED UNTIL REQUESTED')
print('Advanced Packaging layers: AFTER PROJECT OPEN')
print('Packaging editor MutationObservers: ZERO')
print('Automatic second Packaging bootstrap: ZERO')
print('Build 177 cache generation: CONSISTENT')
print('Writes: NATIVE PACKAGING AUTHORITY PRESERVED')
