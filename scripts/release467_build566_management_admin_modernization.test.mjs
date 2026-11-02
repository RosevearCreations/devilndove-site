import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const routes = [
  {name: 'Reports', path: 'admin/analytics/index.html', key: 'analytics', href: '/admin/analytics/', decision: 'IMPROVE'},
  {name: 'Operations', path: 'admin/operations/index.html', key: 'operations', href: '/admin/operations/', decision: 'REVIEW'},
  {name: 'I.T.', path: 'admin/it/index.html', key: 'it', href: '/admin/it/', decision: 'REVIEW'},
  {name: 'Continuity', path: 'admin/operational-continuity/index.html', key: 'continuity', href: '/admin/operational-continuity/', decision: 'REVIEW'},
];
const managementLinks = [...routes.map(route => route.href), '/admin/system-operations/'];

test('Build 566 modernizes four audited screens with no global style or System Operations takeover', () => {
  const css = source('css/admin-management-566.css');
  assert.match(css, /body\[data-dd-management-v566\]/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /max-width: 960px/);
  assert.match(css, /max-width: 620px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css, /^\s*(?:html|body|:root|\.card|\.btn|\.hero|\.nav)\s*\{/m);
  const audit = JSON.parse(source('docs/operations/RELEASE_467_BUILD_556_ADMIN_ROUTE_INVENTORY.json'));
  for (const {name, href, decision} of routes) {
    assert.equal(audit.routes.find(item => item.route === href)?.decision, decision, name);
  }
  assert.equal(audit.routes.find(item => item.route === '/admin/system-operations/')?.decision, 'KEEP');
  for (const path of [
    'admin/system-operations/index.html',
    'admin/accounting/index.html',
    'admin/it-integrations/index.html',
    'admin/it-platform/index.html',
    'admin/month-end/index.html',
    'admin/products/index.html',
  ]) assert.doesNotMatch(source(path), /data-dd-management-v566|admin-management-566\.css/, `${path}: existing owner remains intact`);
});

test('Four Management workspaces have five stable, keyboard-accessible tabs with one current route', () => {
  for (const {name, path, key, href} of routes) {
    const page = source(path);
    assert.match(page, new RegExp(`data-dd-management-v566="${key}"`), name);
    assert.match(page, /admin-management-566\.css\?v=566/, name);
    assert.match(page, /<meta name="robots" content="noindex,nofollow"/, name);
    assert.match(page, /Management Command • /, name);
    const nav = page.match(/<nav class="dd566-management-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav, `${name}: accessible Management nav`);
    assert.equal((nav.match(/<a\b/g) || []).length, 5, name);
    assert.equal((nav.match(/aria-current="page"/g) || []).length, 1, name);
    for (const target of managementLinks) assert.ok(nav.includes(`href="${target}"`), `${name}: retained ${target}`);
    const currentAnchor = nav.match(/<a\b[^>]*aria-current="page"[^>]*>/)?.[0];
    assert.ok(currentAnchor?.includes(`href="${href}"`) || new RegExp(`href="${href}"[^>]*aria-current="page"`).test(nav),
      `${name}: correct active route`);
  }
});

test('Analytics reporting retains nine real, source-backed KPIs and both refresh/read scripts', () => {
  const page = source('admin/analytics/index.html');
  for (const id of [
    'dashboardSummaryMessage', 'summaryUsersCount', 'summaryProductsCount',
    'summaryOrdersCount', 'summaryPaymentsCount', 'summaryLowStockCount',
    'summaryFailedWebhooksCount', 'summaryOpenDisputesCount',
    'summaryLiveVisitorsCount', 'summaryRecentSearchesCount',
    'refreshDashboardSummaryButton', 'analyticsAdminMount',
  ]) assert.ok(page.includes(`id="${id}"`), id);
  assert.match(page, /admin-dashboard-summary\.js\?v=440/);
  assert.match(page, /admin-visitor-analytics\.js/);
  assert.match(page, /class="card dd566-summary"/);
  assert.match(page, /Live metrics only/);
  assert.doesNotMatch(page, /data-fake|sample-data|mock-metrics/i);
});

test('Operations keeps settings, security, notifications, activity, incidents, webhooks and every auxiliary tool', () => {
  const page = source('admin/operations/index.html');
  for (const id of [
    'accessTiersAdminMount', 'usersAdminMount', 'notificationAdminMount',
    'appSettingsAdminMount', 'adminLiveActivityMount', 'securitySummaryAdminMount',
    'runtimeIncidentsAdminMount', 'schemaDriftAdminMount', 'publicApiHealthAdminMount',
    'mediaConsentRecordsAdminMount', 'searchConsoleImportAdminMount',
    'migrationLedgerAdminMount', 'releaseSanityAdminMount', 'webhookEventsAdminMount',
    'adminCommunityMount',
  ]) assert.ok(page.includes(`id="${id}"`), id);
  for (const script of [
    'admin-notifications.js', 'admin-app-settings.js', 'admin-live-activity.js',
    'admin-security-summary.js', 'admin-runtime-incidents.js',
    'admin-schema-drift-report.js', 'admin-webhook-events.js', 'admin-community.js',
  ]) assert.ok(page.includes(script), script);
  const utility = page.match(/<details class="card dd566-related">([\s\S]*?)<\/details>/)?.[1];
  assert.ok(utility?.includes('<summary>Additional Admin and release tools</summary>'));
  assert.ok((utility.match(/<a\b/g) || []).length >= 18, 'legacy utility links are preserved inside disclosure');
  for (const mount of ['notificationAdminMount','appSettingsAdminMount','adminLiveActivityMount','securitySummaryAdminMount','runtimeIncidentsAdminMount']) {
    assert.ok(page.includes(`href="#${mount}"`), mount);
  }
  assert.match(page, /Opening this page does not apply configuration changes/);
});

test('I.T. retains all eight established readiness/control towers and evidence scripts', () => {
  const page = source('admin/it/index.html');
  for (const id of [
    'itControlTowerMount', 'itReadinessActionQueueMount', 'itBrowserRuntimeAcceptanceMount',
    'itEvidenceLedgerMount', 'itCiAccessReadinessMount', 'itPromotionReadinessMount',
    'itAccessAcceptanceHarnessMount', 'itExternalCommercialAcceptanceMount', 'adminModuleHubMount',
  ]) assert.ok(page.includes(`id="${id}"`), id);
  for (const script of [
    'admin-it-control-tower.js','admin-it-readiness-actions.js',
    'admin-it-browser-runtime-acceptance.js','admin-it-evidence-ledger.js',
    'admin-it-ci-access-readiness.js','admin-it-promotion-readiness.js',
    'admin-it-access-acceptance-harness.js','admin-it-external-commercial-acceptance.js',
    'admin-module-hub.js',
  ]) assert.ok(page.includes(script), script);
  assert.match(page, /Evidence before promotion/);
  assert.match(page, /does not self-certify an unverified gate/);
});

test('Continuity preserves safe evidence semantics, read refresh, retry and planning-only fallback', () => {
  const page = source('admin/operational-continuity/index.html');
  for (const id of [
    'refreshOperationalContinuity', 'operationalContinuityMessage',
    'operationalContinuityMount', 'operationalStaticFallback', 'retryOperationalContinuity',
  ]) assert.ok(page.includes(`id="${id}"`), id);
  assert.match(page, /admin-operational-continuity\.js\?v=440/);
  assert.match(page, /No false-success boundary/);
  assert.match(page, /The following list is planning guidance only; every live status remains unknown/);
  assert.match(page, /No status is inferred until the authenticated D1 response returns/);
  assert.match(page, /workshop-creative-paths\.webp/);
  assert.match(page, /private-media continuity/);
});

test('Build 566 gates are connected to CI and the exact Production release marker', () => {
  assert.match(source('.github/workflows/current-application-quality.yml'), /release467_build566_management_admin_modernization\.test\.mjs/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'), /"build":(?:566|567|568|569|570)/);
});
