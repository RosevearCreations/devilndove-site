(() => {
  'use strict';

  const MANIFEST_URL = '/release467-build6-access-acceptance-harness.json';
  const INTERNAL_STATE = 'READY_FOR_EXTERNAL_ACCEPTANCE';
  const EXTERNAL_STATE = 'HOLD_EXTERNAL';

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function mount() {
    return document.getElementById('itAccessAcceptanceHarnessMount');
  }

  function badge(value) {
    return `<span class="badge">${esc(value)}</span>`;
  }

  function safeContract(manifest) {
    const target = manifest?.target || {};
    const workflow = manifest?.acceptance_workflow || {};
    const token = manifest?.service_token || {};
    return {
      release: 467,
      build: 6,
      title: manifest?.title || 'Development Cloudflare Access service-token acceptance harness',
      internal_state: INTERNAL_STATE,
      external_acceptance_state: EXTERNAL_STATE,
      production_mutation_authorized: false,
      development_only: true,
      target: {
        base_url: target.base_url || 'https://dev.devilndove-site.pages.dev',
        path: target.path || '/api/auth/me',
        method: 'GET',
        application_cookie_sent: false,
        authorization_header_sent: false,
        expected_application_status: 401,
        expected_application_json: { ok: false, error: 'Unauthorized.' }
      },
      workflow_path: workflow.path || '.github/workflows/release467-build6-cloudflare-access-acceptance.yml',
      workflow_dispatch_only: true,
      requires_exact_dev_sha: true,
      required_github_actions_secret_names: Array.isArray(token.required_github_actions_secret_names)
        ? token.required_github_actions_secret_names.slice()
        : ['CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET'],
      secret_values_included: false,
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
    const targetNode = mount();
    if (!targetNode) return;
    const target = manifest?.target || {};
    const workflow = manifest?.acceptance_workflow || {};
    const token = manifest?.service_token || {};
    const names = Array.isArray(token.required_github_actions_secret_names)
      ? token.required_github_actions_secret_names
      : ['CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET'];

    targetNode.innerHTML = `
      <section class="card" style="margin-top:18px">
        <div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap">
          <div>
            <div class="small">Release 467 • Build 6</div>
            <h2 style="margin:4px 0 8px">Access Acceptance Harness</h2>
            <p class="small" style="margin:0">The source harness is ready. The real service-token acceptance remains external until the dispatch-only workflow succeeds against the exact reviewed Development SHA.</p>
          </div>
          <div>${badge(INTERNAL_STATE)} ${badge(EXTERNAL_STATE)}</div>
        </div>
        <div class="card" style="margin-top:14px">
          <strong>What a PASS proves</strong>
          <p class="small" style="margin-bottom:0">The service token passed the outer Cloudflare Access layer and the request reached Devil n Dove. Because the harness sends no application cookie or bearer token, the expected application result is still <code>401 Unauthorized.</code> That is intentional and preserves the separation between Access authentication and admin authentication.</p>
        </div>
        <div style="margin-top:14px">
          <strong>Bounded target</strong>
          <ul>
            <li><code>${esc(target.base_url || 'https://dev.devilndove-site.pages.dev')}${esc(target.path || '/api/auth/me')}</code></li>
            <li>Method: <code>GET</code></li>
            <li>Expected application response: <code>401 application/json</code> with <code>Unauthorized.</code></li>
            <li>Application session sent: <strong>No</strong></li>
            <li>Production target: <strong>Forbidden</strong></li>
          </ul>
        </div>
        <div style="margin-top:14px">
          <strong>Operator workflow</strong>
          <p class="small"><code>${esc(workflow.path || '.github/workflows/release467-build6-cloudflare-access-acceptance.yml')}</code></p>
          <ol>
            <li>Confirm <code>dev</code> is the exact reviewed SHA.</li>
            <li>Ensure both canonical GitHub Actions secrets exist: ${names.map((name) => `<code>${esc(name)}</code>`).join(' and ')}.</li>
            <li>Dispatch the Build 6 acceptance workflow with that exact SHA.</li>
            <li>Require a successful run and retain only its sanitized JSON evidence artifact.</li>
          </ol>
          <p class="small">The I.T. browser never receives or sends the Access service-token values and cannot run this external probe.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <button class="btn" id="itRefreshAccessAcceptanceHarness" type="button">Refresh Harness</button>
          <button class="btn" id="itDownloadAccessAcceptanceContract" type="button">Download Acceptance Contract</button>
        </div>
        <p class="small" id="itAccessAcceptanceHarnessStatus" style="margin:12px 0 0">Build 6 source harness loaded. External acceptance remains ${esc(EXTERNAL_STATE)}.</p>
      </section>`;

    document.getElementById('itRefreshAccessAcceptanceHarness')?.addEventListener('click', load);
    document.getElementById('itDownloadAccessAcceptanceContract')?.addEventListener('click', () => {
      downloadJson('release467-build6-access-acceptance-contract.json', safeContract(manifest));
    });
  }

  function renderFailure(error) {
    const target = mount();
    if (!target) return;
    target.innerHTML = `
      <section class="card" style="margin-top:18px">
        <div class="small">Release 467 • Build 6</div>
        <h2 style="margin:4px 0 8px">Access Acceptance Harness</h2>
        <p>${badge(EXTERNAL_STATE)}</p>
        <p class="small">The Build 6 manifest could not be loaded. No Access acceptance is inferred from browser login or earlier runtime evidence.</p>
        <p class="small"><code>${esc(error?.message || 'manifest_load_failed')}</code></p>
        <button class="btn" id="itRefreshAccessAcceptanceHarness" type="button">Retry</button>
      </section>`;
    document.getElementById('itRefreshAccessAcceptanceHarness')?.addEventListener('click', load);
  }

  async function load() {
    mount()?.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(MANIFEST_URL, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`manifest_http_${response.status}`);
      render(await response.json());
    } catch (error) {
      renderFailure(error);
    } finally {
      mount()?.removeAttribute('aria-busy');
    }
  }

  window.DDITAccessAcceptanceHarness = Object.freeze({ load, safeContract });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();
