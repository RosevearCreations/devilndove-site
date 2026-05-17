// File: /public/js/admin-sitemap-preview.js
// Brief description: Operations panel for previewing static + live-D1 product sitemap URLs.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('sitemapPreviewAdminMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const pill = (status) => {
    const clean = String(status || 'unknown').toLowerCase();
    const cls = clean === 'ok' || clean === 'pass' ? 'ok' : (clean === 'fail' || clean === 'error' ? 'danger' : 'warn');
    return `<span class="admin-status-pill ${cls}">${esc(clean)}</span>`;
  };
  const setMsg = (text, error = false) => {
    const el = document.getElementById('sitemapPreviewMessage');
    if (!el) return;
    el.style.display = text ? 'block' : 'none';
    el.style.color = error ? '#b00020' : '#14532d';
    el.textContent = text || '';
  };
  async function readJson(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Sitemap preview failed.');
    return data;
  }
  function render(data) {
    const el = document.getElementById('sitemapPreviewResults');
    if (!el) return;
    const urls = Array.isArray(data.urls) ? data.urls : [];
    el.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:10px"><div>${pill(data.summary?.status)} <strong>${esc(data.generated_at || '')}</strong></div><div class="small">Static ${esc(data.summary?.static_url_count || 0)} • Products ${esc(data.summary?.product_url_count || 0)} • Total ${esc(data.summary?.total_url_count || 0)}</div></div>
      ${data.summary?.warning ? `<div class="small danger" style="margin-top:8px">${esc(data.summary.warning)}</div>` : ''}
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Source</th><th>URL path</th><th>Last modified</th></tr></thead><tbody>
        ${urls.slice(0, 50).map((row) => `<tr><td>${esc(row.source || '')}</td><td><code>${esc(row.path || '')}</code></td><td>${esc(row.lastmod || '—')}</td></tr>`).join('') || '<tr><td colspan="3">No sitemap URLs returned.</td></tr>'}
      </tbody></table></div>
      <details style="margin-top:10px"><summary>XML preview</summary><pre class="small" style="white-space:pre-wrap">${esc(data.xml_preview || '')}</pre></details>`;
  }
  async function run() {
    try {
      setMsg('Building sitemap preview...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/sitemap-preview'));
      render(data);
      setMsg('Sitemap preview complete.');
    } catch (error) {
      setMsg(error.message || 'Sitemap preview failed.', true);
    }
  }
  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Live Sitemap Preview</h2><p class="small" style="margin:8px 0 0 0">Combines important static pages with live D1 product URLs so we can compare the deployed sitemap against current inventory.</p></div>
        <button class="btn primary" type="button" id="sitemapPreviewRunButton">Build sitemap preview</button>
      </div>
      <div id="sitemapPreviewMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="sitemapPreviewResults"></div>
    </div>`;
  document.getElementById('sitemapPreviewRunButton')?.addEventListener('click', run);
});
