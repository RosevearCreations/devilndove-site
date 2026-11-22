// Build 747 source integrity: no public load, Dovlin hold, routed Admin API, private D1.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('admin/storefront-acceptance/index.html');
const client=read('public/js/admin-customer-journey-747.js');
const server=read('functions/api/admin/customer-journey-747.js');
assert.equal(moduleKeyForPath('/api/admin/customer-journey-747'),MODULE_KEYS.STOREFRONT);
assert.equal(moduleKeyForPath('/admin/storefront-acceptance/'),MODULE_KEYS.STOREFRONT);
for(const id of ['a747Local','a747Export','a747Load','a747DeviceForm','a747ReviewForm','a747HandoffForm'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-customer-journey-747.js?v=747'));
assert.ok(client.includes("credentials:'same-origin'")&&client.includes("cache:'no-store'"));
assert.ok(!client.includes('localStorage')&&!client.includes('innerHTML'));
assert.ok(client.includes("network_probe_executed:false"));
assert.ok(server.includes('verifiedAdminFromModule(ctx)'));
assert.ok(server.includes("is_public=0")&&server.includes("setting_value=?"));
assert.ok(server.includes("after-sale")||server.includes("AFTERSALE"));
assert.ok(server.includes("INDEPENDENT_REVIEW_REQUIRED"));
assert.ok(server.includes("refund_executed:false")&&server.includes("customer_notified:false"));
for(const p of ['index.html','shop/index.html'])
 assert.ok(read(p).includes('data-dovlin-temporary-menu-hold="2026-11-21"'),p);
console.log('BUILD747 SOURCE PASS: protected Storefront path, click-only diagnostics, private original source, independent review, frozen Dovlin.');
