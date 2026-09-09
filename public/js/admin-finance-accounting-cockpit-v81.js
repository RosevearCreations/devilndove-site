// Release 467 Build 81 — one-request, read-only Finance & Accounting Cockpit UI.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('financeOperationsMount');
  if (!mount || !window.DDAuth) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const money = (cents) => new Intl.NumberFormat('en-CA', { style:'currency', currency:'CAD' }).format(Number(cents || 0) / 100);
  const currentMonth = () => new Date().toISOString().slice(0, 7);
  let generation = 0;

  mount.innerHTML = `<section class="card accounting-ops finance-cockpit-v81" id="financial-operations" aria-labelledby="financeCockpitHeading">
    <div class="accounting-ops-head"><div><p class="eyebrow">Release 467 Build 81 • read-only monthly convergence</p>
      <h2 id="financeCockpitHeading">Finance &amp; Accounting Cockpit</h2>
      <p class="small">Follow the monthly chain from order and payment evidence through receivables, purchase commitments, reconciliation, expenses, costing, journals, close, and accountant export readiness.</p></div>
      <div class="accounting-ops-period"><label for="financeCockpitMonth">Review month</label><input id="financeCockpitMonth" type="month"><button class="btn" id="financeCockpitRefresh" type="button">Refresh</button></div>
    </div>
    <div class="finance-cockpit-boundary"><strong>Authority boundary:</strong> this view performs one authenticated GET and no financial action. Purchase orders are commitments, not booked Accounts Payable. Readiness never authorizes posting, payment, refund, purchasing, period close, or provider execution.</div>
    <div id="financeCockpitStatus" class="small" role="status" aria-live="polite" data-admin-workspace-status>Loading Finance authority…</div>
    <div class="accounting-ops-summary" id="financeCockpitSummary"></div>
    <div class="finance-cockpit-stages" id="financeCockpitStages"></div>
    <div class="finance-cockpit-actions"><a class="btn primary" href="/admin/accounting/">Open Accounting owner</a><a class="btn" href="/admin/month-end/">Open Month-End</a><a class="btn" href="/admin/order-finance-settlement-readiness/">Order settlement</a><a class="btn" href="/admin/inventory-finance-valuation-readiness/">Inventory valuation</a></div>
    <p class="small accounting-ops-authority">Stripe and PayPal acceptance remain <strong>HOLD_EXTERNAL</strong>. This cockpit reads no secret and calls no payment provider.</p>
  </section>`;

  const monthInput = mount.querySelector('#financeCockpitMonth');
  const status = mount.querySelector('#financeCockpitStatus');
  const summary = mount.querySelector('#financeCockpitSummary');
  const stages = mount.querySelector('#financeCockpitStages');
  monthInput.value = currentMonth();

  function metricValue(item) {
    const label = String(item?.label || '');
    return /cents/i.test(label) ? money(item?.value) : String(Number(item?.value || 0));
  }

  function render(data) {
    const s = data.summary || {};
    summary.innerHTML = [
      ['Stages', s.stage_count], ['Ready', s.ready_count], ['Review', s.review_count], ['Unavailable', s.unavailable_count], ['State', data.state],
    ].map(([label, value]) => `<div class="accounting-ops-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');

    stages.innerHTML = (Array.isArray(data.stages) ? data.stages : []).map((item, index) => `<article class="finance-cockpit-stage state-${esc(item.state)}">
      <div class="finance-cockpit-stage-number">${index + 1}</div><div class="finance-cockpit-stage-body"><div class="finance-cockpit-stage-title"><h3>${esc(item.label)}</h3><span class="finance-cockpit-state">${esc(item.state)}</span></div>
      <p>${esc(item.detail)}</p><div class="finance-cockpit-metrics">${(Array.isArray(item.metrics) ? item.metrics : []).map((metric) => `<span><small>${esc(metric.label)}</small><strong>${esc(metricValue(metric))}</strong></span>`).join('')}</div>
      <a class="btn" href="${esc(item.owner_url)}">${esc(item.owner_label)}</a></div></article>`).join('');

    const failures = Array.isArray(data.source_errors) ? data.source_errors.length : 0;
    status.textContent = `${data.period_month} cockpit: ${s.ready_count || 0} ready, ${s.review_count || 0} review, ${s.unavailable_count || 0} unavailable.${failures ? ` ${failures} source read failed safely.` : ''}`;
    status.dataset.state = failures ? 'warning' : ((s.review_count || 0) ? 'ready' : 'empty');
  }

  async function refresh() {
    const requestGeneration = ++generation;
    const period = monthInput.value || currentMonth();
    status.textContent = `Loading ${period} Finance & Accounting authority…`;
    status.dataset.state = 'loading';
    const response = await window.DDAuth.apiFetch(`/api/admin/finance-accounting-cockpit?period_month=${encodeURIComponent(period)}`, { cache:'no-store' });
    const data = await response.json().catch(() => null);
    if (requestGeneration !== generation) return;
    if (!response.ok || data?.ok !== true) throw new Error(data?.error || `Finance cockpit returned HTTP ${response.status}.`);
    render(data);
  }

  function fail(error) {
    status.textContent = error?.message || 'Finance & Accounting authority could not be loaded.';
    status.dataset.state = 'error';
    stages.innerHTML = '<div class="accounting-ops-empty"><strong>Readiness remains unverified.</strong><span>Use Refresh or open the Accounting owner workspace. No financial action was attempted.</span></div>';
  }

  mount.querySelector('#financeCockpitRefresh')?.addEventListener('click', () => refresh().catch(fail));
  monthInput.addEventListener('change', () => refresh().catch(fail));
  refresh().catch(fail);
});
