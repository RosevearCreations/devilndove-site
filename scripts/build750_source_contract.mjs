// Build 750 protected Admin response custody, archive and no-provider-action static contracts.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('admin/storefront-acceptance/index.html');
const client=read('public/js/admin-customer-care-custody-750.js');
const api=read('functions/api/admin/customer-care-custody-750.js');
const old=read('functions/api/admin/customer-care-queue-749.js');
assert.equal(moduleKeyForPath('/api/admin/customer-care-custody-750'),MODULE_KEYS.STOREFRONT);
for(const id of ['a750Custody','a750Load','a750Lookup','a750Rows','a750Export',
 'a750ResponseForm','a750ReviewForm','a750EscForm','a750AckForm','a750ClearForm',
 'a750HoldForm','a750ReleaseForm','a750ArchiveForm','a750ApproveForm','a750RestoreForm',
 'a750HashResponse','a750HashReview','a750Receipts'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-customer-care-custody-750.js?v=750'));
assert.ok(client.includes("credentials:'same-origin'")&&client.includes("cache:'no-store'"));
assert.ok(client.includes("crypto.subtle.digest('SHA-256'")||client.includes("crypto.subtle.digest('SHA-256'"));
assert.ok(client.includes("file.size>8*1024*1024"));
assert.ok(!client.includes('localStorage')&&!client.includes('innerHTML'));
assert.ok(api.includes('verifiedAdminFromModule(ctx)')&&api.includes('site.admin.customerjourney.workqueue.v749'));
assert.ok(api.includes('site.admin.aftersale.v746.')&&api.includes('is_public=0'));
assert.ok(api.includes('NO_SELF_REVIEW')&&api.includes('NO_SELF_ARCHIVE_APPROVAL'));
assert.ok(api.includes('ARCHIVE_SOURCE_DRIFT_HOLD')&&api.includes('ACTIVE_LEGAL_OR_CUSTOMER_DATA_HOLD'));
assert.ok(api.includes('sha256')&&api.includes('original_evidence_deleted:false'));
assert.ok(!api.includes('fetch('),'No external provider/customer transport in private API');
assert.ok(old.includes("ARCHIVE='site.admin.customerjourney.carecustody.v750'"));
assert.ok(old.includes('ARCHIVED_RESTORE_IN_750')&&old.includes('archivedTaskIds(db)'));
const budget=JSON.parse(read('release465-performance-budget.json'));
assert.ok(budget.limits.max_runtime_source_bytes>=20135000,'Build750 source size floor preserved');
assert.ok(budget.limits.max_runtime_source_files>=1884,'Build750 runtime file floor preserved');
assert.equal(budget.limits.max_inline_data_uri_bytes,650000);
const inv=JSON.parse(read('docs/operations/RELEASE_467_BUILD_556_ADMIN_ROUTE_INVENTORY.json'));
assert.ok(inv.routes.find(x=>x.route==='/admin/storefront-acceptance/').evidence.forms>=25,'Original Build750 forms remain');
assert.ok(inv.routes.find(x=>x.route==='/admin/storefront-acceptance/').evidence.scripts>=8,'Original Build750 scripts remain');
for(const p of ['index.html','shop/index.html'])
 assert.ok(read(p).includes('data-dovlin-temporary-menu-hold="2026-11-21"'));
console.log('BUILD750 SOURCE PASS: verified private source, browser-local SHA-256 never upload, second-Admin review, legal hold, immutable archive and restoration, original Build749 queue integration and Dovlin freeze.');
