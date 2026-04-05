// File: /public/js/admin-panel-routing.js
// Brief description: Keeps admin quick links and member-preview links consistent and opens
// collapsed admin panels when the page loads with a section hash.

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    const panel = target?.closest?.('[data-admin-panel]');
    const toggle = panel?.querySelector?.('.admin-panel-toggle');
    if (panel && panel.dataset.panelOpen !== '1') toggle?.click();
    target?.scrollIntoView?.({ block: 'start' });
  }

  document.querySelectorAll('a[href="/members/"], a[href^="/members/#"]').forEach((link) => {
    const url = new URL(link.getAttribute('href'), window.location.origin);
    url.searchParams.set('admin_preview', '1');
    link.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
  });
});
