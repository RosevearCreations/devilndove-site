// Devil n Dove Build 386 Gift Card admin UI.
// Automatic page load uses only the Operations-owned non-mutating Build 385 read.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('giftCardAdminMount');
  if (!mount || !window.DDAuth) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  async function read(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Gift-card admin failed.');
    return data;
  }
  function render(data) {
    const templates = data.templates || [];
    const attempts = data.attempts || [];
    const queue = data.queue || [];
    const logs = data.logs || [];
    const summary = data.summary || {};
    const schemaNotice = data.schema_ready === true
      ? '<p class="small">Gift Card read schema ready. Automatic page load performs no schema mutation.</p>'
      : `<p class="small"><strong>Gift Card read partially available.</strong> Missing: ${esc((data.missing_tables || []).join(', ') || 'none')}. ${esc((data.query_errors || []).map((x) => x.message).join(' | '))}</p>`;
    mount.innerHTML = `${schemaNotice}<div class="grid cols-2"><section class="card"><h2 style="margin-top:0">Delivery templates</h2>${templates.map((t) => `<form class="gift-template-form" data-template="${esc(t.template_key)}"><label class="small">Template key<input name="template_key" value="${esc(t.template_key)}"></label><label class="small">Subject<input name="subject" value="${esc(t.subject || '')}"></label><label class="small">Body<textarea name="body" rows="6">${esc(t.body || '')}</textarea></label><button class="btn" type="submit">Save template</button></form>`).join('') || '<p class="small">No templates found. Apply the Gift Card parity migration before editing templates.</p>'}</section><section class="card"><h2 style="margin-top:0">Provider delivery</h2><p class="small">Active provider: <strong>${esc(data.provider || 'manual')}</strong>. Sent: ${esc(summary.sent || 0)} • Failed: ${esc(summary.failed || 0)} • Queued: ${esc(summary.queued || 0)}</p><button class="btn primary" id="giftProviderSendButton" type="button">Send next queued item through provider</button><button class="btn" id="giftQueueOutboxButton" type="button">Move queued to notification outbox</button><h3>Manual resend</h3><label class="small">Gift card ID<input id="giftResendId" type="number"></label><label class="small">Recipient email<input id="giftResendEmail" type="email"></label><label class="small">Template<select id="giftResendTemplate">${templates.map((t) => `<option value="${esc(t.template_key)}">${esc(t.template_key)}</option>`).join('')}</select></label><button class="btn" id="giftResendButton" type="button">Queue resend</button></section></div><div class="grid cols-2" style="margin-top:12px"><section class="card"><h2>Lockouts and abuse review</h2><p class="small">High risk groups: ${esc(summary.high_risk || 0)}. Release controls remain compatibility-owned pending the Build 387 mutation audit.</p><div class="admin-table-wrap"><table><thead><tr><th>Email/code</th><th>Attempts</th><th>Severity</th><th>Lock</th></tr></thead><tbody>${attempts.slice(0, 40).map((a) => `<tr><td>${esc(a.lookup_email || '')}<div class="small">${esc(a.code_suffix || '')}</div></td><td>${esc(a.attempt_count || 0)}</td><td>${esc(a.severity_label || a.severity_score || 'low')}</td><td>${a.is_locked ? 'Active' : '—'}</td></tr>`).join('') || '<tr><td colspan="4">No abuse attempts found.</td></tr>'}</tbody></table></div></section><section class="card"><h2>Customer history cards</h2><label class="small">Customer email<input id="giftHistoryEmail" type="email" placeholder="customer@example.com"></label><button class="btn" id="giftHistoryButton" type="button">Load history</button><div id="giftHistoryResults" class="small"></div><p class="small">Cards loaded: ${esc(summary.cards || 0)} • Redemptions: ${esc(summary.redemptions || 0)}</p></section></div><section class="card" style="margin-top:12px"><h2>Provider send logs</h2><div class="admin-table-wrap"><table><thead><tr><th>Date</th><th>Provider</th><th>Recipient</th><th>Status</th><th>Error</th></tr></thead><tbody>${logs.map((l) => `<tr><td>${esc(l.created_at || '')}</td><td>${esc(l.provider || '')}</td><td>${esc(l.recipient_email || '')}</td><td>${esc(l.send_status || '')}</td><td>${esc(l.error_text || '')}</td></tr>`).join('') || '<tr><td colspan="5">No provider send logs yet.</td></tr>'}</tbody></table></div></section>`;
    wire();
  }
  async function load() {
    mount.innerHTML = '<p class="small">Loading gift-card admin…</p>';
    try {
      const data = await read(await window.DDAuth.apiFetch('/api/admin/contracts/operations-gift-cards-read'));
      render(data);
    } catch (error) {
      mount.innerHTML = `<p class="small">${esc(error.message || 'Gift-card admin failed.')}</p>`;
    }
  }
  async function saveTemplate(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    await read(await window.DDAuth.apiFetch('/api/admin/gift-card-delivery-templates', { method: 'POST', body: JSON.stringify(payload) }));
    await load();
  }
  async function resend() {
    await read(await window.DDAuth.apiFetch('/api/admin/gift-card-delivery-templates', { method: 'POST', body: JSON.stringify({ action: 'resend', gift_card_id: Number(document.getElementById('giftResendId')?.value || 0), recipient_email: document.getElementById('giftResendEmail')?.value || '', template_key: document.getElementById('giftResendTemplate')?.value || 'activation' }) }));
    await load();
  }
  async function action(payload) {
    await read(await window.DDAuth.apiFetch('/api/admin/gift-card-delivery-send', { method: 'POST', body: JSON.stringify(payload) }));
    await load();
  }
  async function loadHistory() {
    const email = document.getElementById('giftHistoryEmail')?.value || '';
    const box = document.getElementById('giftHistoryResults');
    try {
      const data = await read(await window.DDAuth.apiFetch(`/api/admin/gift-card-delivery-history?email=${encodeURIComponent(email)}`));
      box.innerHTML = (data.history || []).map((row) => `<article class="card" style="margin:8px 0"><strong>${esc(row.delivery_kind || 'delivery')} • ${esc(row.delivery_status || '')}</strong><div>${esc(row.recipient_email || '')} • Gift card #${esc(row.gift_card_id || '')}</div><div>${esc(row.queued_at || '')}</div></article>`).join('') || 'No delivery history found.';
    } catch (error) { box.textContent = error.message; }
  }
  function wire() {
    mount.querySelectorAll('.gift-template-form').forEach((form) => form.addEventListener('submit', saveTemplate));
    document.getElementById('giftResendButton')?.addEventListener('click', resend);
    document.getElementById('giftProviderSendButton')?.addEventListener('click', () => action({ action: 'send_provider', limit: 1 }));
    document.getElementById('giftQueueOutboxButton')?.addEventListener('click', () => action({ action: 'queue_outbox', limit: 10 }));
    document.getElementById('giftHistoryButton')?.addEventListener('click', loadHistory);
  }
  load();
});
