// Devil n Dove Build 287 Packaging Content-owned artwork picker.
// This UI adapter never writes Content records. It only copies a selected Content-owned
// public artwork URL into the existing Packaging artwork_asset draft field.

const PICKER_ID = 'ddPackagingArtworkPicker';
const SELECT_ID = 'ddPackagingArtworkSelect';
const PREVIEW_ID = 'ddPackagingArtworkPreview';
const STATUS_ID = 'ddPackagingArtworkPickerStatus';

function text(value) { return String(value ?? '').trim(); }

export function stableArtworkUrl(value) {
  const raw = text(value);
  if (!raw) return '';
  try {
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(raw);
    const url = new URL(raw, 'https://devilndove.invalid');
    url.searchParams.delete('v');
    return absolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return raw.replace(/([?&])v=[^&#]*(&?)/i, (match, lead, tail) => tail ? lead : '').replace(/[?&]$/, '');
  }
}

export function normalizeContentArtworkRows(rows = []) {
  const output = [];
  const seen = new Set();
  for (const source of Array.isArray(rows) ? rows : []) {
    const publicUrl = text(source?.public_url);
    if (!publicUrl) continue;
    const stableUrl = stableArtworkUrl(publicUrl);
    const mediaAssetId = Number(source?.media_asset_id || 0) || 0;
    const key = mediaAssetId ? `id:${mediaAssetId}` : `url:${stableUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(Object.freeze({
      media_asset_id: mediaAssetId,
      public_url: publicUrl,
      stable_url: stableUrl,
      object_key: text(source?.object_key),
      display_name: text(source?.display_name || source?.original_filename || source?.object_key || `Artwork ${mediaAssetId || output.length + 1}`),
      alt_text: text(source?.alt_text || source?.display_name || source?.original_filename || 'Managed packaging artwork'),
      image_title: text(source?.image_title),
      caption: text(source?.caption),
      mime_type: text(source?.mime_type),
      width_px: source?.width_px == null ? null : Number(source.width_px || 0),
      height_px: source?.height_px == null ? null : Number(source.height_px || 0),
    }));
  }
  return Object.freeze(output);
}

export function buildArtworkPickerModel(rows = [], currentPath = '') {
  const normalized = normalizeContentArtworkRows(rows);
  const current = stableArtworkUrl(currentPath);
  const selected = normalized.find((row) => row.stable_url === current) || null;
  return Object.freeze({
    rows: normalized,
    count: normalized.length,
    empty: normalized.length === 0,
    selectedMediaAssetId: Number(selected?.media_asset_id || 0) || null,
    selectedUrl: selected?.stable_url || '',
  });
}

function dispatchFieldChange(field, documentRef) {
  const EventCtor = documentRef?.defaultView?.Event || globalThis.Event;
  if (typeof field?.dispatchEvent !== 'function' || typeof EventCtor !== 'function') return;
  field.dispatchEvent(new EventCtor('input', { bubbles: true }));
  field.dispatchEvent(new EventCtor('change', { bubbles: true }));
}

function appendTextElement(documentRef, parent, tagName, content, className = '') {
  const node = documentRef.createElement(tagName);
  if (className) node.className = className;
  node.textContent = content;
  parent.appendChild(node);
  return node;
}

export function createPackagingArtworkPicker({
  documentRef = globalThis.document,
  getRows = () => [],
  refreshRows = null,
  onSelect = null,
  onClear = null,
} = {}) {
  let observer = null;
  let started = false;
  let mountedField = null;
  let mountCount = 0;
  let lastError = '';

  function currentRows() { return normalizeContentArtworkRows(getRows?.() || []); }

  function selectedRow(select, rows) {
    const value = text(select?.value);
    if (!value) return null;
    return rows.find((row) => String(row.media_asset_id || row.stable_url) === value) || null;
  }

  function render(panel, field) {
    if (!panel || !field || !documentRef?.createElement) return false;
    if (typeof panel.replaceChildren === 'function') panel.replaceChildren();
    else panel.textContent = '';

    const rows = currentRows();
    const model = buildArtworkPickerModel(rows, field.value);

    const heading = documentRef.createElement('div');
    heading.className = 'section-heading-row';
    const headingCopy = documentRef.createElement('div');
    appendTextElement(documentRef, headingCopy, 'strong', 'Content-managed artwork');
    appendTextElement(documentRef, headingCopy, 'p', 'Choose non-product artwork owned by Media & Content Studio. The advanced manual path remains available and is never overwritten until you press Use selected artwork.', 'small');
    heading.appendChild(headingCopy);
    appendTextElement(documentRef, heading, 'span', `${model.count} artwork asset${model.count === 1 ? '' : 's'}`, 'status-pill');
    panel.appendChild(heading);

    const controls = documentRef.createElement('div');
    controls.className = 'grid cols-2';
    const selectLabel = documentRef.createElement('label');
    appendTextElement(documentRef, selectLabel, 'span', 'Managed artwork library', 'small');
    const select = documentRef.createElement('select');
    select.id = SELECT_ID;
    select.className = 'input';
    const blank = documentRef.createElement('option');
    blank.value = '';
    blank.textContent = model.empty ? 'No Content-managed artwork registered' : 'Choose managed artwork…';
    select.appendChild(blank);
    for (const row of rows) {
      const option = documentRef.createElement('option');
      option.value = String(row.media_asset_id || row.stable_url);
      option.textContent = `${row.display_name}${row.width_px && row.height_px ? ` · ${row.width_px}×${row.height_px}` : ''}`;
      if (model.selectedMediaAssetId && Number(row.media_asset_id) === Number(model.selectedMediaAssetId)) option.selected = true;
      else if (!model.selectedMediaAssetId && model.selectedUrl && row.stable_url === model.selectedUrl) option.selected = true;
      select.appendChild(option);
    }
    selectLabel.appendChild(select);
    controls.appendChild(selectLabel);

    const preview = documentRef.createElement('div');
    preview.id = PREVIEW_ID;
    preview.className = 'packaging-reference-note';
    controls.appendChild(preview);
    panel.appendChild(controls);

    const actions = documentRef.createElement('div');
    actions.className = 'packaging-save-actions';
    const useButton = documentRef.createElement('button');
    useButton.type = 'button';
    useButton.className = 'btn primary';
    useButton.textContent = 'Use selected artwork';
    const clearButton = documentRef.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'btn';
    clearButton.textContent = 'Clear artwork path';
    const refreshButton = documentRef.createElement('button');
    refreshButton.type = 'button';
    refreshButton.className = 'btn';
    refreshButton.textContent = 'Refresh Content artwork';
    refreshButton.disabled = typeof refreshRows !== 'function';
    actions.appendChild(useButton);
    actions.appendChild(clearButton);
    actions.appendChild(refreshButton);
    panel.appendChild(actions);

    const status = appendTextElement(
      documentRef,
      panel,
      'p',
      model.empty
        ? 'No assets currently have Content media_type “artwork”. Add or classify artwork in Media & Content Studio, then refresh this library.'
        : 'Selecting an asset previews it. Press Use selected artwork to copy its stable public URL into the Packaging draft.',
      'small'
    );
    status.id = STATUS_ID;

    const manageLink = documentRef.createElement('a');
    manageLink.href = '/admin/media-content-studio';
    manageLink.textContent = 'Open Media & Content Studio';
    manageLink.className = 'btn';
    panel.appendChild(manageLink);

    function updatePreview() {
      if (typeof preview.replaceChildren === 'function') preview.replaceChildren();
      else preview.textContent = '';
      const row = selectedRow(select, rows);
      useButton.disabled = !row;
      if (!row) {
        appendTextElement(documentRef, preview, 'span', model.empty ? 'Artwork library is empty.' : 'Choose an artwork asset to preview it.', 'small');
        return;
      }
      const image = documentRef.createElement('img');
      image.src = row.public_url;
      image.alt = row.alt_text;
      image.loading = 'lazy';
      preview.appendChild(image);
      const copy = documentRef.createElement('div');
      appendTextElement(documentRef, copy, 'strong', row.display_name);
      appendTextElement(documentRef, copy, 'span', row.stable_url, 'small');
      preview.appendChild(copy);
    }

    select.addEventListener('change', updatePreview);
    useButton.addEventListener('click', () => {
      const row = selectedRow(select, rows);
      if (!row) return;
      field.value = row.stable_url;
      if (field.dataset) field.dataset.ddContentMediaAssetId = String(row.media_asset_id || '');
      dispatchFieldChange(field, documentRef);
      status.textContent = `Using Content-managed artwork: ${row.display_name}. Save the Packaging project to persist this artwork URL.`;
      onSelect?.(row);
    });
    clearButton.addEventListener('click', () => {
      field.value = '';
      if (field.dataset) delete field.dataset.ddContentMediaAssetId;
      select.value = '';
      dispatchFieldChange(field, documentRef);
      updatePreview();
      status.textContent = 'Artwork path cleared from this Packaging draft. Content media was not changed.';
      onClear?.();
    });
    refreshButton.addEventListener('click', async () => {
      if (typeof refreshRows !== 'function') return;
      refreshButton.disabled = true;
      status.textContent = 'Refreshing Content-managed artwork…';
      try {
        await refreshRows();
        lastError = '';
        render(panel, field);
      } catch (error) {
        lastError = text(error?.message || error || 'Content artwork refresh failed.');
        status.textContent = `Content artwork refresh failed: ${lastError}`;
        refreshButton.disabled = false;
      }
    });

    updatePreview();
    return true;
  }

  function mount() {
    if (!started || !documentRef?.getElementById) return false;
    const field = documentRef.getElementById('packagingArtworkAsset');
    if (!field) return false;
    const existing = documentRef.getElementById(PICKER_ID);
    if (existing && mountedField === field) return true;

    const panel = existing || documentRef.createElement('section');
    panel.id = PICKER_ID;
    panel.className = 'card small';
    panel.setAttribute?.('data-dd-packaging-artwork-picker', '');

    if (!existing) {
      const anchor = field.closest?.('.grid') || field.parentElement;
      if (typeof anchor?.insertAdjacentElement === 'function') anchor.insertAdjacentElement('afterend', panel);
      else if (anchor?.parentNode?.insertBefore) anchor.parentNode.insertBefore(panel, anchor.nextSibling || null);
      else return false;
    }

    mountedField = field;
    mountCount += 1;
    return render(panel, field);
  }

  function sync() {
    if (!started || !documentRef?.getElementById) return false;
    const field = documentRef.getElementById('packagingArtworkAsset');
    const panel = documentRef.getElementById(PICKER_ID);
    if (!field || !panel) return mount();
    mountedField = field;
    return render(panel, field);
  }

  function start() {
    if (started) return true;
    started = true;
    mount();
    const root = documentRef?.getElementById?.('packagingStudioMain') || documentRef?.body || null;
    if (root && typeof MutationObserver === 'function') {
      observer = new MutationObserver(() => { mount(); });
      observer.observe(root, { childList: true, subtree: true });
    }
    return true;
  }

  function stop() {
    started = false;
    observer?.disconnect?.();
    observer = null;
    documentRef?.getElementById?.(PICKER_ID)?.remove?.();
    mountedField = null;
  }

  function getStatus() {
    return Object.freeze({
      build: 287,
      started,
      mounted: Boolean(documentRef?.getElementById?.(PICKER_ID)),
      observerInstalled: Boolean(observer),
      availableCount: currentRows().length,
      mountCount,
      lastError,
    });
  }

  return Object.freeze({ start, stop, mount, sync, getStatus });
}
