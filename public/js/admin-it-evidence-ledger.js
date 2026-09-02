// Release 467 Build 4 — consolidated I.T. evidence and acceptance ledger.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('itEvidenceLedgerMount');
  if (!mount) return;

  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const STORAGE_KEY = 'dnd.release467.browserRuntimeEvidence';
  const SOURCE_PROOF_CHAIN = Object.freeze([
    'Release 467 Build 1 Proof',
    'Release 467 Build 2 Proof',
    'Release 467 I.T. Admin Runtime Proof',
    'Release 467 Build 3 Proof',
    'Release 467 Build 4 Proof',
  ]);
  const MAX_BROWSER_EVIDENCE_AGE_MS = 8 * 60 * 60 * 1000;
  let latestLedger = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const stateClass = (state) => {
    const value = String(state || '').toUpperCase();
    if (['PASS', 'GREEN', 'PROVEN', 'READY'].includes(value)) return 'good';
    if (['FAIL', 'RED', 'BLOCKED'].includes(value)) return 'bad';
    return 'warn';
  };

  function safeBrowserEvidence() {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return { state: 'PENDING', reason: 'No same-session browser acceptance evidence has been recorded.' };
      const evidence = JSON.parse(raw);
      const generated = Date.parse(String(evidence?.generated_at || ''));
      const age = Number.isFinite(generated) ? Date.now() - generated : Number.POSITIVE_INFINITY;
      const sameOrigin = evidence?.target_origin === window.location.origin;
      const correctAuthority = evidence?.authority === 'release467-build3-browser-runtime-acceptance';
      const readOnly = evidence?.http_method === 'GET'
        && evidence?.d1_mutation === false
        && evidence?.r2_mutation === false
        && evidence?.provider_execution === false
        && evidence?.provider_publication === false
        && evidence?.production_mutation === false
        && evidence?.credentials_emitted === false
        && evidence?.cloudflare_access_policy_changed === false
        && evidence?.ci_service_token_readiness_inferred === false;
      const fresh = age >= 0 && age <= MAX_BROWSER_EVIDENCE_AGE_MS;
      if (!sameOrigin || !correctAuthority || !readOnly || !fresh) {
        return {
          state: 'STALE',
          reason: `Browser evidence was rejected: same_origin=${sameOrigin}; authority=${correctAuthority}; read_only=${readOnly}; fresh=${fresh}.`,
        };
      }
      return {
        state: evidence?.overall === 'PASS' ? 'PASS' : 'FAIL',
        generated_at: evidence?.generated_at || null,
        check_count: Array.isArray(evidence?.checks) ? evidence.checks.length : 0,
        failed_checks: Array.isArray(evidence?.checks) ? evidence.checks.filter((row) => row?.status !== 'PASS').map((row) => row?.key || row?.label || 'unknown') : [],
        evidence,
      };
    } catch {
      return { state: 'STALE', reason: 'Stored browser acceptance evidence could not be parsed safely.' };
    }
  }

  async function getTower() {
    const response = await apiFetch('/api/admin/it-control-tower', { method: 'GET', cache: 'no-store' });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; }
    catch { throw new Error(`I.T. Control Tower returned non-JSON content (HTTP ${response.status}).`); }
    if (!response.ok || data?.ok !== true) throw new Error(data?.error || `I.T. Control Tower failed (${response.status}).`);
    return data;
  }

  function findingEvidence(subsystemKey, subsystem) {
    const findings = Array.isArray(subsystem?.findings) ? subsystem.findings : [];
    return findings.map((finding, index) => ({
      id: `${subsystemKey}:${finding?.code || index}`,
      subsystem: subsystemKey,
      code: String(finding?.code || 'finding'),
      label: String(finding?.label || subsystemKey),
      state: String(finding?.state || subsystem?.state || 'amber').toUpperCase(),
      detail: String(finding?.detail || ''),
      correction: String(finding?.correction || ''),
      href: String(finding?.href || '/admin/it/').startsWith('/admin/') ? String(finding?.href || '/admin/it/') : '/admin/it/',
    }));
  }

  function buildLedger(tower, browser) {
    const subsystems = tower?.subsystems && typeof tower.subsystems === 'object' ? tower.subsystems : {};
    const ancestry = subsystems?.deployment_ancestry || {};
    const external = subsystems?.external_acceptance || {};
    const admin = subsystems?.admin_authority || {};
    const database = subsystems?.database || {};
    const storage = subsystems?.storage || {};
    const configuration = subsystems?.configuration || {};
    const providerConfiguration = subsystems?.provider_configuration || {};
    const externalFindings = findingEvidence('external_acceptance', external);
    const allFindings = Object.entries(subsystems).flatMap(([key, value]) => findingEvidence(key, value));
    const openFindings = allFindings.filter((row) => !['GREEN', 'PASS', 'PROVEN'].includes(row.state));

    const runtimeCorePass = database?.state === 'green' && admin?.state === 'green';
    const exactSha = ancestry?.exact_sha_available === true && /^[0-9a-f]{40}$/i.test(String(ancestry?.runtime_source_sha || ''));
    const browserPass = browser?.state === 'PASS';
    const externalAccepted = external?.accepted === true;
    const launchState = String(tower?.readiness?.launch_state || 'HOLD_EXTERNAL_ACCEPTANCE');

    return {
      authority: 'release467-build4-evidence-acceptance-ledger',
      release: 467,
      build: 4,
      mode: 'authenticated-development-read-only-ledger',
      generated_at: new Date().toISOString(),
      target_origin: window.location.origin,
      source_proof_chain: SOURCE_PROOF_CHAIN.map((name) => ({
        name,
        evidence_class: 'ci-source-proof',
        runtime_ci_query_performed: false,
      })),
      runtime: {
        control_tower_generated_at: tower?.generated_at || null,
        control_tower_release: Number(tower?.release || 0),
        control_tower_build: Number(tower?.build || 0),
        environment: tower?.environment || null,
        readiness_score: Number(tower?.readiness?.score || 0),
        readiness_overall: tower?.readiness?.overall || 'unknown',
        launch_state: launchState,
        core_database_admin_pass: runtimeCorePass,
        runtime_source_sha: exactSha ? ancestry.runtime_source_sha : null,
        deployment_host: ancestry?.deployment_host || null,
        exact_sha_available: exactSha,
        storage_state: storage?.state || 'unknown',
        configuration_state: configuration?.state || 'unknown',
        provider_configuration_state: providerConfiguration?.state || 'unknown',
      },
      browser_acceptance: {
        state: browser?.state || 'PENDING',
        generated_at: browser?.generated_at || null,
        check_count: Number(browser?.check_count || 0),
        failed_checks: Array.isArray(browser?.failed_checks) ? browser.failed_checks : [],
        same_session_only: true,
      },
      external_acceptance: {
        accepted: externalAccepted,
        state: external?.state || 'unknown',
        findings: externalFindings.map((row) => ({ code: row.code, label: row.label, state: row.state, detail: row.detail })),
      },
      open_findings: openFindings.map((row) => ({ subsystem: row.subsystem, code: row.code, state: row.state, label: row.label })),
      acceptance: {
        runtime_core: runtimeCorePass ? 'PASS' : 'FAIL',
        exact_sha: exactSha ? 'PROVEN' : 'PENDING_CONTROL_PLANE_PROOF',
        browser_runtime: browserPass ? 'PASS' : browser?.state || 'PENDING',
        external: externalAccepted ? 'PASS' : 'HOLD',
        release: runtimeCorePass && exactSha && browserPass && externalAccepted && launchState === 'READY_FOR_SEPARATE_PROMOTION_REVIEW'
          ? 'READY_FOR_SEPARATE_PROMOTION_REVIEW'
          : 'HOLD',
      },
      safety: {
        http_method: 'GET',
        schema_change: false,
        request_time_schema_mutation: false,
        d1_mutation: false,
        r2_mutation: false,
        production_mutation: false,
        provider_execution: false,
        provider_publication: false,
        cloudflare_access_policy_mutation: false,
        credentials_emitted: false,
        ci_service_token_readiness_inferred_from_browser: false,
      },
    };
  }

  function ledgerRow(title, state, detail, href = '') {
    return `<div class="card" style="margin-top:10px;padding:14px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><strong>${esc(title)}</strong><div class="small">${esc(detail)}</div>${href ? `<a class="small" href="${esc(href)}">Open evidence workspace →</a>` : ''}</div>
        <span class="badge ${stateClass(state)}">${esc(state)}</span>
      </div>
    </div>`;
  }

  function externalRows(tower) {
    const external = tower?.subsystems?.external_acceptance || {};
    const findings = findingEvidence('external_acceptance', external);
    if (!findings.length) return ledgerRow('External acceptance', 'PENDING', 'No external acceptance findings were returned.', '/admin/release-control/external-commercial-readiness/');
    return findings.map((row) => ledgerRow(row.label, row.state, row.detail, row.href)).join('');
  }

  function render(tower, browser, ledger) {
    const runtime = ledger.runtime;
    const acceptance = ledger.acceptance;
    const releaseState = acceptance.release;
    const browserDetail = browser?.state === 'PASS'
      ? `${browser.check_count} GET-only browser checks passed at ${browser.generated_at}.`
      : browser?.reason || `${browser?.state || 'PENDING'}; run Build 3 browser acceptance in this authenticated session.`;
    const shaDetail = runtime.exact_sha_available
      ? `${runtime.runtime_source_sha} on ${runtime.deployment_host || 'current Development host'}; canonical System Gate ancestry cross-check remains a separate control-plane proof.`
      : 'Runtime did not expose a trusted 40-character source SHA; use Deployment Preflight/System Gate evidence.';

    mount.innerHTML = `
      <section class="card" style="margin-top:18px">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <p class="eyebrow">Release 467 • Build 4</p>
            <h2 style="margin:0">I.T. Evidence & Acceptance Ledger</h2>
            <p class="small">Consolidates source-proof authorities, current Development runtime evidence, same-session browser acceptance, exact-SHA visibility and outstanding external acceptance without changing D1, R2, provider state, Cloudflare Access or Production.</p>
          </div>
          <div style="text-align:right">
            <div style="font-size:2rem;font-weight:800">${esc(runtime.readiness_score)}%</div>
            <span class="badge ${stateClass(releaseState === 'READY_FOR_SEPARATE_PROMOTION_REVIEW' ? 'READY' : 'HOLD')}">${esc(releaseState)}</span>
          </div>
        </div>
        <div class="admin-compact-tool-grid" style="margin-top:14px">
          <div><strong>Runtime core</strong><small>${esc(acceptance.runtime_core)}</small></div>
          <div><strong>Exact SHA</strong><small>${esc(acceptance.exact_sha)}</small></div>
          <div><strong>Browser proof</strong><small>${esc(acceptance.browser_runtime)}</small></div>
          <div><strong>External proof</strong><small>${esc(acceptance.external)}</small></div>
          <div><strong>Open findings</strong><small>${esc(ledger.open_findings.length)}</small></div>
          <div><strong>Mutation</strong><small>READ-ONLY</small></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <button class="btn" id="refreshItEvidenceLedger" type="button">Refresh ledger</button>
          <button class="btn secondary" id="copyItEvidenceLedger" type="button">Copy sanitized ledger</button>
          <button class="btn secondary" id="focusBrowserAcceptance" type="button">Open browser acceptance</button>
          <a class="btn secondary" href="/admin/deployment-preflight/">Deployment preflight</a>
        </div>
        <p class="small" style="margin-bottom:0;margin-top:12px">CI source-proof names are consolidated here as authorities only; this browser does not query GitHub or infer CI service-token readiness. Promotion remains a separate deliberate review.</p>
      </section>
      <section aria-label="Evidence ledger">
        ${ledgerRow('Source proof chain', 'CI', `${SOURCE_PROOF_CHAIN.length} Release 467 source-proof authorities are declared; Build 4 CI validates the inherited gate chain.`)}
        ${ledgerRow('Development database & administrator runtime', acceptance.runtime_core, `database=${tower?.subsystems?.database?.state || 'unknown'}; admin=${tower?.subsystems?.admin_authority?.state || 'unknown'}; root_admin_full_manage=${Boolean(tower?.subsystems?.admin_authority?.metrics?.root_admin_full_manage)}.`, '/admin/application-modules/')}
        ${ledgerRow('Development storage authority', String(runtime.storage_state || 'unknown').toUpperCase(), `Runtime storage binding state=${runtime.storage_state || 'unknown'}; exact bucket identity remains control-plane/System Gate evidence.`, '/admin/deployment-preflight/')}
        ${ledgerRow('Exact deployed source SHA', runtime.exact_sha_available ? 'PROVEN' : 'PENDING', shaDetail, '/admin/deployment-preflight/')}
        ${ledgerRow('Authenticated browser runtime acceptance', browser?.state || 'PENDING', browserDetail, '/admin/it/')}
        ${ledgerRow('Development configuration', String(runtime.configuration_state || 'unknown').toUpperCase(), `configuration=${runtime.configuration_state || 'unknown'}; provider_configuration=${runtime.provider_configuration_state || 'unknown'}; secret values are never emitted.`, '/admin/it-integrations/')}
      </section>
      <section class="card" style="margin-top:18px">
        <h2 style="margin-top:0">External Acceptance Evidence</h2>
        <p class="small">Configuration presence is not acceptance. These items remain independent Development/test/sandbox proofs and keep release promotion on HOLD until each required path is proven.</p>
        ${externalRows(tower)}
      </section>
    `;

    document.getElementById('refreshItEvidenceLedger')?.addEventListener('click', load);
    document.getElementById('copyItEvidenceLedger')?.addEventListener('click', copyLedger);
    document.getElementById('focusBrowserAcceptance')?.addEventListener('click', () => {
      document.getElementById('itBrowserRuntimeAcceptanceMount')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function load() {
    mount.innerHTML = '<section class="card" style="margin-top:18px"><p class="small">Building evidence and acceptance ledger…</p></section>';
    try {
      const [tower, browser] = await Promise.all([getTower(), Promise.resolve(safeBrowserEvidence())]);
      latestLedger = buildLedger(tower, browser);
      render(tower, browser, latestLedger);
    } catch (error) {
      latestLedger = null;
      mount.innerHTML = `<section class="card" style="margin-top:18px"><h2>Evidence ledger unavailable</h2><p class="small">${esc(error?.message || 'Unable to build the evidence ledger.')}</p><button class="btn" id="retryItEvidenceLedger" type="button">Retry</button></section>`;
      document.getElementById('retryItEvidenceLedger')?.addEventListener('click', load);
    }
  }

  async function copyLedger() {
    if (!latestLedger) return;
    const button = document.getElementById('copyItEvidenceLedger');
    try {
      await navigator.clipboard.writeText(`${JSON.stringify(latestLedger, null, 2)}\n`);
      if (button) button.textContent = 'Ledger copied';
      window.setTimeout(() => { if (button) button.textContent = 'Copy sanitized ledger'; }, 1800);
    } catch {
      if (button) button.textContent = 'Copy unavailable';
    }
  }

  window.addEventListener('dnd:browser-runtime-acceptance', () => { void load(); });
  void load();
});
