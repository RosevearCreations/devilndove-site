// File: /public/js/admin-amazon-purchase-import.js
// Brief description: Admin pasted-CSV importer for private Amazon purchase staging rows.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('siteInventoryAdminMount');
  if (!mount || !window.DDAuth) return;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function setMessage(text, isError = false) {
    const el = document.getElementById('amazonPurchaseImportMessage');
    if (!el) return;
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#14532d';
    el.textContent = text || '';
  }
  async function readJson(response, fallback) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallback || 'Request failed.');
    return data;
  }
  function ensureCard() {
    if (document.getElementById('amazonPurchaseImportCard')) return;
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'amazonPurchaseImportCard';
    card.style.marginTop = '16px';
    card.innerHTML = `
      <h4 style="margin-top:0">Amazon CSV staging import</h4>
      <p class="small">Paste Amazon order CSV rows here to load them into the private staging table. Imported rows stay pending until reviewed below.</p>
      <div id="amazonPurchaseImportMessage" class="small" style="display:none;margin-bottom:10px"></div>
      <div class="grid cols-2" style="gap:8px">
        <label class="small">Source file name <input id="amazonImportSourceFile" type="text" placeholder="orders_from_amazon.csv" /></label>
        <label class="small">Batch ID <input id="amazonImportBatchId" type="text" placeholder="optional, auto generated" /></label>
      </div>
      <label class="small" style="display:block;margin-top:8px">CSV text <textarea id="amazonImportCsvText" rows="7" placeholder="Paste CSV header and rows here"></textarea></label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn primary" type="button" id="amazonImportRunButton">Import to staging</button><button class="btn" type="button" id="amazonImportClearButton">Clear</button></div>
      <div id="amazonPurchaseImportResult" class="small" style="margin-top:10px"></div>`;
    const reviewCard = document.getElementById('amazonPurchaseReviewCard');
    if (reviewCard) reviewCard.insertAdjacentElement('beforebegin', card);
    else mount.appendChild(card);
  }
  async function importCsv() {
    try {
      const csvText = document.getElementById('amazonImportCsvText')?.value || '';
      const sourceFile = document.getElementById('amazonImportSourceFile')?.value || '';
      const batchId = document.getElementById('amazonImportBatchId')?.value || '';
      setMessage('Importing Amazon CSV rows...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/amazon-purchase-import', {
        method: 'POST',
        body: JSON.stringify({ csv_text: csvText, source_file: sourceFile, import_batch_id: batchId })
      }), 'Amazon CSV import failed.');
      document.getElementById('amazonPurchaseImportResult').innerHTML = `Batch <code>${esc(data.import_batch_id)}</code>: inserted <strong>${esc(data.inserted_count || 0)}</strong>, skipped <strong>${esc(data.skipped_count || 0)}</strong>.`;
      setMessage('Amazon CSV import finished. Refresh the review queue to see new pending rows.');
      document.getElementById('amazonReviewRefreshButton')?.click();
    } catch (error) {
      setMessage(error.message || 'Failed to import Amazon CSV.', true);
    }
  }
  ensureCard();
  mount.addEventListener('click', (event) => {
    if (event.target.id === 'amazonImportRunButton') importCsv();
    if (event.target.id === 'amazonImportClearButton') {
      const text = document.getElementById('amazonImportCsvText');
      if (text) text.value = '';
      setMessage('');
    }
  });
});
