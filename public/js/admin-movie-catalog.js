document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('movieCatalogAdminMount');
  if (!mount) return;
  mount.innerHTML = `
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <h2 style="margin:0">Movie catalog details</h2>
          <p class="small" style="margin:8px 0 0 0">Edit movie title, year, actors, UPC, IMDb id, alternate identifiers, notes, and other details directly in D1. Useful for staff or future visitor-submitted improvements.</p>
        </div>
        <button class="btn" type="button" id="movieCatalogRefreshButton">Refresh</button>
      </div>
      <div class="grid cols-4" style="gap:12px;margin-top:14px">
        <div><label class="small" for="movieCatalogSearch">Search</label><input id="movieCatalogSearch" class="input" type="search" placeholder="Title, UPC, actor, IMDb id..."/></div>
        <div style="display:flex;align-items:end"><button class="btn" id="movieCatalogNewButton" type="button">New movie draft</button></div>
      </div>
      <div id="movieCatalogMessage" class="small" style="display:none;margin-top:10px"></div>
      <div class="admin-table-wrap" style="margin-top:14px">
        <table><thead><tr><th>Movie</th><th>Identifiers</th><th>Year/Format</th><th>Status</th><th>Action</th></tr></thead><tbody id="movieCatalogTableBody"><tr><td colspan="5" style="padding:12px">Loading movie catalog...</td></tr></tbody></table>
      </div>
      <form id="movieCatalogForm" style="display:grid;gap:12px;margin-top:16px">
        <input type="hidden" name="movie_catalog_id"/>
        <div class="grid cols-3" style="gap:12px">
          <label><span>Title</span><input class="input" name="title" type="text" maxlength="220"/></label>
          <label><span>UPC</span><input class="input" name="upc" type="text" maxlength="80"/></label>
          <label><span>IMDb id</span><input class="input" name="imdb_id" type="text" maxlength="32" placeholder="tt1234567"/></label>
          <label><span>Alternate identifier</span><input class="input" name="alternate_identifier" type="text" maxlength="120" placeholder="Shelf code, collector id, visitor note"/></label>
          <label><span>Release year</span><input class="input" name="release_year" type="number" min="1880" max="2100"/></label>
          <label><span>Format</span><input class="input" name="media_format" type="text" maxlength="80" placeholder="Blu-ray, DVD, 4K"/></label>
          <label><span>Genre</span><input class="input" name="genre" type="text" maxlength="160"/></label>
          <label><span>Director(s)</span><input class="input" name="director_names" type="text" maxlength="255"/></label>
          <label><span>Actor(s)</span><input class="input" name="actor_names" type="text" maxlength="500"/></label>
          <label><span>Studio</span><input class="input" name="studio_name" type="text" maxlength="120"/></label>
          <label><span>Runtime minutes</span><input class="input" name="runtime_minutes" type="number" min="0" step="1"/></label>
          <label><span>Status</span><select class="input" name="status"><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
          <label><span>Metadata status</span><select class="input" name="metadata_status"><option value="pending">Pending</option><option value="contributed">Contributed</option><option value="reviewed">Reviewed</option><option value="enriched">Enriched</option></select></label>
          <label><span>Trailer URL</span><input class="input" name="trailer_url" type="url" maxlength="500"/></label>
          <label><span>Front image URL</span><input class="input" name="front_image_url" type="url" maxlength="500"/></label>
          <label><span>Back image URL</span><input class="input" name="back_image_url" type="url" maxlength="500"/></label>
        </div>
        <label><span>Summary</span><textarea class="input" name="summary" rows="4"></textarea></label>
        <label><span>Collection / contribution notes</span><textarea class="input" name="collection_notes" rows="3" placeholder="What still needs to be checked, visitor contribution details, rarity notes, packaging notes, etc."></textarea></label>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" type="submit">Save movie details</button><button class="btn" type="button" id="movieCatalogClearButton">Clear form</button></div>
      </form>
    </div>`;

  const tableBody = document.getElementById('movieCatalogTableBody');
  const searchInput = document.getElementById('movieCatalogSearch');
  const refreshButton = document.getElementById('movieCatalogRefreshButton');
  const form = document.getElementById('movieCatalogForm');
  const messageEl = document.getElementById('movieCatalogMessage');
  const clearButton = document.getElementById('movieCatalogClearButton');
  const newButton = document.getElementById('movieCatalogNewButton');

  function setMessage(msg, isError=false){ messageEl.textContent = msg || ''; messageEl.style.display = msg ? 'block' : 'none'; messageEl.style.color = isError ? '#b00020' : '#0a7a2f'; }
  function esc(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function fillForm(item={}){ Object.entries(item).forEach(([k,v])=>{ const el=form.elements[k]; if (el) el.value = v ?? ''; }); }
  function clearForm(){ form.reset(); form.elements.movie_catalog_id.value=''; }
  function render(items){
    if (!items.length){ tableBody.innerHTML = '<tr><td colspan="5" style="padding:12px">No movie records found.</td></tr>'; return; }
    tableBody.innerHTML = items.map((item)=>`<tr><td style="padding:8px"><strong>${esc(item.title || 'Untitled movie')}</strong><div class="small">${esc(item.actor_names || '')}</div></td><td style="padding:8px"><div class="small">UPC: ${esc(item.upc || '—')}</div><div class="small">IMDb: ${esc(item.imdb_id || '—')}</div><div class="small">Other: ${esc(item.alternate_identifier || '—')}</div></td><td style="padding:8px"><div class="small">${esc(item.release_year || '—')} · ${esc(item.media_format || '—')}</div><div class="small">${esc(item.genre || '')}</div></td><td style="padding:8px"><div class="small">${esc(item.status || 'draft')}</div><div class="small">${esc(item.metadata_status || 'pending')}</div></td><td style="padding:8px"><button class="btn" type="button" data-movie-edit="${item.movie_catalog_id}">Edit</button></td></tr>`).join('');
    tableBody.querySelectorAll('[data-movie-edit]').forEach((btn)=>btn.addEventListener('click',()=>{ const item = items.find((row)=>String(row.movie_catalog_id)===String(btn.dataset.movieEdit)); if(item){ fillForm(item); window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); } }));
  }
  async function load(){
    setMessage('');
    tableBody.innerHTML = '<tr><td colspan="5" style="padding:12px">Loading movie catalog...</td></tr>';
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/movies?q=${encodeURIComponent(searchInput.value || '')}&limit=80`);
      const data = await response.json();
      if(!response.ok || !data.ok) throw new Error(data.error || 'Could not load movie catalog.');
      render(Array.isArray(data.items) ? data.items : []);
    } catch (error) { setMessage(error.message || 'Could not load movie catalog.', true); tableBody.innerHTML = '<tr><td colspan="5" style="padding:12px">Movie catalog could not be loaded.</td></tr>'; }
  }
  refreshButton.addEventListener('click', load);
  searchInput.addEventListener('input', () => { window.clearTimeout(load._t); load._t = window.setTimeout(load, 250); });
  clearButton.addEventListener('click', clearForm);
  newButton.addEventListener('click', () => { clearForm(); form.elements.status.value='draft'; form.elements.metadata_status.value='contributed'; form.elements.title.focus(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('Saving movie details...');
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/movies', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if(!response.ok || !data.ok) throw new Error(data.error || 'Could not save movie details.');
      setMessage(data.message || 'Movie details saved.');
      fillForm(data.item || payload);
      load();
    } catch (error) { setMessage(error.message || 'Could not save movie details.', true); }
  });
  load();
});
