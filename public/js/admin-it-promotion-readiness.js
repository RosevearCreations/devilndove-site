// Release 467 Build 5 — read-only Production promotion readiness review.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('itPromotionReadinessMount');
  if (!mount) return;

  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const STORAGE_KEY = 'dnd.release467.browserRuntimeEvidence';
  const MAX_BROWSER_EVIDENCE_AGE_MS = 8 * 60 * 60 * 1000;
  let latestPackage = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const stateClass = (state) => {
    const value = String(state || '').toUpperCase();
    if (['PASS', 'GREEN', 'PROVEN', 'READY', 'READY_FOR_MANUAL_PROMOTION'].includes(value)) return 'good';
    if (['FAIL', 'RED', 'BLOCKED'].includes(value)) return 'bad';
    return 'warn';
  };

  const badge = (state) => {
    const value = String(state || 'HOLD').toUpperCase();
    return `<span class="badge ${stateClass(value)}">${esc(value)}</span>`;
  };

  function browserEvidence() {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return { state: 'PENDING', reason: 'No same-session browser acceptance evidence is available.' };
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
          reason: `Browser evidence rejected: same_origin=${sameOrigin}; authority=${correctAuthority}; read_only=${readOnly}; fresh=${fresh}.`,
        };
      }
      return {
        state: evidence?.overall === 'PASS' ? 'PASS' : 'FAIL',
        generated_at: evidence?.generated_at || null,
        target_origin: evidence?.target_origin || null,
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
      state: String(finding?.state || subsystem?.state || 'AMBER').toUpperCase(),
      detail: String(finding?.detail || ''),
      correction: String(finding?.correction || ''),
    }));
  }

  function allFindings(tower) {
    const subsystems = tower?.subsystems && typeof tower.subsystems === 'object' ? tower.subsystems : {};
    return Object.entries(subsystems).flatMap(([key, value]) => findingEvidence(key, value));
  }

  function trustedRuntimeSha(tower) {
    const ancestry = tower?.subsystems?.deployment_ancestry || {};
    if (ancestry?.exact_sha_available !== true) return null;
    const value = String(ancestry?.runtime_source_sha || '');
    return /^[0-9a-f]{40}$/i.test(value) ? value.toLowerCase() : null;
  }

  function buildPackage(tower, browser) {
    const subsystems = tower?.subsystems && typeof tower.subsystems === 'object' ? tower.subsystems : {};
    const database = subsystems?.database || {};
    const admin = subsystems?.admin_authority || {};
    const storage = subsystems?.storage || {};
    const configuration = subsystems?.configuration || {};
    const providerConfiguration = subsystems?.provider_configuration || {};
    const external = subsystems?.external_acceptance || {};
    const findings = allFindings(tower);
    const openFindings = findings.filter((row) => !['GREEN', 'PASS', 'PROVEN'].includes(row.state));
    const sha = trustedRuntimeSha(tower);

    const runtimeCoreGreen = database?.state === 'green' && admin?.state === 'green';
    const exactShaProven = Boolean(sha);
    const browserPass = browser?.state === 'PASS';
    const externalPass = external?.accepted === true;
    const externalState = String(external?.state || 'unknown').toUpperCase();
    const launchState = String(tower?.readiness?.launch_state || 'HOLD_EXTERNAL_ACCEPTANCE').toUpperCase();
    const launchReady = launchState === 'READY_FOR_SEPARATE_PROMOTION_REVIEW';

    const blockers = [];
    if (!runtimeCoreGreen) blockers.push(`Development runtime core is not GREEN (database=${database?.state || 'unknown'}; admin=${admin?.state || 'unknown'}).`);
    if (!exactShaProven) blockers.push('Trusted 40-character runtime source SHA is unavailable from deployment ancestry.');
    if (!browserPass) blockers.push('Fresh same-origin Build 3 browser runtime acceptance is not PASS.');
    if (!externalPass) blockers.push('External acceptance remains incomplete or on HOLD.');
    if (!launchReady) blockers.push(`Control Tower launch state is ${launchState}, not READY_FOR_SEPARATE_PROMOTION_REVIEW.`);

    const decision = blockers.length === 0 ? 'READY_FOR_MANUAL_PROMOTION' : 'HOLD';
    return {
      authority: 'release467-build5-production-promotion-readiness',
      release: 467,
      build: 5,
      mode: 'authenticated-development-read-only-promotion-review',
      generated_at: new Date().toISOString(),
      target_origin: window.location.origin,
      decision,
      candidate_sha: sha,
      evidence: {
        runtime_core: runtimeCoreGreen ? 'PASS' : 'FAIL',
        exact_sha: exactShaProven ? 'PROVEN' : 'PENDING',
        browser_runtime: browserPass ? 'PASS' : browser?.state || 'PENDING',
        external_acceptance: externalPass ? 'PASS' : 'HOLD',
        control_tower_launch_state: launchState,
        database_state: database?.state || 'unknown',
        admin_authority_state: admin?.state || 'unknown',
        storage_state: storage?.state || 'unknown',
        configuration_state: configuration?.state || 'unknown',
        provider_configuration_state: providerConfiguration?.state || 'unknown',
      },
      browser_acceptance: browser,
      external_acceptance: {
        accepted: externalPass,
        state: externalState,
        findings: findingEvidence('external_acceptance', external).map((row) => ({
          code: row.code,
          label: row.label,
          state: row.state,
          detail: row.detail,
          correction: row.correction,
        })),
      },
      blockers,
      open_findings: openFindings.map((row) => ({
        subsystem: row.subsystem,
        code: row.code,
        state: row.state,
        label: row.label,
      })),
      promotion_contract: {
        source_authority: 'dev',
        production_source: 'main',
        cloudflare_pages_project: 'devilndove-site',
        exact_green_development_tree_only: true,
        production_business_data_is_production_owned: true,
        canonical_d1_migrations_only: true,
        production_contacted: false,
        main_advanced: false,
      },
      production_resource_expectations: {
        d1: 'devilndove-prod-r462',
        product_r2: 'devilndove-toolshed-images',
        caip_private_r2: 'devilndove-caip-media',
        verification_mode: 'documented expectation only; Build 5 does not contact Production',
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
        cloudflare_access_policy_changed: false,
        credentials_emitted: false,
      },
    };
  }

  function render(pkg) {
    const blockers = pkg.blockers.length
      ? `<ul>${pkg.blockers.map((row) => `<li>${esc(row)}</li>`).join('')}</ul>`
      : '<p class="small">All Build 5 read-only Development promotion evidence is proven for the displayed candidate SHA.</p>';
    const findings = pkg.open_findings.length
      ? `<details><summary>${pkg.open_findings.length} open Control Tower finding(s)</summary><ul>${pkg.open_findings.map((row) => `<li><strong>${esc(row.label)}</strong> — ${esc(row.state)} <span class="small">(${esc(row.subsystem)})</span></li>`).join('')}</ul></details>`
      : '<p class="small">No non-GREEN Control Tower findings were reported.</p>';

    mount.innerHTML = `
      <section class="card" style="margin-top:18px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <p class="eyebrow">Release 467 • Build 5</p>
            <h2 style="margin-top:0">Production Promotion Readiness</h2>
            <p class="small">Freezes the current Development evidence into a sanitized HOLD/READY package. Build 5 never promotes, contacts Production resources, executes providers, changes Cloudflare Access, or mutates D1/R2.</p>
          </div>
          ${badge(pkg.decision)}
        </div>
        <div class="admin-compact-tool-grid" style="margin-top:14px">
          <div><strong>Candidate SHA</strong><small><code>${esc(pkg.candidate_sha || 'UNAVAILABLE')}</code></small></div>
          <div><strong>Runtime core</strong><small>${esc(pkg.evidence.runtime_core)}</small></div>
          <div><strong>Browser proof</strong><small>${esc(pkg.evidence.browser_runtime)}</small></div>
          <div><strong>External proof</strong><small>${esc(pkg.evidence.external_acceptance)}</small></div>
          <div><strong>Launch state</strong><small>${esc(pkg.evidence.control_tower_launch_state)}</small></div>
          <div><strong>Promotion</strong><small>MANUAL / SEPARATE</small></div>
        </div>
        <h3>Promotion blockers</h3>
        ${blockers}
        <h3>Open evidence findings</h3>
        ${findings}
        <p class="small"><strong>Production expectations only:</strong> D1 <code>devilndove-prod-r462</code>; Product R2 <code>devilndove-toolshed-images</code>; CAIP private R2 <code>devilndove-caip-media</code>. Build 5 does not contact or mutate those resources.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          <button class="btn" type="button" id="refreshBuild5PromotionReadiness">Refresh review</button>
          <button class="btn secondary" type="button" id="copyBuild5PromotionPackage">Copy sanitized readiness package</button>
          <a class="btn secondary" href="/admin/deployment-preflight/">Deployment preflight</a>
        </div>
      </section>`;

    document.getElementById('refreshBuild5PromotionReadiness')?.addEventListener('click', load);
    document.getElementById('copyBuild5PromotionPackage')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(latestPackage, null, 2));
      } catch {
      }
    });
  }

  async function load() {
    mount.innerHTML = '<section class="card" style="margin-top:18px"><p class="small">Reviewing Release 467 Build 5 promotion readiness…</p></section>';
    try {
      const tower = await getTower();
      latestPackage = buildPackage(tower, browserEvidence());
      render(latestPackage);
    } catch (error) {
      latestPackage = null;
      mount.innerHTML = `<section class="card" style="margin-top:18px"><h2 style="margin-top:0">Production Promotion Readiness</h2><p>${badge('HOLD')}</p><p class="small">${esc(error?.message || error)}</p><p class="small">No Production resource was contacted and no mutation was attempted.</p></section>`;
    }
  }

  window.addEventListener('dnd:browser-runtime-acceptance', load);
  load();
});
