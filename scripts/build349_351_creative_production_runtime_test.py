from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]

runtime = read('public/js/modules/creative-production/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin_js = read('public/js/admin.js')
page = read('admin/packaging-studio/index.html')
packaging_runtime = read('public/js/modules/packaging/runtime.mjs')
packaging_client = read('public/js/modules/packaging/client-transport-v297.mjs')
validation301 = read('BUILD301_VALIDATION.md')

# Build 349: proven Packaging baseline remains the authority being wrapped.
assert '## Status — COMPLETE IN DEVELOPMENT' in validation301
assert 'Build 301 is **COMPLETE IN DEVELOPMENT**' in validation301
assert 'const BUILD = 290' in packaging_runtime
assert 'const BUILD = 297' in packaging_client
assert 'legacyGetFallbackRemoved: true' in packaging_client
assert 'legacyServerGetReachable: false' in packaging_client
assert '/public/js/admin-packaging-compatibility-v301.js?v=301' in page

# Build 350: passive Creative & Production wrapper.
assert 'const BUILD = 350' in runtime
assert 'const ACTIVATION_BUILD = 351' in runtime
assert "const MODULE_ID = 'creative-production'" in runtime
assert "const SUPPORTED_DOMAINS = Object.freeze(['packaging'])" in runtime
assert "const PACKAGING_RUNTIME_PAGES = Object.freeze(['/admin/packaging-studio/'])" in runtime
for marker in ['inventory-read', 'catalog-read', 'content-media']:
    assert marker in runtime
for forbidden in ['fetch(', 'apiFetch(', 'CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'packagingMutationOwnership: false' in runtime
assert 'creativeMutationOwnership: false' in runtime
assert 'packagingBaselineBuild: 301' in runtime

# Build 351: only Packaging joins Creative & Production top-level runtime coverage.
creative = section(groups, "id: 'creative-production'", "id: 'business-administration'")
assert "entry: '../modules/creative-production/runtime.mjs?v=350'" in creative
assert "runtimeDomains: Object.freeze(['packaging'])" in creative
assert 'CREATIVE_PRODUCTION_RUNTIME_IMPLEMENTATION_BUILD = 350' in groups
assert 'CREATIVE_PRODUCTION_RUNTIME_COVERAGE_BUILD = 351' in groups
assert "'/admin/packaging-studio/'" in groups
assert "void import('/public/js/core/dd-admin-module-runtime.mjs?v=351')" in admin_js
assert '<script src="/public/js/admin.js?v=351"></script>' in page

# Existing Business runtime remains independently active only for Accounting.
business = section(groups, "id: 'business-administration'", ']);')
assert "entry: '../modules/business-administration/runtime.mjs?v=347'" in business
assert "runtimeDomains: Object.freeze(['accounting'])" in business

print('BUILDS 349-351 CREATIVE PRODUCTION PACKAGING RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
