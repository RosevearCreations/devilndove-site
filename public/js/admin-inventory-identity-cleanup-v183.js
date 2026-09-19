// Release 467 Build 183 identity authority, extended by Build 189 Inventory evidence closure.
// This UI never mutates Inventory. It routes reviewed fixes into existing Inventory Operations authorities.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('inventoryIdentityCleanupMount');
  if(!mount||!window.DDAuth)return;
  const state={queue:'all',q:'',loading:false,summaryLoaded:false};
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v)=>Number(v||0);
  function msg(text='',error=false){const el=document.getElementById('inventoryIdentityCleanupMessage');if(!el)return;el.textContent=text;el.hidden=!text;el.classList.toggle('is-error',Boolean(error));el.classList.toggle('is-success',Boolean(text&&!error));}
  async function api(mode,params={}){
    const query=new URLSearchParams({mode,...params});
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await window.DDAuth.apiFetch(`/api/admin/inventory-identity-health?${query}`,{cache:'no-store',signal:controller.signal});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||data?.detail||`Inventory identity request failed (${response.status}).`);
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw new Error('Live D1 Inventory identity review took too long to answer. Try again.');
      throw error;
    }finally{clearTimeout(timer);}
  }
  const card=(label,value,note='')=>`<div class="card inventory-identity-stat"><span class="small">${esc(label)}</span><strong>${n(value).toLocaleString()}</strong><span class="small">${esc(note)}</span></div>`;
  function renderSummary(s={}){
    const el=document.getElementById('inventoryIdentityCleanupSummary');if(!el)return;
    el.innerHTML=[
      card('Active Tool/Supply',s.active_items,'live Inventory rows'),
      card('Duplicate identity rows',s.duplicate_identity_rows,'same source key across active Tool/Supply rows'),
      card('Missing supplier',s.missing_supplier_name,'supplier review'),
      card('Missing source reference',s.missing_source_reference,'source/Amazon URL'),
      card('Sourced without supplier SKU',s.missing_supplier_sku_when_sourced,'review supplier item code'),
      card('Usage review required',s.usage_review_required,'conversion / tracking mode'),
      card('Physical count due',s.count_due,'never counted or 90+ days'),
      card('Reorder review',s.reorder_review_required,'threshold/list contradiction'),
      card('Catalog reference unmatched',s.catalog_reference_not_matched,'missing or wrong Tool/Supply kind'),
    ].join('');
  }
  function issueMarkup(item){
    const issues=Array.isArray(item.issues)?item.issues:[];
    return issues.map(x=>`<span class="${x.severity==='blocker'?'is-blocker':'is-attention'}">${esc(x.label)}</span>`).join('');
  }
  function renderItems(items=[]){
    const el=document.getElementById('inventoryIdentityCleanupResults');if(!el)return;
    if(!items.length){el.innerHTML='<div class="card"><strong>No identity-cleanup issues match this view.</strong></div>';return;}
    el.innerHTML=`<div class="inventory-identity-table-wrap"><table class="inventory-identity-table"><thead><tr><th>Tool / Supply</th><th>Identity & source</th><th>Usage / count / reorder</th><th>Catalog</th><th>Reviewed action</th></tr></thead><tbody>${items.map(item=>{
      const id=n(item.site_item_inventory_id);
      const integrityOwner=(item.issues||[]).some(x=>x.owner==='integrity');
      return `<tr>
        <td><strong>${esc(item.item_name||item.external_key||`Inventory #${id}`)}</strong><div class="small">#${id} · ${esc(item.source_type||'')} · ${esc(item.category||'uncategorized')}</div></td>
        <td><div class="inventory-identity-tags">${issueMarkup(item)}</div><div class="small">Key: ${esc(item.external_key||'missing')} · Supplier: ${esc(item.supplier_name||'missing')}</div></td>
        <td><div class="small">Mode: ${esc(item.usage_tracking_mode||'')} · on hand ${n(item.on_hand_quantity)} · reorder at ${n(item.reorder_level)}</div><div class="small">${item.last_counted_at?`Last count: ${esc(item.last_counted_at)}`:'Never counted'}</div></td>
        <td><strong>${esc(item.catalog_reference_status||'unknown')}</strong><div class="small">Duplicate key rows: ${n(item.key_duplicate_count)} · same-kind: ${n(item.same_kind_duplicate_count)}</div></td>
        <td><div class="inventory-identity-actions">
          <button class="btn" type="button" data-inventory-review-key="${esc(item.external_key||item.item_name||'')}">Open Inventory editor</button>
          <button class="btn" type="button" data-inventory-evidence-recheck="${id}" data-expected-updated-at="${esc(item.updated_at||'')}">Recheck evidence</button>
          ${integrityOwner?`<button class="btn" type="button" data-integrity-review-key="${esc(item.external_key||item.item_name||'')}" data-integrity-queue="${n(item.usage_review_required)?'usage_setup':(n(item.count_due)?'count_due':'all')}">Open count / usage review</button>`:''}
        </div></td>
      </tr>`;
    }).join('')}</tbody></table></div>`;
  }
  async function loadSummary(){
    if(state.loading)return;state.loading=true;msg('Reading live D1 Inventory identity summary…');
    try{const data=await api('summary');renderSummary(data.summary||{});state.summaryLoaded=true;msg('Identity summary loaded. No Inventory data was changed.');}
    catch(error){msg(error.message||'Inventory identity summary failed.',true);}
    finally{state.loading=false;}
  }
  async function loadIssues(){
    if(state.loading)return;state.loading=true;msg('Loading up to 40 reviewed-action candidates…');
    const el=document.getElementById('inventoryIdentityCleanupResults');if(el)el.innerHTML='<div class="card small">Reading bounded live D1 issue rows…</div>';
    try{const data=await api('issues',{queue:state.queue,q:state.q,limit:'40'});renderItems(data.items||[]);msg(`${(data.items||[]).length} issue row(s) loaded. Nothing was changed automatically.`);}
    catch(error){if(el)el.innerHTML='';msg(error.message||'Inventory identity issues failed.',true);}
    finally{state.loading=false;}
  }
  async function recheckEvidence(button){
    if(state.loading)return;
    const inventoryId=n(button&&button.dataset?button.dataset.inventoryEvidenceRecheck:0);
    if(!inventoryId)return;
    state.loading=true;button.disabled=true;msg('Rechecking one Inventory record and its bounded identity/catalog evidence…');
    const evidenceEl=document.getElementById('inventoryEvidenceRecheckResult');
    if(evidenceEl)evidenceEl.innerHTML='<div class="small">Reading one target plus bounded duplicate/catalog evidence…</div>';
    try{
      const data=await api('record',{inventory_id:String(inventoryId),expected_updated_at:String(button.dataset.expectedUpdatedAt||'')});
      const e=data.evidence||{},target=e.target||{},dups=Array.isArray(e.duplicate_group)?e.duplicate_group:[],catalog=Array.isArray(e.catalog_matches)?e.catalog_matches:[];
      const duplicateText=dups.map(row=>'#'+n(row.site_item_inventory_id)+' '+esc(row.source_type||'')+' · '+esc(row.item_name||'')+' · on hand '+n(row.on_hand_quantity)+' · reserved '+n(row.reserved_quantity)+' · cost '+n(row.unit_cost_cents)+'¢ · '+esc(row.updated_at||'')).join('<br>');
      const catalogText=catalog.map(row=>'#'+n(row.catalog_item_id)+' '+esc(row.item_kind||'')+' · '+esc(row.status||'active')+' · '+esc(row.name||row.source_key||'')).join('<br>');
      if(evidenceEl)evidenceEl.innerHTML='<div class="card"><strong>'+esc(target.item_name||target.external_key||('Inventory #'+inventoryId))+'</strong>'
        +'<div class="small">'+(e.stale_target?'Stale queue snapshot detected — rely on this current evidence before editing.':'Queue timestamp matches the current Inventory record.')+'</div>'
        +'<div class="small">Catalog: '+esc(e.catalog_reference_status||'unknown')+' · safe reference: '+(e.catalog_reference_safe?'yes':'no / fail closed')+' · count: '+esc(e.count_action||'')+'</div>'
        +'<div class="small">Supplier: '+(e.supplier_evidence&&e.supplier_evidence.supplier_name_present?'present':'missing')+' · source reference: '+(e.supplier_evidence&&e.supplier_evidence.source_reference_present?'present':'missing')+' · supplier SKU: '+(e.supplier_evidence&&e.supplier_evidence.supplier_sku_present?'present':'missing')+'</div>'
        +'<div class="small">Duplicate-group members: '+dups.length+' · catalog candidates: '+catalog.length+'</div>'
        +(dups.length?'<details><summary>Compare duplicate-group evidence</summary><div class="small">'+duplicateText+'</div></details>':'')
        +(catalog.length?'<details><summary>Catalog-reference evidence</summary><div class="small">'+catalogText+'</div></details>':'')
        +'<div class="inventory-identity-actions"><button class="btn" type="button" data-inventory-review-key="'+esc(target.external_key||target.item_name||'')+'">Open Inventory editor</button></div></div>';
      button.dataset.expectedUpdatedAt=String(e.current_updated_at||'');
      msg('One-record evidence recheck complete. No merge, count, stock, cost or catalog change was performed.');
    }catch(error){
      if(evidenceEl)evidenceEl.innerHTML='';
      msg(error.message||'Inventory evidence recheck failed.',true);
    }finally{state.loading=false;button.disabled=false;}
  }
  function openInventoryEditor(key){
    const search=document.getElementById('siteInventorySearch');
    const mountTarget=document.getElementById('siteInventoryAdminMount');
    if(!search||!mountTarget){msg('Inventory editor is not ready yet. Try again in a moment.',true);return;}
    search.value=key||'';
    search.dispatchEvent(new Event('input',{bubbles:true}));
    mountTarget.scrollIntoView({behavior:'smooth',block:'start'});
    msg('Inventory table filtered to this identity. Review the row, then choose Full edit before saving any correction.');
  }
  function openIntegrity(key,queue){
    const search=document.getElementById('inventoryIntegritySearch');
    const select=document.getElementById('inventoryIntegrityQueue');
    const load=document.getElementById('inventoryIntegrityLoad');
    const target=document.getElementById('inventoryIntegrityReviewMount');
    if(!search||!select||!load||!target){msg('Physical count / usage review is not ready yet. Try again in a moment.',true);return;}
    search.value=key||'';select.value=queue||'all';
    select.dispatchEvent(new Event('change',{bubbles:true}));
    load.click();
    target.scrollIntoView({behavior:'smooth',block:'start'});
    msg('Count / usage review opened for this identity. Any save remains an explicit audited Inventory action.');
  }
  function render(){
    mount.innerHTML=`
      <section class="card inventory-identity-cleanup" aria-labelledby="inventoryIdentityCleanupHeading">
        <div class="section-heading-row">
          <div><p class="inventory-operations-eyebrow">Release 467 Build 189 · Inventory evidence closure</p><h3 id="inventoryIdentityCleanupHeading">Tool & Supply Identity Review</h3><p class="small">Build 183 identity authority extended by Build 189: compare duplicate members, distinguish supplier from source evidence, detect archived/wrong-kind/missing catalog references, and recheck one Inventory record after a reviewed correction. This workspace stays read-only.</p></div>
          <button class="btn primary" type="button" id="inventoryIdentityCleanupSummaryButton">Load identity health</button>
        </div>
        <div id="inventoryIdentityCleanupSummary" class="inventory-identity-summary"><div class="small">Identity summary is paused during page startup.</div></div>
        <div class="inventory-identity-controls">
          <label class="small">Queue<select class="input" id="inventoryIdentityCleanupQueue">
            <option value="all">All identity attention</option>
            <option value="duplicates">Duplicate / missing identity</option>
            <option value="supplier_source">Supplier / source facts</option>
            <option value="usage">Usage setup</option>
            <option value="count_reorder">Count / reorder context</option>
            <option value="catalog">Catalog reference drift</option>
          </select></label>
          <label class="small">Search<input class="input" id="inventoryIdentityCleanupSearch" type="search" placeholder="name, key, category, supplier"/></label>
          <button class="btn" type="button" id="inventoryIdentityCleanupLoad">Load 40 issue rows</button>
        </div>
        <div id="inventoryIdentityCleanupMessage" class="small" hidden aria-live="polite"></div>
        <div id="inventoryEvidenceRecheckResult" style="margin:12px 0"></div>
        <div id="inventoryIdentityCleanupResults"><div class="small">Choose Load 40 issue rows when you are ready to review corrections.</div></div>
        <details class="inventory-identity-policy"><summary>How duplicate classification cleanup works</summary><p class="small">Nothing merges automatically. If review shows the same source key represented as both Tool and Supply, use Full edit and deliberately correct the Tool/Supply classification. The established Build 244 Inventory authority can consolidate into an existing canonical target without double-counting legacy default stock, and updates linked Product-resource/catalog kind references as part of that explicit save.</p></details>
      </section>`;
    document.getElementById('inventoryIdentityCleanupSummaryButton')?.addEventListener('click',loadSummary);
    document.getElementById('inventoryIdentityCleanupLoad')?.addEventListener('click',()=>{state.q=String(document.getElementById('inventoryIdentityCleanupSearch')?.value||'').trim();loadIssues();});
    document.getElementById('inventoryIdentityCleanupQueue')?.addEventListener('change',(event)=>{state.queue=String(event.target.value||'all');});
    document.getElementById('inventoryIdentityCleanupSearch')?.addEventListener('keydown',(event)=>{if(event.key!=='Enter')return;event.preventDefault();state.q=String(event.currentTarget.value||'').trim();loadIssues();});
    mount.addEventListener('click',(event)=>{
      const recheck=event.target.closest('[data-inventory-evidence-recheck]');
      if(recheck){recheckEvidence(recheck);return;}
      const inventory=event.target.closest('[data-inventory-review-key]');
      if(inventory){openInventoryEditor(inventory.getAttribute('data-inventory-review-key')||'');return;}
      const integrity=event.target.closest('[data-integrity-review-key]');
      if(integrity)openIntegrity(integrity.getAttribute('data-integrity-review-key')||'',integrity.getAttribute('data-integrity-queue')||'all');
    });
  }
  render();
});
