// Build 748: protected browser recovery, private source contract, frozen Dovlin.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const old=read('admin/storefront-acceptance/index.html');
const page=read('admin/customer-journey-recovery/index.html');
const client=read('public/js/admin-journey-recovery-748.js');
const server=read('functions/api/admin/customer-journey-closure-748.js');
const middleware=read('functions/_middleware.js');
assert.equal(moduleKeyForPath('/admin/customer-journey-recovery/'),MODULE_KEYS.STOREFRONT);
assert.equal(moduleKeyForPath('/api/admin/customer-journey-closure-748'),MODULE_KEYS.STOREFRONT);
assert.ok(middleware.includes("normalizedPath === '/admin/customer-journey-recovery/'"));
assert.ok(middleware.includes("normalizedPagePath(pathname) === '/admin/customer-journey-recovery/'"));
assert.ok(middleware.includes("String(access.user.role || '').toLowerCase() !== 'admin'"));
assert.ok(middleware.includes('withScriptNonceCsp(platform, request)'));
assert.ok(middleware.includes('resolveGuardUser(request, env, pathname)'));
assert.ok(middleware.includes('moduleAccessForRequest(request, env, moduleKey'));
for(const id of ['a748Probe','a748Export','a748ProbeStatus','a748ProbeRows'])
 assert.ok(page.includes('id="'+id+'"')&&old.includes('id="'+id+'"'));
for(const id of ['a748EvidenceLoad','a748OrderLoad','a748FirefoxForm','a748FirefoxReviewForm',
 'a748ClosureForm','a748ClosureReviewForm','a748ReopenForm'])
 assert.ok(old.includes('id="'+id+'"'),id);
assert.ok(!page.includes('auth.js')&&!page.includes('admin-shell-467.js'));
assert.ok(page.includes('admin-journey-recovery-748.js?v=748')&&old.includes('admin-journey-recovery-748.js?v=748'));
assert.ok(client.includes("credentials:'omit'")&&client.includes("cache:'no-store'"));
assert.ok(client.includes('controller.abort(),6500'));
assert.ok(client.includes('location.pathname')&&client.includes('customer_identity_exported:false'));
assert.ok(!client.includes('localStorage')&&!client.includes('innerHTML'));
assert.ok(server.includes('verifiedAdminFromModule(ctx)'));
assert.ok(server.includes('NO_SELF_REVIEW')&&server.includes('SOURCE_CHANGED'));
assert.ok(server.includes('site.admin.aftersale.v746.')&&server.includes('site.admin.customerjourney.v747'));
assert.ok(server.includes('is_public=0')&&server.includes('customer_message_sent:false'));
assert.ok(!server.includes('fetch('),'API must not send provider/customer network requests');
const budget=JSON.parse(read('release465-performance-budget.json'));
assert.ok(budget.limits.max_runtime_source_bytes>=20040000,'Build 748 source budget floor preserved');
assert.ok(budget.limits.max_runtime_source_files>=1880,'Build 748 runtime file floor preserved');
const inv=JSON.parse(read('docs/operations/RELEASE_467_BUILD_556_ADMIN_ROUTE_INVENTORY.json'));
assert.ok(inv.routes.some(x=>x.route==='/admin/customer-journey-recovery/'&&x.owner_visual_acceptance==='PENDING'));
assert.equal(inv.routes.find(x=>x.route==='/admin/storefront-acceptance/').evidence.forms,9);
for(const p of ['index.html','shop/index.html'])
 assert.ok(read(p).includes('data-dovlin-temporary-menu-hold="2026-11-21"'),p);
assert.ok(existsSync(new URL('../dovlin/data/gallery_material_evidence.json',import.meta.url)));
console.log('BUILD748 SOURCE CONTRACT PASS: lean verified-Admin recovery, owner Firefox observations, no auto source/customer read, private original two-Admin closure, Dovlin freeze.');
