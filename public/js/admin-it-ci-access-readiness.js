(() => {
  'use strict';

  const MANIFEST_URL = '/release467-build5-ci-access-readiness.json';
  const HOLD = 'HOLD_EXTERNAL';

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function mount() {
    return document.getElementById('itCiAccessReadinessMount');
  }

  function statusBadge(state) {
    const normalized = String(state || HOLD).toUpperCase();
    return `<span class="badge">${esc(normalized)}</span>`;
  }

  function safePacket(manifest) {
    const access = manifest?.cloudflare_access_service_token || {};
    return {
      release: 467,
      build: 5,
      title: manifest?.title || 'CI / Cloudflare Access service-token readiness',
      state: HOLD,
      generated_at: new Date().toISOString(),
      browser_pass_is_ci_access_pass: false,
      access_token_is_application_admin_session: false,
      production_mutation_authorized: false,
      development_only: true,
      required_github_actions_secret_names: Array.isArray(access.required_github_actions_secret_names)
        ? access.required_github_actions_secret_names.slice()
        : ['CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET'],
      secret_values_included: false,
      allowed_sanitized_evidence: Array.isArray(manifest?.allowed_sanitized_evidence)
        ? manifest.allowed_sanitized_evidence.slice()
        : [],
      closure_condition: manifest?.closure_condition || ''
    };
  }

  function downloadJson(filename, data) {
    const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function render(manifest) {
    const target = mount();
    if (!target) return;

    const access = manifest?.cloudflare_access_service_token || {};
    const names = Array.isArray(access.required_github_actions_secret_names)
      ? access.required_github_actions_secret_names
      : ['CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET'];
    const mechanics = Array.isArray(access.manual_correction_mechanics)
      ? access.manual_correction_mechanics
      : [];

    target.innerHTML = `
      <section class="card" style="margin-top:18px">
        <div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap">
          <div>
            <div class="small">Release 467 • Build 5</div>
            <h2 style="margin:4px 0 8px">CI / Access Readiness</h2>
            <p class="small" style="margin:0">Automated Cloudflare Access authentication is a separate acceptance lane from browser login and root-admin runtime proof.</p>
          </div>
          <div>${statusBadge(HOLD)}</div>
        </div>
        <div class="card" style="margin-top:14px">
          <strong>Browser Acceptance PASS ≠ CI Access PASS.</strong>
          <p class="small" style="margin-bottom:0">A Cloudflare Access service token also does not create an application-admin session. Build 5 therefore stays ${esc(HOLD)} until independent Development-only CI evidence exists.</p>
        </div>
        <div style="margin-top:14px">
          <strong>Required GitHub Actions secret names</strong>
          <ul>${names.map((name) => `<li><code>${esc(name)}</code></li>`).join('')}</ul>
          <p class="small">Only the names are shown. Secret values are never requested, inspected, rendered, logged or included in the downloadable checklist.</p>
        </div>
        <details style="margin-top:12px">
          <summary><strong>Correction mechanics</strong></summary>
          <ol>${mechanics.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
        </details>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <button class="btn" id="itRefreshCiAccessReadiness" type="button">Refresh CI Readiness</button>
          <button class="btn" id="itDownloadCiAccessChecklist" type="button">Download CI Checklist</button>
        </div>
        <p class="small" id="itCiAccessReadinessStatus" style="margin:12px 0 0">Manifest loaded. External token-backed acceptance remains ${esc(HOLD)}.</p>
      </section>`;

    document.getElementById('itRefreshCiAccessReadiness')?.addEventListener('click', load);
    document.getElementById('itDownloadCiAccessChecklist')?.addEventListener('click', () => {
      downloadJson('release467-build5-ci-access-checklist.json', safePacket(manifest));
    });
  }

  function renderFailure(error) {
    const target = mount();
    if (!target) return;
    target.innerHTML = `
      <section class="card" style="margin-top:18px">
        <div class="small">Release 467 • Build 5</div>
        <h2 style="margin:4px 0 8px">CI / Access Readiness</h2>
        <p>${statusBadge(HOLD)}</p>
        <p class="small">The Build 5 readiness manifest could not be loaded. No CI readiness is inferred from browser authentication.</p>
        <p class="small"><code>${esc(error?.message || 'manifest_load_failed')}</code></p>
        <button class="btn" id="itRefreshCiAccessReadiness" type="button">Retry</button>
      </section>`;
    document.getElementById('itRefreshCiAccessReadiness')?.addEventListener('click', load);
  }

  async function load() {
    const target = mount();
    if (target) target.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(MANIFEST_URL, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`manifest_http_${response.status}`);
      const manifest = await response.json();
      render(manifest);
    } catch (error) {
      renderFailure(error);
    } finally {
      mount()?.removeAttribute('aria-busy');
    }
  }

  window.DDITCiAccessReadiness = Object.freeze({ load, safePacket });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();
