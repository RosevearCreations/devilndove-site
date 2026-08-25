// Devil n Dove Build 407 Gift Card admin UI.
// Startup remains Build 385 read-only; explicit writes use Builds 404-407 Operations contracts.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('giftCardAdminMount');
  if (!mount || !window.DDAuth) return;

  const READ = '/api/admin/contracts/operations-gift-cards-read';
  const CARD_WRITE = '/api/admin/contracts/operations-gift-card-action-write';
  const TEMPLATE_WRITE = '/api/admin/contracts/operations-gift-card-template-write';
  const PROVIDER_WRITE = '/api/admin/contracts/operations-gift-card-provider-send-write';
  const ABUSE_WRITE = '/api/admin/contracts/operations-gift-card-abuse-write';

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  async function read(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Gift-card admin failed.');
    return data;
  }
  async function post(path, payload) {
    return read(await window.DDAuth.apiFetch(path, { method: 'POST', body: JSON.stringify(payload || {}) }));
  }
  function cardButtons(card) {
    const id = Number(card.gift_card_id || 0);
    const status = String(card.status || '').toLowerCase();
    const buttons = [];
    if (status !== 'active') buttons.push(`<button class="btn gift-card-action" data-action="activate_paid" data-id="${id}" type="button">Activate paid</button>`);
    if (!['void','refunded','reissued'].includes(status)) buttons.push(`<button class="btn gift-card-action" data-action="void" data-id="${id}" type="button">Void</button>`);
    if (Number(card.remaining_amount_cents || 0) > 0) buttons.push(`<button class="btn gift-card-action" data-action="refund" data-id="${id}" data-balance="${Number(card.remaining_amount_cents || 0)}" type="button">Reduce/refund</button>`);
    if (!['void','reissued'].includes(status) && Number(card.remaining_amount_cents || 0) > 0) buttons.push(`<button class="btn gift-card-action" data-action="reissue" data-id="${id}" type="button">Reissue</button>`);
    return buttons.join(' ');
  }
  function render(data) {
    const templates = data.templates || [];
    const attempts = data.attempts || [];
    const lockouts = data.lockouts || [];
    const cards = data.cards || [];
    const queue = data.queue || [];
    const logs = data.logs || [];
    const summary = data.summary || {};
    const schemaNotice = data.schema_ready === true
      ? '<p class="small">Gift Card read schema ready. Automatic page load performs no schema mutation.</p>'
      : `<p class="small"><strong>Gift Card read partially available.</strong> Missing: ${esc((data.missing_tables || []).join(', ') || 'none')}. ${esc((data.query_errors || []).map((x) => x.message).join(' | '))}</p>`;

    mount.innerHTML = `${schemaNotice}
      <section class="card" style="margin-top:12px"><h2 style="margin-top:0">Gift cards</h2>
        <p class="small">Cards: ${esc(summary.cards || 0)} • Redemptions: ${esc(summary.redemptions || 0)}. Card-state writes use the Build 404 Operations contract.</p>
        <div class="admin-table-wrap"><table><thead><tr><th>Code</th><th>Recipient</th><th>Status</th><th>Balance</th><th>Order</th><th>Actions</th></tr></thead><tbody>
          ${cards.slice(0,80).map((card) => `<tr><td>${esc(card.code || '')}<div class="small">#${esc(card.gift_card_id || '')}</div></td><td>${esc(card.recipient_email || card.issued_to_email || '')}<div class="small">${esc(card.recipient_name || card.issued_to_name || '')}</div></td><td>${esc(card.status || '')}</td><td>${esc(card.currency || 'CAD')} ${(Number(card.remaining_amount_cents || 0)/100).toFixed(2)}</td><td>${esc(card.order_id || '—')}</td><td>${cardButtons(card) || '—'}</td></tr>`).join('') || '<tr><td colspan="6">No gift cards found.</td></tr>'}
        </tbody></table></div>
      </section>
      <div class="grid cols-2" style="margin-top:12px"><section class="card"><h2 style="margin-top:0">Delivery templates</h2>${templates.map((t) => `<form class="gift-template-form" data-template="${esc(t.template_key)}"><label class="small">Template key<input name="template_key" value="${esc(t.template_key)}"></label><label class="small">Subject<input name="subject" value="${esc(t.subject || '')}"></label><label class="small">Body<textarea name="body" rows="6">${esc(t.body || '')}</textarea></label><button class="btn" type="submit">Save template</button></form>`).join('') || '<p class="small">No templates found. Apply the Gift Card parity migration before editing templates.</p>'}</section><section class="card"><h2 style="margin-top:0">Provider delivery</h2><p class="small">Active provider: <strong>${esc(data.provider || 'manual')}</strong>. Sent: ${esc(summary.sent || 0)} • Failed: ${esc(summary.failed || 0)} • Queued: ${esc(summary.queued || 0)}</p><button class="btn primary" id="giftProviderSendButton" type="button">Send next queued item through provider</button><button class="btn" id="giftQueueOutboxButton" type="button">Move queued to notification outbox</button><h3>Manual resend</h3><label class="small">Gift card ID<input id="giftResendId" type="number"></label><label class="small">Recipient email<input id="giftResendEmail" type="email"></label><label class="small">Template<select id="giftResendTemplate">${templates.map((t) => `<option value="${esc(t.template_key)}">${esc(t.template_key)}</option>`).join('')}</select></label><button class="btn" id="giftResendButton" type="button">Queue resend</button></section></div>
      <div class="grid cols-2" style="margin-top:12px"><section class="card"><h2>Lockouts and abuse review</h2><p class="small">High risk groups: ${esc(summary.high_risk || 0)} • Active lockouts: ${esc(summary.active_lockouts || 0)}. Lock/unlock uses stable lockout IDs.</p><div class="admin-table-wrap"><table><thead><tr><th>Email/code</th><th>Attempts</th><th>Severity</th><th>Action</th></tr></thead><tbody>${attempts.slice(0,40).map((a) => `<tr><td>${esc(a.lookup_email || '')}<div class="small">${esc(a.code_suffix || '')}</div></td><td>${esc(a.attempt_count || 0)}</td><td>${esc(a.severity_label || a.severity_score || 'low')}</td><td>${a.is_locked ? 'Locked' : `<button class="btn gift-abuse-lock" data-email="${esc(a.lookup_email || '')}" data-suffix="${esc(a.code_suffix || '')}" data-ip="${esc(a.ip_hash || '')}" type="button">Lock 7 days</button>`}</td></tr>`).join('') || '<tr><td colspan="4">No abuse attempts found.</td></tr>'}</tbody></table></div><h3>Active lockouts</h3><div class="admin-table-wrap"><table><thead><tr><th>ID</th><th>Identifier</th><th>Expires</th><th>Action</th></tr></thead><tbody>${lockouts.map((l) => `<tr><td>${esc(l.gift_card_lookup_lockout_id || '')}</td><td>${esc(l.lookup_email || l.code_suffix || l.ip_hash || '')}</td><td>${esc(l.expires_at || '')}</td><td><button class="btn gift-abuse-unlock" data-id="${esc(l.gift_card_lookup_lockout_id || '')}" type="button">Release</button></td></tr>`).join('') || '<tr><td colspan="4">No active lockouts.</td></tr>'}</tbody></table></div></section><section class="card"><h2>Customer history cards</h2><label class="small">Customer email<input id="giftHistoryEmail" type="email" placeholder="customer@example.com"></label><button class="btn" id="giftHistoryButton" type="button">Load history</button><div id="giftHistoryResults" class="small"></div></section></div>
      <section class="card" style="margin-top:12px"><h2>Provider send logs</h2><div class="admin-table-wrap"><table><thead><tr><th>Date</th><th>Provider</th><th>Recipient</th><th>Status</th><th>Error</th></tr></thead><tbody>${logs.map((l) => `<tr><td>${esc(l.created_at || '')}</td><td>${esc(l.provider || '')}</td><td>${esc(l.recipient_email || '')}</td><td>${esc(l.send_status || '')}</td><td>${esc(l.error_text || '')}</td></tr>`).join('') || '<tr><td colspan="5">No provider send logs yet.</td></tr>'}</tbody></table></div></section>`;
    wire();
  }
  async function load() {
    mount.innerHTML = '<p class="small">Loading gift-card admin…</p>';
    try { render(await read(await window.DDAuth.apiFetch(READ))); }
    catch (error) { mount.innerHTML = `<p class="small">${esc(error.message || 'Gift-card admin failed.')}</p>`; }
  }
  async function saveTemplate(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    await post(TEMPLATE_WRITE, payload); await load();
  }
  async function resend() {
    await post(TEMPLATE_WRITE, { action:'resend', gift_card_id:Number(document.getElementById('giftResendId')?.value || 0), recipient_email:document.getElementById('giftResendEmail')?.value || '', template_key:document.getElementById('giftResendTemplate')?.value || 'activation' }); await load();
  }
  async function providerAction(payload) { await post(PROVIDER_WRITE, payload); await load(); }
  async function cardAction(button) {
    const action = button.dataset.action || '';
    const gift_card_id = Number(button.dataset.id || 0);
    const payload = { action, gift_card_id, note: window.prompt('Optional admin note:', '') || '' };
    if (action === 'refund') {
      const balance = Number(button.dataset.balance || 0);
      const raw = window.prompt(`Reduction/refund amount in cents (maximum ${balance}):`, String(balance));
      if (raw == null) return;
      payload.amount_cents = Math.max(0, Math.min(balance, Number(raw || 0)));
      if (!payload.amount_cents) return;
    }
    await post(CARD_WRITE, payload); await load();
  }
  async function lock(button) {
    await post(ABUSE_WRITE, { action:'lock', lookup_email:button.dataset.email || '', code_suffix:button.dataset.suffix || '', ip_hash:button.dataset.ip || '', expires_in:'+7 days', lockout_reason:'Locked from Gift Card admin abuse review.' }); await load();
  }
  async function unlock(button) {
    await post(ABUSE_WRITE, { action:'unlock', gift_card_lookup_lockout_id:Number(button.dataset.id || 0), notes:'Released from Gift Card admin.' }); await load();
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
    mount.querySelectorAll('.gift-card-action').forEach((button) => button.addEventListener('click', () => cardAction(button)));
    mount.querySelectorAll('.gift-abuse-lock').forEach((button) => button.addEventListener('click', () => lock(button)));
    mount.querySelectorAll('.gift-abuse-unlock').forEach((button) => button.addEventListener('click', () => unlock(button)));
    document.getElementById('giftResendButton')?.addEventListener('click', resend);
    document.getElementById('giftProviderSendButton')?.addEventListener('click', () => providerAction({ action:'send_provider', limit:1 }));
    document.getElementById('giftQueueOutboxButton')?.addEventListener('click', () => providerAction({ action:'queue_outbox', limit:10 }));
    document.getElementById('giftHistoryButton')?.addEventListener('click', loadHistory);
  }
  document.documentElement.dataset.ddGiftCardMutationUiBuild = '407';
  load();
});
