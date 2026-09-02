// Release 467 Build 2 — read-only readiness action queue and recovery runbooks.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('itReadinessActionQueueMount');
  if (!mount) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const stateClass = (value) => value === 'green' ? 'good' : value === 'red' ? 'bad' : 'warn';
  const stateLabel = (value) => String(value || 'unknown').toUpperCase();
  const safeHref = (value) => {
    const href = String(value || '').trim();
    return href.startsWith('/admin/') ? href : '/admin/it/';
  };

  const RUNBOOKS = Object.freeze({
    database: {
      id: 'RB-D1-01',
      title: 'Development D1 authority recovery',
      trigger: 'D1 binding, table count, migration proof or relational-integrity readiness is RED.',
      workspace: '/admin/deployment-preflight/',
      steps: [
        'Stop dependent release work and keep Production mutation closed.',
        'Confirm the canonical Development D1 binding and environment identity using the approved preflight authority.',
        'Run the canonical migration ledger/applicator only when the preflight identifies an unapplied canonical migration; never repair schema from a request handler.',
        'Run migration proof plus PRAGMA foreign_key_check and retain the resulting evidence.',
        'Refresh the I.T. Control Tower; continue only when the D1 finding is GREEN.'
      ],
      pass: 'Canonical Development D1 evidence is GREEN, migration proofs agree, and foreign-key violations are zero.'
    },
    admin_authority: {
      id: 'RB-ADMIN-01',
      title: 'Root administrator/module authority recovery',
      trigger: 'Profiles are missing, modules drift, or the root administrator lacks effective manage authority.',
      workspace: '/admin/application-modules/',
      steps: [
        'Open Application Modules and verify the canonical active user/profile authority is loading.',
        'Confirm all five canonical modules are enabled before changing any user grant.',
        'Restore business-module manage authority through the existing audited authority surface only.',
        'For I.T., preserve the explicit per-user manage grant and the last-active-I.T.-manager lockout protection.',
        'Refresh the Control Tower and verify root_admin_full_manage is proven.'
      ],
      pass: 'At least one active admin exists, profiles load, five modules are enabled, and the root administrator has FULL MANAGE including explicit I.T. manage.'
    },
    storage: {
      id: 'RB-R2-01',
      title: 'Development R2 storage recovery',
      trigger: 'Product or CAIP storage binding/readiness cannot be proven.',
      workspace: '/admin/deployment-preflight/',
      steps: [
        'Keep Production R2 mutation closed and do not infer bucket identity from an opaque runtime binding.',
        'Verify the Development Pages binding names against the canonical control-plane evidence.',
        'Perform read-only bucket accessibility checks for product and CAIP storage.',
        'Correct binding configuration at the deployment/platform layer if the canonical identity is wrong.',
        'Redeploy the exact candidate SHA if configuration changed, then rerun preflight.'
      ],
      pass: 'Both canonical Development R2 authorities are proven without cross-environment or Production access.'
    },
    configuration: {
      id: 'RB-CONFIG-01',
      title: 'Development configuration drift recovery',
      trigger: 'Environment markers, bindings or sanitized configuration differ from the Development authority.',
      workspace: '/admin/deployment-preflight/',
      steps: [
        'Compare only sanitized presence/type metadata; never expose secret values in diagnostics.',
        'Confirm the candidate is configured for Development and not a Production resource identity.',
        'Correct the Pages environment variable/binding at its authoritative configuration surface.',
        'Redeploy the same reviewed source tree after any configuration correction.',
        'Rerun the System Gate and I.T. preflight before resuming feature work.'
      ],
      pass: 'Development configuration is proven and no secret value is emitted by readiness tooling.'
    },
    provider_configuration: {
      id: 'RB-PROVIDER-01',
      title: 'Provider configuration recovery',
      trigger: 'A required provider key/reference is missing or provider setup authority is incomplete.',
      workspace: '/admin/release-control/external-commercial-readiness/',
      steps: [
        'Keep provider execution in test/sandbox mode and Production provider execution closed.',
        'Verify sanitized credential-reference presence and provider setup authority; do not print credentials.',
        'Correct missing Development secret/binding references in the platform/provider configuration surface.',
        'Run the provider-specific readiness check without treating configuration presence as end-to-end acceptance.',
        'Continue to the external acceptance runbook only after configuration readiness is GREEN.'
      ],
      pass: 'Required Development provider references are present and sanitized configuration readiness is GREEN.'
    },
    external_acceptance: {
      id: 'RB-ACCEPT-01',
      title: 'External Development acceptance closure',
      trigger: 'Stripe, PayPal, social OAuth, CAIP media or another real external acceptance proof is pending.',
      workspace: '/admin/release-control/external-commercial-readiness/',
      steps: [
        'Use Development/test/sandbox resources only and preserve the release HOLD while evidence is incomplete.',
        'Run the exact provider/media acceptance flow required by the corrective workspace.',
        'Capture replay/idempotency, webhook/security or ranged-streaming evidence where required.',
        'Verify the evidence is attached to the exact Development candidate rather than inferred from configuration.',
        'Refresh readiness; do not promote while HOLD_EXTERNAL_ACCEPTANCE remains.'
      ],
      pass: 'All required real Development acceptance evidence is present and the external-acceptance subsystem is GREEN.'
    },
    deployment_ancestry: {
      id: 'RB-SHA-01',
      title: 'Exact-SHA/deployment ancestry recovery',
      trigger: 'Runtime SHA is unavailable, malformed, stale, or does not agree with canonical deployment evidence.',
      workspace: '/admin/deployment-preflight/',
      steps: [
        'Do not infer a SHA from a hostname, release number or deployment age.',
        'Resolve the exact 40-hex candidate SHA from the canonical System Gate/deployment artifact.',
        'Confirm the Development deployment descends from the reviewed dev authority.',
        'Redeploy the exact reviewed candidate if runtime and deployment evidence disagree.',
        'Rerun the System Gate and preflight and retain the exact-SHA proof.'
      ],
      pass: 'Runtime/deployment ancestry is proven by canonical exact-SHA evidence for the reviewed Development candidate.'
    }
  });

  const CODE_RUNBOOK = Object.freeze({
    root_admin_missing: 'admin_authority',
    root_admin_module_authority_drift: 'admin_authority',
    admin_profiles_missing: 'admin_authority',
    module_authority_drift: 'admin_authority',
    d1_binding_missing: 'database',
    d1_table_count_drift: 'database',
    migration_proof_drift: 'database',
    foreign_key_violation: 'database',
    caip_external_evidence: 'external_acceptance',
    stripe_external_evidence: 'external_acceptance',
    paypal_external_evidence: 'external_acceptance',
    runtime_exact_sha_unavailable: 'deployment_ancestry'
  });

  let latestActions = [];
  let activeFilter = 'open';

  function runbookFor(item, subsystemKey) {
    const key = CODE_RUNBOOK[String(item?.code || '')] || (RUNBOOKS[subsystemKey] ? subsystemKey : 'configuration');
    return { key, ...RUNBOOKS[key] };
  }

  function actionPriority(state) {
    return state === 'red' ? 0 : state === 'amber' ? 1 : 2;
  }

  function collectActions(data) {
    const actions = [];
    Object.entries(data?.subsystems || {}).forEach(([subsystemKey, subsystem]) => {
      (Array.isArray(subsystem?.findings) ? subsystem.findings : []).forEach((finding, index) => {
        const level = String(finding?.state || subsystem?.state || 'amber').toLowerCase();
        if (level === 'green') return;
        actions.push({
          id: `${subsystemKey}:${finding?.code || index}`,
          subsystemKey,
          state: level === 'red' ? 'red' : 'amber',
          code: String(finding?.code || 'readiness_finding'),
          label: String(finding?.label || 'Readiness action'),
          detail: String(finding?.detail || ''),
          correction: String(finding?.correction || 'Open the corrective workspace and complete the required proof.'),
          href: safeHref(finding?.href),
          runbook: runbookFor(finding, subsystemKey)
        });
      });
    });
    return actions.sort((a, b) => actionPriority(a.state) - actionPriority(b.state) || a.label.localeCompare(b.label));
  }

  function runbookSteps(runbook) {
    return `<ol style="margin:8px 0 0;padding-left:20px">${runbook.steps.map((step) => `<li class="small" style="margin:5px 0">${esc(step)}</li>`).join('')}</ol>`;
  }

  function actionCard(action) {
    const rb = action.runbook;
    return `<article class="card" style="margin-top:12px;padding:14px" data-readiness-action-state="${esc(action.state)}">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <div class="small"><strong>${esc(rb.id)}</strong> • ${esc(action.code)}</div>
          <h3 style="margin:4px 0">${esc(action.label)}</h3>
          <div class="small">${esc(action.detail)}</div>
        </div>
        <span class="badge ${stateClass(action.state)}">${esc(stateLabel(action.state))}</span>
      </div>
      <div style="margin-top:10px"><strong>Safe correction</strong><div class="small">${esc(action.correction)}</div></div>
      <details style="margin-top:10px">
        <summary><strong>${esc(rb.title)}</strong></summary>
        <div class="small" style="margin-top:8px"><strong>Trigger:</strong> ${esc(rb.trigger)}</div>
        ${runbookSteps(rb)}
        <div class="small" style="margin-top:8px"><strong>Pass condition:</strong> ${esc(rb.pass)}</div>
      </details>
      <div style="margin-top:10px"><a class="btn secondary" href="${esc(action.href)}">Open corrective workspace</a></div>
    </article>`;
  }

  function renderQueue() {
    const visible = activeFilter === 'red'
      ? latestActions.filter((item) => item.state === 'red')
      : activeFilter === 'amber'
        ? latestActions.filter((item) => item.state === 'amber')
        : latestActions;
    const queue = document.getElementById('itReadinessQueueList');
    if (!queue) return;
    queue.innerHTML = visible.length
      ? visible.map(actionCard).join('')
      : '<div class="card" style="margin-top:12px;padding:14px"><strong>No actions in this view.</strong><div class="small">A GREEN finding is intentionally omitted from the open action queue.</div></div>';
  }

  function runbookLibrary() {
    return Object.values(RUNBOOKS).map((rb) => `<details class="card" style="margin-top:10px;padding:14px">
      <summary><strong>${esc(rb.id)} — ${esc(rb.title)}</strong></summary>
      <div class="small" style="margin-top:8px"><strong>Trigger:</strong> ${esc(rb.trigger)}</div>
      ${runbookSteps(rb)}
      <div class="small" style="margin-top:8px"><strong>Pass condition:</strong> ${esc(rb.pass)}</div>
      <div style="margin-top:10px"><a class="small" href="${esc(rb.workspace)}">Open primary workspace →</a></div>
    </details>`).join('');
  }

  async function load() {
    mount.innerHTML = '<section class="card" style="margin-top:18px"><p class="small">Building readiness action queue…</p></section>';
    try {
      const response = await apiFetch('/api/admin/it-control-tower', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.error || `Readiness action queue failed (${response.status}).`);

      latestActions = collectActions(data);
      const red = latestActions.filter((item) => item.state === 'red').length;
      const amber = latestActions.filter((item) => item.state === 'amber').length;
      const openState = red ? 'red' : amber ? 'amber' : 'green';

      mount.innerHTML = `
        <section class="card" style="margin-top:18px">
          <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap">
            <div>
              <p class="eyebrow">Release 467 • Build 2</p>
              <h2 style="margin:0">I.T. Readiness Action Queue</h2>
              <p class="small">Turns non-GREEN Control Tower findings into a prioritized, read-only correction queue with deterministic recovery runbooks and pass conditions.</p>
            </div>
            <div style="text-align:right">
              <div style="font-size:2rem;font-weight:800">${esc(latestActions.length)}</div>
              <span class="badge ${stateClass(openState)}">${red ? `${red} RED` : amber ? `${amber} AMBER` : 'CLEAR'}</span>
            </div>
          </div>
          <div class="admin-compact-tool-grid" style="margin-top:14px">
            <div><strong>RED actions</strong><small>${esc(red)}</small></div>
            <div><strong>AMBER actions</strong><small>${esc(amber)}</small></div>
            <div><strong>Runbooks</strong><small>${esc(Object.keys(RUNBOOKS).length)}</small></div>
            <div><strong>Mutation</strong><small>READ-ONLY</small></div>
          </div>
          <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap" role="group" aria-label="Readiness action filters">
            <button class="btn" type="button" data-it-action-filter="open">All open</button>
            <button class="btn secondary" type="button" data-it-action-filter="red">RED only</button>
            <button class="btn secondary" type="button" data-it-action-filter="amber">AMBER only</button>
            <button class="btn secondary" id="refreshItReadinessActions" type="button">Refresh queue</button>
          </div>
          <p class="small" style="margin-bottom:0">Safety boundary: no schema repair, Production mutation, provider execution, secret disclosure or access-policy change is performed from this queue.</p>
        </section>
        <section id="itReadinessQueueList" aria-label="Open readiness actions"></section>
        <section class="card" style="margin-top:18px">
          <h2 style="margin-top:0">Recovery Runbook Library</h2>
          <p class="small">Use the matching runbook when a subsystem becomes RED or AMBER. Each runbook ends with a proof condition; corrective work remains in its existing audited workspace.</p>
          ${runbookLibrary()}
        </section>
      `;

      mount.querySelectorAll('[data-it-action-filter]').forEach((button) => {
        button.addEventListener('click', () => {
          activeFilter = button.getAttribute('data-it-action-filter') || 'open';
          mount.querySelectorAll('[data-it-action-filter]').forEach((candidate) => candidate.classList.toggle('secondary', candidate !== button));
          renderQueue();
        });
      });
      document.getElementById('refreshItReadinessActions')?.addEventListener('click', load);
      renderQueue();
    } catch (error) {
      mount.innerHTML = `<section class="card" style="margin-top:18px"><h2>I.T. action queue unavailable</h2><p class="small">${esc(error?.message || 'Unable to build the readiness action queue.')}</p><button class="btn" id="retryItReadinessActions" type="button">Retry</button></section>`;
      document.getElementById('retryItReadinessActions')?.addEventListener('click', load);
    }
  }

  void load();
});
