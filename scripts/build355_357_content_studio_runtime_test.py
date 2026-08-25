from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


server_service = read('functions/api/_lib/contentStudioReadService.js')
legacy = read('functions/api/admin/content-studio.js')
contract = read('functions/api/admin/contracts/content-studio-read.js')
client_service = read('public/js/modules/creative-production/content-studio-read-service.mjs')
runtime = read('public/js/modules/creative-production/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin_js = read('public/js/admin.js')
page = read('admin/content-studio/index.html')
caip = read('functions/api/admin/creative-assets.js')

# Build 355 — schema-aware read authority with no request-time DDL/DML.
assert 'export const BUILD = 355' in server_service
assert "export const CONTRACT_ID = 'content-studio-read'" in server_service
assert "export const OWNER = 'content'" in server_service
assert 'request_time_schema_mutation: false' in server_service
assert 'mutation_ownership_moved: false' in server_service
assert 'sqlite_master' in server_service
assert 'PRAGMA table_info' in server_service
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in server_service

# Legacy automatic GET delegates to the read authority and no longer ensures schema.
legacy_get = section(legacy, 'export async function onRequestGet', 'export async function onRequestPost')
assert 'readContentStudio' in legacy_get
assert 'ensureContentAutomationSchema' not in legacy_get
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in legacy_get

# POST keeps the retained mutation compatibility authority.
legacy_post = section(legacy, 'export async function onRequestPost')
assert 'ensureContentAutomationSchema(db)' in legacy_post
for action in ['create_from_creative_project', 'create_project', 'refresh_archive', 'update_project', 'update_media', 'update_deliverable', 'send_to_social_queue']:
    assert action in legacy_post

# Contract is GET-only and delegates to the same read authority.
assert "from '../../_lib/contentStudioReadService.js'" in contract
assert 'readContentStudio' in contract
assert 'onRequestPost' not in contract

# Build 356 — passive Content service plus umbrella runtime expansion.
assert 'export const BUILD = 356' in client_service
assert "export const SERVICE_ID = 'content-studio-read'" in client_service
assert "export const OWNER = 'content'" in client_service
assert "export const ROUTE = '/api/admin/contracts/content-studio-read'" in client_service
assert 'ensureContentStudioReadService' in client_service
assert "const BUILD = 356;" in runtime
assert 'const ACTIVATION_BUILD = 357;' in runtime
assert "'content'" in section(runtime, 'const SUPPORTED_DOMAINS', 'const PACKAGING_RUNTIME_PAGES')
assert "const CONTENT_STUDIO_RUNTIME_PAGES = Object.freeze(['/admin/content-studio/'])" in runtime
assert "const CONTENT_REQUIRED_SERVICES = Object.freeze(['content-studio-read'])" in runtime
assert 'ensureContentStudioReadService(registry)' in runtime
assert 'contentMutationOwnership: false' in runtime
assert 'ownsContentMutations: false' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime

# Build 357 — Content Studio joins top-level Creative runtime coverage only.
creative = section(groups, "id: 'creative-production'", "id: 'business-administration'")
assert "entry: '../modules/creative-production/runtime.mjs?v=356'" in creative
assert "runtimeDomains: Object.freeze(['packaging', 'creative', 'content'])" in creative
assert 'CONTENT_STUDIO_READ_CONTRACT_BUILD = 355' in groups
assert 'CREATIVE_PRODUCTION_RUNTIME_IMPLEMENTATION_BUILD = 356' in groups
assert 'CREATIVE_PRODUCTION_RUNTIME_COVERAGE_BUILD = 357' in groups
assert "'/admin/content-studio/'" in groups
assert 'contentStudioMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert "dd-admin-module-runtime.mjs?v=357" in admin_js

admin_pos = page.index('/public/js/admin.js?v=357')
content_pos = page.index('/public/js/admin-content-studio.js?v=273')
assert admin_pos < content_pos

# CAIP remains intentionally unactivated because its GET still performs schema ensures.
assert 'await ensureCreativeAssetIntelligenceSchema(state.db);' in caip
assert 'await ensureCreativeAssetOperationsSchema(state.db);' in caip
assert "'caip'" not in section(creative, 'runtimeDomains:', '),')

print('BUILDS 355-357 CONTENT STUDIO RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
