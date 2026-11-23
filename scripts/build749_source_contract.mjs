// Build 749 static protected Admin source and privacy contract.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('admin/storefront-acceptance/index.html');
const client=read('public/js/admin-customer-care-queue-749.js');
const server=read('functions/api/admin/customer-care-queue-749.js');
assert.equal(moduleKeyForPath('/api/admin/customer-care-queue-749'),MODULE_KEYS.STOREFRONT);
assert.equal(moduleKeyForPath('/admin/storefront-acceptance/'),MODULE_KEYS.STOREFRONT);
for(const id of ['a749Load','a749Find','a749Rows','a749History','a749FirefoxStatus',
 'a749AckForm','a749OpenForm','a749AssignForm','a749ProgressForm','a749ReviewForm','a749ReopenForm'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-customer-care-queue-749.js?v=749'));
assert.ok(client.includes("credentials:'same-origin'")&&client.includes("cache:'no-store'"));
assert.ok(!client.includes('localStorage')&&!client.includes('innerHTML'));
assert.ok(server.includes('verifiedAdminFromModule(ctx)'));
assert.ok(server.includes('site.admin.customerjourney.v748')&&server.includes('site.admin.aftersale.v746.'));
assert.ok(server.includes("is_public=0")&&server.includes('NO_SELF_REVIEW'));
assert.ok(server.includes('REAL_ADMIN_ASSIGNEE_REQUIRED'));
assert.ok(server.includes('SOURCE_DRIFT_HOLD')&&server.includes('INDEPENDENT_FIREFOX_REQUIRED'));
assert.ok(server.includes('refund_executed:false')&&server.includes('provider_notification:false'));
assert.ok(!server.includes('fetch('),'No outbound customer/provider transport');
const budget=JSON.parse(read('release465-performance-budget.json'));
assert.ok(budget.limits.max_runtime_source_bytes>=20075000,'Build749 original source byte budget floor preserved');
assert.ok(budget.limits.max_runtime_source_files>=1882,'Build749 original runtime file floor preserved');
assert.equal(budget.limits.max_js_bytes,600000);
assert.equal(budget.limits.max_inline_data_uri_bytes,650000);
const inv=JSON.parse(read('docs/operations/RELEASE_467_BUILD_556_ADMIN_ROUTE_INVENTORY.json'));
assert.ok(inv.routes.find(x=>x.route==='/admin/storefront-acceptance/').evidence.forms>=15,'Original Build749 forms preserved');
assert.ok(inv.routes.find(x=>x.route==='/admin/storefront-acceptance/').evidence.scripts>=7,'Original Build749 scripts preserved');
for(const p of ['index.html','shop/index.html'])
 assert.ok(read(p).includes('data-dovlin-temporary-menu-hold="2026-11-21"'));
console.log('BUILD749 SOURCE PASS: original verified Storefront Admin, owner Firefox evidence not fabricated, private original Order/case work queue, independent review and source drift, customer and Dovlin hold preserved.');
