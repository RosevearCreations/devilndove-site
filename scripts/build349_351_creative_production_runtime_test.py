from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


def numeric_constant(text, name):
    match = re.search(rf"(?:export\s+)?const\s+{re.escape(name)}\s*=\s*(\d+)", text)
    assert match, f'Missing numeric constant: {name}'
    return int(match.group(1))


def cache_version(text, pattern):
    match = re.search(pattern, text)
    assert match, f'Missing cache-busted path matching: {pattern}'
    return int(match.group(1))


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

# Build 350 durable boundary: Creative & Production continues to support Packaging
# through a passive wrapper. Later builds may extend the same runtime to more
# Creative domains, so historical validation must not freeze the runtime at 350.
assert numeric_constant(runtime, 'BUILD') >= 350
assert numeric_constant(runtime, 'ACTIVATION_BUILD') >= 351
assert "const MODULE_ID = 'creative-production'" in runtime
assert "'packaging'" in section(runtime, 'const SUPPORTED_DOMAINS', 'const PACKAGING_RUNTIME_PAGES')
assert "const PACKAGING_RUNTIME_PAGES = Object.freeze(['/admin/packaging-studio/'])" in runtime
for marker in ['inventory-read', 'catalog-read', 'content-media']:
    assert marker in runtime
for forbidden in ['fetch(', 'apiFetch(', 'CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'packagingMutationOwnership: false' in runtime
assert 'creativeMutationOwnership: false' in runtime
assert 'packagingBaselineBuild: 301' in runtime

# Build 351 durable boundary: Packaging remains inside Creative & Production
# runtime coverage. Later builds may add Creative/CAIP/Content coverage and may
# advance cache versions, but must not remove the proven Packaging boundary.
creative = section(groups, "id: 'creative-production'", "id: 'business-administration'")
assert '../modules/creative-production/runtime.mjs?v=' in creative
assert cache_version(creative, r"\.\./modules/creative-production/runtime\.mjs\?v=(\d+)") >= 350
runtime_domains = section(creative, 'runtimeDomains:', '),')
assert "'packaging'" in runtime_domains
assert numeric_constant(groups, 'CREATIVE_PRODUCTION_RUNTIME_IMPLEMENTATION_BUILD') >= 350
assert numeric_constant(groups, 'CREATIVE_PRODUCTION_RUNTIME_COVERAGE_BUILD') >= 351
assert "'/admin/packaging-studio/'" in groups
assert cache_version(admin_js, r"dd-admin-module-runtime\.mjs\?v=(\d+)") >= 351
assert cache_version(page, r"/public/js/admin\.js\?v=(\d+)") >= 351

# Existing Business runtime remains independently available for Accounting.
# Do not freeze later Business runtime expansion in this historical test.
business = section(groups, "id: 'business-administration'", ']);')
assert '../modules/business-administration/runtime.mjs?v=' in business
business_domains = section(business, 'runtimeDomains:', '),')
assert "'accounting'" in business_domains

print('BUILDS 349-351 CREATIVE PRODUCTION PACKAGING RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
