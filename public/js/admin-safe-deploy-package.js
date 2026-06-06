// File: /public/js/admin-safe-deploy-package.js
// Brief description: Renders schema order, changed-file summary, release manifest, and post-deploy actions for safe deploy review.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('safeDeployPackageMount');
  if (!mount || !window.DDAuth?.apiFetch) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  window.DDAuth.apiFetch('/api/admin/safe-deploy-package')
    .then((response) => response.json())
    .then((data) => {
      if (!data?.ok) throw new Error(data?.error || 'Safe deploy package failed.');
      const p = data.package || {};
      const blocks = p.sql_copy_blocks || {};
      mount.innerHTML = `
        <section class="card">
          <h2>${esc(p.build_label || 'Safe deploy package')}</h2>
          <h3>Schema order</h3>
          <ul>${(p.schema || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
          <div class="grid two-col">
            <div class="status-note"><h3>Fresh install SQL order</h3><ol>${(blocks.fresh_install || []).map((item) => `<li><code>${esc(item)}</code></li>`).join('')}</ol></div>
            <div class="status-note"><h3>Repair-only / partially upgraded SQL order</h3><ol>${(blocks.repair_only || []).map((item) => `<li><code>${esc(item)}</code></li>`).join('')}</ol></div>
          </div>
          <h3>Changed files</h3>
          <p class="small">Also see the generated file-hash manifest: <a href="${esc(p.manifest || '/data/site/release-package-manifest.json')}" target="_blank" rel="noopener">release package manifest</a>.</p>
          <div class="table-wrap"><table class="admin-table"><thead><tr><th>File</th></tr></thead><tbody>${(p.changed_files || []).map((item) => `<tr><td><code>${esc(item)}</code></td></tr>`).join('')}</tbody></table></div>
          <h3>Required post-deploy actions</h3>
          <ul>${(p.post_deploy_actions || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
          <p><a class="btn" href="/admin/deployment-preflight/">Open Deployment Preflight</a> <a class="btn secondary" href="/admin/post-deploy-smoke-tests/">Open Smoke Tests</a></p>
        </section>`;
    })
    .catch((error) => { mount.textContent = error.message || 'Safe deploy package failed.'; });
});
