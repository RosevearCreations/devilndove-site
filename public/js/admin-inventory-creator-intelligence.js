(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const money = (cents, currency = 'CAD') => {
    const value = Number(cents || 0) / 100;
    try { return new Intl.NumberFormat('en-CA', {style:'currency', currency: currency || 'CAD'}).format(value); }
    catch { return `$${value.toFixed(2)}`; }
  };
  const esc = (value) => String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const apiFetch = async (url) => {
    if (window.DDAuth?.apiFetch) return window.DDAuth.apiFetch(url);
    return fetch(url, {credentials:'same-origin'});
  };

  let last = null;

  function option(value, label) {
    const el = document.createElement('option');
    el.value = String(value || '');
    el.textContent = label;
    return el;
  }

  function fillSelectors(data) {
    const product = $('b2ProductSelect');
    const creative = $('b2CreativeSelect');
    const currentProduct = product.value;
    const currentCreative = creative.value;
    product.innerHTML = '<option value="">Choose a Product</option>';
    creative.innerHTML = '<option value="">Choose a Creative Project</option>';

    (data?.selectors?.products || []).forEach((row) => {
      product.appendChild(option(row.product_id, `${row.name || 'Untitled'}${row.product_category ? ` — ${row.product_category}` : ''}`));
    });
    (data?.selectors?.creative_projects || []).forEach((row) => {
      creative.appendChild(option(row.creative_project_id, `${row.project_title || row.creative_project_key || 'Creative Project'}${row.product_id ? ` — Product #${row.product_id}` : ''}`));
    });

    if ([...product.options].some((o) => o.value === currentProduct)) product.value = currentProduct;
    if ([...creative.options].some((o) => o.value === currentCreative)) creative.value = currentCreative;
  }

  function renderNext(data) {
    const row = data?.next_safe_action;
    $('b2NextAction').innerHTML = row
      ? `<strong>${esc(row.title)}</strong><div style="margin-top:6px">${esc(row.explanation)}</div><div style="margin-top:6px"><span class="badge">Priority ${esc(row.priority)}</span> <span class="badge">Execution: none</span></div>`
      : 'No next-action signal available.';
  }

  function renderAvailability(data) {
    const p = data?.product_intelligence;
    if (!p) {
      $('b2Availability').textContent = 'Choose a Product.';
      $('b2Shortages').textContent = 'Choose a Product.';
      return;
    }
    const a = p.availability || {};
    $('b2Availability').innerHTML = `
      <strong>${esc(p.product?.name || 'Product')}</strong>
      <div style="margin-top:6px">State: <strong>${esc(a.state || 'unknown')}</strong></div>
      <div>Finished on hand: ${a.finished_units_on_hand == null ? 'not tracked' : esc(a.finished_units_on_hand)}</div>
      <div>Can make from current on-hand: ${a.can_make_units_from_current_on_hand == null ? 'not calculated' : esc(a.can_make_units_from_current_on_hand)}</div>
      <div>Scenario: ${esc(p.forecast?.scenario_units || 1)} unit(s)</div>
      <div>Estimated scenario material cost: ${money(p.forecast?.estimated_material_cost_cents || 0, p.product?.currency || 'CAD')}</div>
      <div>Hard blocked: <strong>${a.hard_blocked ? 'YES' : 'NO'}</strong></div>
    `;

    const shortages = p.shortages || [];
    if (!shortages.length) {
      $('b2Shortages').innerHTML = '<strong>No material shortage/reconciliation blocker was found for this scenario.</strong>';
      return;
    }
    $('b2Shortages').innerHTML = shortages.map((row) => `
      <div class="card" style="margin:8px 0">
        <strong>${esc(row.item_name)}</strong>
        <div>Need ${esc(row.forecast_stock_requirement)} ${esc(row.stock_unit_label)} for ${esc(row.forecast_units)} unit(s); on hand ${esc(row.on_hand_quantity)}.</div>
        <div>On-hand shortfall: ${esc(row.forecast_shortfall_on_hand)}; lot-covered shortfall: ${esc(row.forecast_shortfall_lot_covered)}.</div>
        <div>Lot policy: ${esc(row.lot_policy || 'none')} • reconciliation: ${esc(row.lot_reconcile_status || 'n/a')}</div>
        ${(row.blockers || []).length ? `<ul>${row.blockers.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      </div>
    `).join('');
  }

  function renderRelated(data) {
    const related = data?.related_product_intelligence?.related || [];
    if (!data?.product_intelligence) {
      $('b2Related').textContent = 'Choose a Product.';
      return;
    }
    if (!related.length) {
      $('b2Related').textContent = 'No explainable related-product match scored above zero.';
      return;
    }
    $('b2Related').innerHTML = `<div class="grid cols-3">${related.map((item) => `
      <div class="card">
        <strong>${esc(item.product?.name || 'Product')}</strong>
        <div class="small">Score ${esc(item.score)}</div>
        <ul class="small">${(item.reasons || []).map((reason) => `<li>${esc(reason)}</li>`).join('')}</ul>
        ${item.product?.slug ? `<a class="btn" href="/shop/product/?slug=${encodeURIComponent(item.product.slug)}">View Product</a>` : ''}
      </div>
    `).join('')}</div>`;
  }

  function renderGenealogy(data) {
    const g = data?.genealogy_exceptions || {};
    const exceptions = g.exceptions || [];
    const boundaries = g.historical_boundaries || [];
    let html = `<div><strong>${esc(g.counts?.total_exceptions || 0)}</strong> forward exception(s) • <strong>${esc(g.counts?.info_boundaries || 0)}</strong> historical boundary note(s)</div>`;
    if (exceptions.length) {
      html += `<div style="margin-top:10px">${exceptions.map((row) => `
        <div class="card" style="margin:8px 0">
          <strong>${esc(row.severity?.toUpperCase())}: ${esc(row.type)}</strong>
          <div>${esc(row.product_name || `Product #${row.product_id || ''}`)}</div>
          <div>${esc(row.explanation)}</div>
          <div><em>Next:</em> ${esc(row.next_action)}</div>
        </div>
      `).join('')}</div>`;
    } else {
      html += '<div style="margin-top:8px"><strong>No forward genealogy exception was found.</strong></div>';
    }
    if (boundaries.length) {
      html += `<details style="margin-top:10px"><summary>Pre-cutover boundaries (${boundaries.length})</summary>${boundaries.map((row) => `
        <div class="card" style="margin:8px 0">
          <strong>${esc(row.product_name || `Product #${row.product_id}`)}</strong>
          <div>${esc(row.explanation)}</div>
          <div>${esc(row.next_action)}</div>
        </div>
      `).join('')}</details>`;
    }
    $('b2Genealogy').innerHTML = html;
  }

  function renderCreative(data) {
    const c = data?.creative_readiness;
    if (!c) {
      $('b2CreativeScore').textContent = 'Choose a Creative Project.';
      $('b2CreativeDimensions').textContent = 'Choose a Creative Project.';
      return;
    }
    const r = c.readiness || {};
    $('b2CreativeScore').innerHTML = `
      <strong>${esc(c.creative_project?.project_title || 'Creative Project')}</strong>
      <div style="font-size:1.7rem;font-weight:800;margin-top:5px">${esc(r.score || 0)}/100</div>
      <div>Band: <strong>${esc(r.band || 'unknown')}</strong></div>
      <div>Approved evidence: ${esc(c.evidence?.approved_evidence_count || 0)}</div>
      <div>Approved deliverables: ${esc(c.content?.approved_deliverable_count || 0)}</div>
    `;
    const dimensions = r.dimensions || [];
    const blockers = r.blockers || [];
    $('b2CreativeDimensions').innerHTML = `
      <div class="grid cols-3">
        ${dimensions.map((d) => `<div class="card"><strong>${esc(d.label)}</strong><div style="font-size:1.3rem">${esc(d.score)}/${esc(d.max_score)}</div></div>`).join('')}
      </div>
      <div style="margin-top:10px"><strong>Blockers</strong>${blockers.length ? `<ul>${blockers.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '<div>None reported by this read-only score.</div>'}</div>
    `;
  }

  async function load({preserveSelectors = true} = {}) {
    const productId = Number($('b2ProductSelect').value || 0);
    const creativeProjectId = Number($('b2CreativeSelect').value || 0);
    const forecastUnits = Math.max(1, Math.min(100, Number($('b2ForecastUnits').value || 1)));
    $('b2Status').textContent = 'Loading read-only intelligence…';
    const params = new URLSearchParams();
    if (productId) params.set('product_id', String(productId));
    if (creativeProjectId) params.set('creative_project_id', String(creativeProjectId));
    params.set('forecast_units', String(forecastUnits));
    params.set('related_limit', '9');
    params.set('exception_limit', '80');

    try {
      const response = await apiFetch(`/api/admin/inventory-creator-intelligence?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Request failed (${response.status})`);
      last = data;
      if (preserveSelectors) fillSelectors(data);
      renderNext(data);
      renderAvailability(data);
      renderRelated(data);
      renderGenealogy(data);
      renderCreative(data);
      $('b2Status').textContent = `Release ${data.release} Build ${data.build} • read-only • no stock/provider execution`;
    } catch (error) {
      $('b2Status').textContent = error?.message || 'Intelligence could not load.';
    }
  }

  $('b2RefreshButton')?.addEventListener('click', () => load());
  $('b2ProductSelect')?.addEventListener('change', () => load({preserveSelectors:false}));
  $('b2CreativeSelect')?.addEventListener('change', () => load({preserveSelectors:false}));
  $('b2ForecastUnits')?.addEventListener('change', () => load({preserveSelectors:false}));

  load();
})();
