// Release 467 Build 16 — public custom-request examples and consent-approved proof blocks.

document.addEventListener('DOMContentLoaded', () => {
  const examplesMount = document.getElementById('customRequestExamplesMount');
  const proofMount = document.getElementById('customRequestProofMount');
  if (!examplesMount && !proofMount) return;
  const esc = (value) => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  function renderExamples(data) {
    if (!examplesMount) return;
    const rows = Array.isArray(data?.examples) ? data.examples : [];
    if (!rows.length) {
      examplesMount.innerHTML = '<p class="small">No reviewed candle or soap example currently has enough approved facts and photography to show here. We will not invent an example to fill the space.</p>';
      return;
    }
    examplesMount.innerHTML = `<div class="grid cols-3">${rows.map((row) => `<article class="card" style="margin:0"><img src="${esc(row.image_url)}" alt="${esc(row.name)} — approved ${esc(row.family)} example" loading="lazy"/><p class="small" style="font-weight:800;text-transform:uppercase;letter-spacing:.06em">${esc(row.family)}</p><h3>${esc(row.name)}</h3>${row.description ? `<p class="small">${esc(row.description)}</p>` : ''}<dl class="small">${(row.facts || []).map((fact) => `<div><dt style="font-weight:800">${esc(fact.label)}</dt><dd style="margin:0 0 8px">${esc(fact.value)}</dd></div>`).join('')}</dl>${row.slug ? `<a class="btn small" href="/product/?slug=${encodeURIComponent(row.slug)}">View current product</a>` : ''}</article>`).join('')}</div>`;
  }

  function renderProof(data) {
    if (!proofMount) return;
    const rows = Array.isArray(data?.items) ? data.items : [];
    if (!rows.length) {
      proofMount.innerHTML = '<p class="small">No consent-cleared custom-work proof block is currently approved for this page.</p>';
      return;
    }
    proofMount.innerHTML = `<div class="grid cols-3">${rows.map((row) => `<blockquote class="card" style="margin:0"><p>${esc(row.body || '')}</p><footer class="small">${esc(row.attribution_label || 'Devil n Dove customer')}${row.locality_label ? ` • ${esc(row.locality_label)}` : ''}</footer></blockquote>`).join('')}</div>`;
  }

  async function load() {
    const requests = [];
    if (examplesMount) requests.push(fetch('/api/custom-request-examples', { headers: { Accept: 'application/json' } }).then(r => r.json()).then(renderExamples).catch(() => renderExamples({ examples: [] })));
    if (proofMount) requests.push(fetch('/api/trust-blocks?context=custom_work&limit=6', { headers: { Accept: 'application/json' } }).then(r => r.json()).then(renderProof).catch(() => renderProof({ items: [] })));
    await Promise.all(requests);
  }
  load();
});
