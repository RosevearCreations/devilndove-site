// Release 447 — shared Web / Phone / Desktop install and opt-in notification client.
(function () {
  'use strict';
  const RELEASE = 447;
  const ENABLE_KEY = 'dnd:new-item-notifications';
  const LAST_ITEM_KEY = 'dnd:new-item-last-seen-id';
  const LAST_CHECK_KEY = 'dnd:new-item-last-check-at';
  const CHECK_INTERVAL_MS = 15 * 60 * 1000;
  let registrationPromise = null;

  function installedMode() {
    return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  }

  function ensureManifest() {
    if (document.querySelector('link[rel="manifest"]')) return;
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.webmanifest';
    document.head.appendChild(link);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return Promise.resolve(null);
    if (!registrationPromise) {
      registrationPromise = navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
        console.warn('[DND PWA] service worker registration failed', error);
        return null;
      });
    }
    return registrationPromise;
  }

  async function latestItems() {
    try {
      const response = await fetch('/api/new-items?limit=5', { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) return [];
      const data = await response.json().catch(() => null);
      return Array.isArray(data?.items) ? data.items : [];
    } catch {
      return [];
    }
  }

  async function showItemNotification(item) {
    const registration = await registerServiceWorker();
    if (!registration || Notification.permission !== 'granted') return;
    await registration.showNotification('New at Devil n Dove', {
      body: String(item?.name || 'A new creation is available.'),
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-180.png',
      tag: `dnd-new-item-${Number(item?.product_id || 0)}`,
      renotify: false,
      data: { url: String(item?.href || '/shop/') },
    });
  }

  async function establishBaseline() {
    const items = await latestItems();
    if (items[0]?.product_id) localStorage.setItem(LAST_ITEM_KEY, String(items[0].product_id));
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  }

  async function checkNewItems({ force = false } = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return { checked: false, reason: 'permission' };
    if (localStorage.getItem(ENABLE_KEY) !== '1') return { checked: false, reason: 'disabled' };
    const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
    if (!force && lastCheck && Date.now() - lastCheck < CHECK_INTERVAL_MS) return { checked: false, reason: 'throttled' };

    const items = await latestItems();
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    if (!items.length) return { checked: true, notified: 0 };

    const lastSeen = Number(localStorage.getItem(LAST_ITEM_KEY) || 0);
    if (!lastSeen) {
      localStorage.setItem(LAST_ITEM_KEY, String(items[0].product_id));
      return { checked: true, notified: 0, baseline: true };
    }

    const unseen = [];
    for (const item of items) {
      if (Number(item.product_id || 0) === lastSeen) break;
      unseen.push(item);
    }
    for (const item of unseen.slice().reverse().slice(-3)) await showItemNotification(item);
    localStorage.setItem(LAST_ITEM_KEY, String(items[0].product_id));
    return { checked: true, notified: Math.min(unseen.length, 3) };
  }

  async function enableNewItemNotifications() {
    if (!('Notification' in window)) return { enabled: false, reason: 'unsupported' };
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      localStorage.removeItem(ENABLE_KEY);
      renderControl();
      return { enabled: false, permission };
    }
    localStorage.setItem(ENABLE_KEY, '1');
    await establishBaseline();
    renderControl();
    return { enabled: true, permission };
  }

  function disableNewItemNotifications() {
    localStorage.removeItem(ENABLE_KEY);
    renderControl();
    return { enabled: false };
  }

  function renderControl() {
    if (!installedMode() || !('Notification' in window)) return;
    let mount = document.getElementById('dndPwaNotificationControl');
    if (!mount) {
      mount = document.createElement('aside');
      mount.id = 'dndPwaNotificationControl';
      mount.className = 'card small';
      mount.setAttribute('aria-label', 'Installed app notifications');
      mount.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:1000;max-width:300px;padding:12px;box-shadow:0 8px 30px rgba(0,0,0,.25)';
      document.body.appendChild(mount);
    }
    const enabled = localStorage.getItem(ENABLE_KEY) === '1' && Notification.permission === 'granted';
    const denied = Notification.permission === 'denied';
    mount.innerHTML = `<strong>Devil n Dove app</strong><div style="margin:6px 0">${denied ? 'Browser notifications are blocked in device settings.' : enabled ? 'New-item alerts are enabled.' : 'Enable alerts for newly published Storefront items.'}</div><button class="btn" type="button" ${denied ? 'disabled' : ''}>${enabled ? 'Turn alerts off' : 'Enable new-item alerts'}</button>`;
    const button = mount.querySelector('button');
    button?.addEventListener('click', async () => {
      button.disabled = true;
      if (enabled) disableNewItemNotifications();
      else await enableNewItemNotifications();
    }, { once: true });
  }

  function init() {
    ensureManifest();
    registerServiceWorker();
    renderControl();
    checkNewItems().catch(() => null);
    window.addEventListener('pageshow', () => checkNewItems().catch(() => null));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkNewItems().catch(() => null);
    });
  }

  window.DNDPWA = Object.freeze({
    release: RELEASE,
    register: registerServiceWorker,
    enableNewItemNotifications,
    disableNewItemNotifications,
    checkNewItems,
    installedMode,
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
