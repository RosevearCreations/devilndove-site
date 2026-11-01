import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('Build 556 captures every Admin route and keeps previously modernized pages protected',()=>{
  const audit=JSON.parse(read('docs/operations/RELEASE_467_BUILD_556_ADMIN_ROUTE_INVENTORY.json'));
  assert.equal(audit.build,556);
  assert.equal(audit.classification,'PROVISIONAL_STATIC_AUDIT_NOT_OWNER_APPROVAL');
  assert.match(audit.scope,/Admin routes only/);
  assert.ok(audit.totals.total>=150);
  assert.equal(audit.routes.length,audit.totals.total);
  assert.equal(new Set(audit.routes.map(item=>item.route)).size,audit.routes.length);
  const byRoute=route=>audit.routes.find(item=>item.route===route);
  assert.equal(byRoute('/admin/product-editor/').decision,'KEEP');
  for(const route of ['/admin/','/admin/products/','/admin/system-operations/','/admin/interface-blueprint/'])assert.equal(byRoute(route).decision,'KEEP');
  for(const route of ['/admin/inventory-operations/','/admin/project-capacity-planner/','/admin/it/'])assert.equal(byRoute(route).decision,'REVIEW');
  assert.equal(audit.routes.every(row=>row.source.startsWith('admin/')&&row.source.endsWith('/index.html')),true);
  assert.equal(audit.routes.every(row=>row.owner_visual_acceptance==='PENDING'),true);
  for(const screen of ['Admin Dashboard','Product Management','Inventory & Stock','Orders & Fulfillment','Customer Requests','Production Calendar','Workstations & Capacity','Analytics & Reports','Shop Preview','Settings & Configuration'])assert.ok(audit.reference_screens.includes(screen));
});

test('Build 556 new Admin preview is intentionally read-only, accessible and no public or existing Admin screen adopts the CSS',()=>{
  const html=read('admin/interface-blueprint/index.html');
  const css=read('css/admin-interface-foundation-556.css');
  assert.match(html,/data-admin-page="interface-blueprint"/);
  assert.match(html,/Release 467 · Build 556 · Read-only Admin preview/);
  assert.match(html,/class="dd556-admin-root"/);
  assert.match(html,/admin-interface-foundation-556\.css\?v=556/);
  assert.match(html,/name="robots" content="noindex,nofollow"/);
  assert.match(html,/class="dd556-skip" href="#dd556Main"/);
  assert.match(html,/aria-label="Admin navigation"/);
  assert.match(html,/aria-label="Blueprint sections"/);
  assert.match(html,/No Product, Etsy draft, social account or incident record can be changed here/);
  assert.doesNotMatch(html,/<form\b|<button\b|<script\b|<iframe\b|on(?:click|submit|change)=/i);
  assert.doesNotMatch(html,/href="#"|apiFetch|fetch\(|localStorage|document\.cookie/);
  assert.match(css,/\.dd556-admin-root\{/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/@media\(max-width:420px\)/);
  assert.match(css,/:focus-visible/);
  assert.doesNotMatch(css,/^body\s*\{|^:root\s*\{|!important/m);
  for(const path of ['css/styles.css','admin/index.html','admin/products/index.html','admin/system-operations/index.html'])assert.doesNotMatch(read(path),/admin-interface-foundation-556/,`Build 556 must not restyle ${path}`);
  // Build 557 deliberately opted the newly rebuilt Product Editor into the foundation.
  assert.match(read('admin/product-editor/index.html'),/class="dd540-finished-product dd557-entry dd556-admin-root"/);
});

test('Build 556 Product entry and external channel blueprint preserves explicit draft safety and owner consent',()=>{
  const page=read('admin/interface-blueprint/index.html');
  const spec=read('docs/operations/RELEASE_467_BUILD_556_PRODUCT_ENTRY_ADMIN_DESIGN_FOUNDATION.md');
  for(const field of ['Details','Recipe','Photos','Destinations','Save Product'])assert.match(page,new RegExp(field));
  for(const provider of ['Etsy','Facebook Marketplace','Instagram','TikTok','X','Pinterest'])assert.match(page,new RegExp(provider));
  assert.match(page,/manual listing handoff/);
  assert.match(page,/no Product, Etsy draft/i);
  for(const state of ['not_configured','existing_draft_confirmed','manual_handoff','remote_status_unknown','published_confirmed'])assert.match(spec,new RegExp('`'+state+'`'));
  assert.match(spec,/The Product record is the source of truth/);
  assert.match(spec,/Product #54/);
  assert.match(spec,/Build \*\*557\*\*/);
  assert.match(spec,/No bulk stylesheet injection/);
});

test('Build 556 exact release marker and quality gate are configured',()=>{
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:556|557|558|559|560|561|562|563|564|565|566|567)/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build556_product_admin_design_blueprint\.test\.mjs/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build556_admin_interface_inventory\.mjs --check/);
});
