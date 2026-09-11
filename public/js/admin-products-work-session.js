// Release 467 Build 100 — browser-local Product Work Session & Progress.
// This layer is intentionally read-only: it reuses the rendered Product table/readiness state
// and persists only browser-local planning metadata. It adds no Product/readiness API call.
(() => {
  const SESSION_KEY = 'dd_catalog_work_session_v1';
  const SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const MAX_ITEMS = 60;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  ready(() => {
    if (document.body?.dataset?.adminPage !== 'products') return;
    const tableBody = document.getElementById('productsTableBody');
    const tableWrap = document.querySelector('.products-admin-table-wrap');
    if (!tableBody || !tableWrap) return;

    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    const now = () => new Date().toISOString();
    let renderTimer = 0;
    let snapshotProducts = [];

    function readSnapshot() {
      try {
        const payload = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null');
        snapshotProducts = payload && Array.isArray(payload.products) ? payload.products : [];
      } catch { snapshotProducts = []; }
    }

    function loadSession() {
      try {
        const payload = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        const items = Array.isArray(payload?.items) ? payload.items : [];
        return {
          items: items
            .map((item) => ({
              product_id: Number(item?.product_id || 0) || 0,
              added_at: String(item?.added_at || ''),
              completed_at: item?.completed_at ? String(item.completed_at) : null,
            }))
            .filter((item) => item.product_id > 0)
            .slice(0, MAX_ITEMS),
        };
      } catch { return { items: [] }; }
    }

    let session = loadSession();

    function saveSession() {
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
    }

    function productIdForRow(row) {
      return Number(row?.querySelector?.('[data-edit-product-id]')?.dataset?.editProductId || 0) || 0;
    }

    function rowForProduct(productId) {
      return Array.from(tableBody.querySelectorAll('tr')).find((row) => productIdForRow(row) === Number(productId)) || null;
    }

    function productForId(productId) {
      return snapshotProducts.find((product) => Number(product?.product_id || 0) === Number(productId)) || null;
    }

    function rowMeta(row, productId) {
      const product = productForId(productId) || {};
      const cells = row ? Array.from(row.querySelectorAll('td')) : [];
      return {
        product_id: Number(productId),
        product_number: product?.product_number || String(cells[0]?.textContent || '').trim().replace(/^DD/i, '') || productId,
        name: product?.name || String(cells[1]?.textContent || '').trim() || `Product #${productId}`,
      };
    }

    function readinessForRow(row) {
      const node = row?.querySelector?.('.product-readiness-inline');
      if (!node || node.classList.contains('is-unknown')) return { known:false, blocked:false, ready:false, score:null, blocker:'', help:'' };
      const strongText = String(node.querySelector('strong')?.textContent || '').trim();
      const scoreMatch = strongText.match(/(\d+(?:\.\d+)?)\s*%/);
      const blockerText = String(node.querySelector('span')?.textContent || '').trim();
      const separator = blockerText.indexOf(':');
      return {
        known: /^ready\b/i.test(strongText) || /^blocked\b/i.test(strongText),
        blocked: /^blocked\b/i.test(strongText),
        ready: /^ready\b/i.test(strongText),
        score: scoreMatch ? Number(scoreMatch[1]) : null,
        blocker: separator >= 0 ? blockerText.slice(0, separator).trim() : blockerText,
        help: separator >= 0 ? blockerText.slice(separator + 1).trim() : '',
      };
    }

    function isVisibleRow(row) {
      if (!row) return false;
      if (row.hidden || row.style.display === 'none') return false;
      try { return getComputedStyle(row).display !== 'none'; } catch { return true; }
    }

    function sessionItem(productId) {
      return session.items.find((item) => item.product_id === Number(productId)) || null;
    }

    function addProduct(productId) {
      const id = Number(productId) || 0;
      if (!id || sessionItem(id)) return false;
      if (session.items.length >= MAX_ITEMS) return false;
      session.items.push({ product_id:id, added_at:now(), completed_at:null });
      saveSession();
      return true;
    }

    function removeProduct(productId) {
      const id = Number(productId) || 0;
      session.items = session.items.filter((item) => item.product_id !== id);
      saveSession();
    }

    function setDone(productId, done) {
      const item = sessionItem(productId);
      if (!item) return;
      item.completed_at = done ? now() : null;
      saveSession();
    }

    function setMessage(text, tone = '') {
      const node = document.getElementById('catalogWorkSessionMessage');
      if (!node) return;
      node.textContent = String(text || '');
      node.dataset.tone = tone;
    }

    function locateProduct(productId) {
      const row = rowForProduct(productId);
      if (!row) {
        setMessage('That Product is not currently rendered. Refresh Products before locating it.', 'review');
        return false;
      }
      if (!isVisibleRow(row)) {
        setMessage('That Product is hidden by the current Product view. Apply a matching saved view or clear filters, then try again.', 'review');
        return false;
      }
      row.scrollIntoView({ behavior:'smooth', block:'center', inline:'nearest' });
      row.classList.add('dd-work-session-locate');
      window.setTimeout(() => row.classList.remove('dd-work-session-locate'), 1800);
      return true;
    }

    function openBlocker(productId) {
      const row = rowForProduct(productId);
      if (!row) {
        setMessage('That Product is not currently rendered. Refresh Products before opening its blocker.', 'review');
        return false;
      }
      const existing = row.querySelector('[data-open-first-blocker]');
      if (!existing) {
        setMessage('No existing first-blocker action is available for this Product.', 'review');
        return false;
      }
      existing.click();
      return true;
    }

    function incompleteItems() {
      return session.items.filter((item) => !item.completed_at);
    }

    function nextIncomplete() {
      return incompleteItems()[0] || null;
    }

    function nextBlocked() {
      return incompleteItems().find((item) => readinessForRow(rowForProduct(item.product_id)).blocked) || null;
    }

    function addVisibleProducts() {
      let added = 0;
      Array.from(tableBody.querySelectorAll('tr')).forEach((row) => {
        if (!isVisibleRow(row)) return;
        const id = productIdForRow(row);
        if (id && addProduct(id)) added += 1;
      });
      setMessage(added ? `Added ${added} visible Product${added === 1 ? '' : 's'} to this browser's work session.` : 'No new visible Products were added.', added ? 'green' : 'review');
      render();
    }

    function injectStyle() {
      if (document.getElementById('catalogWorkSessionStyle')) return;
      const style = document.createElement('style');
      style.id = 'catalogWorkSessionStyle';
      style.textContent = `
        .dd-work-session-card{margin:14px 0;padding:16px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.03)}
        .dd-work-session-head,.dd-work-session-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
        .dd-work-session-actions{justify-content:flex-start;margin-top:10px}
        .dd-work-session-progress{font-weight:800}
        .dd-work-session-list{display:grid;gap:8px;margin-top:12px}
        .dd-work-session-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:12px}
        .dd-work-session-item.is-done{opacity:.65}
        .dd-work-session-item-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
        .dd-work-session-toggle{margin-left:6px}
        .dd-work-session-locate{outline:3px solid currentColor;outline-offset:-3px}
        #catalogWorkSessionMessage[data-tone="green"]{font-weight:700}
        @media (max-width:720px){.dd-work-session-item{grid-template-columns:1fr}.dd-work-session-item-actions{justify-content:flex-start}.dd-work-session-actions .btn{flex:1 1 160px}.dd-work-session-head{align-items:flex-start}}
      `;
      document.head.appendChild(style);
    }

    function ensurePanel() {
      let panel = document.getElementById('catalogWorkSession');
      if (panel) return panel;
      panel = document.createElement('section');
      panel.id = 'catalogWorkSession';
      panel.className = 'dd-work-session-card';
      panel.setAttribute('aria-label', 'Product work session');
      tableWrap.parentNode?.insertBefore(panel, tableWrap);
      return panel;
    }

    function syncRowButtons() {
      tableBody.querySelectorAll('tr').forEach((row) => {
        const id = productIdForRow(row);
        if (!id) return;
        const actionCell = row.querySelector('td:last-child');
        if (!actionCell) return;
        let button = actionCell.querySelector('[data-work-session-toggle]');
        if (!button) {
          button = document.createElement('button');
          button.type = 'button';
          button.className = 'btn small dd-work-session-toggle';
          button.dataset.workSessionToggle = String(id);
          actionCell.appendChild(button);
        }
        const item = sessionItem(id);
        button.textContent = item ? 'Remove from work' : 'Add to work';
        button.setAttribute('aria-pressed', item ? 'true' : 'false');
      });
    }

    function render() {
      readSnapshot();
      injectStyle();
      const panel = ensurePanel();
      const total = session.items.length;
      const complete = session.items.filter((item) => item.completed_at).length;
      const active = total - complete;
      const next = nextIncomplete();
      const blocked = nextBlocked();
      const rows = session.items.slice(0, 20).map((item) => {
        const row = rowForProduct(item.product_id);
        const meta = rowMeta(row, item.product_id);
        const readiness = readinessForRow(row);
        const readinessText = readiness.known
          ? `${readiness.ready ? 'Ready' : readiness.blocked ? 'Blocked' : 'Readiness'}${Number.isFinite(readiness.score) ? ` ${readiness.score}%` : ''}${readiness.blocker ? ` · ${readiness.blocker}` : ''}`
          : 'Readiness unavailable';
        return `<article class="dd-work-session-item ${item.completed_at ? 'is-done' : ''}" data-work-session-product="${item.product_id}">
          <div><strong>DD${esc(meta.product_number)} — ${esc(meta.name)}</strong><div class="small">${esc(readinessText)}${item.completed_at ? ' · completed in this browser' : ''}</div></div>
          <div class="dd-work-session-item-actions">
            <button class="btn" type="button" data-work-session-action="locate" data-product-id="${item.product_id}">Locate</button>
            <button class="btn" type="button" data-work-session-action="blocker" data-product-id="${item.product_id}" ${readiness.blocked ? '' : 'disabled'}>Open blocker</button>
            <button class="btn" type="button" data-work-session-action="done" data-product-id="${item.product_id}">${item.completed_at ? 'Undo done' : 'Mark done'}</button>
            <button class="btn" type="button" data-work-session-action="remove" data-product-id="${item.product_id}">Remove</button>
          </div>
        </article>`;
      }).join('');
      panel.innerHTML = `<div class="dd-work-session-head"><div><p class="eyebrow">Build 100 · browser-local planning</p><h3 style="margin:0">Product work session</h3><p class="small" style="margin:6px 0 0">Pin Products you want to work through, track browser-local completion, and jump to the next existing readiness blocker. No Product record is changed by this planner.</p></div><div class="dd-work-session-progress">${complete}/${total} done · ${active} active</div></div>
        <div class="dd-work-session-actions">
          <button class="btn" type="button" data-work-session-command="add-visible">Add visible Products</button>
          <button class="btn" type="button" data-work-session-command="next" ${next ? '' : 'disabled'}>Locate next Product</button>
          <button class="btn" type="button" data-work-session-command="next-blocker" ${blocked ? '' : 'disabled'}>Open next blocker</button>
          <button class="btn" type="button" data-work-session-command="clear-completed" ${complete ? '' : 'disabled'}>Clear completed</button>
          <button class="btn" type="button" data-work-session-command="clear" ${total ? '' : 'disabled'}>Clear session</button>
        </div>
        <div id="catalogWorkSessionMessage" class="small" role="status" aria-live="polite"></div>
        <div class="dd-work-session-list">${rows || '<p class="small">No Products are pinned yet. Use “Add to work” on a Product row or add the currently visible Products.</p>'}${total > 20 ? `<p class="small">Showing the first 20 of ${total} pinned Products.</p>` : ''}</div>`;
      syncRowButtons();
    }

    tableBody.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-work-session-toggle]');
      if (toggle) {
        event.preventDefault();
        const id = Number(toggle.dataset.workSessionToggle || 0) || 0;
        if (sessionItem(id)) removeProduct(id); else addProduct(id);
        render();
      }
    });

    document.addEventListener('click', (event) => {
      const command = event.target.closest('[data-work-session-command]');
      if (command) {
        const action = command.dataset.workSessionCommand;
        if (action === 'add-visible') addVisibleProducts();
        if (action === 'next') {
          const item = nextIncomplete();
          if (item) locateProduct(item.product_id);
        }
        if (action === 'next-blocker') {
          const item = nextBlocked();
          if (item) openBlocker(item.product_id);
        }
        if (action === 'clear-completed') {
          session.items = session.items.filter((item) => !item.completed_at);
          saveSession();
          render();
        }
        if (action === 'clear') {
          session = { items: [] };
          saveSession();
          render();
        }
        return;
      }
      const itemAction = event.target.closest('[data-work-session-action]');
      if (!itemAction) return;
      const id = Number(itemAction.dataset.productId || 0) || 0;
      const action = itemAction.dataset.workSessionAction;
      if (action === 'locate') locateProduct(id);
      if (action === 'blocker') openBlocker(id);
      if (action === 'done') {
        const item = sessionItem(id);
        if (item) setDone(id, !item.completed_at);
        render();
      }
      if (action === 'remove') {
        removeProduct(id);
        render();
      }
    });

    const observer = new MutationObserver(() => {
      window.clearTimeout(renderTimer);
      renderTimer = window.setTimeout(render, 80);
    });
    observer.observe(tableBody, { childList:true, subtree:true, characterData:true });
    window.addEventListener('storage', (event) => {
      if (event.key !== SESSION_KEY) return;
      session = loadSession();
      render();
    });
    render();
  });
})();
