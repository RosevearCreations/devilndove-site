// File: /public/js/admin-accounting-evidence-check.js
// Brief description: Admin accounting evidence URL checker for accountant export readiness.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('accountingEvidenceCheckMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  async function load() {
    const period = document.getElementById('accountingEvidencePeriod')?.value || '';
    const out = document.getElementById('accountingEvidenceResults');
    if (!out) return;
    out.innerHTML = '<p class="small">Checking evidence URLs...</p>';
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/accounting-evidence-check?period_month=${encodeURIComponent(period)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Evidence check failed.');
      const rows = Array.isArray(data.checks) ? data.checks : [];
      out.innerHTML = `<p class="small">Missing ${esc(data.summary?.missing || 0)} of ${esc(data.summary?.total || 0)} evidence references.</p><div class="admin-table-wrap"><table><thead><tr><th>Source</th><th>Period</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${esc(row.source)} #${esc(row.record_id)}</td><td>${esc(row.period_month || '')}</td><td>${row.ok ? '<span class="admin-status-pill ok">ready</span>' : '<span class="admin-status-pill warning">missing</span>'}</td><td class="small">${row.evidence_url ? `<a href="${esc(row.evidence_url)}" target="_blank" rel="noopener">${esc(row.evidence_url)}</a>` : esc(row.issue || 'Missing')}</td></tr>`).join('') || '<tr><td colspan="4">No accounting evidence rows found yet.</td></tr>'}</tbody></table></div>`;
    } catch (error) { out.innerHTML = `<p class="small" style="color:#ffb4c1">${esc(error.message || 'Evidence check failed.')}</p>`; }
  }
  mount.innerHTML = `<div class="accounting-evidence-check-card"><h2 style="margin-top:0">Accountant evidence URL checker</h2><p class="small">Find HST/GST or accountant export records missing evidence links before packaging the export.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="accountingEvidencePeriod" placeholder="YYYY-MM or blank"/><button class="btn" type="button" id="accountingEvidenceCheckButton">Check evidence</button></div><div id="accountingEvidenceResults" style="margin-top:10px"></div></div>`;
  document.getElementById('accountingEvidenceCheckButton')?.addEventListener('click', load);
  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) load(); });
});
