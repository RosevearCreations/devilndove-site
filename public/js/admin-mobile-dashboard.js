document.addEventListener('DOMContentLoaded', () => {
  const monthInput = document.getElementById('mobileDashboardMonth');
  const refreshButton = document.getElementById('mobileDashboardRefreshButton');
  const messageEl = document.getElementById('mobileDashboardMessage');
  const monthStats = document.getElementById('mobileAdminMonthSummary');
  const draftStats = document.getElementById('mobileAdminDraftSummary');
  const accountingStats = document.getElementById('mobileAdminAccountingSummary');
  if (!monthInput || !refreshButton || !messageEl || !monthStats || !draftStats || !accountingStats || !window.DDAuth) return;

  function centsToMoney(cents, currency='CAD'){
    const value = Number(cents||0)/100;
    try{return new Intl.NumberFormat(undefined,{style:'currency',currency}).format(value);}catch{return `${currency} ${value.toFixed(2)}`;}
  }
  function escapeHtml(value){ return String(value ?? '').replace(/[&<>"]/g, (ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }
  function setMessage(text, isError=false){ messageEl.textContent=text||''; messageEl.style.display=text?'block':'none'; messageEl.style.color=isError?'#b00020':''; }
  function monthValue(){ return String(monthInput.value || new Date().toISOString().slice(0,7)); }
  function renderMonthSummary(report, costing){
    const summary=report?.summary||{};
    const costingSummary=costing?.summary||{};
    monthStats.innerHTML = `
      <div class="admin-stat"><div class="admin-stat-label">Recognized revenue</div><div class="admin-stat-value">${escapeHtml(centsToMoney(Math.round(Number(summary.recognized_amount||0)*100)))}</div></div>
      <div class="admin-stat"><div class="admin-stat-label">Expenses + tax</div><div class="admin-stat-value">${escapeHtml(centsToMoney(Number(summary.operating_expense_cents||0)+Number(summary.operating_expense_tax_cents||0)))}</div></div>
      <div class="admin-stat"><div class="admin-stat-label">Allocated overhead</div><div class="admin-stat-value">${escapeHtml(centsToMoney(Number(summary.overhead_allocated_cents||0)))}</div></div>
      <div class="admin-stat"><div class="admin-stat-label">Net after overhead</div><div class="admin-stat-value">${escapeHtml(centsToMoney(Number(summary.rough_net_after_overhead_cents||0)))}</div></div>
      <div class="admin-stat"><div class="admin-stat-label">Negative margins</div><div class="admin-stat-value">${escapeHtml(String(Number(costingSummary.negative_margin_count||0)))}</div></div>
      <div class="admin-stat"><div class="admin-stat-label">Missing cost links</div><div class="admin-stat-value">${escapeHtml(String(Number(costingSummary.missing_cost_link_count||0)))}</div></div>`;
  }

  function renderAccountingSummary(payload){
    const summary = payload?.summary || {};
    accountingStats.innerHTML = `
      <div class="mobile-summary-list">
        <div class="mobile-summary-list-item"><strong>${escapeHtml(String(Number(summary.open_records_count || 0)))}</strong><div class="small">Open or partially paid records</div></div>
        <div class="mobile-summary-list-item"><strong>${escapeHtml(centsToMoney(Number(summary.total_outstanding_cents || 0)))}</strong><div class="small">Outstanding amount still open</div></div>
        <div class="mobile-summary-list-item"><strong>${escapeHtml(centsToMoney(Number(summary.total_paid_cents || 0)))}</strong><div class="small">Paid amount recorded so far</div></div>
        <div class="mobile-summary-list-item"><strong>${escapeHtml(centsToMoney(Number(summary.total_tax_cents || 0)))}</strong><div class="small">Tax liability recorded</div></div>
      </div>`;
  }

  function renderDraftSummary(drafts){
    const rows=Array.isArray(drafts)?drafts:[];
    const latest=rows.slice(0,6);
    draftStats.innerHTML = rows.length ? `<div class="mobile-summary-list">${latest.map((row)=>{const issues=[]; if(!row.name) issues.push('name'); if(!row.product_category) issues.push('category'); if(Number(row.price_cents||0)<=0) issues.push('price'); if(Number(row.image_count||0)<=0) issues.push('photo'); return `<div class="mobile-summary-list-item"><strong>DD${String(row.product_number||'').padStart(4,'0')}</strong> <span>${escapeHtml(row.name || row.capture_reference || 'Unnamed draft')}</span><div class="small">${escapeHtml(row.updated_at || '—')} · ${issues.length ? `Needs ${issues.join(', ')}` : 'Basics present'}</div></div>`;}).join('')}</div><div class="small" style="margin-top:8px">${rows.length} draft products available from this screen.</div>` : '<div class="small">No draft products are waiting right now.</div>';
  }
  async function load(){
    setMessage('Loading phone dashboard snapshot...');
    try{
      const month = monthValue();
      const [reportRes, costRes, draftsRes, accountingRes] = await Promise.all([
        window.DDAuth.apiFetch(`/api/admin/accounting-profit-loss?month=${encodeURIComponent(month)}`),
        window.DDAuth.apiFetch(`/api/admin/accounting-item-costing?month=${encodeURIComponent(month)}`),
        window.DDAuth.apiFetch('/api/admin/mobile-product-drafts?status=draft&limit=12'),
        window.DDAuth.apiFetch('/api/admin/accounting-summary')
      ]);
      const report = await reportRes.json();
      const costing = await costRes.json();
      const drafts = await draftsRes.json();
      const accounting = await accountingRes.json();
      if(!reportRes.ok || !report?.ok) throw new Error(report?.error || 'Failed loading accounting snapshot.');
      if(!costRes.ok || !costing?.ok) throw new Error(costing?.error || 'Failed loading costing snapshot.');
      if(!draftsRes.ok || !drafts?.ok) throw new Error(drafts?.error || 'Failed loading draft products.');
      if(!accountingRes.ok || !accounting?.ok) throw new Error(accounting?.error || 'Failed loading accounting records.');
      renderMonthSummary(report, costing);
      renderDraftSummary(drafts.drafts || []);
      renderAccountingSummary(accounting);
      setMessage(`Loaded ${month} phone dashboard snapshot.`);
    }catch(error){
      setMessage(error.message || 'Failed loading phone dashboard snapshot.', true);
    }
  }
  monthInput.value = monthValue();
  refreshButton.addEventListener('click', load);
  monthInput.addEventListener('change', load);
  load();
});
