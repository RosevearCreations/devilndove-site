// Current admin dashboard supplements, Build 157 bounded Admin read delivery, and non-critical route telemetry.
const DD_ADMIN_DATA_DELIVERY_VERSION = 'R467B157_ADMIN_DATA_DELIVERY_V2';
const DD_PRODUCT_SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
const DD_PRODUCT_QUALITY_RECOVERY_SRC = '/public/js/admin-product-quality-command-center-v157.js?v=467b157-quality-recovery-v1';

function normalizeAdminPath(value) {
  const raw = String(value || '/');
  return raw.endsWith('/') ? raw : `${raw}/`;
}

function adminJsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-DND-Admin-Data-Delivery': DD_ADMIN_DATA_DELIVERY_VERSION,
    },
  });
}

function readFreshProductSnapshot(maxAgeMs = 90_000) {
  try {
    const raw = localStorage.getItem(DD_PRODUCT_SNAPSHOT_KEY) || '';
    if (!raw) return [];
    const payload = JSON.parse(raw);
    const cachedAt = Date.parse(String(payload?.cached_at || ''));
    if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > maxAgeMs) return [];
    return Array.isArray(payload?.products) ? payload.products : [];
  } catch {
    return [];
  }
}

function waitForProductCore(timeoutMs = 1200) {
  const startedAt = performance.now();
  const alreadyReady = () => Boolean(
    window.DDProductsColdStartRecoveryHealth?.core_recovered
    || document.querySelector('#productsTableBody [data-edit-product-id]')
  );
  if (alreadyReady()) return Promise.resolve({ source: 'already-ready', elapsed_ms: 0, ready: true });
  return new Promise((resolve) => {
    let timer = 0;
    const finish = (source, ready) => {
      document.removeEventListener('dd:products-core-recovered', onRecovered);
      if (timer) window.clearTimeout(timer);
      resolve({ source, ready, elapsed_ms: Math.round((performance.now() - startedAt) * 10) / 10 });
    };
    const onRecovered = () => finish('core-recovered-event', true);
    document.addEventListener('dd:products-core-recovered', onRecovered, { once: true });
    timer = window.setTimeout(() => finish('bounded-timeout', alreadyReady()), timeoutMs);
  });
}

function installAdminDataDeliveryGuard(pathname) {
  const pagePath = normalizeAdminPath(pathname);
  if (!['/admin/products/', '/admin/inventory-operations/'].includes(pagePath)) return false;
  if (!window.DDAuth?.apiFetch) return false;
  if (window.DDAuth.apiFetch.__ddAdminDataDeliveryV157 === true) return true;

  const original = window.DDAuth.apiFetch.bind(window.DDAuth);
  const installedAt = Date.now();
  let productSnapshotBudget = pagePath === '/admin/products/' ? 2 : 0;
  const health = window.DDAdminDataDeliveryHealth = window.DDAdminDataDeliveryHealth || {
    version: DD_ADMIN_DATA_DELIVERY_VERSION,
    page_path: pagePath,
    product_snapshot_hits: 0,
    product_snapshot_misses: 0,
    product_snapshot_rows: 0,
    product_readiness_rewrites: 0,
    product_readiness_actual_limit: 0,
    product_core_wait_ms: 0,
    product_core_wait_source: '',
    product_resource_bootstrap_rewrites: 0,
    inventory_reconciliation_rewrites: 0,
    inventory_reconciliation_actual_limit: 0,
    mutation_requests_rewritten: 0,
  };
  health.version = DD_ADMIN_DATA_DELIVERY_VERSION;

  const boundedApiFetch = async (input, options = {}) => {
    const method = String(options?.method || 'GET').toUpperCase();
    if (method !== 'GET') {
      // Any write invalidates the startup-only snapshot allowance. Mutation requests are
      // never rewritten and continue to the existing server authority unchanged.
      productSnapshotBudget = 0;
      return original(input, options);
    }

    let url;
    try { url = new URL(String(input || ''), window.location.origin); }
    catch { return original(input, options); }
    if (url.origin !== window.location.origin) return original(input, options);

    if (pagePath === '/admin/products/' && url.pathname === '/api/admin/products' && !url.search) {
      const withinStartupWindow = Date.now() - installedAt <= 15_000;
      if (withinStartupWindow && productSnapshotBudget > 0) {
        const wait = await waitForProductCore(2500);
        health.product_core_wait_ms = Math.max(Number(health.product_core_wait_ms || 0), wait.elapsed_ms);
        health.product_core_wait_source = wait.source;
        const products = wait.ready ? readFreshProductSnapshot() : [];
        if (products.length) {
          productSnapshotBudget -= 1;
          health.product_snapshot_hits += 1;
          health.product_snapshot_rows = products.length;
          return adminJsonResponse({
            ok: true,
            products,
            delivery: 'build157-core-product-snapshot',
            read_only_snapshot: true,
          });
        }
        health.product_snapshot_misses += 1;
      }
      return original(input, options);
    }

    if (pagePath === '/admin/products/' && url.pathname === '/api/admin/product-readiness' && !url.searchParams.get('product_id')) {
      const wait = await waitForProductCore(1200);
      health.product_core_wait_ms = Math.max(Number(health.product_core_wait_ms || 0), wait.elapsed_ms);
      health.product_core_wait_source = wait.source;
      // Build 156 compatibility requests historically canonicalize list readiness to 500 rows.
      // Build 157 preserves that client contract while the actual deep D1 read is delayed until
      // core Product authority is usable and is bounded to 80 Products.
      url.searchParams.set('limit', '80');
      url.searchParams.set('show_ready', '1');
      url.searchParams.set('force_deep', '1');
      url.searchParams.set('delivery', 'build157');
      health.product_readiness_rewrites += 1;
      health.product_readiness_actual_limit = 80;
      return original(`${url.pathname}${url.search}`, { ...options, method: 'GET' });
    }

    if (pagePath === '/admin/products/' && url.pathname === '/api/admin/product-resource-bootstrap') {
      const requested = Math.trunc(Number(url.searchParams.get('limit') || 80)) || 80;
      const bounded = Math.max(1, Math.min(120, requested, 80));
      url.searchParams.set('limit', String(bounded));
      url.searchParams.set('delivery', 'build157');
      health.product_resource_bootstrap_rewrites += 1;
      return original(`${url.pathname}${url.search}`, { ...options, method: 'GET' });
    }

    if (pagePath === '/admin/inventory-operations/' && url.pathname === '/api/admin/inventory-material-usage-reconciliation') {
      const requested = Math.trunc(Number(url.searchParams.get('limit') || 80)) || 80;
      const bounded = Math.max(25, Math.min(80, requested));
      url.searchParams.set('limit', String(bounded));
      url.searchParams.set('delivery', 'build157');
      health.inventory_reconciliation_rewrites += 1;
      health.inventory_reconciliation_actual_limit = bounded;
      return original(`${url.pathname}${url.search}`, { ...options, method: 'GET' });
    }

    return original(input, options);
  };

  boundedApiFetch.__ddAdminDataDeliveryV157 = true;
  boundedApiFetch.__ddProductsOriginal = original;
  window.DDAuth.apiFetch = boundedApiFetch;
  return true;
}

function installProductQualityRecoveryWatch(pathname) {
  if (normalizeAdminPath(pathname) !== '/admin/products/') return;
  const install = () => {
    const mount = document.getElementById('productQualityCommandCenterMount');
    if (!mount || mount.dataset.ddQualityRecoveryWatch === '1') return;
    mount.dataset.ddQualityRecoveryWatch = '1';
    let injected = false;
    let expiryTimer = 0;
    const injectRecovery = () => {
      if (injected || document.querySelector(`script[src^="/public/js/admin-product-quality-command-center-v157.js"]`)) return;
      injected = true;
      observer.disconnect();
      if (expiryTimer) window.clearTimeout(expiryTimer);
      const script = document.createElement('script');
      script.src = DD_PRODUCT_QUALITY_RECOVERY_SRC;
      script.dataset.ddQualityRecovery = '1';
      document.head.appendChild(script);
    };
    const needsRecovery = () => /product quality view unavailable|product startup request timed out/i.test(String(mount.textContent || ''));
    const observer = new MutationObserver(() => { if (needsRecovery()) injectRecovery(); });
    observer.observe(mount, { childList: true, subtree: true, characterData: true });
    if (needsRecovery()) injectRecovery();
    expiryTimer = window.setTimeout(() => observer.disconnect(), 12_000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}

function ensureCurrentDashboardCards(path) {
  if (path !== '/admin/' && path !== '/admin/index.html') return;
  const grid = document.querySelector('.department-grid');
  if (!grid) return;
  const cards = [
    ['/admin/help/', 'Online Help Centre', 'Current operating help for security, search quality, responsive layouts, releases, integrations and application ownership.'],
    ['/admin/inventory-intelligence/', 'Inventory Intelligence', 'Prioritized stock, reorder, provenance, usage-profile and Product-impact work queue over the existing Inventory authority.'],
    ['/admin/supply-sourcing/', 'Supply Sourcing & Replenishment', 'Compare reviewed Supply sources, pack pricing, lead times, reorder targets and approved substitutions without automatic ordering or stock mutation.'],
    ['/admin/tool-lifecycle/', 'Tool Lifecycle', 'Condition, service, maintenance, repair, calibration, safety, retirement and replacement planning for durable Tools without quantity consumption.'],
    ['/admin/storefront-merchandising/', 'Storefront Merchandising', 'Curate Collections and Collage presets over existing Products and approved Product images without creating another catalog.'],
    ['/admin/caip-content-handoff/', 'CAIP → Content Studio Handoff', 'Prepare reviewed, reference-only evidence packages from approved CAIP evidence; no private-media copy or automatic publication.']
  ];
  for (const [href, title, body] of cards) {
    if (grid.querySelector(`a[href="${href}"]`)) continue;
    const link = document.createElement('a');
    link.className = 'card department-card startup-highlight-card';
    link.href = href;
    const h2 = document.createElement('h2');
    h2.textContent = title;
    const p = document.createElement('p');
    p.className = 'small';
    p.textContent = body;
    link.append(h2, p);
    grid.appendChild(link);
  }
}

const currentAdminPath = window.location.pathname || '';
if (currentAdminPath.startsWith('/admin/')) {
  const installDelivery = () => installAdminDataDeliveryGuard(currentAdminPath);
  if (!installDelivery()) {
    document.addEventListener('dd:auth-verified', installDelivery, { once: true });
    document.addEventListener('dd:admin-ready', installDelivery, { once: true });
    window.setTimeout(installDelivery, 0);
  }
  installProductQualityRecoveryWatch(currentAdminPath);
}

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname || '';
  if (!path.startsWith('/admin/')) return;
  ensureCurrentDashboardCards(path);

  // Build 176: route-view telemetry is intentionally browser-local. Merely navigating
  // around Admin must not authenticate against D1 or write a telemetry row.
  const key = `dd_admin_route_usage_local:${path}`;
  try {
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, JSON.stringify({
        first_seen_at: new Date().toISOString(),
        source_route: document.referrer ? new URL(document.referrer, window.location.origin).pathname : ''
      }));
    }
  } catch {}
  window.DDAdminRouteUsage = Object.freeze({
    build: 176,
    automatic_remote_recording: false,
    remote_d1_queries: 0,
    path
  });
});
