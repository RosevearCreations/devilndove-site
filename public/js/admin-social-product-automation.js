// File: /public/js/admin-social-product-automation.js
// Build 210 — dedicated connection + automatic product-draft configuration.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('socialProductAutomationMount');
  if (!mount || !window.DDAuth) return;

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  async function readJson(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }
  function setMessage(message, error = false) {
    const el = document.getElementById('socialProductAutomationMessage');
    if (!el) return;
    el.textContent = message || '';
    el.hidden = !message;
    el.className = `social-automation-message ${error ? 'is-error' : 'is-ok'}`;
  }
  function values() {
    return {
      action: 'save',
      auto_queue_enabled: document.getElementById('socialAutoQueueEnabled')?.checked ? 1 : 0,
      auto_queue_on_review_status: document.getElementById('socialAutoQueueReviewStatus')?.value || 'approved',
      require_active_product: document.getElementById('socialRequireActive')?.checked ? 1 : 0,
      require_featured_image: document.getElementById('socialRequireFeaturedImage')?.checked ? 1 : 0,
      default_platforms: Array.from(document.querySelectorAll('[data-product-social-platform]:checked')).map((el) => el.value),
      caption_template_key: document.getElementById('socialProductCaptionTemplate')?.value || 'new_product',
      default_hashtags: document.getElementById('socialProductHashtags')?.value || '',
      default_utm_campaign: document.getElementById('socialProductCampaign')?.value || 'new_product',
      notes: document.getElementById('socialProductAutomationNotes')?.value || ''
    };
  }
  function platformCard(platform, data = {}) {
    const connected = Boolean(data.connected);
    const secrets = Array.isArray(data.secret_names) ? data.secret_names : [];
    return `<article class="social-connection-card ${connected ? 'is-connected' : 'is-unconfigured'}">
      <div class="social-connection-card-head"><h3>${esc(platform)}</h3><span class="admin-status-pill ${connected ? 'success' : 'muted'}">${connected ? 'Configured' : 'Setup required'}</span></div>
      <p class="small">${esc(data.capability || '')}</p>
      <p class="small"><strong>Cloudflare secret variables:</strong> ${secrets.map(esc).join(', ') || 'No automated credential yet'}</p>
      <p class="small"><strong>Mode:</strong> ${esc(String(data.mode || 'manual_ready').replace(/_/g, ' '))}</p>
    </article>`;
  }
  function render(data) {
    const settings = data?.settings || {};
    const platforms = Array.isArray(settings.default_platforms) ? settings.default_platforms : ['facebook','instagram','pinterest'];
    const status = data?.connection_status || {};
    mount.innerHTML = `
      <section class="card social-product-automation-panel">
        <div class="social-automation-heading">
          <div>
            <p class="eyebrow">Social publishing control</p>
            <h2>New Product Social Drafts</h2>
            <p>When enabled, a product that meets these rules creates one social post <strong>draft</strong>. The draft must still pass privacy review and be approved before a person uses the existing publish control. Nothing posts automatically from this screen.</p>
          </div>
          <a class="btn secondary" href="/admin/operations/#socialPostQueueAdminMount">Open Social Posting Queue</a>
        </div>
        <div class="social-policy-callout"><strong>Protection kept on:</strong> auto-publish is intentionally unavailable. Pixels track visitors; Page/account API permissions and protected server tokens are required for real posting.</div>
        <div class="social-automation-form-grid">
          <label class="social-toggle"><input id="socialAutoQueueEnabled" type="checkbox" ${Number(settings.auto_queue_enabled) === 1 ? 'checked' : ''}> <span><strong>Create a social draft when a product becomes eligible</strong><small>One idempotent draft per eligible product. It will not duplicate every save.</small></span></label>
          <label>Trigger status<select id="socialAutoQueueReviewStatus"><option value="approved" ${settings.auto_queue_on_review_status === 'approved' ? 'selected' : ''}>Approved or Published</option><option value="published" ${settings.auto_queue_on_review_status === 'published' ? 'selected' : ''}>Published only</option></select></label>
          <label class="social-toggle"><input id="socialRequireActive" type="checkbox" ${Number(settings.require_active_product) !== 0 ? 'checked' : ''}> <span><strong>Require Active/Published status</strong><small>Stops drafts for archived or inactive listings.</small></span></label>
          <label class="social-toggle"><input id="socialRequireFeaturedImage" type="checkbox" ${Number(settings.require_featured_image) !== 0 ? 'checked' : ''}> <span><strong>Require usable product image</strong><small>Stops drafts that cannot carry a useful product visual.</small></span></label>
          <label>Caption template key<input id="socialProductCaptionTemplate" value="${esc(settings.caption_template_key || 'new_product')}" maxlength="80"></label>
          <label>UTM campaign<input id="socialProductCampaign" value="${esc(settings.default_utm_campaign || 'new_product')}" maxlength="80"></label>
        </div>
        <fieldset class="social-platform-selector"><legend>Default draft destinations</legend>
          ${['facebook','instagram','pinterest','x','tiktok','youtube'].map((platform) => `<label><input type="checkbox" data-product-social-platform value="${platform}" ${platforms.includes(platform) ? 'checked' : ''}> ${platform}</label>`).join('')}
        </fieldset>
        <label class="social-full-field">Default hashtags<input id="socialProductHashtags" value="${esc(settings.default_hashtags || '')}" maxlength="500"></label>
        <label class="social-full-field">Internal notes<textarea id="socialProductAutomationNotes" rows="3" maxlength="1500" placeholder="For example: use clean product-only images and avoid a hard sales tone.">${esc(settings.notes || '')}</textarea></label>
        <div class="social-automation-actions"><button id="socialProductAutomationSave" type="button" class="btn primary">Save product social automation</button><span class="small">Changes are audited. Existing queue entries are not changed.</span></div>
        <p id="socialProductAutomationMessage" class="social-automation-message" hidden></p>
      </section>
      <section class="card social-connections-panel">
        <div class="social-automation-heading"><div><p class="eyebrow">Connection status</p><h2>Social account connections</h2><p>Credentials are shown only as their variable names; the app never displays secret values.</p></div><a class="btn" href="/admin/social-publishing/#setup-guide">Open setup guide</a></div>
        <div class="social-connection-grid">${Object.entries(status).map(([platform, item]) => platformCard(platform, item)).join('')}</div>
      </section>`;
  }
  async function load() {
    try {
      setMessage('Loading social automation settings...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-product-automation'));
      render(data);
      setMessage(data?.settings?.auto_queue_enabled ? 'Product social draft automation is enabled. Eligible product approvals create review-first drafts.' : 'Product social draft automation is currently disabled.');
    } catch (error) {
      setMessage(error.message || 'Could not load social automation settings.', true);
    }
  }
  mount.addEventListener('click', async (event) => {
    if (event.target?.id !== 'socialProductAutomationSave') return;
    try {
      setMessage('Saving social automation settings...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-product-automation', {
        method: 'POST',
        body: JSON.stringify(values())
      }));
      render(data);
      setMessage(data.message || 'Social automation settings saved.');
    } catch (error) {
      setMessage(error.message || 'Could not save social automation settings.', true);
    }
  });
  load();
});
