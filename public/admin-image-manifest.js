// Build 230 — Visual Image Manifest browser, editor, and visibly unsynced fallback.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('imageManifestMount');
  if(!mount)return;
  const FALLBACK_ROWS=[
    ['workshop_process_hero','Workshop process photograph','/','/assets/visual-placeholders/workshop-process.svg','real_photo_required','placeholder',1],
    ['home_workshop_discovery','Homepage workshop discovery visual','/','/assets/generated/editorial/workshop-discovery-illustration.webp','editorial_illustration_allowed','generated_editorial',0],
    ['representative_product_collection','Representative product collection photograph','/creations/','/assets/visual-placeholders/product-grid.svg','real_photo_required','placeholder',1],
    ['before_after_process','Before-and-after or process proof','/gallery/','/assets/visual-placeholders/before-after.svg','real_photo_required','placeholder',1],
    ['handmade_jewelry_macro','Handmade jewelry technique visual','/handmade-jewelry-ontario/','/assets/generated/editorial/handmade-jewelry-techniques-illustration.webp','editorial_illustration_allowed','generated_editorial',0],
    ['polymer_clay_macro','Polymer-clay earring photograph','/polymer-clay-earrings-ontario/','/assets/visual-placeholders/jewelry-macro.svg','real_photo_required','placeholder',1],
    ['laser_engraving_proof','Laser engraving proof photograph','/laser-engraving-ontario/','/assets/visual-placeholders/engraving-detail.svg','real_photo_required','placeholder',1],
    ['candle_process','Candle colour and process photograph','/custom-candle-making-ontario/','/assets/visual-placeholders/candle-colour.svg','real_photo_required','placeholder',1],
    ['soap_process','Soap texture and process photograph','/custom-soap-making-ontario/','/assets/visual-placeholders/soap-texture.svg','real_photo_required','placeholder',1],
    ['vintage_condition','Vintage condition photograph','/vintage-finds-ontario/','/assets/visual-placeholders/vintage-condition.svg','real_photo_required','placeholder',1],
    ['workshop_gift_process','Workshop-made gift process photograph','/workshop-made-gifts-ontario/','/assets/visual-placeholders/product-process.svg','real_photo_required','placeholder',1],
    ['product_material_detail','Product material detail photograph','/shop/','/assets/visual-placeholders/material-detail.svg','real_photo_required','placeholder',1],
    ['product_scale','Product scale photograph','/shop/','/assets/visual-placeholders/product-scale.svg','real_photo_required','placeholder',1],
    ['product_care_packaging','Product care and packaging photograph','/shop/','/assets/visual-placeholders/product-care.svg','real_photo_required','placeholder',1],
    ['gift_card_artwork','Main gift-card artwork','/gift-cards/','/assets/generated/editorial/gift-card-brand-illustration.webp','editorial_illustration_allowed','owner_review',0],
    ['workshop_journal_hero','Workshop Journal hero and story image','/workshop-journal/','/assets/visual-placeholders/workshop-journal.svg','real_photo_required','placeholder',1],
    ['launch_product_primary','Launch-product primary photographs','/shop/','/assets/product-placeholder.svg','real_photo_required','missing',1],
    ['events_page','Events page photograph','/events/','/assets/visual-placeholders/events.svg','real_photo_required','placeholder',1],
    ['pickup_page','Local pickup photograph','/pickup/','/assets/visual-placeholders/pickup.svg','real_photo_required','placeholder',1],
    ['tools_and_supplies','Tools, toolshed, and supplies photographs','/tools/','/assets/visual-placeholders/tools.svg','real_photo_required','placeholder',1]
  ];
  const FALLBACK=FALLBACK_ROWS.map((row,index)=>({manifest_key:row[0],manifest_title:row[1],page_path:row[2],current_asset_url:row[3],final_asset_url:row[3],required_asset_kind:row[4],replacement_status:row[5],is_launch_blocker:row[6],manifest_group:row[0]==='launch_product_primary'?'dynamic_catalog':'public_static',rights_status:row[5]==='generated_editorial'?'approved':'needs_review',public_use_status:'needs_review',phone_review_status:'unchecked',desktop_review_status:'unchecked',sort_order:(index+1)*10,generated_asset:row[5]==='generated_editorial'||row[0]==='gift_card_artwork'?1:0,alt_text:'',owner_name:'',evidence_url:'',notes:'Built-in unsynced fallback. Retry the database before recording evidence.'}));
  const STATUS=['missing','placeholder','generated_editorial','needs_real_photo','owner_review','in_progress','approved','blocked'];
  const REVIEW=['unchecked','needs_review','passed','failed'];
  const APPROVAL=['needs_review','approved','blocked'];
  let state={items:[],history:[],fallback:false,error:'',filter:'all',query:'',blockersOnly:false};
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const label=(value)=>String(value||'').replaceAll('_',' ');
  const options=(values,current)=>values.map((value)=>`<option value="${esc(value)}"${value===current?' selected':''}>${esc(label(value))}</option>`).join('');
  const safeUrl=(value,fallback='')=>{const candidate=String(value||'');return /^(\/(?!\/)|https:\/\/)/i.test(candidate)?candidate:fallback;};
  const safeImage=(value)=>safeUrl(value,'/assets/logo-clear.png');
  const summarize=(items)=>({total:items.length,approved:items.filter(i=>i.replacement_status==='approved').length,generated_editorial:items.filter(i=>Number(i.generated_asset||0)===1).length,open_launch_blockers:items.filter(i=>Number(i.is_launch_blocker||0)===1&&i.replacement_status!=='approved').length,missing_or_placeholder:items.filter(i=>['missing','placeholder','needs_real_photo','blocked'].includes(i.replacement_status)).length});
  const filtered=()=>state.items.filter((item)=>{
    if(state.filter!=='all'&&item.replacement_status!==state.filter)return false;
    if(state.blockersOnly&&!(Number(item.is_launch_blocker||0)===1&&item.replacement_status!=='approved'))return false;
    const haystack=`${item.manifest_title||''} ${item.page_path||''} ${item.manifest_key||''} ${item.owner_name||''}`.toLowerCase();
    return !state.query||haystack.includes(state.query.toLowerCase());
  });
  function itemCard(item){
    const asset=item.final_asset_url||item.current_asset_url||'/assets/logo-clear.png';
    const locked=state.fallback?' disabled':'';
    return `<article class="card image-manifest-card" data-manifest-key="${esc(item.manifest_key)}">
      <div class="image-manifest-preview"><img src="${esc(safeImage(asset))}" alt="" loading="lazy" decoding="async"><span class="status-pill status-${esc(item.replacement_status)}">${esc(label(item.replacement_status))}</span>${Number(item.is_launch_blocker||0)===1?'<span class="manifest-blocker-badge">Launch blocker</span>':''}</div>
      <div class="image-manifest-card-body"><div class="image-manifest-card-heading"><div><p class="eyebrow">${esc(label(item.manifest_group))} • ${esc(item.manifest_key)}</p><h2>${esc(item.manifest_title)}</h2></div><a class="btn small" href="${esc(item.page_path||'/')}" target="_blank" rel="noopener">Open page</a></div>
      <p class="small"><strong>Required:</strong> ${esc(label(item.required_asset_kind))}${Number(item.generated_asset||0)===1?' • AI-generated editorial asset':''}</p>
      ${item.generated_prompt_summary?`<details><summary>Generated-asset provenance</summary><p class="small">${esc(item.generated_prompt_summary)}</p></details>`:''}
      <form class="image-manifest-form">
        <input type="hidden" name="manifest_key" value="${esc(item.manifest_key)}">
        <div class="image-manifest-field-grid">
          <label>Status<select name="replacement_status"${locked}>${options(STATUS,item.replacement_status)}</select></label>
          <label>Owner<input name="owner_name" value="${esc(item.owner_name||'')}" placeholder="Name or role"${locked}></label>
          <label>Rights<select name="rights_status"${locked}>${options(APPROVAL,item.rights_status||'needs_review')}</select></label>
          <label>Public use<select name="public_use_status"${locked}>${options(APPROVAL,item.public_use_status||'needs_review')}</select></label>
          <label>Phone review<select name="phone_review_status"${locked}>${options(REVIEW,item.phone_review_status||'unchecked')}</select></label>
          <label>Desktop review<select name="desktop_review_status"${locked}>${options(REVIEW,item.desktop_review_status||'unchecked')}</select></label>
        </div>
        <label>Final asset URL<input name="final_asset_url" value="${esc(item.final_asset_url||'')}" placeholder="/assets/... or https://..."${locked}></label>
        <label>Descriptive alternative text<input name="alt_text" value="${esc(item.alt_text||'')}" placeholder="Describe visible, useful image content"${locked}></label>
        <label>Evidence URL<input name="evidence_url" value="${esc(item.evidence_url||'')}" placeholder="Approved evidence or screenshot URL"${locked}></label>
        <label>Review notes<textarea name="notes" rows="3" placeholder="Accuracy, crop, performance, consent, or correction details"${locked}>${esc(item.notes||'')}</textarea></label>
        <label>Change note<input name="change_note" placeholder="What changed in this review"${locked}></label>
        <div class="image-manifest-save-row"><button class="btn primary" type="submit"${locked}>Save evidence</button><span class="small" data-save-message></span></div>
      </form></div></article>`;
  }
  function render(){
    const summary=summarize(state.items);const shown=filtered();
    const banner=state.fallback?`<section class="card manifest-mode-banner is-warning"><strong>Unsynced fallback — review only.</strong><span>${esc(state.error||'The saved database manifest is unavailable.')}</span><button class="btn" type="button" data-retry-manifest>Retry database</button></section>`:`<section class="card manifest-mode-banner is-live"><strong>Database status authority connected.</strong><span>Changes create review history and admin audit evidence.</span><button class="btn" type="button" data-retry-manifest>Reload</button></section>`;
    mount.innerHTML=`${banner}<section class="image-manifest-summary" aria-label="Manifest summary"><article class="card"><strong>${summary.total}</strong><span>Total requirements</span></article><article class="card"><strong>${summary.open_launch_blockers}</strong><span>Open launch blockers</span></article><article class="card"><strong>${summary.missing_or_placeholder}</strong><span>Missing / placeholder</span></article><article class="card"><strong>${summary.generated_editorial}</strong><span>Generated editorials</span></article><article class="card"><strong>${summary.approved}</strong><span>Fully approved</span></article></section>
      <section class="card image-manifest-toolbar"><label>Search<input id="manifestSearch" type="search" value="${esc(state.query)}" placeholder="Title, route, owner, or key"></label><label>Status<select id="manifestStatusFilter"><option value="all">All statuses</option>${options(STATUS,state.filter)}</select></label><label class="manifest-checkbox"><input id="manifestBlockersOnly" type="checkbox"${state.blockersOnly?' checked':''}>Open launch blockers only</label><span class="small">Showing ${shown.length} of ${state.items.length}</span></section>
      ${shown.length?`<section class="image-manifest-grid">${shown.map(itemCard).join('')}</section>`:`<section class="card"><h2>No items match these local filters</h2><p>Clear the search, status, or blocker filter. This message never means the database manifest is complete.</p><button class="btn" type="button" data-clear-manifest-filters>Clear filters</button></section>`}
      ${state.history.length&&!state.fallback?`<section class="card image-manifest-history"><h2>Recent saved changes</h2><div class="admin-table-wrap"><table><thead><tr><th>When</th><th>Item</th><th>Change</th><th>Evidence</th></tr></thead><tbody>${state.history.slice(0,30).map(row=>`<tr><td>${esc(row.created_at||'')}</td><td>${esc(row.manifest_title||row.manifest_key||'')}</td><td>${esc(label(row.previous_status||'new'))} → ${esc(label(row.next_status||''))}<div class="small">${esc(row.change_note||'')}</div></td><td>${safeUrl(row.evidence_url)?`<a href="${esc(safeUrl(row.evidence_url))}" target="_blank" rel="noopener">Open</a>`:'—'}</td></tr>`).join('')}</tbody></table></div></section>`:''}`;
    mount.querySelectorAll('.image-manifest-preview img').forEach((img)=>img.addEventListener('error',()=>{img.src='/assets/logo-clear.png';img.classList.add('is-image-fallback');},{once:true}));
    mount.querySelector('[data-retry-manifest]')?.addEventListener('click',load);
    mount.querySelector('[data-clear-manifest-filters]')?.addEventListener('click',()=>{state.query='';state.filter='all';state.blockersOnly=false;render();});
    mount.querySelector('#manifestSearch')?.addEventListener('change',(event)=>{state.query=event.target.value;render();});
    mount.querySelector('#manifestSearch')?.addEventListener('keydown',(event)=>{if(event.key==='Enter'){event.preventDefault();state.query=event.currentTarget.value;render();}});
    mount.querySelector('#manifestStatusFilter')?.addEventListener('change',(event)=>{state.filter=event.target.value;render();});
    mount.querySelector('#manifestBlockersOnly')?.addEventListener('change',(event)=>{state.blockersOnly=event.target.checked;render();});
    mount.querySelectorAll('.image-manifest-form').forEach((form)=>form.addEventListener('submit',save));
  }
  async function save(event){
    event.preventDefault();if(state.fallback)return;
    const form=event.currentTarget;const message=form.querySelector('[data-save-message]');const button=form.querySelector('button[type="submit"]');
    message.textContent='Saving…';button.disabled=true;
    try{
      const payload=Object.fromEntries(new FormData(form).entries());
      const response=await window.DDAuth.apiFetch('/api/admin/image-manifest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw new Error(data?.error||'Manifest save failed.');
      message.textContent=data.message||'Saved.';await load();
    }catch(error){message.textContent=error?.message||'Nothing was saved.';button.disabled=false;}
  }
  async function load(){
    mount.innerHTML='<section class="card"><p>Loading the database image manifest…</p></section>';
    if(!window.DDAuth){state={...state,items:FALLBACK,history:[],fallback:true,error:'Authentication tools did not load. No evidence can be saved.'};render();return;}
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/image-manifest');
      const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw new Error(data?.error||'The manifest response was incomplete.');
      if(!Array.isArray(data.items)||data.migration_pending)throw new Error(data.message||'Build 230 manifest seed rows are not available.');
      state={...state,items:data.items,history:Array.isArray(data.history)?data.history:[],fallback:false,error:''};render();
    }catch(error){state={...state,items:FALLBACK,history:[],fallback:true,error:error?.message||'The saved manifest could not be loaded.'};render();}
  }
  load();
});
