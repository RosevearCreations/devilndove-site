// Build 200 — Admin Content Release Board client.
(() => {
  'use strict';
  const mount = document.getElementById('contentReleaseBoardMount');
  if (!mount) return;
  const state = { projects: [], publications: [], selectedProjectId: 0, busy: false };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const clean = (value) => String(value ?? '').trim();
  const byId = (id) => document.getElementById(id);
  const selected = () => Number(state.selectedProjectId || 0);
  const selectedPublications = () => state.publications.filter((item) => !selected() || Number(item.content_project_id || 0) === selected());
  const status = (value) => `<span class="content-status ${esc(clean(value).toLowerCase() || 'draft')}">${esc(clean(value).replace(/_/g, ' ') || 'draft')}</span>`;
  const count = (items, predicate) => items.filter(predicate).length;

  function message(text, tone = 'info') {
    const node = byId('contentReleaseMessage');
    if (!node) return;
    node.textContent = text || '';
    node.className = `content-studio-message ${tone}`;
    node.hidden = !text;
  }

  async function api(payload = null) {
    const response = await window.DDAuth.apiFetch('/api/admin/content-publications', payload ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    } : { method: 'GET' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Content Release Board request failed.');
    return data;
  }

  function updateState(data) {
    state.projects = Array.isArray(data?.projects) ? data.projects : state.projects;
    state.publications = Array.isArray(data?.publications) ? data.publications : state.publications;
    if (!state.selectedProjectId && state.publications[0]?.content_project_id) state.selectedProjectId = Number(state.publications[0].content_project_id);
    if (!state.selectedProjectId && state.projects[0]?.content_project_id) state.selectedProjectId = Number(state.projects[0].content_project_id);
  }

  function projectOptions() {
    const prepared = new Set(state.publications.map((item) => Number(item.content_project_id || 0)));
    const rows = state.projects.filter((item) => Number(item.content_project_id || 0));
    return `<option value="">All prepared content projects</option>${rows.map((item) => `<option value="${Number(item.content_project_id)}" ${Number(item.content_project_id) === selected() ? 'selected' : ''}>${esc(item.project_title || item.content_project_key || `Project #${item.content_project_id}`)}${prepared.has(Number(item.content_project_id)) ? '' : ' — no web drafts yet'}</option>`).join('')}`;
  }

  function readiness(item) {
    const checks = Array.isArray(item?.readiness?.checks) ? item.readiness.checks : [];
    const blockers = Array.isArray(item?.readiness?.blockers) ? item.readiness.blockers : [];
    return `<div class="content-publication-readiness">
      <strong>${item?.readiness?.ready ? 'Release checks pass' : `${blockers.length} release blocker${blockers.length === 1 ? '' : 's'}`}</strong>
      <ul>${checks.map((check) => `<li class="${check.pass ? 'pass' : (check.required ? 'blocker' : 'warning')}"><span aria-hidden="true">${check.pass ? '✓' : (check.required ? '!' : '•')}</span><div><b>${esc(check.label)}</b><small>${esc(check.detail)}</small></div></li>`).join('')}</ul>
    </div>`;
  }

  function publicationCard(item) {
    const media = Array.isArray(item.media_urls) ? item.media_urls : [];
    const metrics = item.metrics || {};
    const title = item.destination === 'website_gallery' ? 'Website gallery feature' : 'Workshop Journal article';
    const liveUrl = item.public_url || item.canonical_path || '';
    return `<article class="card content-publication-card" data-publication-card="${Number(item.content_publication_id)}">
      <div class="content-publication-card-head"><div><span class="small content-publication-kind">${esc(title)}</span><h2>${esc(item.title || 'Untitled public draft')}</h2><p class="small">Project: ${esc(item.project_title || item.content_project_key || '')} • source: ${esc(item.source_deliverable_key || 'content package')}</p></div><div class="content-publication-statuses">${status(item.content_status)} ${status(item.source_approval_status || 'needs_review')}</div></div>
      <div class="content-publication-preview">
        ${item.hero_media_url ? `<img src="${esc(item.hero_media_url)}" alt="${esc(item.hero_alt_text || item.title || 'Published content preview')}" loading="lazy"/>` : `<div class="content-publication-placeholder" aria-label="Visual placeholder"><span aria-hidden="true">✦</span><small>Choose a public-cleared lead image</small></div>`}
        <div><strong>${esc(item.meta_title || item.title || '')}</strong><p>${esc(item.meta_description || item.summary || 'Add a clear public summary.')}</p>${liveUrl ? `<a class="btn secondary" href="${esc(liveUrl)}" target="_blank" rel="noopener">${item.content_status === 'published' ? 'Open live page' : 'Preview public path'}</a>` : ''}</div>
      </div>
      ${readiness(item)}
      <details class="content-publication-editor"><summary>Edit public copy, image and SEO</summary><div class="content-publication-form-grid">
        <label>Destination<select class="input" data-pub-destination="${Number(item.content_publication_id)}"><option value="workshop_journal" ${item.destination === 'workshop_journal' ? 'selected' : ''}>Workshop Journal</option><option value="website_gallery" ${item.destination === 'website_gallery' ? 'selected' : ''}>Website gallery</option></select></label>
        <label>Public slug<input class="input" data-pub-slug="${Number(item.content_publication_id)}" value="${esc(item.publication_slug || '')}"/></label>
        <label>Lead image URL<input class="input" data-pub-hero="${Number(item.content_publication_id)}" value="${esc(item.hero_media_url || '')}"/></label>
        <label>Lead image alt text<input class="input" data-pub-alt="${Number(item.content_publication_id)}" value="${esc(item.hero_alt_text || '')}"/></label>
        <label>Meta title<input class="input" data-pub-meta-title="${Number(item.content_publication_id)}" value="${esc(item.meta_title || '')}"/></label>
        <label>Meta description<input class="input" data-pub-meta-description="${Number(item.content_publication_id)}" value="${esc(item.meta_description || '')}"/></label>
      </div>
      <label>Public title<input class="input" data-pub-title="${Number(item.content_publication_id)}" value="${esc(item.title || '')}"/></label>
      <label>Summary<textarea class="input" rows="3" data-pub-summary="${Number(item.content_publication_id)}">${esc(item.summary || '')}</textarea></label>
      <label>Visible article / gallery copy<textarea class="input" rows="12" data-pub-body="${Number(item.content_publication_id)}">${esc(item.body_content || '')}</textarea></label>
      <label>Review notes<textarea class="input" rows="3" data-pub-notes="${Number(item.content_publication_id)}">${esc(item.review_notes || '')}</textarea></label>
      <label class="content-check"><input type="checkbox" data-pub-lock="${Number(item.content_publication_id)}" ${Number(item.copy_locked || 0) === 1 ? 'checked' : ''}/> Keep this edited public copy when the source package refreshes</label>
      <div class="content-publication-actions"><button class="btn" type="button" data-save-publication="${Number(item.content_publication_id)}">Save draft</button><button class="btn primary" type="button" data-approve-publication="${Number(item.content_publication_id)}">Approve public copy</button>${item.content_status === 'published' ? `<button class="btn danger" type="button" data-unpublish-publication="${Number(item.content_publication_id)}">Unpublish now</button>` : `<button class="btn primary" type="button" data-publish-publication="${Number(item.content_publication_id)}">Publish after approval</button>`}</div>
      </details>
      <details class="content-publication-metrics"><summary>Record performance manually</summary><p class="small">Optional manual rollup only. Do not treat views as sales; record the source and date so the number stays explainable.</p><div class="content-publication-form-grid"><label>Views<input class="input" type="number" min="0" data-pub-views="${Number(item.content_publication_id)}" value="${Number(metrics.views || 0)}"/></label><label>Clicks<input class="input" type="number" min="0" data-pub-clicks="${Number(item.content_publication_id)}" value="${Number(metrics.clicks || 0)}"/></label><label>Saves<input class="input" type="number" min="0" data-pub-saves="${Number(item.content_publication_id)}" value="${Number(metrics.saves || 0)}"/></label><label>Enquiries<input class="input" type="number" min="0" data-pub-enquiries="${Number(item.content_publication_id)}" value="${Number(metrics.enquiries || 0)}"/></label></div><label>Metric source/note<input class="input" data-pub-metric-note="${Number(item.content_publication_id)}" value="${esc(metrics.source_note || '')}" placeholder="Example: Search Console, June monthly check"/></label><button class="btn secondary" type="button" data-save-metrics="${Number(item.content_publication_id)}">Save manual metrics</button></details>
      ${media.length ? `<p class="small content-publication-media-count">${media.length} public-cleared media reference${media.length === 1 ? '' : 's'} attached. Source files remain unchanged.</p>` : ''}
    </article>`;
  }

  function render() {
    const items = selectedPublications();
    const review = count(state.publications, (item) => ['draft', 'review'].includes(clean(item.content_status).toLowerCase()));
    const approved = count(state.publications, (item) => clean(item.content_status).toLowerCase() === 'approved');
    const published = count(state.publications, (item) => clean(item.content_status).toLowerCase() === 'published');
    mount.innerHTML = `<div id="contentReleaseMessage" class="content-studio-message" hidden></div>
      <section class="card content-release-controls"><div><h2>Prepare website drafts from a finished content package</h2><p class="small">Select an approved-product content project. Preparation creates or refreshes two reference-only drafts: a Workshop Journal article and a gallery feature. Edited/locked public copy remains untouched by refresh.</p></div><div class="content-release-control-row"><label>Content project<select id="contentReleaseProject" class="input">${projectOptions()}</select></label><button id="preparePublicationsButton" class="btn primary" type="button" ${selected() ? '' : 'disabled'}>Prepare / refresh website drafts</button><a class="btn secondary" href="/admin/content-studio/">Open Content Studio</a></div></section>
      <section class="content-metric-grid content-release-metrics"><div><strong>${review}</strong><small>Draft/review release items</small></div><div><strong>${approved}</strong><small>Approved, not public</small></div><div><strong>${published}</strong><small>Published website items</small></div><div><strong>${count(state.publications, (item) => item.readiness?.ready)}</strong><small>Currently passing release checks</small></div></section>
      <section class="content-publication-list"><div class="section-title-row"><div><h2>${selected() ? 'Release drafts for the selected project' : 'Prepared public drafts'}</h2><p>Publication needs a separate source approval, factual visible content, public-cleared media, then a human publish action.</p></div></div>${items.length ? items.map(publicationCard).join('') : `<div class="content-empty-state">No public drafts are prepared for this view yet. Choose a content project and use <b>Prepare / refresh website drafts</b>.</div>`}</section>`;
    wire();
  }

  function field(selector, id) { return mount.querySelector(`${selector}="${id}"]`)?.value ?? ''; }
  function checked(selector, id) { return Boolean(mount.querySelector(`${selector}="${id}"]`)?.checked); }
  function publicationPatch(id) {
    return {
      action: 'update_publication', content_publication_id: Number(id),
      destination: field('[data-pub-destination', id), publication_slug: field('[data-pub-slug', id),
      hero_media_url: field('[data-pub-hero', id), hero_alt_text: field('[data-pub-alt', id),
      meta_title: field('[data-pub-meta-title', id), meta_description: field('[data-pub-meta-description', id),
      title: field('[data-pub-title', id), summary: field('[data-pub-summary', id), body_content: field('[data-pub-body', id),
      review_notes: field('[data-pub-notes', id), copy_locked: checked('[data-pub-lock', id) ? 1 : 0
    };
  }

  async function perform(payload, success) {
    state.busy = true;
    try { const data = await api(payload); updateState(data); render(); message(success || data.message || 'Saved.', 'success'); }
    catch (error) { message(error.message, 'error'); }
    finally { state.busy = false; }
  }

  function wire() {
    byId('contentReleaseProject')?.addEventListener('change', (event) => { state.selectedProjectId = Number(event.target.value || 0); render(); });
    byId('preparePublicationsButton')?.addEventListener('click', () => perform({ action: 'prepare_publications', content_project_id: selected() }, 'Website release drafts prepared. Review the public copy before approval.'));
    mount.querySelectorAll('[data-save-publication]').forEach((button) => button.addEventListener('click', () => perform(publicationPatch(button.dataset.savePublication), 'Public draft saved.')));
    mount.querySelectorAll('[data-approve-publication]').forEach((button) => button.addEventListener('click', () => perform({ action: 'approve_publication', content_publication_id: Number(button.dataset.approvePublication) }, 'Public copy approved. It is still not live.')));
    mount.querySelectorAll('[data-publish-publication]').forEach((button) => button.addEventListener('click', () => perform({ action: 'publish_publication', content_publication_id: Number(button.dataset.publishPublication) }, 'Public story/gallery item is now live.')));
    mount.querySelectorAll('[data-unpublish-publication]').forEach((button) => button.addEventListener('click', () => perform({ action: 'unpublish_publication', content_publication_id: Number(button.dataset.unpublishPublication) }, 'Public item removed from public API listings. Source media remains retained.')));
    mount.querySelectorAll('[data-save-metrics]').forEach((button) => button.addEventListener('click', () => {
      const id = Number(button.dataset.saveMetrics);
      perform({ action: 'record_metrics', content_publication_id: id, views: field('[data-pub-views', id), clicks: field('[data-pub-clicks', id), saves: field('[data-pub-saves', id), enquiries: field('[data-pub-enquiries', id), source_note: field('[data-pub-metric-note', id) }, 'Manual metrics saved.');
    }));
  }

  async function load() { try { const data = await api(); updateState(data); render(); } catch (error) { mount.innerHTML = `<div class="content-studio-message error">${esc(error.message)}</div>`; } }
  load();
})();
