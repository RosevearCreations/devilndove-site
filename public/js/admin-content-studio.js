// Build 199 — Content Automation Studio admin workspace.
// Keeps content generation factual and review-first; no external publishing or media deletion occurs here.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('contentAutomationStudioMount');
  if (!mount || !window.DDAuth) return;

  const state = { projects: [], products: [], detail: null, busy: false };
  const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const plain = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const parseJson = (value, fallback = {}) => { try { return JSON.parse(value || ''); } catch { return fallback; } };
  const checked = (value) => Number(value || 0) === 1 ? 'checked' : '';
  const displayStatus = (value) => esc(String(value || 'needs review').replace(/_/g, ' '));
  const statusClass = (value) => `content-status ${esc(String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, ''))}`;
  const byId = (id) => document.getElementById(id);

  function message(text, type = 'info') {
    const node = byId('contentStudioMessage');
    if (!node) return;
    node.className = `content-studio-message ${type}`;
    node.textContent = text || '';
    node.hidden = !text;
  }

  async function request(payload) {
    const response = await window.DDAuth.apiFetch('/api/admin/content-studio', { method: 'POST', body: JSON.stringify(payload) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }

  async function load(projectId = '') {
    message('Loading content projects…');
    const endpoint = projectId ? `/api/admin/content-studio?project_id=${encodeURIComponent(projectId)}` : '/api/admin/content-studio';
    try {
      const response = await window.DDAuth.apiFetch(endpoint);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load the Content Automation Studio.');
      state.projects = Array.isArray(data.projects) ? data.projects : [];
      state.products = Array.isArray(data.approved_products) ? data.approved_products : [];
      state.detail = data.detail || (projectId ? null : state.detail);
      render();
      message(state.detail ? 'Content package loaded.' : 'Choose an approved product or an existing content package.', 'success');
    } catch (error) {
      render();
      message(error.message || 'Could not load the Content Automation Studio.', 'error');
    }
  }

  function visualPlaceholder(label, kind = 'image') {
    return `<div class="content-studio-placeholder" aria-label="${esc(label)}"><span aria-hidden="true">${kind === 'video' ? '▶' : '✦'}</span><small>${esc(label)}</small></div>`;
  }

  function mediaPreview(item) {
    const source = String(item.source_url || '');
    if (item.media_type === 'video' && source) return `<video class="content-archive-preview" src="${esc(source)}" muted preload="metadata" playsinline></video>`;
    if (source) return `<img class="content-archive-preview" src="${esc(source)}" alt="" loading="lazy"/>`;
    return visualPlaceholder(item.media_type === 'video' ? 'Video reference' : 'Image reference', item.media_type);
  }

  function counter(label, value, note = '') {
    return `<div class="content-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  }

  function productOptions() {
    const withProject = new Set(state.projects.map((project) => String(project.product_id || '')));
    const options = state.products.map((product) => {
      const productId = String(product.product_id || '');
      const hasPackage = withProject.has(productId);
      const label = `${product.name || 'Untitled product'}${product.product_category ? ` — ${product.product_category}` : ''}${hasPackage ? ' (package exists)' : ''}`;
      return `<option value="${esc(productId)}">${esc(label)}</option>`;
    }).join('');
    return `<option value="">Choose an approved finished product…</option>${options}`;
  }

  function projectList() {
    if (!state.projects.length) return `<div class="content-empty-state">No content package has been created yet. Approving a product will create one automatically; the selector above also lets us create or refresh one safely.</div>`;
    return state.projects.map((project) => {
      const active = String(state.detail?.project?.content_project_id || '') === String(project.content_project_id || '');
      const title = project.project_title || project.product_name || 'Untitled content package';
      return `<button type="button" class="content-project-row ${active ? 'is-active' : ''}" data-open-project="${esc(project.content_project_id)}">
        <span><strong>${esc(title)}</strong><small>${esc(project.product_name || project.source_type || 'Project')} • ${Number(project.media_count || 0)} archived • ${Number(project.deliverable_count || 0)} outputs</small></span>
        <span class="${statusClass(project.review_status)}">${displayStatus(project.review_status)}</span>
      </button>`;
    }).join('');
  }

  function deliverableSummary(detail) {
    const counts = detail?.counts || {};
    return [
      counter('YouTube', counts.youtube || 0, '1 long-form plan'),
      counter('Facebook', counts.facebook || 0, '3 video plans'),
      counter('Instagram', counts.instagram || 0, '5 Reel plans'),
      counter('TikTok', counts.tiktok || 0, '5 video plans'),
      counter('Website / GBP', (counts.website || 0) + (counts.google_business_profile || 0), 'gallery and photos'),
      counter('SEO / Blog', (counts.seo || 0) + (counts.blog || 0), 'written assets')
    ].join('');
  }

  function archiveGrid(detail) {
    const media = Array.isArray(detail?.media) ? detail.media : [];
    if (!media.length) return `<div class="content-empty-state">No source media is linked yet. Refreshing the archive links retained product images and media assets; it never deletes or overwrites originals.</div>`;
    return media.map((item) => `<article class="content-archive-card ${Number(item.is_selected || 0) === 1 ? 'is-selected' : ''}">
      <div class="content-archive-media">${mediaPreview(item)}</div>
      <div class="content-archive-copy">
        <div class="content-archive-head"><strong>${esc(item.media_type || 'image')}</strong><span>${esc(item.selection_score || 0)}/100</span></div>
        <small>${esc(item.selection_reason || 'Metadata score')}</small>
        <small class="content-archive-key">${esc(item.archive_path || item.archive_key || '')}</small>
        <label class="content-check"><input type="checkbox" data-media-selected="${esc(item.content_project_media_id)}" ${checked(item.is_selected)}/> Use in package</label>
        <label class="content-check"><input type="checkbox" data-media-featured="${esc(item.content_project_media_id)}" ${checked(item.is_featured)}/> Lead source</label>
        <label><span class="small">Public-use check</span><select class="input" data-media-safety="${esc(item.content_project_media_id)}">
          <option value="needs_review" ${item.safety_status === 'needs_review' ? 'selected' : ''}>Needs review</option>
          <option value="public_allowed" ${item.safety_status === 'public_allowed' ? 'selected' : ''}>Public allowed</option>
          <option value="internal_only" ${item.safety_status === 'internal_only' ? 'selected' : ''}>Internal only</option>
          <option value="blocked" ${item.safety_status === 'blocked' ? 'selected' : ''}>Blocked</option>
        </select></label>
        <button class="btn small" type="button" data-save-media="${esc(item.content_project_media_id)}">Save media choice</button>
      </div>
    </article>`).join('');
  }

  function deliverableCard(item) {
    const assetPlan = parseJson(item.asset_plan_json, {});
    const assetCount = Array.isArray(assetPlan.assets) ? assetPlan.assets.length : 0;
    const isSocial = ['facebook', 'instagram', 'tiktok', 'youtube'].includes(String(item.channel_key || ''));
    return `<details class="content-deliverable-card" data-deliverable-card="${esc(item.content_project_deliverable_id)}">
      <summary>
        <span><strong>${esc(item.title || item.deliverable_key)}</strong><small>${esc(item.channel_key || 'content').replace(/_/g, ' ')} • ${esc(item.deliverable_type || '')} • ${assetCount} linked source item${assetCount === 1 ? '' : 's'}</small></span>
        <span class="content-deliverable-statuses"><span class="${statusClass(item.deliverable_status)}">${displayStatus(item.deliverable_status)}</span><span class="${statusClass(item.approval_status)}">${displayStatus(item.approval_status)}</span></span>
      </summary>
      <div class="content-deliverable-body">
        <div class="content-deliverable-form-grid">
          <label><span class="small">Title</span><input class="input" data-deliverable-title="${esc(item.content_project_deliverable_id)}" value="${esc(item.title || '')}" maxlength="220"/></label>
          <label><span class="small">Output / rendered media URL</span><input class="input" data-deliverable-output="${esc(item.content_project_deliverable_id)}" value="${esc(item.output_url || '')}" placeholder="Add only after the finished file exists"/></label>
          <label><span class="small">Thumbnail URL</span><input class="input" data-deliverable-thumbnail="${esc(item.content_project_deliverable_id)}" value="${esc(item.thumbnail_url || '')}" placeholder="Optional finished thumbnail URL"/></label>
          <label><span class="small">Render / review state</span><select class="input" data-deliverable-status="${esc(item.content_project_deliverable_id)}">
            ${['planned','needs_media_review','ready_for_render','rendering','ready_for_review','approved','published','archived'].map((value) => `<option value="${value}" ${item.deliverable_status === value ? 'selected' : ''}>${esc(value.replace(/_/g, ' '))}</option>`).join('')}
          </select></label>
          <label><span class="small">Approval</span><select class="input" data-deliverable-approval="${esc(item.content_project_deliverable_id)}">
            ${['needs_review','approved','changes_requested','blocked'].map((value) => `<option value="${value}" ${item.approval_status === value ? 'selected' : ''}>${esc(value.replace(/_/g, ' '))}</option>`).join('')}
          </select></label>
          <label><span class="small">Aspect / target</span><input class="input" value="${esc(item.aspect_ratio || '')}${item.target_duration_seconds ? ` • ${item.target_duration_seconds}s` : ''}" readonly/></label>
        </div>
        <label><span class="small">Caption</span><textarea class="input" rows="5" data-deliverable-caption="${esc(item.content_project_deliverable_id)}">${esc(item.caption || '')}</textarea></label>
        <label><span class="small">Script / production directions</span><textarea class="input" rows="8" data-deliverable-script="${esc(item.content_project_deliverable_id)}">${esc(item.script_text || '')}</textarea></label>
        <label><span class="small">Written content / notes</span><textarea class="input" rows="8" data-deliverable-body="${esc(item.content_project_deliverable_id)}">${esc(item.body_content || '')}</textarea></label>
        <label><span class="small">Reviewer notes</span><textarea class="input" rows="3" data-deliverable-notes="${esc(item.content_project_deliverable_id)}">${esc(item.review_notes || '')}</textarea></label>
        <div class="content-deliverable-actions">
          <button class="btn primary" type="button" data-save-deliverable="${esc(item.content_project_deliverable_id)}">Save and lock edited copy</button>
          <button class="btn" type="button" data-copy-caption="${esc(item.content_project_deliverable_id)}">Copy caption</button>
          ${isSocial ? `<button class="btn secondary" type="button" data-send-social="${esc(item.content_project_deliverable_id)}">Send approved file to social queue</button>` : ''}
        </div>
      </div>
    </details>`;
  }

  function detailView(detail) {
    if (!detail?.project) return `<section class="card content-studio-welcome"><div>${visualPlaceholder('Content package visual placeholder')}</div><div><h2>One completed project, a calm content system</h2><p>Choose an approved product above, or create a content-only handoff from Creative Process. The studio links retained source references into a structured archive and prepares the full output plan for review.</p><ul><li>1 YouTube long-form video plan</li><li>3 Facebook video plans</li><li>5 Instagram Reels and 5 TikToks</li><li>Gallery, Google Business Profile, SEO, blog, thumbnail, and captions</li></ul></div></section>`;
    const project = detail.project;
    return `<section class="content-studio-detail">
      <div class="content-studio-detail-header card">
        <div><p class="eyebrow">${esc(project.content_project_key || '')}</p><h2>${esc(project.project_title || 'Content package')}</h2><p class="small">${project.source_type==='creative_project'?'Content-only Creative Project: no storefront product is required. ':''}Source references are archived without moving or deleting original files. Every public asset remains review-first.</p></div>
        <div class="content-studio-toolbar"><a class="btn secondary" href="/admin/creative-assets/?content_project_id=${esc(project.content_project_id)}">Open CAIP</a>${project.product_id?'<button class="btn" type="button" id="refreshContentArchive">Refresh archive and preserve edits</button><button class="btn" type="button" id="refreshContentCopy">Refresh only unlocked factual copy</button>':'<a class="btn" href="/admin/creative-process/">Refresh from Creative Process</a>'}<button class="btn secondary" type="button" id="downloadContentManifest">Download project manifest</button></div>
      </div>
      <div class="content-metric-grid">${deliverableSummary(detail)}</div>
      <section class="card content-project-settings">
        <h3>Project review controls</h3>
        <div class="content-project-settings-grid">
          <label><span class="small">Package title</span><input class="input" id="contentProjectTitle" value="${esc(project.project_title || '')}" maxlength="180"/></label>
          <label><span class="small">Story angle</span><input class="input" id="contentProjectAngle" value="${esc(project.story_angle || '')}" maxlength="320" placeholder="Example: workshop process and finished details"/></label>
          <label><span class="small">Package state</span><select class="input" id="contentProjectStatus">${['draft','review','approved','published','archived'].map((value) => `<option value="${value}" ${project.project_status === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></label>
          <label><span class="small">Package approval</span><select class="input" id="contentProjectApproval">${['needs_review','approved','changes_requested','blocked'].map((value) => `<option value="${value}" ${project.review_status === value ? 'selected' : ''}>${esc(value.replace(/_/g, ' '))}</option>`).join('')}</select></label>
          <label><span class="small">Public release</span><select class="input" id="contentProjectRelease">${['private','review_ready','approved_for_publish','published'].map((value) => `<option value="${value}" ${project.public_release_status === value ? 'selected' : ''}>${esc(value.replace(/_/g, ' '))}</option>`).join('')}</select></label>
        </div>
        <label><span class="small">Internal notes</span><textarea class="input" id="contentProjectNotes" rows="3" maxlength="4000">${esc(project.internal_notes || '')}</textarea></label>
        <button class="btn primary" type="button" id="saveContentProject">Save project review controls</button>
      </section>
      <section class="card"><div class="section-title-row"><div><h3>Structured media archive</h3><p class="small">Selection score uses recorded order, media roles, and existing metadata only. It is a review aid, not proof that an image is accurate or cleared for public use.</p></div><span class="${statusClass(project.public_release_status)}">${displayStatus(project.public_release_status)}</span></div><div class="content-archive-grid">${archiveGrid(detail)}</div></section>
      <section class="card"><div class="section-title-row"><div><h3>Review queue and production plans</h3><p class="small">A planned video is a render brief until a real output URL is attached. Sending to the social queue requires both an approved deliverable and finished media URL.</p></div><span class="small">${detail.deliverables?.length || 0} deliverables</span></div><div class="content-deliverable-list">${(detail.deliverables || []).map(deliverableCard).join('')}</div></section>
      <section class="card"><h3>Activity</h3><div class="content-event-list">${(detail.events || []).map((event) => `<div><strong>${esc(String(event.event_type || '').replace(/_/g, ' '))}</strong><span>${esc(event.created_at || '')}</span></div>`).join('') || '<p class="small">No project events recorded yet.</p>'}</div></section>
    </section>`;
  }

  function render() {
    const detail = state.detail;
    const selectedProduct = detail?.project?.product_id || '';
    mount.innerHTML = `<div id="contentStudioMessage" class="content-studio-message" hidden></div>
      <section class="content-studio-layout">
        <aside class="card content-studio-sidebar">
          <h2>Create or open a content package</h2>
          <p class="small">The studio creates one source-linked package per approved product. Content-only packages are created from Creative Process and remain separate from store inventory.</p>
          <label><span class="small">Approved finished product</span><select class="input" id="contentStudioProductSelect">${productOptions()}</select></label>
          <button class="btn primary" type="button" id="createContentProject">Create / refresh content package</button>
          <hr/>
          <h3>Existing packages</h3>
          <div class="content-project-list">${projectList()}</div>
        </aside>
        <main class="content-studio-main">${detailView(detail)}</main>
      </section>`;
    const select = byId('contentStudioProductSelect');
    if (select && selectedProduct) select.value = String(selectedProduct);
    bind();
  }

  function selectorForId(attributeSelector, id) {
    const raw = String(id ?? '');
    const escaped = (window.CSS && typeof window.CSS.escape === 'function')
      ? window.CSS.escape(raw)
      : raw.replace(/[^A-Za-z0-9_-]/g, '');
    return `${attributeSelector.replace(/]$/, '')}="${escaped}"]`;
  }

  function inputValue(selector, id) { return mount.querySelector(selectorForId(selector, id))?.value || ''; }
  function inputChecked(selector, id) { return Boolean(mount.querySelector(selectorForId(selector, id))?.checked); }

  async function saveProject() {
    const detail = state.detail;
    if (!detail?.project) return;
    const data = await request({
      action: 'update_project', content_project_id: detail.project.content_project_id,
      project_title: byId('contentProjectTitle')?.value || '', story_angle: byId('contentProjectAngle')?.value || '',
      project_status: byId('contentProjectStatus')?.value || 'draft', review_status: byId('contentProjectApproval')?.value || 'needs_review',
      public_release_status: byId('contentProjectRelease')?.value || 'private', internal_notes: byId('contentProjectNotes')?.value || ''
    });
    state.projects = data.projects || state.projects; state.products = data.approved_products || state.products; state.detail = data.detail || state.detail; render(); message('Project controls saved.', 'success');
  }

  async function saveMedia(mediaId) {
    const detail = state.detail;
    if (!detail?.project) return;
    const data = await request({
      action: 'update_media', content_project_id: detail.project.content_project_id, content_project_media_id: mediaId,
      is_selected: inputChecked('[data-media-selected]', mediaId) ? 1 : 0,
      is_featured: inputChecked('[data-media-featured]', mediaId) ? 1 : 0,
      safety_status: inputValue('[data-media-safety]', mediaId)
    });
    state.projects = data.projects || state.projects; state.products = data.approved_products || state.products; state.detail = data.detail || state.detail; render(); message('Archive media selection saved. This did not change the original source file.', 'success');
  }

  async function saveDeliverable(deliverableId) {
    const detail = state.detail;
    if (!detail?.project) return;
    const data = await request({
      action: 'update_deliverable', content_project_id: detail.project.content_project_id, content_project_deliverable_id: deliverableId,
      title: inputValue('[data-deliverable-title]', deliverableId), output_url: inputValue('[data-deliverable-output]', deliverableId),
      thumbnail_url: inputValue('[data-deliverable-thumbnail]', deliverableId), deliverable_status: inputValue('[data-deliverable-status]', deliverableId),
      approval_status: inputValue('[data-deliverable-approval]', deliverableId), caption: inputValue('[data-deliverable-caption]', deliverableId),
      script_text: inputValue('[data-deliverable-script]', deliverableId), body_content: inputValue('[data-deliverable-body]', deliverableId),
      review_notes: inputValue('[data-deliverable-notes]', deliverableId), copy_locked: 1
    });
    state.projects = data.projects || state.projects; state.products = data.approved_products || state.products; state.detail = data.detail || state.detail; render(); message('Deliverable saved. Edited text is now protected from automatic copy refresh.', 'success');
  }

  async function downloadManifest() {
    const detail = state.detail;
    if (!detail?.project) return;
    const response = await window.DDAuth.apiFetch('/api/admin/content-studio', { method: 'POST', body: JSON.stringify({ action: 'manifest', content_project_id: detail.project.content_project_id }) });
    if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.error || 'Could not download project manifest.'); }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${detail.project.content_project_key || 'content-project'}-manifest.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function bind() {
    byId('createContentProject')?.addEventListener('click', async () => {
      const productId = byId('contentStudioProductSelect')?.value || '';
      if (!productId) return message('Choose an approved finished product first.', 'error');
      try { message('Creating the source-linked archive and review package…'); const data = await request({ action: 'create_project', product_id: Number(productId) }); state.projects = data.projects || []; state.products = data.approved_products || []; state.detail = data.detail || null; render(); message('Content package created. Review media safety and each deliverable before publishing.', 'success'); }
      catch (error) { message(error.message || 'Could not create the content package.', 'error'); }
    });
    mount.querySelectorAll('[data-open-project]').forEach((button) => button.addEventListener('click', () => load(button.dataset.openProject)));
    byId('saveContentProject')?.addEventListener('click', () => saveProject().catch((error) => message(error.message, 'error')));
    byId('refreshContentArchive')?.addEventListener('click', async () => {
      try { const productId = Number(state.detail?.project?.product_id || 0); if (!productId) throw new Error('This package is not linked to a product source.'); message('Refreshing archive references while preserving our choices…'); const data = await request({ action: 'refresh_archive', product_id: productId }); state.projects = data.projects || []; state.products = data.approved_products || []; state.detail = data.detail || null; render(); message('Archive refreshed without deleting original media or replacing edited copy.', 'success'); } catch (error) { message(error.message, 'error'); }
    });
    byId('refreshContentCopy')?.addEventListener('click', async () => {
      try { const productId = Number(state.detail?.project?.product_id || 0); if (!productId) throw new Error('This package is not linked to a product source.'); message('Refreshing only unlocked factual copy…'); const data = await request({ action: 'refresh_archive', product_id: productId, refresh_copy: 1 }); state.projects = data.projects || []; state.products = data.approved_products || []; state.detail = data.detail || null; render(); message('Unlocked factual copy refreshed. Manually edited deliverables stayed protected.', 'success'); } catch (error) { message(error.message, 'error'); }
    });
    byId('downloadContentManifest')?.addEventListener('click', () => downloadManifest().catch((error) => message(error.message, 'error')));
    mount.querySelectorAll('[data-save-media]').forEach((button) => button.addEventListener('click', () => saveMedia(button.dataset.saveMedia).catch((error) => message(error.message, 'error'))));
    mount.querySelectorAll('[data-save-deliverable]').forEach((button) => button.addEventListener('click', () => saveDeliverable(button.dataset.saveDeliverable).catch((error) => message(error.message, 'error'))));
    mount.querySelectorAll('[data-copy-caption]').forEach((button) => button.addEventListener('click', () => { const value = inputValue('[data-deliverable-caption]', button.dataset.copyCaption); if (!value) return message('This deliverable has no caption to copy.', 'error'); navigator.clipboard?.writeText(value).then(() => message('Caption copied.', 'success')).catch(() => window.prompt('Copy caption:', value)); }));
    mount.querySelectorAll('[data-send-social]').forEach((button) => button.addEventListener('click', async () => { try { const data = await request({ action: 'send_to_social_queue', content_project_id: state.detail.project.content_project_id, content_project_deliverable_id: Number(button.dataset.sendSocial) }); state.projects = data.projects || state.projects; state.products = data.approved_products || state.products; state.detail = data.detail || state.detail; render(); message('Approved finished file added to the existing social review queue.', 'success'); } catch (error) { message(error.message, 'error'); } }));
  }

  render();
  load();
});
