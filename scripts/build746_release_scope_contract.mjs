// Build746 immutable Dovlin freeze, Admin lean-transport & release scope contract.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const middleware=read('functions/_middleware.js');
const page=read('admin/storefront-acceptance/index.html');
const client=read('public/js/admin-after-sale-746.js');
const server=read('functions/api/admin/after-sale-746.js');
assert.equal(moduleKeyForPath('/admin/storefront-acceptance/'),MODULE_KEYS.STOREFRONT);
assert.equal(moduleKeyForPath('/api/admin/after-sale-746'),MODULE_KEYS.STOREFRONT);
const lean=middleware.indexOf("normalizedPath === '/admin/storefront-acceptance/'");
const heavy=middleware.indexOf("let rewriter = new HTMLRewriter()");
assert.ok(lean>0&&heavy>lean,'Lean route must precede optional heavy HTML rewriting');
assert.ok(middleware.includes("['/admin/dovlin-readiness/','/admin/storefront-acceptance/']"));
assert.ok(middleware.includes("String(access.user.role || '').toLowerCase() !== 'admin'"));
assert.ok(middleware.includes("Cache-Control','private, no-store, max-age=0'"));
assert.ok(middleware.includes("withScriptNonceCsp(platform, request)"),'Admin lean route must keep CSP');
assert.ok(middleware.includes('const resolvedUser = await resolveGuardUser(request, env, pathname)'));
assert.ok(middleware.includes('await moduleAccessForRequest(request, env, moduleKey, { user: resolvedUser })'));
assert.ok(page.includes('id="a746Load"')&&page.includes('id="a746CaseForm"'));
assert.ok(page.includes('id="a746Status"')&&page.includes('id="a746History"'));
assert.ok(page.includes('admin-after-sale-746.js?v=746'));
assert.ok(client.includes("API='/api/admin/after-sale-746'"));
assert.ok(!client.includes('localStorage')&&!client.includes('innerHTML'));
assert.ok(client.includes("credentials:'same-origin'"));
assert.ok(client.includes('AbortSignal.timeout(9000)'));
assert.ok(server.includes('getDb,jsonResponse,auditAdminAction'));
assert.ok(server.includes('verifiedAdminFromModule(ctx)'));
assert.ok(server.includes("is_public=0"));
assert.ok(server.includes("Original Order"));
assert.ok(server.includes("refund_issued:false"));
assert.ok(server.includes("customer_notified:false"));
assert.ok(server.includes("pickup_completed:false"));
assert.ok(server.includes("finance_posted:false"));
const links=['index.html','shop/index.html'];
for(const p of links){
 const h=read(p);
 assert.ok(h.includes('data-dovlin-temporary-menu-hold="2026-11-21"'),p);
 assert.ok(h.includes('style="display:none!important"'),p);
}
for(const p of ['dovlin/index.html','dovlin/gallery/index.html','dovlin/data/gallery_material_evidence.json'])
 assert.ok(existsSync(new URL(p,root)),p);
console.log('BUILD746 SOURCE CONTRACT PASS: role-gated lean Admin, tracked URL unaffected, CSP retained, real-order support cases, Dovlin unchanged, no spoofed refund.');
