// Release 467 Build 30 — current-authority source promotion review.
// Historical browser/preflight builds remain evidence but are not recurring prerequisites once superseded by a later GREEN System Gate.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('itPromotionReadinessMount');
  if (!mount) return;
  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const stateClass = (value) => ['READY_FOR_EXPLICIT_SOURCE_PROMOTION','GREEN','PASS','PROVEN'].includes(String(value||'').toUpperCase()) ? 'good' : ['BLOCKED','RED','FAIL'].includes(String(value||'').toUpperCase()) ? 'bad' : 'warn';
  const badge = (value) => `<span class="badge ${stateClass(value)}">${esc(String(value || 'HOLD').toUpperCase())}</span>`;
  let latestPackage = null;

  async function getAuthority() {
    const response = await fetch('/current-development-authority.json', { cache:'no-store' });
    if (!response.ok) throw new Error(`Current Development authority unavailable (${response.status}).`);
    return response.json();
  }
  async function getTower() {
    const response = await apiFetch('/api/admin/it-control-tower', { method:'GET', cache:'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) throw new Error(data?.error || `I.T. Control Tower failed (${response.status}).`);
    return data;
  }
  function currentAuthorityGreen(authority) {
    return authority?.state === 'DEVELOPMENT_GREEN'
      && /^[0-9a-f]{40}$/i.test(String(authority?.accepted_dev_sha || ''))
      && /^[0-9a-f]{40}$/i.test(String(authority?.accepted_dev_tree_sha || ''))
      && Number(authority?.last_green_system_gate_run || 0) > 0
      && Number(authority?.last_green_build_proof_run || 0) > 0
      && Number(authority?.last_green_branch_hygiene_run || 0) > 0;
  }
  function deferredExternal(authority) {
    return Object.entries(authority?.external_lanes || {}).filter(([,value]) => String(value || '').toUpperCase().startsWith('HOLD_EXTERNAL')).map(([lane,value]) => ({lane,value}));
  }
  function buildPackage(authority, tower) {
    const databaseState = String(tower?.subsystems?.database?.state || 'unknown').toLowerCase();
    const adminState = String(tower?.subsystems?.admin_authority?.state || 'unknown').toLowerCase();
    const authorityGreen = currentAuthorityGreen(authority);
    const currentCore = databaseState === 'green' && adminState === 'green';
    const blockers = [];
    if (!authorityGreen) blockers.push('Current Development authority is not yet DEVELOPMENT_GREEN with exact accepted SHA/tree and current System Gate/build-proof/branch-hygiene evidence.');
    if (!currentCore) blockers.push(`Current Development runtime core is not GREEN (database=${databaseState}; admin=${adminState}).`);
    const decision = blockers.length ? 'HOLD' : 'READY_FOR_EXPLICIT_SOURCE_PROMOTION';
    return {
      authority: 'release467-build30-current-source-promotion-readiness',
      release: Number(authority?.release || 467),
      build: Number(authority?.build || 0),
      generated_at: new Date().toISOString(),
      decision,
      candidate_sha: authority?.accepted_dev_sha || null,
      candidate_tree_sha: authority?.accepted_dev_tree_sha || null,
      evidence: {
        current_authority: authorityGreen ? 'GREEN' : 'HOLD',
        system_gate_run: Number(authority?.last_green_system_gate_run || 0) || null,
        build_proof_run: Number(authority?.last_green_build_proof_run || 0) || null,
        branch_hygiene_run: Number(authority?.last_green_branch_hygiene_run || 0) || null,
        database_state: databaseState,
        admin_authority_state: adminState,
      },
      blockers,
      deferred_external_lanes: deferredExternal(authority),
      superseded_prerequisites: [
        'Release 467 Build 3 same-session browser acceptance is historical evidence, not a recurring blocker after a later exact-SHA System Gate is GREEN.',
        'Release 467 Build 5 promotion package is superseded by the current DEVELOPMENT_GREEN authority.',
        'Legacy Release 448 calibration is historical evidence and is not a current release prerequisite.'
      ],
      contract: {
        explicit_human_promotion_required: true,
        dev_source_authority: true,
        main_is_production_source: true,
        production_business_data_remains_production_owned: true,
        canonical_d1_migrations_only: true,
        browser_button_does_not_promote: true,
        provider_hold_is_not_claimed_passed: true,
        schema_mutation: false,
        d1_mutation: false,
        r2_mutation: false,
        provider_execution: false,
        provider_publication: false,
        secret_values_emitted: false,
      }
    };
  }
  function render(pkg) {
    const blockers = pkg.blockers.length ? `<ul>${pkg.blockers.map((row)=>`<li>${esc(row)}</li>`).join('')}</ul>` : '<p class="small">The current GREEN Development source authority is ready for an explicit promotion decision.</p>';
    const deferred = pkg.deferred_external_lanes.length ? `<ul>${pkg.deferred_external_lanes.map((row)=>`<li><strong>${esc(row.lane)}</strong> — ${esc(row.value)}</li>`).join('')}</ul>` : '<p class="small">No external lanes are deferred.</p>';
    mount.innerHTML = `<section class="card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Release ${esc(pkg.release)} • Current authority Build ${esc(pkg.build)}</p><h2 style="margin-top:0">Current Source Promotion Readiness</h2><p class="small">Uses the latest accepted Development authority instead of requiring old Build 3/5/448 tests again. This screen remains read-only; an explicit reviewed promotion is still required.</p></div>${badge(pkg.decision)}</div><div class="admin-compact-tool-grid" style="margin-top:14px"><div><strong>Candidate SHA</strong><small><code>${esc(pkg.candidate_sha || 'NOT GREEN')}</code></small></div><div><strong>Candidate tree</strong><small><code>${esc(pkg.candidate_tree_sha || 'NOT GREEN')}</code></small></div><div><strong>System Gate</strong><small>${esc(pkg.evidence.system_gate_run || 'pending')}</small></div><div><strong>Build proof</strong><small>${esc(pkg.evidence.build_proof_run || 'pending')}</small></div><div><strong>Branch hygiene</strong><small>${esc(pkg.evidence.branch_hygiene_run || 'pending')}</small></div><div><strong>Runtime core</strong><small>${esc(`${pkg.evidence.database_state}/${pkg.evidence.admin_authority_state}`)}</small></div></div><h3>Current blockers</h3>${blockers}<details><summary><strong>Deferred external lanes (${esc(pkg.deferred_external_lanes.length)})</strong></summary><p class="small">These are not marked passed. They remain separate integration work and are not recycled as old source-release prerequisites.</p>${deferred}</details><details style="margin-top:10px"><summary><strong>Superseded prerequisite rules</strong></summary><ul>${pkg.superseded_prerequisites.map((row)=>`<li>${esc(row)}</li>`).join('')}</ul></details><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn" type="button" id="refreshBuild30PromotionReadiness">Refresh current review</button><button class="btn secondary" type="button" id="copyBuild30PromotionPackage">Copy sanitized package</button></div><p class="small">No Production resource, provider, secret, D1 row, R2 object, or Cloudflare Access policy is changed by this review.</p></section>`;
    document.getElementById('refreshBuild30PromotionReadiness')?.addEventListener('click', load);
    document.getElementById('copyBuild30PromotionPackage')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(JSON.stringify(latestPackage,null,2)); } catch {} });
  }
  async function load() {
    mount.innerHTML='<section class="card" style="margin-top:18px"><p class="small">Reading current Development promotion authority…</p></section>';
    try { const [authority,tower]=await Promise.all([getAuthority(),getTower()]); latestPackage=buildPackage(authority,tower); render(latestPackage); }
    catch(error) { latestPackage=null; mount.innerHTML=`<section class="card" style="margin-top:18px"><h2>Current Source Promotion Readiness</h2>${badge('HOLD')}<p class="small">${esc(error?.message||error)}</p></section>`; }
  }
  load();
});
