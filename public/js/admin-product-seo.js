document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('productSeoAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  const LOCAL_PENDING_KEY = 'dd_admin_product_seo_pending_actions_v1';
  let rendered = false;
  let pendingMount = null;
  let currentSharedPendingActions = [];

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setMessage(msg, err = false) {
    const el = document.getElementById('adminProductSeoMessage');
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
    el.style.color = err ? '#b00020' : '#0a7a2f';
  }

  function parseSafeJson(value, fallback = []) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function loadLocalPendingActions() {
    return parseSafeJson(localStorage.getItem(LOCAL_PENDING_KEY) || '[]', []);
  }

  function saveLocalPendingActions(actions) {
    try {
      localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(actions));
    } catch {}
  }

  function upsertLocalPendingAction(action) {
    const rows = loadLocalPendingActions();
    const key = String(action.client_action_id || action.id || '').trim();
    const existingIndex = rows.findIndex((row) => String(row.client_action_id || row.id || '').trim() === key);
    if (existingIndex >= 0) rows[existingIndex] = action;
    else rows.unshift(action);
    saveLocalPendingActions(rows.slice(0, 30));
  }

  function removeLocalPendingAction(clientActionId) {
    saveLocalPendingActions(loadLocalPendingActions().filter((row) => String(row.client_action_id || row.id || '') !== String(clientActionId || '')));
  }

  function ensurePendingMount() {
    if (pendingMount && pendingMount.isConnected) return pendingMount;
    pendingMount = document.getElementById('productSeoPendingActionsMount');
    if (pendingMount) return pendingMount;
    pendingMount = document.createElement('div');
    pendingMount.id = 'productSeoPendingActionsMount';
    pendingMount.className = 'card';
    pendingMount.style.marginTop = '16px';
    mountEl.appendChild(pendingMount);
    return pendingMount;
  }

  function buildClientActionId(productId) {
    return ['product-seo', Number(productId || 0), Date.now()].join(':');
  }

  function normalizeSharedAction(row) {
    if (!row) return null;
    return {
      source: 'shared',
      admin_pending_action_id: Number(row.admin_pending_action_id || 0),
      client_action_id: String(row.client_action_id || '').trim(),
      queue_status: row.queue_status || 'queued',
      label: row.label || row.action_label || 'Pending product SEO save',
      last_error: row.last_error || row.warning || '',
      created_at: row.created_at || null,
      payload: row.payload || {},
      endpoint: row.endpoint || row.endpoint_path || '/api/admin/product-seo',
      method: row.method || row.http_method || 'POST'
    };
  }

  function normalizeLocalAction(row) {
    if (!row) return null;
    return {
      source: 'local',
      id: String(row.id || row.client_action_id || '').trim(),
      client_action_id: String(row.client_action_id || row.id || '').trim(),
      queue_status: row.queue_status || 'queued',
      label: row.label || 'Pending product SEO save',
      last_error: row.last_error || '',
      created_at: row.created_at || null,
      payload: row.payload || {},
      endpoint: row.endpoint || '/api/admin/product-seo',
      method: row.method || 'POST'
    };
  }

  async function fetchSharedPendingActions() {
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/pending-actions?action_scope=product_seo&limit=20', { method: 'GET' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load queued product SEO saves.');
      return (Array.isArray(data.actions) ? data.actions : []).map(normalizeSharedAction).filter(Boolean);
    } catch {
      return [];
    }
  }

  async function saveSharedPendingAction(action) {
    const response = await window.DDAuth.apiFetch('/api/admin/pending-actions', {
      method: 'POST',
      body: JSON.stringify({
        client_action_id: action.client_action_id,
        action_scope: 'product_seo',
        action_label: action.label,
        endpoint_path: action.endpoint,
        http_method: action.method,
        payload: action.payload,
        queue_status: action.queue_status || 'queued',
        last_error: action.last_error || '',
        source_device_label: navigator.userAgent || 'browser'
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to save queued product SEO action.');
    return normalizeSharedAction(data.action);
  }

  async function updateSharedPendingActionStatus(action, queueStatus, lastError = '', incrementAttempt = false) {
    const response = await window.DDAuth.apiFetch('/api/admin/pending-actions-status', {
      method: 'POST',
      body: JSON.stringify({
        admin_pending_action_id: action.admin_pending_action_id || 0,
        client_action_id: action.client_action_id || '',
        queue_status: queueStatus,
        last_error: lastError,
        increment_attempt: incrementAttempt ? 1 : 0
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to update queued product SEO action.');
    return data.action || null;
  }

  function mergePendingActions(sharedRows) {
    const localRows = loadLocalPendingActions().map(normalizeLocalAction).filter(Boolean);
    const sharedClientIds = new Set(sharedRows.map((row) => String(row.client_action_id || '')).filter(Boolean));
    return [...sharedRows, ...localRows.filter((row) => !sharedClientIds.has(String(row.client_action_id || '')))];
  }

  function renderPendingActions() {
    const mount = ensurePendingMount();
    const rows = mergePendingActions(currentSharedPendingActions);
    mount.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h3 style="margin:0 0 6px 0">Queued product SEO saves</h3><div class="small">Failed SEO writes now save to the shared replay queue first, with this browser only as the last fallback when the queue cannot be reached.</div></div><button class="btn" type="button" id="refreshProductSeoPendingButton">Refresh queue</button></div><div style="margin-top:12px">${rows.length ? `<div class="table-wrap"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Action</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Status</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Saved</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Replay</th></tr></thead><tbody>${rows.map((row) => `<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>${escapeHtml(row.label || 'Pending product SEO save')}</strong>${row.last_error ? `<div class="small">${escapeHtml(row.last_error)}</div>` : ''}</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(row.queue_status || 'queued')}<div class="small">${row.source === 'shared' ? 'Shared queue' : 'Browser only'}</div></td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(row.created_at || '—')}</td><td style="padding:8px;border-bottom:1px solid #eee"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-replay-product-seo="${escapeHtml(String(row.client_action_id || row.id || ''))}">Retry</button><button class="btn" type="button" data-dismiss-product-seo="${escapeHtml(String(row.client_action_id || row.id || ''))}">Dismiss</button></div></td></tr>`).join('')}</tbody></table></div>` : `<div class="small">No queued product SEO saves are waiting right now.</div>`}</div>`;
    mount.querySelector('#refreshProductSeoPendingButton')?.addEventListener('click', loadPendingActions);
  }

  async function loadPendingActions() {
    currentSharedPendingActions = await fetchSharedPendingActions();
    renderPendingActions();
  }

  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `<div class="card" style="margin-top:18px"><h3 style="margin-top:0">Product SEO Editor</h3><p class="small" style="margin-top:0">Edit search title, meta description, H1, keywords, canonical, and social image fields for a product.</p><div id="adminProductSeoMessage" class="small" style="display:none;margin-bottom:12px"></div><form id="adminProductSeoForm" class="grid" style="gap:12px"><div class="grid cols-2" style="gap:12px"><div><label class="small" for="seoProductId">Product ID</label><input id="seoProductId" type="number" min="1" step="1" required /></div><div><label class="small" for="seoMetaTitle">Meta Title</label><input id="seoMetaTitle" type="text" /></div></div><div><label class="small" for="seoMetaDescription">Meta Description</label><textarea id="seoMetaDescription" rows="3"></textarea></div><div class="grid cols-2" style="gap:12px"><div><label class="small" for="seoKeywords">Keywords</label><input id="seoKeywords" type="text" placeholder="comma,separated,keywords" /></div><div><label class="small" for="seoH1">H1 Override</label><input id="seoH1" type="text" /></div></div><div class="grid cols-3" style="gap:12px"><div><label class="small" for="seoCanonical">Canonical URL</label><input id="seoCanonical" type="text" /></div><div><label class="small" for="seoOgTitle">OG Title</label><input id="seoOgTitle" type="text" /></div><div><label class="small" for="seoOgImage">OG Image URL</label><input id="seoOgImage" type="text" /></div></div><div><label class="small" for="seoOgDescription">OG Description</label><textarea id="seoOgDescription" rows="2"></textarea></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="button" id="loadProductSeoButton">Load SEO</button><button class="btn" type="submit" id="saveProductSeoButton">Save SEO</button></div></form></div>`;
    document.getElementById('loadProductSeoButton')?.addEventListener('click', loadSeo);
    document.getElementById('adminProductSeoForm')?.addEventListener('submit', saveSeo);
    const pendingEl = ensurePendingMount();
    pendingEl.addEventListener('click', async (event) => {
      const replayId = event.target?.getAttribute?.('data-replay-product-seo');
      if (replayId) {
        const row = mergePendingActions(currentSharedPendingActions).find((entry) => String(entry.client_action_id || entry.id || '') === String(replayId));
        await replayAction(row);
        return;
      }
      const dismissId = event.target?.getAttribute?.('data-dismiss-product-seo');
      if (dismissId) {
        const row = mergePendingActions(currentSharedPendingActions).find((entry) => String(entry.client_action_id || entry.id || '') === String(dismissId));
        await dismissAction(row);
      }
    });
    loadPendingActions();
  }

  function buildPayload() {
    const product_id = Number(document.getElementById('seoProductId')?.value || 0);
    if (!product_id) throw new Error('Enter a valid product ID.');
    return {
      product_id,
      meta_title: document.getElementById('seoMetaTitle')?.value || '',
      meta_description: document.getElementById('seoMetaDescription')?.value || '',
      keywords: document.getElementById('seoKeywords')?.value || '',
      h1_override: document.getElementById('seoH1')?.value || '',
      canonical_url: document.getElementById('seoCanonical')?.value || '',
      og_title: document.getElementById('seoOgTitle')?.value || '',
      og_image_url: document.getElementById('seoOgImage')?.value || '',
      og_description: document.getElementById('seoOgDescription')?.value || ''
    };
  }

  async function liveSaveSeo(payload) {
    const response = await window.DDAuth.apiFetch('/api/admin/product-seo', { method: 'POST', body: JSON.stringify(payload) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to save product SEO.');
    return data;
  }

  async function queueSeoSave(payload, errorMessage) {
    const action = {
      client_action_id: buildClientActionId(payload.product_id),
      queue_status: 'queued',
      label: `Save SEO: product #${payload.product_id}`,
      payload,
      endpoint: '/api/admin/product-seo',
      method: 'POST',
      last_error: errorMessage || 'Failed to save product SEO.',
      created_at: new Date().toISOString()
    };
    try {
      const shared = await saveSharedPendingAction(action);
      currentSharedPendingActions = await fetchSharedPendingActions();
      renderPendingActions();
      return { queued: true, shared: true, action: shared };
    } catch {
      upsertLocalPendingAction({ ...action, id: action.client_action_id, source: 'local' });
      renderPendingActions();
      return { queued: true, shared: false, action };
    }
  }

  async function replayAction(row) {
    if (!row?.payload) return;
    try {
      if (row.source === 'shared') {
        await updateSharedPendingActionStatus(row, 'retrying', row.last_error || '', true);
      } else {
        upsertLocalPendingAction({ ...row, queue_status: 'retrying' });
      }
      renderPendingActions();
      await liveSaveSeo(row.payload);
      if (row.source === 'shared') {
        await updateSharedPendingActionStatus(row, 'completed', '', false);
        currentSharedPendingActions = await fetchSharedPendingActions();
      } else {
        removeLocalPendingAction(row.client_action_id || row.id);
      }
      renderPendingActions();
      setMessage(`Queued SEO replay succeeded for product #${row.payload.product_id}.`);
      document.dispatchEvent(new CustomEvent('dd:product-updated', { detail: { product_id: row.payload.product_id } }));
    } catch (error) {
      if (row.source === 'shared') {
        await updateSharedPendingActionStatus(row, 'failed', error.message || 'Replay failed.', true).catch(() => null);
        currentSharedPendingActions = await fetchSharedPendingActions();
      } else {
        upsertLocalPendingAction({ ...row, queue_status: 'failed', last_error: error.message || 'Replay failed.' });
      }
      renderPendingActions();
      setMessage(error.message || 'Queued SEO replay failed.', true);
    }
  }

  async function dismissAction(row) {
    if (!row) return;
    try {
      if (row.source === 'shared') {
        await updateSharedPendingActionStatus(row, 'dismissed', row.last_error || '', false);
        currentSharedPendingActions = await fetchSharedPendingActions();
      } else {
        removeLocalPendingAction(row.client_action_id || row.id);
      }
      renderPendingActions();
    } catch (error) {
      setMessage(error.message || 'Failed to dismiss queued SEO action.', true);
    }
  }

  async function loadSeo() {
    const product_id = Number(document.getElementById('seoProductId')?.value || 0);
    if (!product_id) { setMessage('Enter a valid product ID.', true); return; }
    try {
      setMessage('Loading product SEO...');
      const r = await window.DDAuth.apiFetch(`/api/admin/product-seo?product_id=${encodeURIComponent(product_id)}`);
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || 'Failed to load product SEO.');
      const seo = d.seo || {};
      document.getElementById('seoMetaTitle').value = seo.meta_title || '';
      document.getElementById('seoMetaDescription').value = seo.meta_description || '';
      document.getElementById('seoKeywords').value = seo.keywords || '';
      document.getElementById('seoH1').value = seo.h1_override || '';
      document.getElementById('seoCanonical').value = seo.canonical_url || '';
      document.getElementById('seoOgTitle').value = seo.og_title || '';
      document.getElementById('seoOgImage').value = seo.og_image_url || '';
      document.getElementById('seoOgDescription').value = seo.og_description || '';
      setMessage('Product SEO loaded.');
    } catch (e) {
      setMessage(e.message || 'Failed to load product SEO.', true);
    }
  }

  async function saveSeo(event) {
    event.preventDefault();
    let payload = null;
    try {
      payload = buildPayload();
      setMessage('Saving product SEO...');
      await liveSaveSeo(payload);
      setMessage('Product SEO saved.');
      document.dispatchEvent(new CustomEvent('dd:product-updated', { detail: { product_id: payload.product_id } }));
    } catch (e) {
      if (payload) {
        const queued = await queueSeoSave(payload, e.message || 'Failed to save product SEO.');
        setMessage(
          queued.shared
            ? `Live SEO save failed, but the action was saved to the shared queue for replay. ${e.message || ''}`.trim()
            : `Live SEO save failed, and the action was saved only in this browser as a fallback. ${e.message || ''}`.trim(),
          true
        );
      } else {
        setMessage(e.message || 'Failed to save product SEO.', true);
      }
    }
  }


  document.addEventListener('dd:admin-ready', (event) => {
    if (!event?.detail?.ok) return;
    render();
  });

  render();
});
