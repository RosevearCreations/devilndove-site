(() => {
  const mount = document.getElementById('orderFinanceSettlementMount');
  if (!mount) return;
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (cents, currency='CAD') => {
    const n = Number(cents || 0) / 100;
    try { return n.toLocaleString('en-CA',{style:'currency',currency:currency || 'CAD'}); } catch { return `${n.toFixed(2)} ${currency || 'CAD'}`; }
  };
  const label = (s) => String(s || 'unknown').replaceAll('_',' ');
  const card = (row) => `
    <article class="ofs-card card">
      <div class="ofs-card-head">
        <div><p class="small">${esc(row.order_number || `Order ${row.order_id}`)}</p><h2>${esc(label(row.settlement_state))}</h2></div>
        <strong class="ofs-badge">${row.settlement_supported ? 'Supported' : 'Review'}</strong>
      </div>
      <p>${esc(row.detail)}</p>
      <div class="ofs-grid">
        <div><span>Order total</span><strong>${esc(money(row.total_cents,row.currency))}</strong></div>
        <div><span>Effective paid</span><strong>${esc(money(row.effective_paid_cents,row.currency))}</strong></div>
        <div><span>Expected outstanding</span><strong>${esc(money(row.expected_outstanding_cents,row.currency))}</strong></div>
        <div><span>Accounting total</span><strong>${row.accounting_total_cents == null ? '—' : esc(money(row.accounting_total_cents,row.accounting_currency))}</strong></div>
        <div><span>Accounting paid</span><strong>${row.accounting_paid_cents == null ? '—' : esc(money(row.accounting_paid_cents,row.accounting_currency))}</strong></div>
        <div><span>Accounting outstanding</span><strong>${row.accounting_outstanding_cents == null ? '—' : esc(money(row.accounting_outstanding_cents,row.accounting_currency))}</strong></div>
      </div>
      <div class="ofs-links"><a class="btn" href="${esc(row.owner_urls?.order || '/admin/orders/')}">Order owner</a><a class="btn secondary" href="${esc(row.owner_urls?.accounting || '/admin/accounting/')}">Accounting owner</a></div>
    </article>`;
  async function load() {
    mount.innerHTML = '<div class="card">Loading settlement readiness…</div>';
    try {
      const res = await fetch('/api/admin/order-finance-settlement-readiness', { credentials:'same-origin' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const s = data.summary || {};
      mount.innerHTML = `
        <section class="ofs-summary">
          <div class="card"><span>Orders reviewed</span><strong>${Number(s.orders_reviewed || 0)}</strong></div>
          <div class="card"><span>Supported</span><strong>${Number(s.settlement_supported || 0)}</strong></div>
          <div class="card"><span>Missing accounting</span><strong>${Number(s.accounting_record_missing || 0)}</strong></div>
          <div class="card"><span>Refund review</span><strong>${Number(s.refund_review || 0)}</strong></div>
          <div class="card"><span>Other mismatches</span><strong>${Number(s.currency_mismatch || 0)+Number(s.order_total_mismatch || 0)+Number(s.paid_amount_mismatch || 0)+Number(s.outstanding_amount_mismatch || 0)+Number(s.payment_status_mismatch || 0)}</strong></div>
        </section>
        <p class="small">Read-only; no payment/refund execution, accounting posting, order change, inventory change, or provider action occurred.</p>
        <section class="ofs-list">${(data.rows || []).map(card).join('') || '<div class="card">No orders require settlement comparison.</div>'}</section>`;
    } catch (error) {
      mount.innerHTML = `<div class="card"><strong>Settlement readiness unavailable.</strong><p>${esc(error.message || error)}</p></div>`;
    }
  }
  load();
})();
