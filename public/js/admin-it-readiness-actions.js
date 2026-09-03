// Release 467 Build 30 — current-release I.T. readiness action queue.
// Historical/superseded evidence is not an open task. Explicit HOLD_EXTERNAL lanes remain visible as deferred work,
// but do not masquerade as current source-release blockers.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('itReadinessActionQueueMount');
  if (!mount) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const stateClass = (value) => value === 'green' ? 'good' : value === 'red' ? 'bad' : 'warn';
  const stateLabel = (value) => String(value || 'unknown').toUpperCase();
  const safeHref = (value) => String(value || '').trim().startsWith('/admin/') ? String(value).trim() : '/admin/it/';

  const EXTERNAL_CODE_TO_LANE = Object.freeze({
    caip_external_evidence: 'caip_private_media',
    stripe_external_evidence: 'stripe_development',
    paypal_external_evidence: 'paypal_sandbox',
    social_external_evidence: 'social_oauth',
    provider_secret_reference_missing: 'stripe_development',
    provider_configuration_drift: 'stripe_development',
    paypal_not_sandbox: 'paypal_sandbox',
  });
  const INTENTIONAL_SAFE_CLOSED = new Set(['provider_execution_switch_closed','provider_mutation_switch_closed']);
  const SYSTEM_GATE_PROVEN = new Set(['r2_identity_control_plane_proof','runtime_exact_sha_unavailable']);
  const GOVERNANCE_DEFERRED = new Set(['github_native_ruleset_external']);

  let latestActions = [];
  let deferredActions = [];
  let satisfiedActions = [];
  let activeFilter = 'open';

  async function loadAuthority() {
    const response = await fetch('/current-development-authority.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Current Development authority unavailable (${response.status}).`);
    return response.json();
  }
  function authorityGreen(authority) {
    return authority?.state === 'DEVELOPMENT_GREEN' && Number(authority?.last_green_build || 0) >= 20
      && /^[0-9a-f]{40}$/i.test(String(authority?.accepted_dev_sha || ''))
      && Number(authority?.last_green_system_gate_run || 0) > 0
      && Number(authority?.last_green_build_proof_run || 0) > 0
      && Number(authority?.last_green_branch_hygiene_run || 0) > 0;
  }
  function externalLaneDeferred(authority, code) {
    const lane = EXTERNAL_CODE_TO_LANE[code];
    if (!lane) return null;
    const value = String(authority?.external_lanes?.[lane] || '').toUpperCase();
    return value.startsWith('HOLD_EXTERNAL') ? { lane, value } : null;
  }
  function classifyFinding(authority, finding, index) {
    const level = String(finding?.state || 'amber').toLowerCase();
    const code = String(finding?.code || `finding_${index}`);
    if (level === 'green') return { bucket: 'satisfied', code, reason: 'GREEN evidence is retained but is not an open action.' };
    if (INTENTIONAL_SAFE_CLOSED.has(code)) return { bucket: 'satisfied', code, reason: 'Guarded provider mutation/execution controls are intentionally closed outside deliberate acceptance.' };
    if (authorityGreen(authority) && SYSTEM_GATE_PROVEN.has(code)) return { bucket: 'satisfied', code, reason: `Current System Gate ${authority.last_green_system_gate_run} already owns this exact deployment/control-plane proof.` };
    if (authorityGreen(authority) && GOVERNANCE_DEFERRED.has(code)) return { bucket: 'deferred', code, reason: `Repository Branch Hygiene ${authority.last_green_branch_hygiene_run} is GREEN; native ruleset hardening remains separately managed rather than a current release blocker.` };
    const external = externalLaneDeferred(authority, code);
    if (external) return { bucket: 'deferred', code, reason: `${external.lane} is explicitly ${external.value}; keep the evidence visible without presenting it as a current source-release prerequisite.` };
    return { bucket: 'open', code, reason: '' };
  }
  function normalizeAction(subsystemKey, finding, index, classification) {
    const level = String(finding?.state || 'amber').toLowerCase();
    return { id:`${subsystemKey}:${classification.code || index}`, subsystemKey, state:level === 'red' ? 'red' : 'amber', code:classification.code,
      label:String(finding?.label || 'Readiness action'), detail:String(finding?.detail || ''), correction:String(finding?.correction || 'Open the corrective workspace and complete the current proof.'), href:safeHref(finding?.href), disposition_reason:classification.reason };
  }
  function collect(authority, data) {
    const open=[], deferred=[], satisfied=[];
    Object.entries(data?.subsystems || {}).forEach(([subsystemKey, subsystem]) => {
      (Array.isArray(subsystem?.findings) ? subsystem.findings : []).forEach((finding,index) => {
        const classification=classifyFinding(authority,finding,index); const item=normalizeAction(subsystemKey,finding,index,classification);
        if (classification.bucket === 'open') open.push(item); else if (classification.bucket === 'deferred') deferred.push(item); else satisfied.push(item);
      });
    });
    const order=(a,b)=>(a.state===b.state?a.label.localeCompare(b.label):a.state==='red'?-1:1);
    return {open:open.sort(order),deferred:deferred.sort(order),satisfied:satisfied.sort(order)};
  }
  function actionCard(action) {
    return `<article class="card" style="margin-top:12px;padding:14px" data-readiness-action-state="${esc(action.state)}"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><div class="small"><strong>${esc(action.code)}</strong> • ${esc(action.subsystemKey)}</div><h3 style="margin:4px 0">${esc(action.label)}</h3><div class="small">${esc(action.detail)}</div></div><span class="badge ${stateClass(action.state)}">${esc(stateLabel(action.state))}</span></div><div style="margin-top:10px"><strong>Current correction</strong><div class="small">${esc(action.correction)}</div></div><div style="margin-top:10px"><a class="btn secondary" href="${esc(action.href)}">Open corrective workspace</a></div></article>`;
  }
  function dispositionCard(action,label) { return `<article class="card" style="margin-top:10px;padding:12px"><div><strong>${esc(action.label)}</strong> <span class="small">${esc(action.code)}</span></div><div class="small"><strong>${esc(label)}:</strong> ${esc(action.disposition_reason)}</div></article>`; }
  function renderQueue() {
    const visible=activeFilter==='red'?latestActions.filter((item)=>item.state==='red'):activeFilter==='amber'?latestActions.filter((item)=>item.state==='amber'):latestActions;
    const queue=document.getElementById('itReadinessQueueList'); if(!queue)return;
    queue.innerHTML=visible.length?visible.map(actionCard).join(''):'<div class="card" style="margin-top:12px;padding:14px"><strong>No current actions in this view.</strong><div class="small">Passed, superseded, intentionally-safe-closed, and explicitly deferred external findings are not counted as open release work.</div></div>';
  }
  async function load() {
    mount.innerHTML='<section class="card" style="margin-top:18px"><p class="small">Building current release action queue…</p></section>';
    try {
      const [authority,towerResponse]=await Promise.all([loadAuthority(),apiFetch('/api/admin/it-control-tower',{cache:'no-store'})]);
      const data=await towerResponse.json().catch(()=>({})); if(!towerResponse.ok||!data?.ok)throw new Error(data?.error||`Readiness action queue failed (${towerResponse.status}).`);
      const classified=collect(authority,data); latestActions=classified.open; deferredActions=classified.deferred; satisfiedActions=classified.satisfied;
      const red=latestActions.filter((item)=>item.state==='red').length; const amber=latestActions.filter((item)=>item.state==='amber').length; const openState=red?'red':amber?'amber':'green';
      mount.innerHTML=`<section class="card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Release ${esc(authority.release||467)} • Current authority Build ${esc(authority.build||'?')}</p><h2 style="margin:0">Current I.T. Readiness Actions</h2><p class="small">Only unresolved work that still applies to the current release authority appears as an open action. Historical passed checks remain evidence, not recurring to-do items.</p></div><div style="text-align:right"><div style="font-size:2rem;font-weight:800">${esc(latestActions.length)}</div><span class="badge ${stateClass(openState)}">${red?`${red} RED`:amber?`${amber} AMBER`:'CLEAR'}</span></div></div><div class="admin-compact-tool-grid" style="margin-top:14px"><div><strong>Current RED</strong><small>${esc(red)}</small></div><div><strong>Current AMBER</strong><small>${esc(amber)}</small></div><div><strong>Deferred external/governance</strong><small>${esc(deferredActions.length)}</small></div><div><strong>Passed/superseded</strong><small>${esc(satisfiedActions.length)}</small></div></div><div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap" role="group" aria-label="Readiness action filters"><button class="btn" type="button" data-it-action-filter="open">All current</button><button class="btn secondary" type="button" data-it-action-filter="red">RED only</button><button class="btn secondary" type="button" data-it-action-filter="amber">AMBER only</button><button class="btn secondary" id="refreshItReadinessActions" type="button">Refresh queue</button></div><p class="small" style="margin-bottom:0">Current authority: <code>${esc(authority.accepted_dev_sha||'not-yet-green')}</code>. Last green System Gate: ${esc(authority.last_green_system_gate_run||'pending')}. No schema repair, Production mutation, provider execution, secret disclosure, or access-policy change is performed here.</p></section><section id="itReadinessQueueList" aria-label="Current readiness actions"></section><details class="card" style="margin-top:18px"><summary><strong>Deferred external / governance work (${esc(deferredActions.length)})</strong></summary><p class="small">These items are not claimed as passed. They remain deliberately separate from the current source-release action queue.</p>${deferredActions.map((item)=>dispositionCard(item,'Deferred')).join('')||'<p class="small">None.</p>'}</details><details class="card" style="margin-top:12px"><summary><strong>Passed / superseded evidence (${esc(satisfiedActions.length)})</strong></summary><p class="small">These findings are retained for evidence but do not need to be repeated merely because a later build exists.</p>${satisfiedActions.map((item)=>dispositionCard(item,'Not open')).join('')||'<p class="small">None.</p>'}</details>`;
      mount.querySelectorAll('[data-it-action-filter]').forEach((button)=>button.addEventListener('click',()=>{activeFilter=button.getAttribute('data-it-action-filter')||'open';mount.querySelectorAll('[data-it-action-filter]').forEach((candidate)=>candidate.classList.toggle('secondary',candidate!==button));renderQueue();}));
      document.getElementById('refreshItReadinessActions')?.addEventListener('click',load); renderQueue();
    } catch(error) { mount.innerHTML=`<section class="card" style="margin-top:18px"><h2>Current I.T. action queue unavailable</h2><p class="small">${esc(error?.message||error)}</p></section>`; }
  }
  load();
});
