// Devil n Dove Build 440 — Finished Production Reversal workspace.
// Event-driven Admin enhancement for the existing Product Tools & Supplies / production area.
// No polling, no provider calls, no schema work. All mutation authority remains server-side.

(() => {
  const API = '/api/admin/product-production-reversal';
  const state = {
    productId: 0,
    history: [],
    selectedRunId: 0,
    preview: null,
    busy: false,
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }
  function number(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function positiveId(value) {
    const n = Number(value || 0);
    return Number.isInteger(n) && n > 0 ? n : 0;
  }
  function currentProductId() {
    return positiveId(document.getElementById('productResourcesProduct')?.value);
  }
  function reasonValue() {
    return String(document.getElementById('productProductionReversalReason')?.value || '').trim();
  }
  function message(text, isError = false) {
    const el = document.getElementById('productProductionReversalMessage');
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
    el.classList.toggle('is-error', Boolean(text && isError));
    el.classList.toggle('is-success', Boolean(text && !isError));
  }

  function ensureStyle() {
    if (document.getElementById('productProductionReversalStyle')) return;
    const style = document.createElement('style');
    style.id = 'productProductionReversalStyle';
    style.textContent = `
      .product-production-reversal{margin-top:16px;padding-top:16px;border-top:1px solid var(--border,#444)}
      .product-production-reversal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
      .product-production-reversal-controls{display:grid;grid-template-columns:minmax(240px,1fr) minmax(260px,1.5fr) auto auto;gap:10px;align-items:end;margin-top:12px}
      .product-production-reversal-preview{margin-top:12px;padding:12px;border:1px solid var(--border,#444);border-radius:12px;background:rgba(255,255,255,.025)}
      .product-production-reversal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;margin-top:10px}
      .product-production-reversal-grid>div{padding:9px;border:1px solid var(--border,#444);border-radius:10px}
      .product-production-reversal-grid strong,.product-production-reversal-grid span{display:block}
      .product-production-reversal-blockers{margin:10px 0 0;padding-left:20px}
      .product-production-reversal-status{display:inline-flex;padding:3px 8px;border-radius:999px;border:1px solid var(--border,#444);font-size:.82rem}
      @media(max-width:800px){.product-production-reversal-controls{grid-template-columns:1fr}.product-production-reversal-controls .btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function mount() {
    if (document.getElementById('productProductionReversalWorkspace')) return true;
    const release = document.querySelector('.product-production-release');
    if (!release) return false;
    ensureStyle();
    const section = document.createElement('section');
    section.id = 'productProductionReversalWorkspace';
    section.className = 'product-production-reversal';
    section.setAttribute('aria-labelledby', 'productProductionReversalHeading');
    section.innerHTML = `
      <div class="product-production-reversal-head">
        <div>
          <h4 id="productProductionReversalHeading" style="margin:0">Finished Production Reversal</h4>
          <p class="small" style="margin:4px 0 0">Reverse an incorrectly posted finished-production run without deleting its history. The original run and material snapshot remain intact; recorded consumable stock is compensated and the finished Product quantity is reduced.</p>
        </div>
        <span class="product-production-reversal-status">Build 440 · audited reversal</span>
      </div>
      <div class="product-production-reversal-controls">
        <label class="small">Posted production run
          <select class="input" id="productProductionReversalRun"><option value="">Choose a Product first</option></select>
        </label>
        <label class="small">Reversal reason
          <input class="input" id="productProductionReversalReason" maxlength="500" placeholder="Required — explain why this posted run must be reversed"/>
        </label>
        <button class="btn" type="button" id="productProductionReversalReview">Review reversal</button>
        <button class="btn primary" type="button" id="productProductionReversalPost" disabled>Reverse posted run</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn secondary" type="button" id="productProductionReversalRefresh">Refresh production history</button>
      </div>
      <div id="productProductionReversalMessage" class="small" hidden style="margin-top:8px"></div>
      <div id="productProductionReversalPreview" class="product-production-reversal-preview small">Choose a Product, then review one posted run. No stock changes are made by Review.</div>
    `;
    release.insertAdjacentElement('afterend', section);

    section.querySelector('#productProductionReversalRun')?.addEventListener('change', (event) => {
      state.selectedRunId = positiveId(event.target.value);
      state.preview = null;
      renderPreview();
    });
    section.querySelector('#productProductionReversalReason')?.addEventListener('input', updateReverseButton);
    section.querySelector('#productProductionReversalReview')?.addEventListener('click', reviewSelectedRun);
    section.querySelector('#productProductionReversalPost')?.addEventListener('click', reverseSelectedRun);
    section.querySelector('#productProductionReversalRefresh')?.addEventListener('click', () => loadHistory({ announce: true }));

    state.productId = currentProductId();
    if (state.productId) loadHistory();
    else renderHistory();
    return true;
  }

  function renderHistory() {
    const select = document.getElementById('productProductionReversalRun');
    if (!select) return;
    if (!state.productId) {
      select.innerHTML = '<option value="">Choose a Product first</option>';
      state.selectedRunId = 0;
      return;
    }
    if (!state.history.length) {
      select.innerHTML = '<option value="">No production runs found for this Product</option>';
      state.selectedRunId = 0;
      return;
    }
    const posted = state.history.filter((row) => String(row.run_status || '').toLowerCase() === 'posted');
    const reversed = state.history.filter((row) => String(row.run_status || '').toLowerCase() === 'reversed');
    if (!posted.length) {
      select.innerHTML = '<option value="">No posted production runs are available to reverse</option>' +
        reversed.slice(0, 10).map((row) => `<option value="" disabled>Reversed #${positiveId(row.product_production_run_id)} · ${esc(row.output_quantity)} unit(s) · ${esc(row.reversed_at || row.posted_at || '')}</option>`).join('');
      state.selectedRunId = 0;
      return;
    }
    if (!posted.some((row) => positiveId(row.product_production_run_id) === state.selectedRunId)) {
      state.selectedRunId = positiveId(posted[0].product_production_run_id);
    }
    select.innerHTML = posted.map((row) => {
      const id = positiveId(row.product_production_run_id);
      return `<option value="${id}" ${id === state.selectedRunId ? 'selected' : ''}>Run #${id} · ${esc(row.output_quantity)} unit(s) · ${esc(row.posted_at || '')}</option>`;
    }).join('') + (reversed.length ? `<optgroup label="Already reversed">${reversed.slice(0, 10).map((row) => `<option value="" disabled>Run #${positiveId(row.product_production_run_id)} · ${esc(row.output_quantity)} unit(s) · ${esc(row.reversed_at || '')}</option>`).join('')}</optgroup>` : '');
  }

  function updateReverseButton() {
    const button = document.getElementById('productProductionReversalPost');
    if (!button) return;
    button.disabled = state.busy || !Number(state.preview?.eligible) || reasonValue().length < 8;
  }

  function renderPreview() {
    const el = document.getElementById('productProductionReversalPreview');
    if (!el) return;
    const preview = state.preview;
    if (!state.productId) {
      el.innerHTML = 'Choose a Product first.';
      updateReverseButton();
      return;
    }
    if (!state.selectedRunId) {
      el.innerHTML = 'No posted production run is currently selected.';
      updateReverseButton();
      return;
    }
    if (!preview) {
      el.innerHTML = 'Click <strong>Review reversal</strong>. Review is read-only and does not change Product or Inventory quantities.';
      updateReverseButton();
      return;
    }

    const blockers = Array.isArray(preview.blockers) ? preview.blockers : [];
    const plan = Array.isArray(preview.return_plan) ? preview.return_plan : [];
    const run = preview.run || {};
    el.innerHTML = `
      <div class="product-production-summary ${blockers.length ? 'is-blocked' : 'is-ready'}">
        <strong>${blockers.length ? 'Reversal blocked' : 'Reversal ready for explicit approval'}</strong>
        <span>Run #${positiveId(run.product_production_run_id)} · ${esc(preview.output_quantity)} finished unit(s)</span>
      </div>
      <div class="product-production-reversal-grid">
        <div><strong>Finished Product stock</strong><span>${esc(preview.product_inventory_before)} → ${esc(preview.product_inventory_after)} unit(s)</span></div>
        <div><strong>Raw Inventory compensation</strong><span>${plan.length} inventory item(s) from the immutable run snapshot</span></div>
        <div><strong>Run history</strong><span>The run is retained and marked reversed; it is never deleted.</span></div>
      </div>
      ${blockers.length ? `<ul class="product-production-reversal-blockers">${blockers.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
      ${plan.length ? `<div class="product-production-reversal-grid">${plan.map((item) => `<div><strong>${esc(item.item_name || `Inventory #${item.site_item_inventory_id}`)}</strong><span>Return ${esc(item.return_stock_quantity)} ${esc(item.stock_unit_label || 'unit')} · on hand ${esc(item.previous_on_hand_quantity)} → ${esc(item.new_on_hand_quantity)}${Number(item.inventory_is_active) === 1 ? '' : ' · item currently inactive'}</span></div>`).join('')}</div>` : ''}
      <p class="small" style="margin-bottom:0"><strong>Downstream guard:</strong> ${esc(preview.downstream_guard?.explanation || 'Reversal requires the posted finished quantity to remain on hand.')}</p>
    `;
    updateReverseButton();
  }

  async function loadHistory({ announce = false } = {}) {
    const productId = currentProductId();
    state.productId = productId;
    state.preview = null;
    if (!productId) {
      state.history = [];
      state.selectedRunId = 0;
      renderHistory();
      renderPreview();
      return;
    }
    try {
      if (announce) message('Refreshing production history…');
      const response = await window.DDAuth.apiFetch(`${API}?product_id=${encodeURIComponent(productId)}`, { cache: 'no-store' });
      const data = await window.DDAuth.readApiJson(response, { fallbackMessage: 'Production reversal history could not be loaded.' });
      state.history = Array.isArray(data.history) ? data.history : [];
      renderHistory();
      renderPreview();
      if (announce) message('Production history refreshed.');
    } catch (error) {
      state.history = [];
      state.selectedRunId = 0;
      renderHistory();
      renderPreview();
      message(error.message || 'Production reversal history could not be loaded.', true);
    }
  }

  async function reviewSelectedRun() {
    if (!state.selectedRunId || state.busy) return;
    state.busy = true;
    updateReverseButton();
    try {
      message('Reviewing immutable production snapshot and current stock…');
      const response = await window.DDAuth.apiFetch(`${API}?product_production_run_id=${encodeURIComponent(state.selectedRunId)}`, { cache: 'no-store' });
      const data = await window.DDAuth.readApiJson(response, { fallbackMessage: 'Production reversal preview could not be loaded.' });
      state.preview = data.preview || null;
      renderPreview();
      message(state.preview?.eligible ? 'Reversal preview is ready. Enter a reason and review the compensation plan before reversing.' : 'This run is not eligible for reversal. No stock was changed.', !state.preview?.eligible);
    } catch (error) {
      state.preview = null;
      renderPreview();
      message(error.message || 'Production reversal preview failed.', true);
    } finally {
      state.busy = false;
      updateReverseButton();
    }
  }

  async function reverseSelectedRun() {
    if (!state.selectedRunId || !state.preview?.eligible || state.busy) return;
    const reason = reasonValue();
    if (reason.length < 8) return message('Provide a clear reversal reason of at least 8 characters.', true);
    const output = Math.max(0, number(state.preview.output_quantity, 0));
    const rawItems = Array.isArray(state.preview.return_plan) ? state.preview.return_plan.length : 0;
    if (!window.confirm(`Reverse production run #${state.selectedRunId}?\n\nThis will remove ${output} finished unit(s) from Product stock, return the immutable snapshot quantities to ${rawItems} raw Inventory item(s), retain the original run, and record your reason. This action cannot be reversed a second time.`)) return;

    state.busy = true;
    updateReverseButton();
    try {
      message('Posting audited production reversal…');
      const response = await window.DDAuth.apiFetch(API, {
        method: 'POST',
        body: JSON.stringify({
          product_production_run_id: state.selectedRunId,
          reason,
        }),
      });
      const data = await window.DDAuth.readApiJson(response, { fallbackMessage: 'Finished-production reversal failed safely.' });
      message(data.message || 'Production run reversed.');
      document.dispatchEvent(new CustomEvent('dd:product-production-reversed', {
        detail: {
          product_id: state.productId,
          product_production_run_id: state.selectedRunId,
          run: data.run || null,
        },
      }));
      const reasonInput = document.getElementById('productProductionReversalReason');
      if (reasonInput) reasonInput.value = '';
      await loadHistory();
      document.getElementById('productProductionPreviewButton')?.click();
    } catch (error) {
      message(error.message || 'Finished-production reversal failed safely. Refresh the history before trying again.', true);
      await loadHistory();
    } finally {
      state.busy = false;
      updateReverseButton();
    }
  }

  document.addEventListener('change', (event) => {
    if (event.target?.id !== 'productResourcesProduct') return;
    state.selectedRunId = 0;
    loadHistory();
  });

  if (!mount()) {
    const observer = new MutationObserver(() => {
      if (mount()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
