// Release 467 Build 147 — Buyer Account, Saved Items & Order Hub.
// Device Saved reconciliation is explicit/user-triggered. Orders and Wishlist remain server-authoritative.
(function () {
  'use strict';

  const BUILD = 147;
  const SAVED_KEY = 'dd:saved-products:v1';
  const RECENT_KEY = 'dd_recently_viewed_products_v1';
  const ORDER_REFRESH_KEY = 'dd:member-orders:last-live-refresh:v147';

  if (!window.location.pathname.startsWith('/members')) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const text = (value) => String(value ?? '').trim();

  function readRows(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function readLastOrderRefresh() {
    try { return text(localStorage.getItem(ORDER_REFRESH_KEY)); } catch { return ''; }
  }

  function writeLastOrderRefresh(value) {
    try { localStorage.setItem(ORDER_REFRESH_KEY, value); } catch {}
  }

  function formatWhen(value) {
    if (!value) return 'Not refreshed in this browser yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  function ensureHub() {
    let hub = document.getElementById('buyerAccountHub147');
    if (hub) return hub;
    const members = document.getElementById('membersSection');
    if (!members) return null;
    hub = document.createElement('section');
    hub.id = 'buyerAccountHub147';
    hub.className = 'card';
    hub.style.marginBottom = '18px';
    hub.setAttribute('aria-labelledby', 'buyerAccountHub147Heading');
    members.prepend(hub);
    return hub;
  }

  function render(message = '', isError = false) {
    const hub = ensureHub();
    if (!hub) return;
    const saved = readRows(SAVED_KEY).filter((row) => Number(row?.product_id || 0) > 0);
    const recent = readRows(RECENT_KEY);
    const online = navigator.onLine !== false;
    const lastRefresh = readLastOrderRefresh();
    hub.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <div class="small">Release 467 • Build ${BUILD}</div>
          <h2 id="buyerAccountHub147Heading" style="margin:4px 0 0">Your buyer account hub</h2>
          <p class="small" style="margin:8px 0 0">Orders and account Wishlist below are live account data. Device Saved and Recently Viewed remain local to this browser until you choose to reconcile Saved items.</p>
        </div>
        <div class="small" role="status" aria-live="polite"><strong>${online ? 'Online' : 'Offline'}</strong>${online ? ' • live account refresh available' : ' • account mutations paused'}</div>
      </div>
      <div class="grid cols-3" style="gap:12px;margin-top:14px">
        <div class="card"><div class="small">Device Saved</div><strong>${saved.length}</strong><div class="small">Local browser copy; does not reserve inventory.</div></div>
        <div class="card"><div class="small">Recently Viewed</div><strong>${recent.length}</strong><div class="small">Private to this browser.</div></div>
        <div class="card"><div class="small">Orders last live refresh</div><strong style="font-size:.95rem">${esc(formatWhen(lastRefresh))}</strong><div class="small">A timestamp only; cached status is never presented as live.</div></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
        <a class="btn" href="#memberOrdersMount">Orders</a>
        <a class="btn" href="#memberWishlistMount">Account Wishlist</a>
        <a class="btn secondary" href="/saved/">Device Saved</a>
        <a class="btn secondary" href="#memberProfileMount">Profile</a>
        <button class="btn" type="button" id="syncDeviceSaved147" ${!online || !saved.length ? 'disabled' : ''}>Sync device Saved to account Wishlist</button>
      </div>
      <p class="small" style="margin:10px 0 0">Nothing syncs automatically. Sync is additive and idempotent: matching Wishlist items are kept, device Saved items are not deleted, and a live signed-in account connection is required.</p>
      <div id="buyerAccountHub147Message" class="small" style="${message ? 'margin-top:10px' : 'display:none'};${isError ? 'color:#b00020' : ''}">${esc(message)}</div>`;
    hub.querySelector('#syncDeviceSaved147')?.addEventListener('click', syncSaved);
  }

  async function syncSaved() {
    const rows = readRows(SAVED_KEY).filter((row) => Number(row?.product_id || 0) > 0);
    if (!rows.length) { render('There are no device Saved items to sync.'); return; }
    if (navigator.onLine === false) { render('Reconnect before syncing. Device Saved items remain available locally.', true); return; }
    if (!window.DDAuth?.apiFetch || !window.DDAuth?.isLoggedIn?.()) { render('A verified signed-in account is required before Saved items can be reconciled.', true); return; }

    const button = document.getElementById('syncDeviceSaved147');
    if (button) { button.disabled = true; button.textContent = 'Syncing…'; }
    let synced = 0;
    try {
      for (const row of rows) {
        const response = await window.DDAuth.apiFetch('/api/member/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: Number(row.product_id) })
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.message || data?.error || `Could not sync ${row.name || 'a saved item'}.`);
        synced += 1;
      }
      document.dispatchEvent(new CustomEvent('dd:build147:saved-synced', { detail: { count: synced } }));
      render(`Synced ${synced} device Saved item${synced === 1 ? '' : 's'} to the account Wishlist. The device copy was preserved.`);
    } catch (error) {
      render(error?.message || 'Saved-item sync could not be completed. Your device Saved list was not removed.', true);
    }
  }

  function observeOrderRefresh() {
    const attach = () => {
      const node = document.getElementById('memberOrdersMessage');
      if (!node || node.dataset.build147Observed === '1') return false;
      node.dataset.build147Observed = '1';
      const observer = new MutationObserver(() => {
        const value = text(node.textContent);
        if (/^Loaded \d+ order/i.test(value) && navigator.onLine !== false) {
          writeLastOrderRefresh(new Date().toISOString());
          render();
        }
      });
      observer.observe(node, { childList: true, characterData: true, subtree: true });
      return true;
    };
    if (!attach()) {
      const host = document.getElementById('memberOrdersMount');
      if (host) {
        const observer = new MutationObserver(() => { if (attach()) observer.disconnect(); });
        observer.observe(host, { childList: true, subtree: true });
      }
    }
  }

  function init() {
    render();
    observeOrderRefresh();
    window.addEventListener('online', () => render('Connection restored. Live account actions are available again.'));
    window.addEventListener('offline', () => render('Offline. Device Saved and Recently Viewed remain available; live account actions are paused.'));
    document.addEventListener('dd:saved:changed', () => render());
    document.addEventListener('dd:auth-ready', () => render());
    document.documentElement.dataset.buyerAccountHubBuild = String(BUILD);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
