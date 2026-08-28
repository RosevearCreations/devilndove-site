// Release 448 — shared Web / Phone / Desktop install and opt-in notification client.
(function () {
  'use strict';
  const RELEASE = 448;
  const ENABLE_KEY = 'dnd:new-item-notifications'; // retained for existing opt-in compatibility
  const LAST_ITEM_KEY = 'dnd:new-item-last-seen-id';
  const LAST_RELEASE_KEY = 'dnd:last-seen-release';
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

  function alertsEnabled() {
    return localStorage.getItem(ENABLE_KEY) === '1' && 'Notification' in window && Notification.permission === 'granted';
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

  async function showAppNotification(title, options = {}) {
    const registration = await registerServiceWorker();
    if (!registration || Notification.permission !== 'granted') return;
    await registration.showNotification(title, {
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-180.png',
      renotify: false,
      ...options,
    });
  }

  async function showItemNotification(item) {
    await showAppNotification('New at Devil n Dove', {
      body: String(item?.name || 'A new creation is available.'),
      tag: `dnd-new-item-${Number(item?.product_id || 0)}`,
      data: { url: String(item?.href || '/shop/') },
    });
  }

  async function showReleaseNotification() {
    await showAppNotification(`Devil n Dove Release ${RELEASE}`, {
      body: 'A new application release is available. Open Devil n Dove to use the latest version.',
      tag: `dnd-release-${RELEASE}`,
      data: { url: '/' },
    });
  }

  async function establishBaseline() {
    const items = await latestItems();
    if (items[0]?.product_id) localStorage.setItem(LAST_ITEM_KEY, String(items[0].product_id));
    localStorage.setItem(LAST_RELEASE_KEY, String(RELEASE));
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  }

  async function checkReleaseUpdate() {
    if (!alertsEnabled()) return { checked: false, reason: 'disabled' };
    let lastRelease = Number(localStorage.getItem(LAST_RELEASE_KEY) || 0);
    if (!lastRelease) {
      // Existing pre-448 notification opt-ins did not track releases; seed the prior release so
      // the first current-client launch can announce the upgrade exactly once.
      lastRelease = RELEASE - 1;
    }
    if (RELEASE <= lastRelease) return { checked: true, notified: 0 };
    await showReleaseNotification();
    localStorage.setItem(LAST_RELEASE_KEY, String(RELEASE));
    return { checked: true, notified: 1, release: RELEASE };
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

  async function enableAppNotifications() {
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

  function disableAppNotifications() {
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
    const enabled = alertsEnabled();
    const denied = Notification.permission === 'denied';
    mount.innerHTML = `<strong>Devil n Dove app</strong><div style="margin:6px 0">${denied ? 'Browser notifications are blocked in device settings.' : enabled ? 'New-release and new-item alerts are enabled.' : 'Enable alerts for new Devil n Dove releases and newly published items.'}</div><button class="btn" type="button" ${denied ? 'disabled' : ''}>${enabled ? 'Turn alerts off' : 'Enable app alerts'}</button>`;
    const button = mount.querySelector('button');
    button?.addEventListener('click', async () => {
      button.disabled = true;
      if (enabled) disableAppNotifications();
      else await enableAppNotifications();
    }, { once: true });
  }

  function checkAppUpdates() {
    checkReleaseUpdate().catch(() => null);
    checkNewItems().catch(() => null);
  }

  function init() {
    ensureManifest();
    registerServiceWorker();
    renderControl();
    checkAppUpdates();
    window.addEventListener('pageshow', checkAppUpdates);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkAppUpdates();
    });
  }

  window.DNDPWA = Object.freeze({
    release: RELEASE,
    register: registerServiceWorker,
    enableAppNotifications,
    disableAppNotifications,
    // Backward-compatible names retained for any existing UI hooks.
    enableNewItemNotifications: enableAppNotifications,
    disableNewItemNotifications: disableAppNotifications,
    checkReleaseUpdate,
    checkNewItems,
    installedMode,
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
