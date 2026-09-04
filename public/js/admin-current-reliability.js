(() => {
  'use strict';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const yes = (v) => v === true ? 'PASS' : 'REVIEW';
  const api = async (url) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(url) : fetch(url, { credentials: 'same-origin' });
  const card = (label, value, detail = '') => `<article class="card"><div class="small">${esc(label)}</div><div class="rel-score">${esc(value)}</div>${detail ? `<div class="small">${esc(detail)}</div>` : ''}</article>`;

  function renderChecks(rows) {
    const el = document.getElementById('reliabilityChecks');
    el.innerHTML = (Array.isArray(rows) ? rows : []).map((x) => `<div class="rel-check"><span>${esc(x.label || x.key)}</span><span class="rel-status">${x.pass ? 'PASS' : 'FAIL'}</span></div>`).join('') || '<p class="small">No checks returned.</p>';
  }

  function renderGovernance(r) {
    const g = r.governance || {}, rec = r.recovery || {}, drift = r.drift || {}, provenance = r.provenance || {};
    document.getElementById('reliabilityGovernance').innerHTML = `
      <div class="rel-check"><span>Current release authority</span><span>${esc(g.current_release_authority || provenance.current_operator_authority || 'unknown')}</span></div>
      <div class="rel-check"><span>Production promotion proofs</span><span>${esc(g.production_promotion_proof_count ?? 'unknown')}</span></div>
      <div class="rel-check"><span>Rollback readiness</span><span>${esc(g.rollback_readiness || 'unknown')}</span></div>
      <div class="rel-check"><span>Native GitHub ruleset</span><span>${esc(g.native_github_ruleset || 'unknown')}</span></div>
      <div class="rel-check"><span>Required status context</span><span>${esc(g.required_status_context || '')}</span></div>
      <div class="rel-check"><span>Force push policy</span><span>${esc(g.force_push_policy || '')}</span></div>
      <div class="rel-check"><span>Rollback planner</span><span>${yes(rec.rollback_planner)}</span></div>
      <div class="rel-check"><span>Schema reversal allowed</span><span>${rec.rollback_schema_reversal ? 'YES' : 'NO'}</span></div>
      <div class="rel-check"><span>Recovery rehearsal</span><span>${yes(rec.development_export_restore_rehearsal)}</span></div>
      <div class="rel-check"><span>Structural drift check</span><span>${yes(drift.development_production_structural_check)}</span></div>
      <div class="rel-check"><span>Production drift contact</span><span>${esc(drift.production_contact || '')}</span></div>`;
  }

  function renderSlo(r) {
    const s = r.slo_targets || {};
    document.getElementById('reliabilitySlo').innerHTML = Object.entries(s).map(([k, v]) => `<div class="rel-check"><span>${esc(k.replaceAll('_', ' '))}</span><span>${esc(v)}</span></div>`).join('');
  }

  async function load() {
    const msg = document.getElementById('reliabilityMessage');
    try {
      const response = await api('/api/admin/current-reliability');
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const r = data.reliability || {};
      msg.textContent = `Release ${data.release} Build ${data.build} current reliability snapshot loaded for ${r.environment || 'unknown'}; mutation capability: none.`;
      document.getElementById('reliabilitySummary').innerHTML = [
        card('Reliability score', `${r.score ?? 0}/100`, r.status || ''),
        card('Canonical migrations', `${r.migrations?.native_rows ?? 0}/${r.migrations?.expected ?? 0}`, 'native ledger'),
        card('Migration proofs', `${r.migrations?.proof_rows ?? 0}/${r.migrations?.expected ?? 0}`, 'proof authority'),
        card('Foreign-key violations', r.foreign_key_violations ?? 0, 'target: 0'),
        card('Open critical incidents', r.runtime_incidents?.open_critical ?? 0, 'target: 0'),
        card('Open error incidents', r.runtime_incidents?.open_error ?? 0, 'target: 0')
      ].join('');
      renderChecks(r.checks);
      renderGovernance(r);
      renderSlo(r);
    } catch (error) {
      msg.textContent = `Current reliability snapshot unavailable: ${error?.message || error}`;
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
