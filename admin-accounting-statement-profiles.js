// File: /public/js/admin-accounting-statement-profiles.js
// Brief description: Saved statement-import provider profiles for bank/PayPal/Stripe/Square/Etsy/manual CSV mappings.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('accountingStatementProviderProfilesMount');
  if (!mount || !window.DDAuth) return;

  mount.innerHTML = `
    <div class="card" id="statement-provider-profiles" style="margin-top:18px">
      <h2 style="margin-top:0">Statement import provider profiles</h2>
      <p class="small">Saved column mappings for bank, PayPal, Stripe, Square, Etsy, and manual CSVs. This lets us tune imports once instead of guessing every statement file.</p>
      <div id="statementProviderProfileMessage" class="small" style="display:none;margin:10px 0"></div>
      <form id="statementProviderProfileForm" class="grid cols-3" style="gap:10px">
        <div><label class="small">Provider scope</label><input name="provider_scope" placeholder="paypal" required /></div>
        <div><label class="small">Display name</label><input name="display_name" placeholder="PayPal Activity" required /></div>
        <div><label class="small">Default currency</label><input name="default_currency" maxlength="3" value="CAD" /></div>
        <div><label class="small">Date column</label><input name="date_column" placeholder="Date" /></div>
        <div><label class="small">Description column</label><input name="description_column" placeholder="Description" /></div>
        <div><label class="small">Reference column</label><input name="reference_column" placeholder="Transaction ID" /></div>
        <div><label class="small">Gross column</label><input name="gross_column" placeholder="Gross" /></div>
        <div><label class="small">Fee column</label><input name="fee_column" placeholder="Fee" /></div>
        <div><label class="small">Net column</label><input name="net_column" placeholder="Net" /></div>
        <div><label class="small">Currency column</label><input name="currency_column" placeholder="Currency" /></div>
        <div><label class="small">Active</label><select name="is_active"><option value="1">Active</option><option value="0">Inactive</option></select></div>
        <div style="display:flex;gap:10px;align-items:end"><button class="btn primary" type="submit">Save profile</button><button class="btn" id="seedStatementProviderProfilesButton" type="button">Seed defaults</button></div>
        <div style="grid-column:1/-1"><label class="small">Notes</label><textarea name="notes" rows="2" placeholder="Provider-specific import notes"></textarea></div>
      </form>
      <div id="statementProviderProfileList" class="small" style="margin-top:12px"></div>
    </div>`;

  const message = mount.querySelector('#statementProviderProfileMessage');
  const form = mount.querySelector('#statementProviderProfileForm');
  const list = mount.querySelector('#statementProviderProfileList');

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function setMessage(text, isError = false) {
    message.textContent = text || '';
    message.style.display = text ? 'block' : 'none';
    message.style.color = isError ? '#b00020' : '#0a7a2f';
  }
  async function readJson(response, fallbackMessage) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallbackMessage);
    return data;
  }
  function fillForm(row = {}) {
    Object.entries(row).forEach(([key, value]) => {
      const field = form.elements?.[key];
      if (field) field.value = value == null ? '' : String(value);
    });
  }
  function render(profiles = []) {
    list.innerHTML = `<div class="admin-table-wrap"><table><thead><tr><th>Provider</th><th>Columns</th><th>Status</th><th>Actions</th></tr></thead><tbody>${profiles.map((row) => `
      <tr>
        <td><strong>${escapeHtml(row.display_name || row.provider_scope)}</strong><div class="small">${escapeHtml(row.provider_scope || '')} • ${escapeHtml(row.default_currency || 'CAD')}</div></td>
        <td class="small">Date: ${escapeHtml(row.date_column || '—')} • Gross: ${escapeHtml(row.gross_column || '—')} • Fee: ${escapeHtml(row.fee_column || '—')} • Net: ${escapeHtml(row.net_column || '—')}<br>Reference: ${escapeHtml(row.reference_column || '—')} • Description: ${escapeHtml(row.description_column || '—')}</td>
        <td>${Number(row.is_active || 0) === 1 ? '<span class="admin-status-pill ok">active</span>' : '<span class="admin-status-pill muted">inactive</span>'}</td>
        <td><button class="btn" type="button" data-edit-provider="${escapeHtml(row.provider_scope || '')}">Edit</button></td>
      </tr>`).join('') || '<tr><td colspan="4">No provider profiles yet.</td></tr>'}</tbody></table></div>`;
    list.querySelectorAll('[data-edit-provider]').forEach((button) => {
      button.addEventListener('click', () => {
        const provider = button.getAttribute('data-edit-provider');
        const row = profiles.find((item) => item.provider_scope === provider);
        if (row) fillForm(row);
      });
    });
  }
  async function loadProfiles() {
    try {
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-statement-provider-profiles'), 'Statement provider profiles endpoint is unavailable.');
      render(Array.isArray(data.profiles) ? data.profiles : []);
    } catch (error) {
      setMessage(error.message || 'Failed to load statement provider profiles.', true);
    }
  }
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      setMessage('Saving provider profile...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-statement-provider-profiles', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) }), 'Failed to save provider profile.');
      render(Array.isArray(data.profiles) ? data.profiles : []);
      setMessage('Provider profile saved.');
      form.reset();
      form.elements.default_currency.value = 'CAD';
      form.elements.is_active.value = '1';
    } catch (error) {
      setMessage(error.message || 'Failed to save provider profile.', true);
    }
  });
  mount.querySelector('#seedStatementProviderProfilesButton')?.addEventListener('click', async () => {
    try {
      setMessage('Seeding default provider profiles...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-statement-provider-profiles', { method: 'POST', body: JSON.stringify({ action: 'seed_defaults' }) }), 'Failed to seed provider profiles.');
      render(Array.isArray(data.profiles) ? data.profiles : []);
      setMessage('Default provider profiles are ready.');
    } catch (error) {
      setMessage(error.message || 'Failed to seed provider profiles.', true);
    }
  });
  loadProfiles();
});
