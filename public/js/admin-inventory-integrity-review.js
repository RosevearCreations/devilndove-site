// Devil n Dove Build 440 — Inventory physical-count and usage-setup review workspace.
// User-triggered only. No polling, providers, R2, or request-time schema work.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('inventoryIntegrityReviewMount');
  if (!mount) return;

  const state = {
    queue: 'all',
    q: '',
    offset: 0,
    nextOffset: null,
    items: [],
    summary: {},
    loading: false,
  };
  let startRequested = false;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const fmt = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });

  function setMessage(message = '', error = false) {
    const el = document.getElementById('inventoryIntegrityMessage');
    if (!el) return;
    el.textContent = message;
    el.hidden = !message;
    el.classList.toggle('is-error', Boolean(message && error));
    el.classList.toggle('is-success', Boolean(message && !error));
  }

  async function read(response, fallbackMessage) {
    if (window.DDAuth?.readApiJson) return window.DDAuth.readApiJson(response, { fallbackMessage });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallbackMessage);
    return data;
  }

  function countLabel(item) {
    if (item.count_status === 'never_counted') return 'Never physically counted';
    if (item.count_status === 'stale_count') return `Count stale · ${esc(item.last_counted_at || '')}`;
    return `Count current · ${esc(item.last_counted_at || '')}`;
  }

  function usageCard(item) {
    if (!Number(item.usage_setup_required || 0)) return '';
    const id = Number(item.site_item_inventory_id || 0);
    return `
      <details class="inventory-integrity-subpanel" open>
        <summary><strong>Usage Setup Required</strong> · review how one stock unit converts to actual usage</summary>
        <div class="inventory-integrity-form grid cols-3">
          <label class="small">Tracking mode
            <select class="input" data-usage-mode="${id}">
              ${['exact','estimated','log_only','reusable'].map((mode) => `<option value="${mode}" ${mode === item.usage_tracking_mode ? 'selected' : ''}>${mode.replace('_',' ')}</option>`).join('')}
            </select>
          </label>
          <label class="small">Stock unit
            <input class="input" data-stock-unit="${id}" value="${esc(item.stock_unit_label || 'unit')}" />
          </label>
          <label class="small">Usage unit
            <input class="input" data-usage-unit="${id}" value="${esc(item.usage_unit_label || 'unit')}" />
          </label>
          <label class="small">Usage units per stock unit
            <input class="input" type="number" min="0.000001" step="0.001" data-usage-per-stock="${id}" value="${esc(item.usage_units_per_stock_unit || 1)}" />
          </label>
          <label class="small">Minimum usage increment
            <input class="input" type="number" min="0.0001" step="0.0001" data-min-usage="${id}" value="${esc(item.minimum_usage_increment || 0.001)}" />
          </label>
          <label class="small">Review note
            <input class="input" data-usage-note="${id}" placeholder="e.g. 1 jar = 500 grams; weighed on bench scale" />
          </label>
        </div>
        <p class="small">If <strong>log only</strong> is intentional, keep it and add a clear review note. That removes this item from the setup-required queue without pretending the quantity is measurable.</p>
        <button class="btn" type="button" data-save-usage="${id}">Save reviewed usage setup</button>
      </details>`;
  }

  function countCard(item) {
    const id = Number(item.site_item_inventory_id || 0);
    return `
      <div class="inventory-integrity-subpanel">
        <div class="inventory-integrity-row-head">
          <div><strong>Physical count</strong><div class="small">${countLabel(item)}</div></div>
          <div class="small">Recorded: <strong>${esc(fmt(item.on_hand_quantity))} ${esc(item.stock_unit_label || 'unit')}</strong> · Reserved: ${esc(fmt(item.reserved_quantity))}</div>
        </div>
        <div class="inventory-integrity-count-controls">
          <label class="small">Counted on hand
            <input class="input" type="number" min="0" step="0.001" data-count-qty="${id}" value="${esc(item.on_hand_quantity)}" />
          </label>
          <label class="small">Count note / reason
            <input class="input" data-count-reason="${id}" placeholder="Shelf count, bin count, recount after production…" />
          </label>
          <button class="btn" type="button" data-save-count="${id}">Save physical count</button>
        </div>
      </div>`;
  }

  function renderItems() {
    const list = document.getElementById('inventoryIntegrityList');
    if (!list) return;
    if (!state.items.length) {
      list.innerHTML = '<div class="small">No Inventory items match this attention queue.</div>';
      return;
    }
    list.innerHTML = state.items.map((item) => `
      <article class="inventory-integrity-item" data-integrity-item="${Number(item.site_item_inventory_id || 0)}">
        <div class="inventory-integrity-item-head">
          ${item.image_url ? `<img src="${esc(item.image_url)}" alt="" loading="lazy" />` : '<div class="inventory-integrity-placeholder">INV</div>'}
          <div>
            <div class="inventory-integrity-badges">
              <span>${esc(String(item.source_type || '').toUpperCase())}</span>
              ${Number(item.physical_count_due || 0) ? '<span>COUNT DUE</span>' : ''}
              ${Number(item.usage_setup_required || 0) ? '<span>USAGE SETUP</span>' : ''}
            </div>
            <h4>${esc(item.item_name || item.external_key || `Inventory #${item.site_item_inventory_id}`)}</h4>
            <div class="small">#${Number(item.site_item_inventory_id || 0)} · ${esc(item.category || 'uncategorized')} · ${esc(item.external_key || '')}</div>
          </div>
        </div>
        ${countCard(item)}
        ${usageCard(item)}
      </article>
    `).join('');
  }

  function renderSummary() {
    const s = state.summary || {};
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = String(Number(value || 0)); };
    set('inventoryIntegrityActive', s.active_items);
    set('inventoryIntegrityCountDue', s.count_due);
    set('inventoryIntegrityNeverCounted', s.never_counted);
    set('inventoryIntegrityStaleCount', s.stale_count);
    set('inventoryIntegrityUsageRequired', s.usage_setup_required);
    const next = document.getElementById('inventoryIntegrityNext');
    const previous = document.getElementById('inventoryIntegrityPrevious');
    if (next) next.disabled = state.nextOffset == null;
    if (previous) previous.disabled = state.offset <= 0;
  }

  function render() {
    mount.innerHTML = `
      <section class="card inventory-integrity-review" aria-labelledby="inventoryIntegrityHeading">
        <div class="section-heading-row">
          <div>
            <p class="inventory-operations-eyebrow">Build 440 · Inventory truth &amp; usage</p>
            <h3 id="inventoryIntegrityHeading">Physical Count &amp; Usage Setup Review</h3>
            <p class="small">Use a physical count to make on-hand stock truthful. Legacy supplies that remain in the safe <code>log_only</code> default stay in Usage Setup Required until their real stock-to-usage conversion is reviewed.</p>
          </div>
        </div>
        <div class="grid cols-5 inventory-integrity-summary">
          <div class="card"><span class="small">Active items</span><strong id="inventoryIntegrityActive">—</strong></div>
          <div class="card"><span class="small">Count due</span><strong id="inventoryIntegrityCountDue">—</strong></div>
          <div class="card"><span class="small">Never counted</span><strong id="inventoryIntegrityNeverCounted">—</strong></div>
          <div class="card"><span class="small">Count stale 90+ days</span><strong id="inventoryIntegrityStaleCount">—</strong></div>
          <div class="card"><span class="small">Usage setup required</span><strong id="inventoryIntegrityUsageRequired">—</strong></div>
        </div>
        <div class="inventory-integrity-controls">
          <label class="small">Queue
            <select class="input" id="inventoryIntegrityQueue">
              <option value="all">All attention</option>
              <option value="count_due">Physical count due</option>
              <option value="usage_setup">Usage setup required</option>
            </select>
          </label>
          <label class="small">Search
            <input class="input" id="inventoryIntegritySearch" type="search" placeholder="name, key, category" />
          </label>
          <button class="btn" type="button" id="inventoryIntegrityRefresh">Refresh queue</button>
        </div>
        <div id="inventoryIntegrityMessage" class="small" hidden aria-live="polite"></div>
        <div id="inventoryIntegrityList" class="inventory-integrity-list"><div class="small">Load the review queue to begin.</div></div>
        <div class="inventory-integrity-pager">
          <button class="btn secondary" type="button" id="inventoryIntegrityPrevious" disabled>Previous</button>
          <button class="btn secondary" type="button" id="inventoryIntegrityNext" disabled>Next</button>
        </div>
      </section>`;

    document.getElementById('inventoryIntegrityQueue')?.addEventListener('change', (event) => {
      state.queue = String(event.target.value || 'all');
      state.offset = 0;
      load();
    });
    document.getElementById('inventoryIntegrityRefresh')?.addEventListener('click', () => {
      state.q = String(document.getElementById('inventoryIntegritySearch')?.value || '').trim();
      state.offset = 0;
      load();
    });
    document.getElementById('inventoryIntegritySearch')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      state.q = String(event.currentTarget.value || '').trim();
      state.offset = 0;
      load();
    });
    document.getElementById('inventoryIntegrityPrevious')?.addEventListener('click', () => {
      state.offset = Math.max(0, state.offset - 40);
      load();
    });
    document.getElementById('inventoryIntegrityNext')?.addEventListener('click', () => {
      if (state.nextOffset == null) return;
      state.offset = Number(state.nextOffset || 0);
      load();
    });
    mount.addEventListener('click', onAction);
  }

  async function load() {
    if (state.loading || !window.DDAuth?.isLoggedIn()) return;
    state.loading = true;
    setMessage('Loading Inventory attention queue…');
    try {
      const url = `/api/admin/inventory-integrity-review?queue=${encodeURIComponent(state.queue)}&q=${encodeURIComponent(state.q)}&offset=${encodeURIComponent(state.offset)}&limit=40`;
      const response = await window.DDAuth.apiFetch(url, { cache: 'no-store' });
      const data = await read(response, 'Inventory integrity review could not be loaded.');
      state.items = Array.isArray(data.items) ? data.items : [];
      state.summary = data.summary || {};
      state.nextOffset = data.next_offset == null ? null : Number(data.next_offset);
      renderSummary();
      renderItems();
      setMessage(`${state.items.length} attention item(s) loaded.`);
    } catch (error) {
      state.items = [];
      renderItems();
      setMessage(error.message || 'Inventory integrity review failed.', true);
    } finally {
      state.loading = false;
    }
  }

  async function post(payload, fallbackMessage) {
    const response = await window.DDAuth.apiFetch('/api/admin/inventory-integrity-review', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return read(response, fallbackMessage);
  }

  async function saveCount(id, button) {
    const qty = Number(mount.querySelector(`[data-count-qty="${id}"]`)?.value);
    const reason = String(mount.querySelector(`[data-count-reason="${id}"]`)?.value || '').trim();
    const item = state.items.find((row) => Number(row.site_item_inventory_id) === id);
    if (!Number.isFinite(qty) || qty < 0) return setMessage('Count must be zero or greater.', true);
    if (reason.length < 6) return setMessage('Add a short count note/reason of at least 6 characters.', true);
    const delta = qty - Number(item?.on_hand_quantity || 0);
    if (Math.abs(delta) > 1e-9 && !window.confirm(`Save physical count ${fmt(qty)} ${item?.stock_unit_label || 'unit'}?\n\nRecorded on hand: ${fmt(item?.on_hand_quantity)}\nCorrection: ${delta > 0 ? '+' : ''}${fmt(delta)}`)) return;
    const old = button.textContent;
    button.disabled = true; button.textContent = 'Saving count…';
    try {
      const data = await post({ action: 'physical_count', site_item_inventory_id: id, counted_quantity: qty, reason }, 'Physical count could not be saved.');
      setMessage(data.shortage_against_reservations ? `${data.message} Warning: reserved quantity is now greater than physical stock.` : data.message, Boolean(data.shortage_against_reservations));
      await load();
    } catch (error) {
      setMessage(error.message || 'Physical count failed safely.', true);
    } finally {
      if (button.isConnected) { button.disabled = false; button.textContent = old; }
    }
  }

  async function saveUsage(id, button) {
    const trackingMode = String(mount.querySelector(`[data-usage-mode="${id}"]`)?.value || 'exact');
    const stockUnit = String(mount.querySelector(`[data-stock-unit="${id}"]`)?.value || 'unit').trim();
    const usageUnit = String(mount.querySelector(`[data-usage-unit="${id}"]`)?.value || 'unit').trim();
    const perStock = Number(mount.querySelector(`[data-usage-per-stock="${id}"]`)?.value);
    const minimum = Number(mount.querySelector(`[data-min-usage="${id}"]`)?.value);
    const reviewNote = String(mount.querySelector(`[data-usage-note="${id}"]`)?.value || '').trim();
    if (!Number.isFinite(perStock) || perStock <= 0 || !Number.isFinite(minimum) || minimum <= 0) return setMessage('Usage conversion and minimum increment must be greater than zero.', true);
    if (trackingMode === 'log_only' && reviewNote.length < 8) return setMessage('Intentional log-only usage needs a clear review note of at least 8 characters.', true);
    const old = button.textContent;
    button.disabled = true; button.textContent = 'Saving setup…';
    try {
      const data = await post({
        action: 'save_usage_setup',
        site_item_inventory_id: id,
        usage_tracking_mode: trackingMode,
        stock_unit_label: stockUnit,
        usage_unit_label: usageUnit,
        usage_units_per_stock_unit: perStock,
        minimum_usage_increment: minimum,
        review_note: reviewNote,
      }, 'Usage setup could not be saved.');
      setMessage(data.message || 'Usage setup reviewed and saved.');
      await load();
    } catch (error) {
      setMessage(error.message || 'Usage setup failed safely.', true);
    } finally {
      if (button.isConnected) { button.disabled = false; button.textContent = old; }
    }
  }

  function onAction(event) {
    const count = event.target.closest('[data-save-count]');
    if (count) {
      const id = Number(count.getAttribute('data-save-count') || 0);
      if (id) saveCount(id, count);
      return;
    }
    const usage = event.target.closest('[data-save-usage]');
    if (usage) {
      const id = Number(usage.getAttribute('data-save-usage') || 0);
      if (id) saveUsage(id, usage);
    }
  }

  function start() {
    if (startRequested) return;
    startRequested = true;
    load();
  }

  render();
  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) start(); }, { once: true });
  if (window.DDAuth?.isLoggedIn()) start();
});
