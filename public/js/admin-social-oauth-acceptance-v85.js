// Release 467 Build 85 — Socials / OAuth acceptance UI.
// Read-only except that an explicit administrator may choose to follow the guarded OAuth start link.

(() => {
  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const label = (value) => String(value || '').replace(/_/g, ' ');

  function checkRow(name, ok, detail = '') {
    return `<li class="social-oauth-v85-check ${ok ? 'is-ok' : 'is-hold'}"><span aria-hidden="true">${ok ? '✓' : '•'}</span><div><strong>${esc(name)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</div></li>`;
  }

  function render(mount, data) {
    const a = data?.acceptance || {};
    const c = a?.checks || {};
    const queue = a?.queue || {};
    const provider = data?.selected_provider || 'none selected';
    const statusClass = String(a?.status || '').includes('ready_') ? 'success' : String(a?.status || '').includes('production_closed') ? 'muted' : 'warning';
    const connection = data?.connection || null;

    mount.innerHTML = `
      <section class="card social-oauth-v85" id="social-oauth-acceptance">
        <div class="social-oauth-v85-head">
          <div>
            <p class="eyebrow">Release 467 · Build 85</p>
            <h2>Controlled Social OAuth Acceptance</h2>
            <p>One selected provider may be authorized only in Development. Intended-account verification and a human-approved queue draft are required evidence. This panel does not publish anything.</p>
          </div>
          <span class="admin-status-pill ${statusClass}">${esc(label(a?.status || 'loading'))}</span>
        </div>

        <div class="social-oauth-v85-summary">
          <article><span>Selected provider</span><strong>${esc(provider)}</strong></article>
          <article><span>OAuth connection</span><strong>${esc(connection ? label(connection.intended_account_verification || connection.connection_status) : 'not connected')}</strong></article>
          <article><span>Approved queue drafts</span><strong>${Number(queue.human_approved_queue_items || 0)}</strong></article>
          <article><span>Publication</span><strong>Fail-closed</strong></article>
        </div>

        <ul class="social-oauth-v85-checks">
          ${checkRow('One provider selected', c.provider_selected, data?.selected_provider_reference || '')}
          ${checkRow('Development host', c.development_host, c.development_host ? 'Development Preview' : 'Production/non-Development stays closed')}
          ${checkRow('Explicit operator switch', c.explicit_operator_switch, data?.global_operator_switch_reference || '')}
          ${checkRow('Selected-provider authorization gate', c.selected_provider_authorization_open, 'Both the operator switch and provider selection must agree')}
          ${checkRow('Encryption authority', c.encryption_authority_ready, 'OAuth token values remain encrypted and redacted')}
          ${checkRow('Provider configuration', c.provider_configuration_ready)}
          ${checkRow('Intended account configured', c.intended_account_configured, data?.intended_account_label || 'No account label exposed')}
          ${checkRow('Identity lookup configuration', c.identity_lookup_configuration_ready)}
          ${checkRow('OAuth connection healthy', c.connection_present && c.connection_healthy)}
          ${checkRow('Intended account verified', c.intended_account_verified, 'Provider subject identifiers are not shown')}
          ${checkRow('Explicit human-approved draft', c.human_approval_present, `${Number(queue.targeted_queue_items || 0)} targeted open queue item(s)`)}
          ${checkRow('Provider publication remains closed', c.provider_publication_closed, 'No automatic or provider publication is authorized by Build 85')}
        </ul>

        <div class="social-oauth-v85-next"><strong>Next safe action</strong><p>${esc(a?.next_action || '')}</p></div>
        <div class="social-oauth-v85-actions">
          ${data?.start_authorization_available && data?.start_authorization_path
            ? `<a class="btn primary" href="${esc(data.start_authorization_path)}">Begin ${esc(provider)} OAuth acceptance</a>`
            : ''}
          <button class="btn" id="socialOauthV85Refresh" type="button">Refresh acceptance evidence</button>
          <a class="btn" href="#socialPostQueueAdminMount">Open human review queue</a>
          <a class="btn" href="/admin/it-integrations/">Open I.T. Integrations</a>
        </div>
        <p class="small social-oauth-v85-boundary"><strong>Safety boundary:</strong> secret values are never returned; provider subject IDs are never returned; Production OAuth is closed; provider execution/publication is closed; raw CAIP media is not changed.</p>
      </section>`;
  }

  function renderError(mount, error) {
    mount.innerHTML = `<section class="card social-oauth-v85" id="social-oauth-acceptance"><p class="eyebrow">Release 467 · Build 85</p><h2>Controlled Social OAuth Acceptance</h2><p class="social-oauth-v85-error">${esc(error?.message || 'Acceptance evidence could not be loaded.')}</p><button class="btn" id="socialOauthV85Refresh" type="button">Retry</button></section>`;
  }

  async function load(mount) {
    if (!window.DDAuth?.apiFetch) {
      renderError(mount, new Error('Admin authentication client is unavailable.'));
      return;
    }
    try {
      mount.setAttribute('aria-busy', 'true');
      const response = await window.DDAuth.apiFetch('/api/admin/social-oauth-acceptance');
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `Acceptance request failed (${response.status})`);
      render(mount, data);
    } catch (error) {
      renderError(mount, error);
    } finally {
      mount.removeAttribute('aria-busy');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('socialOAuthAcceptanceMount');
    if (!mount) return;
    mount.addEventListener('click', (event) => {
      if (event.target?.id === 'socialOauthV85Refresh') load(mount);
    });
    load(mount);
  });
})();
