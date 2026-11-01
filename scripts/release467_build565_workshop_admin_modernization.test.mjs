import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const routes = [
  {name: 'Requests', path: 'admin/custom-request/index.html', key: 'requests', href: '/admin/custom-request/'},
  {name: 'Commissions', path: 'admin/commission-workbench/index.html', key: 'commissions', href: '/admin/commission-workbench/'},
  {name: 'Calendar', path: 'admin/project-resource-calendar/index.html', key: 'calendar', href: '/admin/project-resource-calendar/'},
  {name: 'Capacity', path: 'admin/project-capacity-planner/index.html', key: 'capacity', href: '/admin/project-capacity-planner/'},
  {name: 'Work Orders', path: 'admin/project-work-orders/index.html', key: 'work-orders', href: '/admin/project-work-orders/'},
];

test('Build 565 modifies only opted-in legacy Workshop Operations routes', () => {
  const css = source('css/admin-workshop-565.css');
  assert.match(css, /body\[data-dd-workshop-v565\]/);
  assert.match(css, /body\[data-dd-workshop-v565="requests"\]/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /max-width: 620px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css, /^\s*(?:body|html|:root|\.card|\.btn)\s*\{/m);
  const audit = JSON.parse(source('docs/operations/RELEASE_467_BUILD_556_ADMIN_ROUTE_INVENTORY.json'));
  const decision = route => audit.routes.find(item => item.route === route)?.decision;
  assert.equal(decision('/admin/custom-request/'), 'IMPROVE');
  for (const route of ['/admin/commission-workbench/', '/admin/project-resource-calendar/', '/admin/project-capacity-planner/', '/admin/project-work-orders/']) assert.equal(decision(route), 'REVIEW');
  for (const path of ['admin/products/index.html','admin/product-editor/index.html','admin/maker-workbench/index.html','admin/custom-request/made-today/index.html','admin/system-operations/index.html']) {
    assert.doesNotMatch(source(path), /data-dd-workshop-v565|admin-workshop-565\.css/, `${path} was already outside scope`);
  }
});

test('Five Workshop sections share accessible navigation, clear active state and bounded style opt-in', () => {
  for (const {name, path, key, href} of routes) {
    const page = source(path);
    assert.match(page, new RegExp(`data-dd-workshop-v565="${key}"`), name);
    assert.match(page, /admin-workshop-565\.css\?v=565/, name);
    assert.match(page, /class="(?:hero|page-hero)[^\"]*dd565-workshop-hero/, name);
    assert.match(page, /<nav class="dd565-workshop-nav" aria-label="Workshop operations workspaces">/, name);
    const nav = page.match(/<nav class="dd565-workshop-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav, `${name}: nav exists`);
    assert.equal((nav.match(/<a\b/g) || []).length, 5, `${name}: five stable destinations`);
    assert.equal((nav.match(/aria-current="page"/g) || []).length, 1, `${name}: exactly one active destination`);
    assert.match(nav, new RegExp(`aria-current="page" href="${href}"`), `${name}: current link`);
    for (const target of routes) assert.ok(nav.includes(`href="${target.href}"`), `${name}: links ${target.href}`);
    assert.match(page, /Workshop Command • /, `${name}: human-readable context`);
  }
});

test('Custom Requests retains existing intake, quote, proof, traveler, stock and export guards', () => {
  const page = source('admin/custom-request/index.html');
  for (const id of [
    'adminAuthState','adminUserSummary','adminAccessMessage',
    'customWorkBuild151Mount','customWorkTriage211Mount','customWorkProof213Mount',
    'customWorkLifecycle214Mount','customWorkBatchQuote215Mount','customWorkSuppliedItem216Mount',
    'customWorkMarginGuardrails218Mount','customWorkJobTraveler219Mount','customWorkProductionRun220Mount',
    'customRequestsReadRefresh','customRequestsOwnedReadStatus','customRequestsReadDiagnostics',
    'customRequestsSafeExportLinks','customRequestsAdminMount',
  ]) assert.match(page, new RegExp(`id="${id}"`), `${id} still mounted`);
  for (const script of [
    'admin-custom-work-build151.js','admin-custom-work-triage-build211.js',
    'admin-custom-work-proof-build213.js','admin-manufacturing-lifecycle-build214.js',
    'admin-custom-work-batch-quote-build215.js','admin-custom-work-supplied-item-build216.js',
    'admin-custom-work-margin-guardrails-build218.js','admin-manufacturing-job-traveler-build219.js',
    'admin-production-run-evidence-build220.js','admin-custom-requests.js',
    'commerce-operations/custom-requests-page-tools.mjs',
  ]) assert.ok(page.includes(script), `${script} retained`);
  assert.match(page, /Inventory movements and Finance\/Accounting postings remain in their existing authorities/);
  assert.match(page, /cannot claim a unique item is reserved or sold until live inventory is revalidated/);
  assert.match(page, /Safe CSV exports read already-prepared marketplace packs only/);
  assert.match(page, /aria-live="polite"/);
});

test('Commission handoff retains real request selection and avoids unauthorized customer/payment actions', () => {
  const page = source('admin/commission-workbench/index.html');
  for (const id of ['commissionRequest','commissionRefresh','commissionState','commissionCompletionLoad','commissionCompletionState']) assert.match(page, new RegExp(`id="${id}"`));
  assert.match(page, /admin-commission-workbench\.js\?v=467b382/);
  assert.match(page, /admin-commission-completion\.js\?v=467b453/);
  assert.match(page, /does <strong>not<\/strong> issue a quote, record a settled deposit, approve a proof/);
  assert.match(page, /cannot charge a deposit, send messages, change Inventory/);
  assert.doesNotMatch(page, /href="\/admin\/custom-requests\/"/, 'obsolete Custom Requests route removed');
});

test('Production Calendar retains UTC conflict handling, hard blocks and explicit authorizations', () => {
  const page = source('admin/project-resource-calendar/index.html');
  for (const id of [
    'calendarFrom','calendarTo','calendarResourceFilter','calendarProjectFilter',
    'calendarRefresh','calendarRecords','calendarKind','calendarResource',
    'calendarProject','calendarOperation','calendarStart','calendarEnd',
    'calendarTitle','calendarNote','calendarOverride','calendarOverrideReason',
    'calendarMaintenanceAck','calendarRecord','calendarResult',
  ]) assert.match(page, new RegExp(`id="${id}"`));
  for (const kind of ['project_booking','maintenance','resource_hold','project_deadline']) assert.ok(page.includes(`value="${kind}"`));
  assert.match(page, /real maintenance or resource hold is a <strong>hard block<\/strong>/);
  assert.match(page, /matching human decision/);
  assert.match(page, /No automatic maintenance sign-off, work order completion, Inventory consumption or customer notification/);
  assert.match(page, /admin-project-resource-calendar\.js\?v=467b381/);
});

test('Workstations and Capacity retain demand-only interpretation and source paging', () => {
  const page = source('admin/project-capacity-planner/index.html');
  for (const id of ['capacityRefresh','capacitySearch','capacityFilter','capacityMount','capacityPrevious','capacityNext']) assert.match(page, new RegExp(`id="${id}"`));
  assert.match(page, /Shared demand is a planning warning, never proof of a time reservation/);
  assert.match(page, /demand-only view still does not consult those bookings/);
  assert.match(page, /empty calendar cannot prove physical availability/);
  assert.match(page, /admin-project-capacity-planner\.js\?v=467b378/);
});

test('Work Orders retain append-only status, real time and milestone evidence', () => {
  const page = source('admin/project-work-orders/index.html');
  for (const id of ['woProject','woRefresh','woMount']) assert.match(page, new RegExp(`id="${id}"`));
  assert.match(page, /Dependencies must be completed before moving forward/);
  assert.match(page, /Time and status are append-only and cannot be deleted here/);
  assert.match(page, /no automatic task completion or stock movement/);
  assert.match(page, /admin-project-work-orders\.js\?v=467b379/);
  assert.match(page, /admin-write-receipt-recovery-v386\.js\?v=467b386/);
});

test('Build 565 CI proof and exact Production release marker are wired', () => {
  assert.match(source('.github/workflows/current-application-quality.yml'), /release467_build565_workshop_admin_modernization\.test\.mjs/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'), /"build":565/);
});
