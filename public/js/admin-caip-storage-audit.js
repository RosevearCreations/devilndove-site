// Devil n Dove Build 439 — CAIP temporal-media storage integrity + missing-binary recovery workspace.
// Audit is read-only/user-triggered. Recovery is explicit, fingerprint-verified, and uses existing private R2 upload routes.
// No polling. No provider execution. Existing creative_asset_id is preserved after verified recovery finalization.
(() => {
  'use strict';

  const mount = document.getElementById('caipStorageAuditMount');
  if (!mount) return;

  const API = '/api/admin/caip-evidence-storage-diagnostic';
  const RECOVERY_API = '/api/admin/caip-evidence-storage-recovery';
  const INTAKE_API = '/api/admin/caip-media-intake';
  const PAGE_SIZE = 8;
  const CONTENT_FINGERPRINT_VERSION = 'sample_sha256_v1';
  const CONTENT_SAMPLE_BYTES = 1024 * 1024;
  const state = { busy: false, audit: null, error: '', recoveryMessage: '', recoveryTone: 'info' };

  const text = (value) => String(value ?? '').trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const num = (value) => Number(value || 0) || 0;

  async function requestJson(path, options = {}) {
    if (!window.DDAuth?.apiFetch) throw new Error('Authentication helper is unavailable.');
    const response = await window.DDAuth.apiFetch(path, { cache: 'no-store', ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Request failed with HTTP ${response.status}.`);
    return data;
  }

  async function postJson(path, body) {
    return requestJson(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }

  async function sha256Hex(value) {
    const digest = await crypto.subtle.digest('SHA-256', value);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function sampleRanges(size) {
    const length = Math.min(size, CONTENT_SAMPLE_BYTES);
    const maxStart = Math.max(0, size - length);
    return [...new Set([0, Math.floor(maxStart / 2), maxStart])].sort((a, b) => a - b).map((offset) => ({ offset, length: Math.min(length, size - offset) }));
  }

  async function contentFingerprintForFile(file) {
    const parts = [];
    for (const range of sampleRanges(file.size)) {
      const buffer = await file.slice(range.offset, range.offset + range.length).arrayBuffer();
      parts.push(`${range.offset}:${range.length}:${await sha256Hex(buffer)}`);
    }
    return sha256Hex(new TextEncoder().encode(`${CONTENT_FINGERPRINT_VERSION}|${file.size}|${parts.join('|')}`));
  }

  function label(value) {
    return text(value).replace(/_/g, ' ') || 'unknown';
  }

  function classificationHelp(value) {
    switch (value) {
      case 'healthy_media_asset_binding':
        return 'Playable authority exists: the canonical media_assets key is present in its bound R2 bucket.';
      case 'recoverable_metadata_drift':
        return 'Another recorded CAIP candidate exists in R2, but the canonical media_assets linkage is stale or incomplete. This is repairable without re-uploading the binary.';
      case 'recorded_keys_missing_from_dev_r2':
        return 'D1 records R2 object keys, but none of those objects exist in the bound Development bucket. Restore the original local file through the verified recovery control below.';
      case 'r2_binding_unavailable':
        return 'The required R2 binding is unavailable in this Development runtime.';
      case 'no_recorded_r2_key':
        return 'The temporal asset has no recorded R2 object key and needs verified intake/linkage recovery.';
      default:
        return 'Storage state needs review.';
    }
  }

  function badge(value) {
    const ok = value === 'healthy_media_asset_binding';
    return `<span class="caip439-badge ${ok ? 'ok' : ''}">${esc(label(value))}</span>`;
  }

  function candidateLine(candidate) {
    const exists = candidate.exists ? 'exists' : 'missing';
    const binding = candidate.binding_available ? candidate.binding_route : 'binding unavailable';
    const bytes = candidate.head?.size ? ` · ${Number(candidate.head.size).toLocaleString()} bytes` : '';
    return `<li><strong>${esc(candidate.source)}</strong> · ${esc(binding)} · ${esc(exists)}${bytes}<br/><code>${esc(candidate.object_key || '')}</code>${candidate.error ? `<br/><small>${esc(candidate.error)}</small>` : ''}</li>`;
  }

  function recoveryButton(item) {
    if (!['recorded_keys_missing_from_dev_r2', 'no_recorded_r2_key'].includes(item.classification)) return '';
    return `<button class="btn" type="button" data-caip439-recover="${num(item.creative_asset_id)}" ${state.busy ? 'disabled' : ''}>Restore from original file</button>`;
  }

  function auditRow(item) {
    return `<details class="caip439-row" style="display:block;padding:10px 0">
      <summary style="cursor:pointer"><strong>${esc(item.original_filename || item.asset_key || `Asset ${item.creative_asset_id}`)}</strong> · project ${num(item.creative_project_id)} / asset ${num(item.creative_asset_id)} · ${badge(item.classification)}</summary>
      <p class="small">${esc(classificationHelp(item.classification))}</p>
      <p class="small">Upload authority: ${item.upload_file_id ? `#${num(item.upload_file_id)}` : 'no linked upload row'} · media asset: ${item.media_asset_id ? `#${num(item.media_asset_id)}` : 'not linked'}</p>
      <ul class="small">${(item.candidates || []).map(candidateLine).join('') || '<li>No recorded R2 candidates.</li>'}</ul>
      <div class="caip439-actions">
        ${recoveryButton(item)}
        <a class="btn secondary" href="/admin/creative-assets/?creative_project_id=${num(item.creative_project_id)}">Open project in CAIP</a>
      </div>
    </details>`;
  }

  function summaryCards(audit) {
    const counts = audit?.counts || {};
    const values = [
      ['Healthy', counts.healthy_media_asset_binding || 0],
      ['Recoverable drift', counts.recoverable_metadata_drift || 0],
      ['Missing Dev R2', counts.recorded_keys_missing_from_dev_r2 || 0],
      ['Binding unavailable', counts.r2_binding_unavailable || 0],
      ['No R2 key', counts.no_recorded_r2_key || 0],
    ];
    return `<div class="caip439-badges">${values.map(([name, count]) => `<span class="caip439-badge ${name === 'Healthy' && count ? 'ok' : ''}">${esc(name)}: ${num(count)}</span>`).join('')}</div>`;
  }

  function render() {
    const audit = state.audit;
    const health = audit?.items?.find((item) => item.classification === 'healthy_media_asset_binding');
    const recoverable = audit?.items?.find((item) => item.classification === 'recoverable_metadata_drift');
    const allMissing = audit && audit.total > 0 && !health && !recoverable;

    mount.innerHTML = `<section class="card" style="margin-top:18px">
      <div class="caip439-head">
        <div>
          <p class="eyebrow">Build 439 · Integrity gate</p>
          <h2 style="margin-top:0">CAIP Temporal Media Storage Audit</h2>
          <p class="small">Read-only Development audit of every active video/audio asset. It compares recorded media/upload/metadata/observation keys using R2 HEAD only. Recovery is a separate explicit action: the selected local source is fingerprinted, uploaded to a new private key, R2-verified, then the existing CAIP asset identity is preserved.</p>
        </div>
        <div class="caip439-actions"><button class="btn" id="caip439RunStorageAudit" type="button" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Working…' : 'Audit all temporal media'}</button></div>
      </div>
      ${state.error ? `<p class="small caip439-status" data-tone="error">${esc(state.error)}</p>` : ''}
      ${state.recoveryMessage ? `<p class="small caip439-status" data-tone="${esc(state.recoveryTone)}">${esc(state.recoveryMessage)}</p>` : ''}
      ${audit ? `<div style="margin-top:12px">${summaryCards(audit)}<p class="small">Audited ${num(audit.items?.length)} of ${num(audit.total)} active temporal asset${num(audit.total) === 1 ? '' : 's'}.</p></div>` : '<p class="small">Run this before CAIP browser acceptance or whenever secure playback reports a missing R2 object.</p>'}
      ${health ? `<p class="small"><strong>Playable Development candidate found:</strong> project ${num(health.creative_project_id)}, asset ${num(health.creative_asset_id)} (${esc(health.original_filename || health.asset_key)}).</p>` : ''}
      ${recoverable ? `<p class="small"><strong>Recoverable metadata drift exists.</strong> Repair canonical linkage only after the existing R2 candidate is verified.</p>` : ''}
      ${allMissing ? `<p class="small"><strong>No healthy/recoverable Development temporal object was found.</strong> Use Restore from original file on one or more records. Recovery creates a new immutable private object and never fabricates a D1-only link.</p>` : ''}
      <div>${(audit?.items || []).map(auditRow).join('')}</div>
    </section>`;

    document.getElementById('caip439RunStorageAudit')?.addEventListener('click', () => { void runAudit(); });
    mount.querySelectorAll('[data-caip439-recover]').forEach((button) => button.addEventListener('click', () => {
      const assetId = num(button.dataset.caip439Recover);
      const item = (state.audit?.items || []).find((row) => num(row.creative_asset_id) === assetId);
      if (item) chooseRecoveryFile(item);
    }));
  }

  async function runAudit() {
    if (state.busy) return;
    state.busy = true;
    state.error = '';
    state.audit = null;
    render();
    try {
      let offset = 0;
      let total = 0;
      const items = [];
      const counts = {};
      for (;;) {
        const data = await requestJson(`${API}?scope=all&limit=${PAGE_SIZE}&offset=${offset}`);
        total = num(data.total);
        for (const item of data.items || []) {
          items.push(item);
          counts[item.classification] = num(counts[item.classification]) + 1;
        }
        if (data.next_offset == null) break;
        offset = num(data.next_offset);
        if (!offset || items.length >= 240) break;
      }
      state.audit = { total, items, counts };
    } catch (error) {
      state.error = error?.message || 'CAIP storage audit failed.';
    } finally {
      state.busy = false;
      render();
    }
  }

  function chooseRecoveryFile(item) {
    if (state.busy) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = item.media_type === 'audio' ? 'audio/*' : 'video/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await recoverItem(item, file);
    };
    input.click();
  }

  async function recoverItem(item, file) {
    state.busy = true;
    state.error = '';
    state.recoveryTone = 'info';
    state.recoveryMessage = `Fingerprinting ${file.name} before recovery…`;
    render();
    try {
      const contentFingerprint = await contentFingerprintForFile(file);
      state.recoveryMessage = `Preparing verified recovery for ${file.name}…`;
      render();
      const prepared = await postJson(RECOVERY_API, {
        action: 'prepare', creative_project_id: num(item.creative_project_id), creative_asset_id: num(item.creative_asset_id),
        caip_media_upload_file_id: num(item.upload_file_id) || null,
        filename: file.name, mime_type: file.type || '', file_size_bytes: file.size, last_modified_ms: file.lastModified || null,
        content_fingerprint: contentFingerprint, content_fingerprint_version: CONTENT_FINGERPRINT_VERSION,
        upload_device: navigator.userAgent.slice(0, 180),
      });
      const recoveryFile = prepared.file;
      if (!recoveryFile?.caip_media_upload_file_id) throw new Error('Recovery upload row was not returned.');
      const recoveryId = num(recoveryFile.caip_media_upload_file_id);

      state.recoveryMessage = `Uploading ${file.name} to a new private CAIP R2 key…`;
      render();
      const initiated = await postJson(INTAKE_API, { action: 'initiate_file', caip_media_upload_file_id: recoveryId, compact_response: true });
      const initiatedFile = initiated.result?.file || initiated.result?.files?.[0] || recoveryFile;
      if (initiated.result?.direct_upload || initiatedFile?.direct_upload || file.size <= 90 * 1024 * 1024) {
        const response = await window.DDAuth.apiFetch(`/api/admin/caip-media-upload-direct?file_id=${encodeURIComponent(recoveryId)}`, {
          method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) throw new Error(data.error || 'Direct private-R2 recovery upload failed.');
      } else {
        const parts = (prepared.parts || []).slice().sort((a, b) => num(a.part_number) - num(b.part_number));
        const queue = parts.filter((part) => part.part_status !== 'uploaded');
        let next = 0;
        let doneBytes = parts.filter((part) => part.part_status === 'uploaded').reduce((sum, part) => sum + num(part.part_size_bytes), 0);
        let failed = null;
        const worker = async () => {
          while (next < queue.length && !failed) {
            const part = queue[next++];
            const blob = file.slice(num(part.byte_start), num(part.byte_end));
            try {
              const response = await window.DDAuth.apiFetch(`/api/admin/caip-media-upload-part?file_id=${encodeURIComponent(recoveryId)}&part_number=${encodeURIComponent(part.part_number)}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(blob.size) }, body: blob,
              });
              const data = await response.json().catch(() => ({}));
              if (!response.ok || data.ok === false) throw new Error(data.error || `Part ${part.part_number} failed.`);
              doneBytes += blob.size;
              state.recoveryMessage = `Uploading ${file.name}… ${Math.min(100, Math.round((doneBytes / file.size) * 100))}%`;
              render();
            } catch (error) { failed = error; }
          }
        };
        await Promise.all(Array.from({ length: Math.min(2, queue.length || 1) }, worker));
        if (failed) throw failed;
        await postJson(INTAKE_API, { action: 'complete_file', caip_media_upload_file_id: recoveryId, compact_response: true });
      }

      state.recoveryMessage = `Verifying R2 and reconnecting existing CAIP asset #${num(item.creative_asset_id)}…`;
      render();
      const finalized = await postJson(RECOVERY_API, {
        action: 'finalize', creative_project_id: num(item.creative_project_id), creative_asset_id: num(item.creative_asset_id),
        caip_media_upload_file_id: recoveryId,
      });
      state.recoveryTone = 'ok';
      state.recoveryMessage = `${file.name} restored and R2-verified. Existing CAIP asset #${num(finalized.creative_asset_id)} was preserved.`;
      await runAudit();
    } catch (error) {
      state.recoveryTone = 'error';
      state.recoveryMessage = error?.message || 'CAIP missing-binary recovery failed.';
      state.error = '';
    } finally {
      state.busy = false;
      render();
    }
  }

  async function explainReviewMediaError(media) {
    const projectId = num(document.getElementById('caip439Project')?.value);
    const assetId = num(document.getElementById('caip439Asset')?.value);
    if (!projectId || !assetId) return;
    const status = document.getElementById('caip439Status');
    try {
      const data = await requestJson(`${API}?creative_project_id=${projectId}&creative_asset_id=${assetId}`);
      if (data.classification === 'recorded_keys_missing_from_dev_r2' || data.classification === 'no_recorded_r2_key') {
        if (status) {
          status.textContent = 'Private review could not start because the Development R2 binary is missing. The browser\'s generic “unsupported format/MIME” panel is not a codec diagnosis here. Use CAIP Temporal Media Storage Audit → Restore from original file.';
          status.dataset.tone = 'error';
        }
        return;
      }
      if (data.classification === 'r2_binding_unavailable') {
        if (status) { status.textContent = 'Private review could not start because the CAIP private R2 binding is unavailable.'; status.dataset.tone = 'error'; }
        return;
      }
      if (status && data.classification === 'healthy_media_asset_binding') {
        const probe = document.createElement('video');
        const h264 = probe.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') || 'not reported';
        status.textContent = `The private R2 object exists, but the browser rejected playback (media error ${media?.error?.code || 'unknown'}). H.264/AAC capability reports “${h264}”; inspect the returned MIME/codec and use a verified proxy_video artifact if the original codec is not web-compatible.`;
        status.dataset.tone = 'error';
      }
    } catch (error) {
      if (status) { status.textContent = `Media review failed before playback could be diagnosed: ${error.message}`; status.dataset.tone = 'error'; }
    }
  }

  function bindReviewPlayerHealth() {
    const media = document.getElementById('caip439Player');
    if (!media || media.dataset.caip439StorageHealthBound === '1') return;
    media.dataset.caip439StorageHealthBound = '1';
    media.addEventListener('error', () => { void explainReviewMediaError(media); });
  }

  const reviewMount = document.getElementById('caipEvidenceReviewMount');
  if (reviewMount && typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => bindReviewPlayerHealth());
    observer.observe(reviewMount, { childList: true, subtree: true });
    bindReviewPlayerHealth();
  }

  render();
})();
