import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const routes = [
  {name: 'Orders', path: 'admin/orders/index.html', key: 'orders', current: '/admin/orders/'},
  {name: 'Fulfilment', path: 'admin/order-fulfillment-care/index.html', key: 'fulfillment', current: '/admin/order-fulfillment-care/'},
  {name: 'Inventory', path: 'admin/inventory-operations/index.html', key: 'inventory', current: '/admin/inventory-operations/'},
];
const commerceTargets = [
  '/admin/orders/',
  '/admin/order-fulfillment-care/',
  '/admin/inventory-operations/',
  '/admin/products/',
];

test('Build 564 is opt-in on three Commerce workspaces; the KEEP Product Browser stays unstyled', () => {
  const css = source('css/admin-commerce-564.css');
  assert.match(css, /body\[data-dd-commerce-v564\]/);
  assert.match(css, /body\[data-dd-commerce-v564="orders"\]/);
  assert.match(css, /body\[data-dd-commerce-v564="fulfillment"\]/);
  assert.match(css, /body\[data-dd-commerce-v564="inventory"\]/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-width: 620px/);
  assert.doesNotMatch(css, /^\s*(?:body|html|:root|\.card|\.btn)\s*\{/m);
  const browser = source('admin/products/index.html');
  assert.doesNotMatch(browser, /data-dd-commerce-v564|admin-commerce-564\.css/);
  const audit = JSON.parse(source('docs/operations/RELEASE_467_BUILD_556_ADMIN_ROUTE_INVENTORY.json'));
  const classified = route => audit.routes.find(row => row.route === route)?.decision;
  assert.equal(classified('/admin/products/'), 'KEEP');
  assert.equal(classified('/admin/orders/'), 'IMPROVE');
  assert.equal(classified('/admin/inventory-operations/'), 'REVIEW');
});

test('Commerce navigation and shared responsive shell are accessible and route-correct', () => {
  for (const {name, path, key, current} of routes) {
    const page = source(path);
    assert.match(page, new RegExp(`data-dd-commerce-v564="${key}"`), name);
    assert.match(page, /admin-commerce-564\.css\?v=564/, name);
    assert.match(page, /<header class="hero[^\"]*dd564-commerce-hero/, name);
    assert.match(page, /<nav class="dd564-commerce-nav" aria-label="Commerce workspaces">/, name);
    assert.match(page, new RegExp(`aria-current="page" href="${current}"`), name);
    const nav = page.match(/<nav class="dd564-commerce-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav, `${name} navigation exists`);
    assert.equal((nav.match(/<a\b/g) || []).length, 4, `${name} has exactly four Commerce links`);
    assert.equal((nav.match(/aria-current="page"/g) || []).length, 1, `${name} has one active link`);
    for (const target of commerceTargets) assert.ok(nav.includes(`href="${target}"`), `${name} can open ${target}`);
    assert.match(page, /<details class="card[^\"]*dd564-help"><summary>/, `${name} has optional safety guidance`);
  }
});

test('Orders retains one live renderer, local drafts and explicit idempotent fulfilment', () => {
  const page = source('admin/orders/index.html');
  assert.equal((page.match(/id="orderWorkspaceMount"/g) || []).length, 1);
  assert.match(page, /data-release="467" data-build="150"/);
  assert.match(page, /admin-orders-workspace-build150\.js\?v=467b176/);
  assert.match(page, /admin-orders-workspace-build150\.css\?v=467b150/);
  assert.match(page, /<template id="ordersBuild82WorkflowContract" data-build176-inert-contract="true">/);
  assert.match(page, /id="ordersSection"/);
  assert.match(page, /save locally only/);
  assert.match(page, /client_action_id/);
  assert.match(page, /payment\/refund execution/);
  assert.doesNotMatch(page, /<script[^>]+admin-orders-legacy|<script[^>]+admin-orders-v82/);
});

test('Fulfilment retains existing reconciliation, transition and care authorities without new execution', () => {
  const page = source('admin/order-fulfillment-care/index.html');
  for (const id of [
    'orderFulfillmentReconciliationMount',
    'orderFulfillmentWorkflowMount',
    'makerFulfillmentEvidenceMount',
    'fulfillmentCareMount',
  ]) assert.match(page, new RegExp(`id="${id}"`));
  for (const script of [
    'admin-order-fulfillment-idempotency-bridge-build150.js',
    'admin-order-fulfillment-workflow-v82.js',
    'admin-order-fulfillment-reconciliation-v111.js',
    'admin-order-fulfillment-care.js',
    'admin-maker-fulfillment-evidence.js',
  ]) assert.ok(page.includes(script), `${script} remains loaded`);
  assert.match(page, /client_action_id/);
  assert.match(page, /Canada-only shipping/);
  assert.match(page, /U\.S\. sales\/shipping suspension/);
  assert.match(page, /does not send customer messages, reserve or deduct inventory, execute payment\/refund\/carrier actions/);
});

test('Inventory retains all stock, receiving, reconciliation and classified-tool controls', () => {
  const page = source('admin/inventory-operations/index.html');
  for (const id of [
    'workshopProcessTaxonomyBuild207', 'inventoryReceivingMount',
    'inventoryReceivingReversalMount', 'inventorySourceProvenanceReviewMount',
    'inventoryAssetRestoreStatic', 'inventoryAssetParityMount',
    'inventoryIdentityCleanupMount', 'inventoryIntegrityReviewMount',
    'inventoryMaterialUsageReconciliationMount', 'inventoryProcessAssignmentsMount',
    'toolLifecycleReviewMount', 'productIntegrityReviewMount',
    'costMarginReadinessMount', 'inventoryTaxReview388',
    'productResourcesAdminMount', 'siteInventoryAdminMount',
    'inventoryKitComponentUsageMount', 'productStockReportMount',
    'catalogSyncAdminMount', 'catalogOptionManagerMount',
  ]) assert.match(page, new RegExp(`id="${id}"`), `${id} retained`);
  for (const script of [
    'admin-inventory-receiving.js', 'admin-inventory-receiving-reversal.js',
    'admin-inventory-source-provenance-review.js',
    'admin-inventory-material-usage-reconciliation-v112.js',
    'admin-inventory-process-assignments-v156.js',
    'admin-cost-margin-readiness-v203.js', 'admin-product-resources.js',
    'admin-site-item-inventory.js',
  ]) assert.ok(page.includes(script), `${script} remains loaded`);
  assert.match(page, /Base-unit counts remain authoritative/);
  assert.match(page, /do not change quantity, cost or Product links/);
  assert.match(page, /no automatic write or scan/);
});

test('Release marker, deployment workflow and CI proof identify Build 564', () => {
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'), /"build":564/);
  assert.match(source('.github/workflows/current-application-quality.yml'), /release467_build564_commerce_modernization\.test\.mjs/);
});
