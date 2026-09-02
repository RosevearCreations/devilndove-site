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

  const pill = (state) => {
    const value = String(state || 'HOLD').toUpperCase();
    const cls = ['PASS', 'GREEN', 'READY', 'READY_FOR_MANUAL_PROMOTION'].includes(value)
      ? 'good'
      : ['FAIL', 'RED', 'BLOCKED'].includes(value) ? 'bad' : 'warn';
    return `<span class="pill ${cls}">${esc(value)}</span>`;
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
        return { state: 'STALE', reason: `same_origin=${sameOrigin}; authority=${correctAuthority}; read_only=${readOnly}; fresh=${fresh}` };
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

  function subsystemState(subsystem) {
    return String(subsystem?.state || subsystem?.status || 'UNKNOWN').toUpperCase();
  }

  function allFindings(tower) {
    const subsystems = tower?.subsystems && typeof tower.subsystems === 'object' ? tower.subsystems : {};
    return Object.entries(subsystems).flatMap(([subsystem, value]) => {
      const findings = Array.isArray(value?.findings) ? value.findings : [];
      return findings.map((finding, index) => ({
        id: `${subsystem}:${finding?.code || index}`,
        subsystem,
        code: String(finding?.code || 'finding'),
        label: String(finding?.label || subsystem),
        state: String(finding?.state || value?.state || 'AMBER').toUpperCase(),
        detail: String(finding?.detail || ''),
        correction: String(finding?.correction || ''),
      }));
    });
  }

  function trustedSha(tower) {
    const candidates = [
      tower?.runtime_source_sha,
      tower?.source_sha,
      tower?.deployment_sha,
      tower?.subsystems?.deployment_ancestry?.runtime_source_sha,
      tower?.subsystems?.deployment_ancestry?.source_sha,
      tower?.subsystems?.deployment_ancestry?.deployment_sha,
    ];
    const found = candidates.find((value) => /^[0-9a-f]{40}$/i.test(String(value || '')));
    return found ? String(found).toLowerCase() : null;
  }

  function buildPackage(tower, browser) {
    const subsystems = tower?.subsystems && typeof tower.subsystems === 'object' ? tower.subsystems : {};
    const findings = allFindings(tower);
    const openFindings = findings.filter((row) => !['GREEN', 'PASS', 'READY', 'PROVEN'].includes(row.state));
    const externalState = subsystemState(subsystems?.external_acceptance);
    const databaseState = subsystemState(subsystems?.database);
    const adminState = subsystemState(subsystems?.admin_authority);
    const storageState = subsystemState(subsystems?.storage);
    const configurationState = subsystemState(subsystems?.configuration);
    const sha = trustedSha(tower);

    const runtimeCoreGreen = [databaseState, adminState, storageState, configurationState]
      .every((state) => ['GREEN', 'PASS', 'READY', 'PROVEN'].includes(state));
    const exactShaProven = Boolean(sha);
    const browserPass = browser?.state === 'PASS';
    const externalPass = ['GREEN', 'PASS', 'READY', 'PROVEN'].includes(externalState);
    const launchState = String(tower?.launch_state || tower?.release_state || '').toUpperCase();
    const launchReady = ['READY_FOR_SEPARATE_PROMOTION_REVIEW', 'READY_FOR_MANUAL_PROMOTION', 'READY'].includes(launchState);

    const blockers = [];
    if (!runtimeCoreGreen) blockers.push('Development runtime core is not fully GREEN.');
    if (!exactShaProven) blockers.push('Trusted 40-character runtime source SHA is unavailable.');
    if (!browserPass) blockers.push('Fresh same-origin browser runtime acceptance is not PASS.');
    if (!externalPass) blockers.push('External acceptance remains incomplete or on HOLD.');
    if (!launchReady) blockers.push(`Launch state is ${launchState || 'UNKNOWN'}, not promotion-review ready.`);

    const decision = blockers.length === 0 ? 'READY_FOR_MANUAL_PROMOTION' : 'HOLD';
    return {
      authority: 'release467-build5-production-promotion-readiness',
      release: 467,
      build: 5,
      generated_at: new Date().toISOString(),
      target_origin: window.location.origin,
      decision,
      candidate_sha: sha,
      runtime_core_green: runtimeCoreGreen,
      browser_acceptance: browser,
      external_acceptance_state: externalState,
      launch_state: launchState || 'UNKNOWN',
      blockers,
      open_findings: openFindings,
      promotion_contract: {
        source_authority: 'dev',
        production_source: 'main',
        cloudflare_pages_project: 'devilndove-site',
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
      : '<p class="small">No Build 5 blockers are present in the current read-only Development evidence.</p>';
    const findings = pkg.open_findings.length
      ? `<details><summary>${pkg.open_findings.length} open finding(s)</summary><ul>${pkg.open_findings.map((row) => `<li><strong>${esc(row.label)}</strong> — ${esc(row.state)}${row.detail ? `: ${esc(row.detail)}` : ''}${row.correction ? `<br><span class="small">Correction: ${esc(row.correction)}</span>` : ''}</li>`).join('')}</ul></details>`
      : '<p class="small">No non-GREEN Control Tower findings were reported.</p>';

    mount.innerHTML = `
      <section class="card" style="margin-top:18px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <h2 style="margin-top:0">Production Promotion Readiness</h2>
            <p class="small">Release 467 Build 5 freezes the current Development evidence into a sanitized HOLD/READY package. It never promotes, contacts Production resources, executes providers, changes Cloudflare Access, or mutates D1/R2.</p>
          </div>
          ${pill(pkg.decision)}
        </div>
        <div class="grid" style="margin-top:12px">
          <div><strong>Candidate SHA</strong><br><code>${esc(pkg.candidate_sha || 'UNAVAILABLE')}</code></div>
          <div><strong>Browser acceptance</strong><br>${pill(pkg.browser_acceptance?.state)}</div>
          <div><strong>External acceptance</strong><br>${pill(pkg.external_acceptance_state)}</div>
          <div><strong>Launch state</strong><br>${pill(pkg.launch_state)}</div>
        </div>
        <h3>Promotion blockers</h3>
        ${blockers}
        <h3>Open evidence findings</h3>
        ${findings}
        <p class="small"><strong>Production expectations only:</strong> D1 <code>devilndove-prod-r462</code>; Product R2 <code>devilndove-toolshed-images</code>; CAIP private R2 <code>devilndove-caip-media</code>. Build 5 does not contact or mutate those resources.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          <button type="button" id="copyBuild5PromotionPackage">Copy sanitized readiness package</button>
          <button type="button" id="refreshBuild5PromotionReadiness">Refresh review</button>
        </div>
      </section>`;

    document.getElementById('copyBuild5PromotionPackage')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(latestPackage, null, 2));
      } catch {
        window.alert('The browser could not copy the readiness package automatically.');
      }
    });
    document.getElementById('refreshBuild5PromotionReadiness')?.addEventListener('click', load);
  }

  async function load() {
    mount.innerHTML = '<section class="card" style="margin-top:18px"><p class="small">Reviewing Release 467 Build 5 promotion readiness…</p></section>';
    try {
      const tower = await getTower();
      latestPackage = buildPackage(tower, browserEvidence());
      render(latestPackage);
    } catch (error) {
      latestPackage = null;
      mount.innerHTML = `<section class="card" style="margin-top:18px"><h2 style="margin-top:0">Production Promotion Readiness</h2><p>${pill('HOLD')}</p><p class="small">${esc(error?.message || error)}</p><p class="small">No Production resource was contacted and no mutation was attempted.</p></section>`;
    }
  }

  window.addEventListener('dnd:browser-runtime-acceptance', load);
  load();
});
