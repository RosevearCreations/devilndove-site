// File: /public/js/admin-member-timeline.js
// Brief description: Build 190 compact customer/member timeline cards for the Members admin page.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('memberTimelineMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money = (value) => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(value || 0) / 100);
  async function load() {
    mount.innerHTML = '<p class="small">Loading unified customer timelines…</p>';
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/value-ops?customer_limit=24&days=90');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Timeline request failed.');
      const customers = Array.isArray(data.customers) ? data.customers : [];
      mount.innerHTML = `<div class="value-card-head"><div><h2 style="margin:0">Unified customer/member timeline</h2><p class="small">Orders, custom requests, gift cards, reviews, and guarded cart-recovery reviews in one place.</p></div><a class="btn secondary" href="/admin/command-center/#valueOpsCommandCenterMount">Open Command Center</a></div><div class="value-customer-grid">${customers.map((row)=>`<article class="card value-customer-card"><h3>${esc(row.customer_label || row.customer_email)}</h3><div class="small">${esc(row.customer_email || '')}</div><div class="small">Orders ${Number(row.order_count||0)} • Requests ${Number(row.custom_request_count||0)} • Gift cards ${Number(row.gift_card_count||0)} • Reviews ${Number(row.review_count||0)}</div><ol class="timeline-list">${(row.events||[]).slice(0,6).map((event)=>`<li><strong>${esc(event.event_label)}</strong><span>${esc(event.event_status||'')}${event.event_amount_cents?` • ${money(event.event_amount_cents)}`:''}</span><time>${esc(event.event_at||'')}</time></li>`).join('')}</ol></article>`).join('') || '<p class="small">No customer activity is available yet.</p>'}</div>`;
    } catch (error) {
      mount.innerHTML = `<p class="status-note danger">${esc(error.message || 'Timeline failed to load.')}</p>`;
    }
  }
  load();
});
