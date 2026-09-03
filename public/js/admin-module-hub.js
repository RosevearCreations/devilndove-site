// Release 467 Build 30 — current admin navigation renderer.
// Historical evidence routes remain addressable but are not presented as current operational tools.
document.addEventListener('DOMContentLoaded', () => {
  const hubKey = document.body?.dataset?.adminModuleHub || '';
  const hubMount = document.getElementById('adminModuleHubMount');
  const cardCounts = Array.from(document.querySelectorAll('[data-admin-module-card]'));
  if (!hubMount && !cardCounts.length) return;

  const HISTORICAL_ONLY_HREFS = new Set(['/admin/release448-calibration/']);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const currentLinks = (section) => (Array.isArray(section?.links) ? section.links : []).filter((link) => !HISTORICAL_ONLY_HREFS.has(String(link?.href || '')));

  const load = async () => {
    try {
      const response = await fetch('/data/admin-navigation-modules.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Navigation manifest unavailable (${response.status}).`);
      const manifest = await response.json();
      const modules = Array.isArray(manifest?.modules) ? manifest.modules : [];
      window.DDAdminNavigationManifest = manifest;

      cardCounts.forEach((card) => {
        const key = card.getAttribute('data-admin-module-card') || '';
        const module = modules.find((row) => row?.key === key);
        if (!module) return;
        const count = (module.sections || []).reduce((total, section) => total + currentLinks(section).length, 0);
        const countEl = card.querySelector('[data-admin-module-count]');
        if (countEl) countEl.textContent = `${count} tools`;
      });

      if (!hubMount) return;
      const module = modules.find((row) => row?.key === hubKey);
      if (!module) throw new Error('This admin module is not defined in the navigation manifest.');
      const sections = Array.isArray(module.sections) ? module.sections : [];
      const toolCount = sections.reduce((total, section) => total + currentLinks(section).length, 0);
      const intro = document.getElementById('adminModuleHubIntro');
      if (intro) intro.textContent = `${module.summary || ''} ${toolCount} current grouped tool${toolCount === 1 ? '' : 's'}. Historical evidence routes are intentionally omitted from the current tool list.`;

      hubMount.innerHTML = sections.map((section) => {
        const links = currentLinks(section);
        if (!links.length) return '';
        return `<section class="card" style="margin-top:18px"><h2 style="margin-top:0">${escapeHtml(section?.label || 'Tools')}</h2><div class="admin-compact-tool-grid">${links.map((link) => `<a href="${escapeHtml(link?.href || '/admin/')}"><strong>${escapeHtml(link?.label || link?.href || 'Open')}</strong><small>Open ${escapeHtml(module.label)} workspace</small></a>`).join('')}</div></section>`;
      }).join('');
    } catch (error) {
      if (hubMount) hubMount.innerHTML = `<section class="card"><h2>Navigation unavailable</h2><p class="small">${escapeHtml(error?.message || 'Unable to load admin navigation.')}</p><a class="btn" href="/admin/">Return to Admin</a></section>`;
    }
  };

  void load();
});
