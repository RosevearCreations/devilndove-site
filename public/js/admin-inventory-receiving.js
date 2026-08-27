// Devil n Dove Build 440 — barcode-first Tool/Supply receiving workspace.
// Manual/USB/Bluetooth scanner input is primary. Optional camera scan is user-triggered and bounded.
// No polling, no automatic write retries, no Product stock mutation.

(() => {
  const mount = document.getElementById('inventoryReceivingMount');
  if (!mount || !window.DDAuth) return;

  const state = {
    selected: null,
    context: null,
    scannedCode: '',
    identifierType: '',
    identifierKnown: false,
    candidates: [],
    recent: [],
    busy: false,
    cameraStream: null,
    cameraFrame: 0,
  };

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const money = (cents) => (Number(cents || 0) / 100).toFixed(2);
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  async function readJson(response, fallback) {
    if (window.DDAuth?.readApiJson) return window.DDAuth.readApiJson(response, fallback);
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!response.ok) throw new Error(data?.error || fallback || `Request failed (${response.status}).`);
    return data;
  }

  function setMessage(message, isError = false) {
    const el = document.getElementById('inventoryReceivingMessage');
    if (!el) return;
    el.textContent = message || '';
    el.hidden = !message;
    el.classList.toggle('is-error', Boolean(message && isError));
    el.classList.toggle('is-success', Boolean(message && !isError));
  }

  function selectedSource() {
    const sources = Array.isArray(state.context?.sources) ? state.context.sources : [];
    return sources.find((row) => Number(row.is_preferred || 0) === 1) || sources[0] || null;
  }

  function renderSelected() {
    const el = document.getElementById('inventoryReceivingSelected');
    if (!el) return;
    if (!state.selected) {
      el.innerHTML = '<div class="small">Scan/enter a code, or search for an Inventory item.</div>';
      return;
    }
    const item = state.selected;
    const source = selectedSource();
    el.innerHTML = `
      <div class="inventory-receiving-selected-card">
        <div>
          <strong>${esc(item.item_name || `Inventory #${item.site_item_inventory_id}`)}</strong>
          <div class="small">${esc(item.source_type || 'inventory')} · ${esc(item.external_key || '')}</div>
        </div>
        <div class="inventory-receiving-stock-grid">
          <span><b>${esc(item.on_hand_quantity)}</b><small>on hand</small></span>
          <span><b>${esc(item.incoming_quantity)}</b><small>incoming</small></span>
          <span><b>${esc(item.available_quantity)}</b><small>available</small></span>
        </div>
        <div class="small">Preferred source: ${esc(source?.source_name || item.supplier_name || 'not set')} ${source?.supplier_sku || item.supplier_sku ? `· SKU ${esc(source?.supplier_sku || item.supplier_sku)}` : ''}</div>
      </div>`;
    populateFormDefaults();
  }

  function populateFormDefaults() {
    if (!state.selected) return;
    const source = selectedSource();
    const setIfBlank = (id, value) => {
      const el = document.getElementById(id);
      if (el && !String(el.value || '').trim() && value != null) el.value = String(value);
    };
    setIfBlank('inventoryReceiveSupplier', source?.source_name || state.selected.supplier_name || '');
    setIfBlank('inventoryReceiveSupplierSku', source?.supplier_sku || state.selected.supplier_sku || '');
    setIfBlank('inventoryReceiveSourceUrl', source?.source_url || state.selected.source_url || state.selected.amazon_url || '');
    setIfBlank('inventoryReceiveUnitCost', money(state.selected.unit_cost_cents));
    const clear = document.getElementById('inventoryReceiveClearIncoming');
    if (clear && Number(state.selected.incoming_quantity || 0) <= 0) clear.checked = false;
    const bind = document.getElementById('inventoryReceiveBindCode');
    if (bind) {
      bind.disabled = !state.scannedCode || state.identifierKnown;
      bind.checked = Boolean(state.scannedCode && !state.identifierKnown);
    }
  }

  function renderSearchResults() {
    const el = document.getElementById('inventoryReceivingSearchResults');
    if (!el) return;
    if (!state.candidates.length) {
      el.innerHTML = '<div class="small">No search results yet.</div>';
      return;
    }
    el.innerHTML = state.candidates.map((row) => `
      <button type="button" class="inventory-receiving-result" data-receive-item="${Number(row.site_item_inventory_id || 0)}">
        <strong>${esc(row.item_name || `Inventory #${row.site_item_inventory_id}`)}</strong>
        <span>${esc(row.source_type || '')} · on hand ${esc(row.on_hand_quantity)} · incoming ${esc(row.incoming_quantity)}${row.supplier_sku ? ` · ${esc(row.supplier_sku)}` : ''}</span>
      </button>`).join('');
  }

  function renderRecent() {
    const el = document.getElementById('inventoryReceivingRecent');
    if (!el) return;
    if (!state.recent.length) {
      el.innerHTML = '<div class="small">No Build 440 receiving claims yet.</div>';
      return;
    }
    el.innerHTML = state.recent.slice(0, 12).map((row) => `
      <div class="inventory-receiving-recent-row">
        <span><strong>${esc(row.item_name || row.external_key || row.site_item_inventory_id)}</strong><small>${esc(row.received_at || '')}</small></span>
        <span>${esc(row.quantity_received)} ${esc(row.stock_unit_label || 'unit')} · ${esc(row.lot_code || '')} · ${esc(row.claim_status || '')}</span>
      </div>`).join('');
  }

  function renderShell() {
    mount.innerHTML = `
      <section class="card inventory-receiving-card" aria-labelledby="inventoryReceivingTitle">
        <div class="inventory-receiving-heading">
          <div>
            <p class="inventory-operations-eyebrow">Receiving & provenance</p>
            <h3 id="inventoryReceivingTitle">Barcode-first Tool & Supply Receiving</h3>
            <p class="small">Scan or enter UPC/EAN/GTIN, supplier SKU, or external key. Every receipt updates Inventory and its purchase lot together; Product finished stock is intentionally excluded.</p>
          </div>
          <span class="inventory-receiving-badge">Build 440</span>
        </div>
        <div id="inventoryReceivingMessage" class="small inventory-receiving-message" hidden></div>

        <div class="inventory-receiving-scan-row">
          <label>Scan / enter code
            <input class="input" id="inventoryReceiveCode" autocomplete="off" inputmode="text" placeholder="UPC, EAN, GTIN, supplier SKU or external key" />
          </label>
          <button class="btn primary" type="button" id="inventoryReceiveLookup">Lookup</button>
          <button class="btn" type="button" id="inventoryReceiveCamera">Scan with camera</button>
        </div>
        <div id="inventoryReceiveCameraWrap" class="inventory-receiving-camera" hidden>
          <video id="inventoryReceiveCameraVideo" playsinline muted></video>
          <button class="btn" type="button" id="inventoryReceiveCameraStop">Stop camera</button>
        </div>

        <div class="inventory-receiving-search-row">
          <label>Search Inventory when a code is new or unknown
            <input class="input" id="inventoryReceiveSearch" autocomplete="off" placeholder="Item name, supplier, SKU, external key or Inventory ID" />
          </label>
          <button class="btn" type="button" id="inventoryReceiveSearchButton">Search</button>
        </div>
        <div id="inventoryReceivingSearchResults" class="inventory-receiving-results"><div class="small">No search results yet.</div></div>

        <div id="inventoryReceivingSelected" class="inventory-receiving-selected"><div class="small">Scan/enter a code, or search for an Inventory item.</div></div>

        <form id="inventoryReceivingForm" class="inventory-receiving-form">
          <div class="grid cols-3">
            <label>Quantity received<input class="input" id="inventoryReceiveQuantity" type="number" min="0.000001" step="0.001" value="1" required /></label>
            <label>Supplier / batch lot code<input class="input" id="inventoryReceiveLotCode" placeholder="Optional — generated when blank" /></label>
            <label>Received date<input class="input" id="inventoryReceiveDate" type="date" /></label>
          </div>
          <div class="grid cols-3">
            <label>Unit cost (CAD $)<input class="input" id="inventoryReceiveUnitCost" type="number" min="0" step="0.01" /></label>
            <label>Shipping allocated to lot ($)<input class="input" id="inventoryReceiveShipping" type="number" min="0" step="0.01" value="0" /></label>
            <label>Tax allocated to lot ($)<input class="input" id="inventoryReceiveTax" type="number" min="0" step="0.01" value="0" /></label>
          </div>
          <div class="grid cols-3">
            <label>Supplier / source<input class="input" id="inventoryReceiveSupplier" /></label>
            <label>Supplier SKU<input class="input" id="inventoryReceiveSupplierSku" /></label>
            <label>Source type<select class="input" id="inventoryReceiveSourceKind"><option value="supplier">Supplier</option><option value="manufacturer">Manufacturer</option><option value="retailer">Retailer</option><option value="amazon">Amazon</option><option value="marketplace">Marketplace</option><option value="manual">Manual</option></select></label>
          </div>
          <div class="grid cols-2">
            <label>Source URL<input class="input" id="inventoryReceiveSourceUrl" type="url" /></label>
            <label>Storage location<input class="input" id="inventoryReceiveStorage" /></label>
          </div>
          <div class="grid cols-2">
            <label>Purchase date<input class="input" id="inventoryReceivePurchaseDate" type="date" /></label>
            <label>Expiry / best-before date<input class="input" id="inventoryReceiveExpiry" type="date" /></label>
          </div>
          <label>Receiving note<textarea class="input" id="inventoryReceiveNotes" rows="2" placeholder="Shipment, condition, invoice, batch or receiving note"></textarea></label>
          <div class="inventory-receiving-checks">
            <label><input type="checkbox" id="inventoryReceiveClearIncoming" checked /> Clear matching incoming quantity</label>
            <label><input type="checkbox" id="inventoryReceiveBindCode" disabled /> Bind scanned code to this Inventory item</label>
            <label><input type="checkbox" id="inventoryReceivePreferredSource" /> Make this the preferred source</label>
            <label><input type="checkbox" id="inventoryReceiveVerifySource" /> Mark source details reviewed</label>
          </div>
          <div class="inventory-receiving-actions">
            <button class="btn primary" id="inventoryReceivePost" type="submit" disabled>Receive into Inventory</button>
            <button class="btn" id="inventoryReceiveReset" type="button">Clear form</button>
          </div>
        </form>

        <details class="inventory-receiving-recent">
          <summary>Recent receiving evidence</summary>
          <div id="inventoryReceivingRecent"><div class="small">Loading…</div></div>
        </details>
      </section>`;
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('inventoryReceiveDate').value = today;
  }

  async function loadItem(itemId) {
    const data = await window.DDAuth.apiJson(`/api/admin/inventory-receiving?site_item_inventory_id=${encodeURIComponent(itemId)}`, { method: 'GET' }, { fallbackMessage: 'Inventory receiving detail could not load.', cacheTtlMs: 0, staleOnError: false });
    state.context = data.detail || null;
    state.selected = state.context?.item || null;
    renderSelected();
    document.getElementById('inventoryReceivePost').disabled = !state.selected;
  }

  async function lookupCode() {
    const code = String(document.getElementById('inventoryReceiveCode')?.value || '').trim();
    if (!code) return setMessage('Enter or scan a code first.', true);
    state.scannedCode = code;
    state.identifierKnown = false;
    setMessage('Looking up Inventory identity…');
    try {
      const data = await window.DDAuth.apiJson(`/api/admin/inventory-receiving?code=${encodeURIComponent(code)}`, { method: 'GET' }, { fallbackMessage: 'Inventory code lookup failed.', cacheTtlMs: 0, staleOnError: false });
      const resolution = data.resolution || {};
      state.identifierType = resolution.identifier_type || '';
      if (resolution.ambiguous) {
        state.candidates = Array.isArray(resolution.candidates) ? resolution.candidates : [];
        renderSearchResults();
        state.selected = null;
        state.context = null;
        renderSelected();
        document.getElementById('inventoryReceivePost').disabled = true;
        return setMessage('That code matches multiple Inventory items. Choose the correct item before receiving.', true);
      }
      if (resolution.resolved) {
        state.identifierKnown = true;
        state.context = data.detail || null;
        state.selected = state.context?.item || resolution.resolved;
        renderSelected();
        document.getElementById('inventoryReceivePost').disabled = false;
        return setMessage(`Matched ${state.selected.item_name}. Review the lot and quantity, then receive.`);
      }
      state.selected = null;
      state.context = null;
      renderSelected();
      document.getElementById('inventoryReceivePost').disabled = true;
      setMessage('Code is not linked yet. Search Inventory, select the correct item, then keep “Bind scanned code” checked when receiving.', true);
      document.getElementById('inventoryReceiveSearch')?.focus();
    } catch (error) {
      setMessage(error.message || 'Inventory code lookup failed.', true);
    }
  }

  async function searchInventory() {
    const q = String(document.getElementById('inventoryReceiveSearch')?.value || '').trim();
    if (!q) return setMessage('Enter an Inventory search term.', true);
    setMessage('Searching Tool/Supply Inventory…');
    try {
      const data = await window.DDAuth.apiJson(`/api/admin/inventory-receiving?q=${encodeURIComponent(q)}`, { method: 'GET' }, { fallbackMessage: 'Inventory search failed.', cacheTtlMs: 0, staleOnError: false });
      state.candidates = Array.isArray(data.candidates) ? data.candidates : [];
      renderSearchResults();
      setMessage(state.candidates.length ? `${state.candidates.length} matching Inventory item(s).` : 'No matching Tool/Supply Inventory items found.', !state.candidates.length);
    } catch (error) {
      setMessage(error.message || 'Inventory search failed.', true);
    }
  }

  async function loadRecent() {
    try {
      const data = await window.DDAuth.apiJson('/api/admin/inventory-receiving', { method: 'GET' }, { fallbackMessage: 'Recent receiving evidence could not load.', cacheTtlMs: 0, staleOnError: false });
      state.recent = Array.isArray(data.recent) ? data.recent : [];
      renderRecent();
    } catch {
      const el = document.getElementById('inventoryReceivingRecent');
      if (el) el.innerHTML = '<div class="small">Recent receiving evidence is unavailable.</div>';
    }
  }

  function dollarsToCents(id) {
    const n = Number(document.getElementById(id)?.value || 0);
    return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
  }

  async function postReceipt(event) {
    event.preventDefault();
    if (!state.selected || state.busy) return;
    const quantity = Number(document.getElementById('inventoryReceiveQuantity')?.value || 0);
    if (!(quantity > 0)) return setMessage('Quantity received must be greater than zero.', true);
    state.busy = true;
    const postButton = document.getElementById('inventoryReceivePost');
    postButton.disabled = true;
    postButton.textContent = 'Receiving…';
    const payload = {
      action: 'receive',
      receive_key: `ui-${uuid()}`,
      site_item_inventory_id: Number(state.selected.site_item_inventory_id || 0),
      identifier: state.scannedCode || '',
      identifier_type: state.identifierType || '',
      bind_identifier: document.getElementById('inventoryReceiveBindCode')?.checked ? 1 : 0,
      quantity_received: quantity,
      lot_code: String(document.getElementById('inventoryReceiveLotCode')?.value || '').trim(),
      received_date: document.getElementById('inventoryReceiveDate')?.value || '',
      purchase_date: document.getElementById('inventoryReceivePurchaseDate')?.value || '',
      expiry_date: document.getElementById('inventoryReceiveExpiry')?.value || '',
      storage_location: String(document.getElementById('inventoryReceiveStorage')?.value || '').trim(),
      unit_cost_cents: dollarsToCents('inventoryReceiveUnitCost'),
      shipping_cost_cents: dollarsToCents('inventoryReceiveShipping'),
      tax_cost_cents: dollarsToCents('inventoryReceiveTax'),
      source_kind: document.getElementById('inventoryReceiveSourceKind')?.value || 'supplier',
      source_name: String(document.getElementById('inventoryReceiveSupplier')?.value || '').trim(),
      supplier_sku: String(document.getElementById('inventoryReceiveSupplierSku')?.value || '').trim(),
      source_url: String(document.getElementById('inventoryReceiveSourceUrl')?.value || '').trim(),
      clear_incoming: document.getElementById('inventoryReceiveClearIncoming')?.checked ? 1 : 0,
      make_preferred_source: document.getElementById('inventoryReceivePreferredSource')?.checked ? 1 : 0,
      verify_source: document.getElementById('inventoryReceiveVerifySource')?.checked ? 1 : 0,
      notes: String(document.getElementById('inventoryReceiveNotes')?.value || '').trim(),
    };
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/inventory-receiving', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await readJson(response, 'Inventory receiving failed safely.');
      state.context = data.context || data.receipts?.[0]?.context || null;
      state.selected = state.context?.item || data.item || state.selected;
      state.identifierKnown = Boolean(state.scannedCode);
      renderSelected();
      const warnings = Array.isArray(data.warnings) ? data.warnings : [];
      setMessage(`${data.message || 'Inventory received.'}${warnings.length ? ` ${warnings.join(' ')}` : ''}`, warnings.length > 0);
      document.getElementById('inventoryReceiveQuantity').value = '1';
      document.getElementById('inventoryReceiveLotCode').value = '';
      document.getElementById('inventoryReceiveNotes').value = '';
      await loadRecent();
      document.dispatchEvent(new CustomEvent('dd:inventory-received', { detail: { site_item_inventory_id: Number(state.selected?.site_item_inventory_id || 0) } }));
    } catch (error) {
      setMessage(error.message || 'Inventory receiving failed safely.', true);
    } finally {
      state.busy = false;
      postButton.disabled = !state.selected;
      postButton.textContent = 'Receive into Inventory';
    }
  }

  function resetForm() {
    stopCamera();
    state.selected = null;
    state.context = null;
    state.scannedCode = '';
    state.identifierType = '';
    state.identifierKnown = false;
    state.candidates = [];
    document.getElementById('inventoryReceiveCode').value = '';
    document.getElementById('inventoryReceiveSearch').value = '';
    document.getElementById('inventoryReceiveQuantity').value = '1';
    document.getElementById('inventoryReceiveLotCode').value = '';
    document.getElementById('inventoryReceiveSupplier').value = '';
    document.getElementById('inventoryReceiveSupplierSku').value = '';
    document.getElementById('inventoryReceiveSourceUrl').value = '';
    document.getElementById('inventoryReceiveUnitCost').value = '';
    document.getElementById('inventoryReceiveShipping').value = '0';
    document.getElementById('inventoryReceiveTax').value = '0';
    document.getElementById('inventoryReceiveStorage').value = '';
    document.getElementById('inventoryReceiveExpiry').value = '';
    document.getElementById('inventoryReceivePurchaseDate').value = '';
    document.getElementById('inventoryReceiveNotes').value = '';
    document.getElementById('inventoryReceiveClearIncoming').checked = true;
    document.getElementById('inventoryReceiveBindCode').checked = false;
    document.getElementById('inventoryReceiveBindCode').disabled = true;
    document.getElementById('inventoryReceivePreferredSource').checked = false;
    document.getElementById('inventoryReceiveVerifySource').checked = false;
    document.getElementById('inventoryReceivePost').disabled = true;
    renderSelected();
    renderSearchResults();
    setMessage('');
    document.getElementById('inventoryReceiveCode')?.focus();
  }

  function stopCamera() {
    if (state.cameraFrame) cancelAnimationFrame(state.cameraFrame);
    state.cameraFrame = 0;
    if (state.cameraStream) state.cameraStream.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
    const wrap = document.getElementById('inventoryReceiveCameraWrap');
    if (wrap) wrap.hidden = true;
    const video = document.getElementById('inventoryReceiveCameraVideo');
    if (video) video.srcObject = null;
  }

  async function startCamera() {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) return setMessage('Camera barcode detection is not supported in this browser. A USB/Bluetooth scanner or manual code entry works here.', true);
    stopCamera();
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats?.().catch?.(() => []) || [];
      const wanted = ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf'];
      const supported = wanted.filter((format) => !formats.length || formats.includes(format));
      const detector = new window.BarcodeDetector(supported.length ? { formats: supported } : undefined);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      state.cameraStream = stream;
      const wrap = document.getElementById('inventoryReceiveCameraWrap');
      const video = document.getElementById('inventoryReceiveCameraVideo');
      wrap.hidden = false;
      video.srcObject = stream;
      await video.play();
      const expires = Date.now() + 12000;
      const detect = async () => {
        if (!state.cameraStream || Date.now() > expires) {
          stopCamera();
          if (Date.now() > expires) setMessage('Camera scan timed out. Try again or enter the code manually.', true);
          return;
        }
        try {
          const codes = await detector.detect(video);
          const value = String(codes?.[0]?.rawValue || '').trim();
          if (value) {
            document.getElementById('inventoryReceiveCode').value = value;
            stopCamera();
            await lookupCode();
            return;
          }
        } catch {}
        state.cameraFrame = requestAnimationFrame(detect);
      };
      setMessage('Camera scan active for up to 12 seconds. Hold the barcode steady in view.');
      state.cameraFrame = requestAnimationFrame(detect);
    } catch (error) {
      stopCamera();
      setMessage(error?.message || 'Camera could not start. Use scanner/manual entry instead.', true);
    }
  }

  renderShell();
  renderSearchResults();
  loadRecent();

  document.getElementById('inventoryReceiveLookup')?.addEventListener('click', lookupCode);
  document.getElementById('inventoryReceiveCode')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); lookupCode(); } });
  document.getElementById('inventoryReceiveSearchButton')?.addEventListener('click', searchInventory);
  document.getElementById('inventoryReceiveSearch')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); searchInventory(); } });
  document.getElementById('inventoryReceivingSearchResults')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-receive-item]');
    if (!button) return;
    try {
      await loadItem(Number(button.dataset.receiveItem || 0));
      setMessage(`Selected ${state.selected?.item_name || 'Inventory item'}. Review the receipt details.`);
    } catch (error) {
      setMessage(error.message || 'Inventory item could not load.', true);
    }
  });
  document.getElementById('inventoryReceivingForm')?.addEventListener('submit', postReceipt);
  document.getElementById('inventoryReceiveReset')?.addEventListener('click', resetForm);
  document.getElementById('inventoryReceiveCamera')?.addEventListener('click', startCamera);
  document.getElementById('inventoryReceiveCameraStop')?.addEventListener('click', stopCamera);
  window.addEventListener('pagehide', stopCamera, { once: true });
})();
