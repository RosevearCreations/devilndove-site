// Devil n Dove Release 448 — read-only Financials monthly performance bridge.
// Uses existing Accounting P&L and item-costing authorities. No ledger, D1, provider or inventory writes.
(function () {
  const reportMount = document.getElementById('adminAccountingReportMount');
  if (!reportMount || !window.DDAuth) return;

  const bridgeMount = document.createElement('div');
  bridgeMount.id = 'accountingPerformanceBridgeMount';
  bridgeMount.className = 'accounting-performance-bridge';
  bridgeMount.style.marginTop = '18px';
  reportMount.insertAdjacentElement('afterend', bridgeMount);

  let requestSequence = 0;
  let refreshTimer = null;

  function money(cents, currency = 'CAD') {
    const value = Number(cents || 0) / 100;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
    }[char]));
  }

  function monthValue() {
    return String(document.getElementById('accountingReportMonth')?.value || new Date().toISOString().slice(0, 7));
  }

  function currentCurrency(costing) {
    const sold = (Array.isArray(costing?.items) ? costing.items : [])
      .find((row) => Number(row?.sold_quantity_in_period || 0) > 0 && String(row?.currency || '').trim());
    return String(sold?.currency || 'CAD').trim().toUpperCase() || 'CAD';
  }

  function renderLoading() {
    bridgeMount.innerHTML = `
      <section class="card">
        <h2 style="margin-top:0"
          data-context-help="financial-performance-bridge"
          data-context-help-title="Monthly performance bridge"
          data-context-help-text="A read-only management view that combines recognized sales, recorded operating costs, estimated direct/resource COGS and monthly overhead. It is not a tax return, final net profit statement, or a second accounting ledger.">
          Monthly performance bridge
        </h2>
        <p class="small">Loading recognized revenue, estimated COGS and cost-coverage evidence…</p>
      </section>`;
    window.DDContextHelp?.refresh?.();
  }

  function readinessText(report, costing) {
    const issues = [];
    if (report?.schema_ready === false) {
      const missing = [...(report?.missing_tables || []), ...(report?.missing_columns || [])];
      issues.push(`P&L schema needs review${missing.length ? `: ${missing.join(', ')}` : ''}`);
    }
    if (costing?.schema_ready === false) {
      const missing = [...(costing?.missing_tables || []), ...(costing?.missing_columns || [])];
      issues.push(`Costing schema needs review${missing.length ? `: ${missing.join(', ')}` : ''}`);
    }
    return issues;
  }

  function soldCostCoverage(costing) {
    const items = Array.isArray(costing?.items) ? costing.items : [];
    const sold = items.filter((row) => Number(row?.sold_quantity_in_period || 0) > 0);
    const gaps = sold.filter((row) =>
      Number(row?.base_unit_cost_cents || 0) <= 0 ||
      Number(row?.missing_cost_links || 0) > 0
    );
    const missingLinks = sold.filter((row) => Number(row?.missing_cost_links || 0) > 0);
    const uncosted = sold.filter((row) => Number(row?.base_unit_cost_cents || 0) <= 0);
    return {
      soldCount: sold.length,
      completeCount: Math.max(0, sold.length - gaps.length),
      gapCount: gaps.length,
      missingLinkProductCount: missingLinks.length,
      uncostedProductCount: uncosted.length
    };
  }

  function resultTone(cents) {
    if (Number(cents || 0) > 0) return 'positive';
    if (Number(cents || 0) < 0) return 'negative';
    return 'neutral';
  }

  function line(label, cents, currency, kind = '') {
    return `<div class="accounting-performance-line ${kind}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(money(cents, currency))}</strong>
    </div>`;
  }

  function render(report, costing) {
    const summary = report?.summary || {};
    const costingSummary = costing?.summary || {};
    const currency = currentCurrency(costing);

    const recognizedRevenueCents = Math.round(Number(summary.recognized_amount || 0) * 100);
    const bookedRevenueCents = Math.round(Number(summary.booked_amount || 0) * 100);
    const operatingExpenseCents =
      Number(summary.operating_expense_cents || 0) +
      Number(summary.operating_expense_tax_cents || 0);
    const writeoffCents = Number(summary.writeoff_cents || 0);
    const baseCogsCents = Number(costingSummary.estimated_recognized_base_cogs_cents || 0);
    const overheadCents = Number(summary.overhead_allocated_cents || 0);
    const recognizedOverheadCogsCents = Number(costingSummary.estimated_recognized_overhead_cogs_cents || 0);
    const recognizedFullCogsCents = Number(costingSummary.estimated_recognized_full_cogs_cents || 0);

    // Deliberately subtract BASE COGS plus the full monthly overhead pool.
    // Do not subtract recognized full COGS here because full COGS already contains
    // recognized allocated overhead and would double-count overhead.
    const roughOperatingResultCents =
      recognizedRevenueCents -
      operatingExpenseCents -
      writeoffCents -
      baseCogsCents -
      overheadCents;

    const coverage = soldCostCoverage(costing);
    const readiness = readinessText(report, costing);
    const coverageTone = coverage.gapCount ? 'warning' : 'success';
    const resultClass = resultTone(roughOperatingResultCents);

    bridgeMount.innerHTML = `
      <section class="card">
        <div class="accounting-performance-head">
          <div>
            <h2 style="margin:0"
              data-context-help="financial-performance-bridge"
              data-context-help-title="Monthly performance bridge"
              data-context-help-text="A read-only management view that combines recognized sales, recorded operating costs, estimated direct/resource COGS and monthly overhead. It is not a tax return, final net profit statement, or a second accounting ledger.">
              Monthly performance bridge
            </h2>
            <p class="small" style="margin:8px 0 0">
              ${escapeHtml(report?.period || monthValue())} • read-only management view • existing Accounting authorities only
            </p>
          </div>
          <div class="accounting-performance-badge">No new ledger</div>
        </div>

        ${readiness.length ? `
          <div class="status-note warning accounting-performance-readiness">
            <strong>Schema readiness needs review.</strong>
            <div>${escapeHtml(readiness.join(' • '))}</div>
          </div>` : ''}

        <div class="accounting-performance-grid">
          <div class="accounting-performance-formula">
            <h3 data-context-help="rough-operating-result"
              data-context-help-title="Rough operating result"
              data-context-help-text="Recognized revenue minus recorded operating expenses and tax, write-offs, estimated base COGS for sold Products, and the full monthly allocated overhead pool. This is a management estimate, not final net income.">
              Rough operating result
            </h3>
            ${line('Recognized revenue', recognizedRevenueCents, currency, 'income')}
            ${line('Operating expenses + recorded tax', -operatingExpenseCents, currency)}
            ${line('Write-offs', -writeoffCents, currency)}
            ${line('Estimated base COGS', -baseCogsCents, currency)}
            ${line('Allocated monthly overhead', -overheadCents, currency)}
            <div class="accounting-performance-result ${resultClass}">
              <span>Rough result after base COGS &amp; overhead</span>
              <strong>${escapeHtml(money(roughOperatingResultCents, currency))}</strong>
            </div>
            <p class="small accounting-performance-caution">
              Not final net profit. Product cost gaps, tax treatment, refunds/fees, accruals, depreciation,
              financing, owner transactions, and other unrecorded obligations can change the final result.
            </p>
          </div>

          <div class="accounting-performance-evidence">
            <h3 data-context-help="cogs-overhead-bridge"
              data-context-help-title="COGS and overhead"
              data-context-help-text="Base COGS contains direct Product cost plus linked resource cost for sold units. The item-costing model can also attach part of monthly overhead to those units. Because the bridge subtracts the full monthly overhead pool separately, it must not subtract full COGS again.">
              COGS &amp; overhead evidence
            </h3>
            <dl class="accounting-performance-dl">
              <div><dt>Booked revenue</dt><dd>${escapeHtml(money(bookedRevenueCents, currency))}</dd></div>
              <div><dt>Estimated base COGS</dt><dd>${escapeHtml(money(baseCogsCents, currency))}</dd></div>
              <div><dt>Overhead attributed to sold units</dt><dd>${escapeHtml(money(recognizedOverheadCogsCents, currency))}</dd></div>
              <div><dt>Recognized full COGS view</dt><dd>${escapeHtml(money(recognizedFullCogsCents, currency))}</dd></div>
              <div><dt>Full monthly overhead pool</dt><dd>${escapeHtml(money(overheadCents, currency))}</dd></div>
            </dl>
            <p class="small">
              The full COGS figure is an attribution view that already includes overhead attached to sold units.
              It is shown for evidence only and is <strong>not subtracted again</strong> in the performance bridge.
            </p>
          </div>

          <div class="accounting-performance-quality">
            <h3>Sold-Product cost coverage</h3>
            <div class="status-note ${coverageTone}">
              <strong>${escapeHtml(String(coverage.completeCount))} of ${escapeHtml(String(coverage.soldCount))} sold Products have no current base-cost/link gap.</strong>
            </div>
            <div class="accounting-performance-quality-grid">
              <div><span>Sold Products</span><strong>${escapeHtml(String(coverage.soldCount))}</strong></div>
              <div><span>Needs costing review</span><strong>${escapeHtml(String(coverage.gapCount))}</strong></div>
              <div><span>Missing resource-cost links</span><strong>${escapeHtml(String(coverage.missingLinkProductCount))}</strong></div>
              <div><span>No base cost yet</span><strong>${escapeHtml(String(coverage.uncostedProductCount))}</strong></div>
            </div>
          </div>
        </div>
      </section>`;

    clarifyExistingLabels();
    window.DDContextHelp?.refresh?.();
  }

  function clarifyExistingLabels() {
    document.querySelectorAll('#accountingReportStats .admin-stat-label').forEach((label) => {
      const text = String(label.textContent || '').trim();
      if (text === 'Net after overhead') label.textContent = 'Before COGS · after overhead';
      if (text === 'Recognized full COGS') label.textContent = 'Recognized full COGS · includes overhead';
    });
  }

  async function loadPerformance() {
    const sequence = ++requestSequence;
    renderLoading();
    const month = monthValue();

    try {
      const [reportResponse, costingResponse] = await Promise.all([
        window.DDAuth.apiFetch(`/api/admin/accounting-profit-loss?month=${encodeURIComponent(month)}`),
        window.DDAuth.apiFetch(`/api/admin/accounting-item-costing?month=${encodeURIComponent(month)}`)
      ]);
      const report = await reportResponse.json().catch(() => null);
      const costing = await costingResponse.json().catch(() => null);
      if (sequence !== requestSequence) return;

      if (!reportResponse.ok || !report?.ok) {
        throw new Error(report?.error || 'Monthly P&L authority could not be read.');
      }
      if (!costingResponse.ok || !costing?.ok) {
        throw new Error(costing?.error || 'Monthly item-costing authority could not be read.');
      }
      render(report, costing);
    } catch (error) {
      if (sequence !== requestSequence) return;
      bridgeMount.innerHTML = `
        <section class="card">
          <h2 style="margin-top:0">Monthly performance bridge</h2>
          <div class="status-note error">${escapeHtml(error?.message || 'Financial performance could not be loaded.')}</div>
          <p class="small">The existing Accounting workspace remains available. No write was attempted by this read-only bridge.</p>
        </section>`;
    }
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(loadPerformance, 75);
  }

  const monthInput = document.getElementById('accountingReportMonth');
  const refreshButton = document.getElementById('refreshAccountingReportButton');
  monthInput?.addEventListener('change', scheduleRefresh);
  refreshButton?.addEventListener('click', scheduleRefresh);

  const stats = document.getElementById('accountingReportStats');
  if (stats) {
    new MutationObserver(clarifyExistingLabels).observe(stats, { childList: true, subtree: true });
  }

  loadPerformance();
})();
