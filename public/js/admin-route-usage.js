// File: /public/js/admin-route-usage.js
// Release 448: dashboard convergence + non-critical route telemetry.

function ensureRelease448DashboardCards(path) {
  if (path !== '/admin/' && path !== '/admin/index.html') return;
  const grid = document.querySelector('.department-grid');
  if (!grid) return;
  const cards = [
    ['/admin/release448-calibration/', 'Release 448 Calibration Cockpit', 'Read-only real-data readiness across Photography, lineage, Storefront, CAIP, Inventory, Tools, Supplies and I.T.; separates schema activation, missing data and pending review.'],
    ['/admin/inventory-intelligence/', 'Inventory Intelligence', 'Prioritized stock, reorder, provenance, usage-profile and Product-impact work queue over the existing Inventory authority.'],
    ['/admin/supply-sourcing/', 'Supply Sourcing & Replenishment', 'Compare reviewed Supply sources, pack pricing, lead times, reorder targets and approved substitutions without automatic ordering or stock mutation.'],
    ['/admin/tool-lifecycle/', 'Tool Lifecycle', 'Condition, service, maintenance, repair, calibration, safety, retirement and replacement planning for durable Tools without quantity consumption.'],
    ['/admin/storefront-merchandising/', 'Storefront Merchandising', 'Curate Collections and Collage presets over existing Products and consent-gated Product images without creating another catalog.'],
    ['/admin/caip-content-handoff/', 'CAIP → Content Studio Handoff', 'Prepare reviewed, reference-only evidence packages from approved CAIP temporal/story evidence; no private-media copy or automatic publication.']
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

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname || '';
  if (!path.startsWith('/admin/')) return;
  ensureRelease448DashboardCards(path);

  const key = `dd_admin_route_usage_v448:${path}`;
  try { if (sessionStorage.getItem(key)) return; } catch {}

  const record = async () => {
    if (!window.DDAuth?.apiFetch || !window.DDAuth?.isLoggedIn?.()) return;
    try {
      await window.DDAuth.apiFetch('/api/admin/live-readiness-playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_usage',
          route_path: path,
          event_kind: 'view',
          source_route: document.referrer ? new URL(document.referrer, window.location.origin).pathname : ''
        })
      });
      try { sessionStorage.setItem(key, '1'); } catch {}
    } catch {}
  };

  if ('requestIdleCallback' in window) window.requestIdleCallback(record, { timeout: 5000 });
  else window.setTimeout(record, 4000);
});
