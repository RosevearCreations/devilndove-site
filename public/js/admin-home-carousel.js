// Devil n Dove — Home carousel editor UI with direct approved-media upload.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const TRUSTED_MEDIA_HOSTS = new Set(['assets.devilndove.com', 'pub-f8137eb938da486a9f24410ccf49087c.r2.dev']);
  let slides = [];

  function message(text, bad = false) {
    const node = $('homeCarouselMessage');
    if (!node) return;
    node.textContent = text || '';
    node.className = `small ${bad ? 'error' : 'success'}`;
  }

  async function api(body = null) {
    const response = await DDAuth.apiFetch('/api/admin/home-carousel', body ? {
      method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body),
    } : {});
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }

  function localInput(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function normalizeMediaPath(value) {
    const raw = String(value || '').trim();
    if (!raw || raw.startsWith('/')) return raw;
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === 'https:' && TRUSTED_MEDIA_HOSTS.has(parsed.hostname.toLowerCase())) {
        return `/api/product-media?src=${encodeURIComponent(raw)}`;
      }
    } catch {}
    return raw;
  }

  function humanizeFilename(name) {
    return String(name || '')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220);
  }

  function payload(action) {
    return {
      action,
      slide_id: Number($('homeCarouselSlideId').value || 0),
      title: $('homeCarouselTitle').value,
      body_text: $('homeCarouselBody').value,
      image_url: normalizeMediaPath($('homeCarouselImage').value),
      alt_text: $('homeCarouselAlt').value,
      cta_label: $('homeCarouselCtaLabel').value,
      cta_url: $('homeCarouselCtaUrl').value,
      status: $('homeCarouselStatus').value,
      sort_order: Number($('homeCarouselSort').value || 100),
      auto_advance_seconds: Number($('homeCarouselSeconds').value || 7),
      starts_at: $('homeCarouselStarts').value || null,
      ends_at: $('homeCarouselEnds').value || null,
    };
  }

  function reset() {
    $('homeCarouselForm').reset();
    $('homeCarouselSlideId').value = '';
    $('homeCarouselSort').value = '100';
    $('homeCarouselSeconds').value = '7';
    $('homeCarouselStatus').value = 'draft';
    $('homeCarouselPreviewMount').hidden = true;
    if ($('homeCarouselImageFile')) $('homeCarouselImageFile').value = '';
    $('homeCarouselTitle').focus();
  }

  function edit(slideId) {
    const slide = slides.find((item) => Number(item.slide_id) === Number(slideId));
    if (!slide) return;
    $('homeCarouselSlideId').value = slide.slide_id;
    $('homeCarouselTitle').value = slide.title || '';
    $('homeCarouselBody').value = slide.body_text || '';
    $('homeCarouselImage').value = slide.image_url || '';
    $('homeCarouselAlt').value = slide.alt_text || '';
    $('homeCarouselCtaLabel').value = slide.cta_label || '';
    $('homeCarouselCtaUrl').value = slide.cta_url || '';
    $('homeCarouselStatus').value = slide.status === 'published' ? 'draft' : slide.status;
    $('homeCarouselSort').value = slide.sort_order || 100;
    $('homeCarouselSeconds').value = slide.auto_advance_seconds || 7;
    $('homeCarouselStarts').value = localInput(slide.starts_at);
    $('homeCarouselEnds').value = localInput(slide.ends_at);
    window.scrollTo({ top: $('homeCarouselForm').offsetTop - 40, behavior: 'smooth' });
  }

  function preview() {
    const data = payload('save');
    const mount = $('homeCarouselPreviewMount');
    mount.innerHTML = `<figure class="home-carousel-preview-card"><img src="${esc(data.image_url)}" alt="${esc(data.alt_text)}"><figcaption><strong>${esc(data.title || 'Untitled draft')}</strong>${data.body_text ? `<p>${esc(data.body_text)}</p>` : ''}${data.cta_label && data.cta_url ? `<span class="btn primary">${esc(data.cta_label)}</span>` : ''}</figcaption></figure>`;
    mount.hidden = false;
  }

  function render() {
    const root = $('homeCarouselSlides');
    if (!root) return;
    if (!slides.length) {
      root.innerHTML = '<p class="small">No carousel slides exist. Home continues to use the static hero.</p>';
      return;
    }
    root.innerHTML = slides.map((slide) => `<article class="home-carousel-admin-row" data-slide-id="${Number(slide.slide_id)}">
      <img src="${esc(slide.image_url)}" alt="">
      <div><div class="home-carousel-admin-row-title"><strong>${esc(slide.title)}</strong><span class="pill">${esc(slide.status)}</span></div><p class="small">${esc(slide.body_text || 'No body copy')}</p><small>Updated ${esc(slide.updated_at || '')}${slide.starts_at || slide.ends_at ? ' · scheduled' : ''}</small></div>
      <label><span>Order</span><input type="number" min="1" max="999999" value="${Number(slide.sort_order || 100)}" data-carousel-order="${Number(slide.slide_id)}"></label>
      <div class="home-carousel-row-actions"><button class="btn" type="button" data-carousel-edit="${Number(slide.slide_id)}">Edit</button>${slide.status === 'published' ? `<button class="btn" type="button" data-carousel-pause="${Number(slide.slide_id)}">Pause</button>` : ''}<button class="btn" type="button" data-carousel-archive="${Number(slide.slide_id)}">Archive</button></div>
    </article>`).join('');
  }

  async function load() {
    try {
      message('Loading carousel authority…');
      const data = await api();
      slides = data.slides || [];
      render();
      message(`${slides.length} saved slide(s).`);
    } catch (error) {
      slides = [];
      render();
      message(`${error.message} Apply database_build443_home_carousel.sql to the guarded Development D1 target; Home remains on its static hero until then.`, true);
    }
  }

  async function send(body) {
    try {
      message('Saving…');
      const data = await api(body);
      slides = data.slides || [];
      render();
      message(data.message || 'Saved.');
      return true;
    } catch (error) {
      message(error.message, true);
      return false;
    }
  }

  async function uploadChosenImage(file) {
    if (!file) return;
    const button = $('homeCarouselChooseImage');
    const previousLabel = button?.textContent || 'Choose file';
    try {
      if (!String(file.type || '').toLowerCase().startsWith('image/')) throw new Error('Choose an image file.');
      if (!Number(file.size || 0)) throw new Error('The selected image is empty.');
      if (Number(file.size || 0) > 10 * 1024 * 1024) throw new Error('Carousel images must be 10 MB or smaller.');
      if (button) {
        button.disabled = true;
        button.textContent = 'Uploading…';
      }
      message(`Uploading ${file.name || 'image'}…`);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_scope', 'brand');
      formData.append('attach_to_product', '0');
      formData.append('asset_tag', 'home_carousel');
      formData.append('variant_role', 'hero');
      const response = await DDAuth.apiFetch('/api/admin/media-upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `Image upload failed (${response.status}).`);
      const objectKey = String(data?.asset?.object_key || '').trim();
      if (!objectKey.startsWith('brand/')) throw new Error('The uploaded image did not return an approved brand-media key.');
      const sameOriginPath = `/api/product-media?key=${encodeURIComponent(objectKey)}`;
      $('homeCarouselImage').value = sameOriginPath;
      if (!$('homeCarouselAlt').value.trim()) $('homeCarouselAlt').value = humanizeFilename(file.name);
      message('Image uploaded. The carousel URL field has been filled automatically.');
    } catch (error) {
      message(error.message || 'Image upload failed.', true);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = previousLabel;
      }
      if ($('homeCarouselImageFile')) $('homeCarouselImageFile').value = '';
    }
  }

  $('homeCarouselForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (await send(payload('save'))) reset();
  });
  $('homeCarouselPublish')?.addEventListener('click', async () => {
    if (await send(payload('publish'))) reset();
  });
  $('homeCarouselPreview')?.addEventListener('click', preview);
  $('homeCarouselNew')?.addEventListener('click', reset);
  $('homeCarouselReload')?.addEventListener('click', load);
  $('homeCarouselChooseImage')?.addEventListener('click', () => $('homeCarouselImageFile')?.click());
  $('homeCarouselImageFile')?.addEventListener('change', async (event) => uploadChosenImage(event.target.files?.[0] || null));
  $('homeCarouselImage')?.addEventListener('blur', (event) => {
    const normalized = normalizeMediaPath(event.target.value);
    if (normalized !== event.target.value) event.target.value = normalized;
  });
  $('homeCarouselSaveOrder')?.addEventListener('click', () => send({ action:'reorder', items: slides.map((slide) => ({
    slide_id: slide.slide_id,
    sort_order: Number(document.querySelector(`[data-carousel-order="${slide.slide_id}"]`)?.value || slide.sort_order || 100),
  })) }));
  $('homeCarouselSlides')?.addEventListener('click', async (event) => {
    const editId = event.target.closest('[data-carousel-edit]')?.dataset.carouselEdit;
    const pauseId = event.target.closest('[data-carousel-pause]')?.dataset.carouselPause;
    const archiveId = event.target.closest('[data-carousel-archive]')?.dataset.carouselArchive;
    if (editId) edit(editId);
    if (pauseId) await send({ action:'pause', slide_id:Number(pauseId) });
    if (archiveId) await send({ action:'archive', slide_id:Number(archiveId) });
  });
  load();
})();