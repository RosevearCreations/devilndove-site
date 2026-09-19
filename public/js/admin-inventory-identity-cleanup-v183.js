// Release 467 Build 183 identity authority, extended through Build 200 Supplier/Source and Build 201 Cycle Count & Duplicate Identity Resolution.
// This UI never mutates Inventory. It routes reviewed fixes into existing Inventory Operations authorities.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('inventoryIdentityCleanupMount');
  if(!mount||!window.DDAuth)return;
  const state={queue:'supplier_source',supplierFilter:'all',q:'',loading:false,summaryLoaded:false,items:[],cursor:0,queueKey:'',duplicateCursor:0};
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v)=>Number(v||0);
  const focusByIssue={supplier_name:'siteInventorySupplierName',source_reference:'siteInventorySourceUrl',supplier_sku:'siteInventorySupplierSku'};
  function msg(text='',error=false){const el=document.getElementById('inventoryIdentityCleanupMessage');if(!el)return;el.textContent=text;el.hidden=!text;el.classList.toggle('is-error',Boolean(error));el.classList.toggle('is-success',Boolean(text&&!error));}
  async function api(mode,params={}){
    const query=new URLSearchParams({mode,...params});
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/inventory-identity-health?'+query,{cache:'no-store',signal:controller.signal});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||data?.detail||('Inventory identity request failed ('+response.status+').'));
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw new Error('Live D1 Inventory evidence review took too long to answer. Try again.');
      throw error;
    }finally{clearTimeout(timer);}
  }
  const card=(label,value,note='')=>'<div class="card inventory-identity-stat"><span class="small">'+esc(label)+'</span><strong>'+n(value).toLocaleString()+'</strong><span class="small">'+esc(note)+'</span></div>';
  function renderSummary(s={}){
    const el=document.getElementById('inventoryIdentityCleanupSummary');if(!el)return;
    el.innerHTML=[
      card('Active Tool/Supply',s.active_items,'live Inventory rows'),
      card('Supplier blank (raw)',s.missing_supplier_name,'starting evidence count'),
      card('Supplier unresolved',s.supplier_evidence_unresolved,'excludes explicit reviewed N/A'),
      card('Source blank (raw)',s.missing_source_reference,'source/Amazon URL'),
      card('Source unresolved',s.source_evidence_unresolved,'excludes explicit reviewed N/A'),
      card('Both unresolved',s.supplier_source_both_unresolved,'supplier + source missing'),
      card('Supplier N/A reviewed',s.supplier_not_applicable_reviewed,'explicit note marker'),
      card('Source N/A reviewed',s.source_not_applicable_reviewed,'explicit note marker'),
      card('Sourced without supplier SKU',s.missing_supplier_sku_when_sourced,'review supplier item code'),
      card('Duplicate identity rows',s.duplicate_identity_rows,'same source key across active Tool/Supply rows'),
      card('Physical count due',s.count_due,'never counted or 90+ days'),
      card('Catalog reference unmatched',s.catalog_reference_not_matched,'separate identity evidence'),
    ].join('');
  }
  function issueMarkup(item){
    const issues=Array.isArray(item.issues)?item.issues:[];
    return issues.map(x=>'<span class="'+(x.severity==='blocker'?'is-blocker':'is-attention')+'">'+esc(x.label)+'</span>').join('');
  }
  function supplierStateMarkup(item={}){
    const s=item.supplier_source_state||{};
    return '<div class="small">Supplier: <strong>'+esc(s.supplier_status||'unknown')+'</strong> · Source: <strong>'+esc(s.source_status||'unknown')+'</strong> · Supplier SKU: <strong>'+esc(s.supplier_sku_status||'unknown')+'</strong></div>';
  }
  function firstRepair(item={}){
    if(state.queue==='duplicates')return {focus:'siteInventorySourceType',label:'duplicate identity in Full edit'};
    const issues=Array.isArray(item.issues)?item.issues:[];
    const issue=issues.find(x=>focusByIssue[x.code]);
    return {focus:(issue&&focusByIssue[issue.code])||'siteInventorySupplierName',label:issue?.label||'Supplier/source review'};
  }
  function rememberItems(items=[]){
    state.items=Array.isArray(items)?items:[];
    state.queueKey='ddInventoryEvidenceCursor:'+state.queue+':'+state.supplierFilter+':'+state.q.toLowerCase();
    const saved=n(sessionStorage.getItem(state.queueKey));
    state.cursor=state.items.length?saved%state.items.length:0;
    const button=document.getElementById('inventorySupplierSourceNext');
    if(button){button.disabled=!state.items.length;button.textContent=state.items.length?'Open next unresolved ('+(state.cursor+1)+'/'+state.items.length+')':'Open next unresolved';}
    const duplicate=document.getElementById('inventoryDuplicateNext');
    if(duplicate){duplicate.disabled=!state.items.length;duplicate.textContent=state.items.length?'Open next duplicate ('+(state.cursor+1)+'/'+state.items.length+')':'Open next duplicate';}
  }
  function renderItems(items=[]){
    const el=document.getElementById('inventoryIdentityCleanupResults');if(!el)return;
    rememberItems(items);
    if(!items.length){el.innerHTML='<div class="card"><strong>No identity/provenance issues match this view.</strong></div>';return;}
    el.innerHTML='<div class="inventory-identity-table-wrap"><table class="inventory-identity-table"><thead><tr><th>Tool / Supply</th><th>Supplier & source evidence</th><th>Other evidence</th><th>Catalog</th><th>Reviewed action</th></tr></thead><tbody>'+items.map(item=>{
      const id=n(item.site_item_inventory_id),repair=firstRepair(item);
      const integrityOwner=(item.issues||[]).some(x=>x.owner==='integrity');
      return '<tr>'
        +'<td><strong>'+esc(item.item_name||item.external_key||('Inventory #'+id))+'</strong><div class="small">#'+id+' · '+esc(item.source_type||'')+' · '+esc(item.category||'uncategorized')+'</div></td>'
        +'<td><div class="inventory-identity-tags">'+issueMarkup(item)+'</div>'+supplierStateMarkup(item)+'<div class="small">Supplier: '+esc(item.supplier_name||'—')+' · source: '+esc(item.source_url||item.amazon_url||'—')+'</div></td>'
        +'<td><div class="small">Mode: '+esc(item.usage_tracking_mode||'')+' · on hand '+n(item.on_hand_quantity)+' · reorder at '+n(item.reorder_level)+'</div><div class="small">'+(item.last_counted_at?('Last count: '+esc(item.last_counted_at)):'Never counted')+'</div></td>'
        +'<td><strong>'+esc(item.catalog_reference_status||'unknown')+'</strong><div class="small">Duplicate key rows: '+n(item.key_duplicate_count)+' · same-kind: '+n(item.same_kind_duplicate_count)+'</div></td>'
        +'<td><div class="inventory-identity-actions">'
        +'<button class="btn primary" type="button" data-inventory-focus="'+esc(repair.focus)+'" data-inventory-review-key="'+esc(item.external_key||item.item_name||'')+'" data-inventory-review-id="'+id+'">Open '+esc(repair.label)+'</button>'
        +'<button class="btn" type="button" data-inventory-evidence-recheck="'+id+'" data-expected-updated-at="'+esc(item.updated_at||'')+'">Review candidate evidence</button>'
        +(integrityOwner?'<button class="btn" type="button" data-integrity-review-key="'+esc(item.external_key||item.item_name||'')+'" data-integrity-queue="'+(n(item.usage_review_required)?'usage_setup':(n(item.count_due)?'count_due':'all'))+'">Open count / usage review</button>':'')
        +'</div></td></tr>';
    }).join('')+'</tbody></table></div>';
  }
  async function loadSummary(){
    if(state.loading)return;state.loading=true;msg('Reading live D1 Inventory evidence summary…');
    try{const data=await api('summary');renderSummary(data.summary||{});state.summaryLoaded=true;msg('Evidence summary loaded. No Inventory data was changed.');}
    catch(error){msg(error.message||'Inventory evidence summary failed.',true);}
    finally{state.loading=false;}
  }
  async function loadIssues(){
    if(state.loading)return;state.loading=true;msg(state.queue==='duplicates'?'Loading up to 40 duplicate-identity review rows…':'Loading up to 40 reviewed Inventory evidence rows…');
    const el=document.getElementById('inventoryIdentityCleanupResults');if(el)el.innerHTML='<div class="card small">Reading bounded live D1 issue rows…</div>';
    try{
      const data=await api('issues',{queue:state.queue,q:state.q,limit:'40',supplier_filter:state.supplierFilter});
      renderItems(data.items||[]);
      msg((data.items||[]).length+' issue row(s) loaded. Nothing was merged, counted, or changed automatically.');
    }catch(error){if(el)el.innerHTML='';rememberItems([]);msg(error.message||'Inventory evidence issues failed.',true);}
    finally{state.loading=false;}
  }
  function candidateMarkup(rows=[]){
    if(!rows.length)return '<div class="small">No same-identity candidate supplier/source evidence was found. Leave unknown facts blank until we have reviewed evidence.</div>';
    return '<div class="small">'+rows.map(row=>'<div style="padding:7px 0;border-bottom:1px solid var(--border)"><strong>'+esc(row.origin||'candidate')+'</strong> · '+esc(row.item_name||'same identity')+'<br>Supplier: '+esc(row.supplier_name||'—')+' · SKU: '+esc(row.supplier_sku||'—')+' · Source: '+esc(row.source_reference||'—')+'<br><em>Evidence only — never auto-selected.</em></div>').join('')+'</div>';
  }
  async function recheckEvidence(button){
    if(state.loading)return;
    const inventoryId=n(button?.dataset?.inventoryEvidenceRecheck);
    if(!inventoryId)return;
    state.loading=true;button.disabled=true;msg('Rechecking one Inventory record and bounded supplier/source evidence…');
    const evidenceEl=document.getElementById('inventoryEvidenceRecheckResult');
    if(evidenceEl)evidenceEl.innerHTML='<div class="small">Reading one target plus bounded duplicate/catalog evidence…</div>';
    try{
      const data=await api('record',{inventory_id:String(inventoryId),expected_updated_at:String(button.dataset.expectedUpdatedAt||'')});
      const e=data.evidence||{},target=e.target||{},dups=Array.isArray(e.duplicate_group)?e.duplicate_group:[],catalog=Array.isArray(e.catalog_matches)?e.catalog_matches:[],candidates=Array.isArray(e.candidate_evidence)?e.candidate_evidence:[];
      const duplicateText=dups.map(row=>'#'+n(row.site_item_inventory_id)+' '+esc(row.source_type||'')+' · '+esc(row.item_name||'')+' · supplier '+esc(row.supplier_name||'—')+' · source '+esc(row.source_url||row.amazon_url||'—')+' · '+esc(row.updated_at||'')).join('<br>');
      const catalogText=catalog.map(row=>'#'+n(row.catalog_item_id)+' '+esc(row.item_kind||'')+' · '+esc(row.status||'active')+' · '+esc(row.name||row.source_key||'')+' · supplier '+esc(row.supplier_name||'—')+' · source '+esc(row.amazon_url||'—')).join('<br>');
      const s=e.supplier_source_state||{};
      if(evidenceEl)evidenceEl.innerHTML='<div class="card"><strong>'+esc(target.item_name||target.external_key||('Inventory #'+inventoryId))+'</strong>'
        +'<div class="small">'+(e.stale_target?'Stale queue snapshot detected — rely on this current evidence before editing.':'Queue timestamp matches the current Inventory record.')+'</div>'
        +'<div class="small">Catalog: '+esc(e.catalog_reference_status||'unknown')+' · safe reference: '+(e.catalog_reference_safe?'yes':'no / fail closed')+'</div>'
        +'<div class="small">Supplier: '+esc(s.supplier_status||'unknown')+' · source reference: '+esc(s.source_status||'unknown')+' · supplier SKU: '+esc(s.supplier_sku_status||'unknown')+'</div>'
        +'<details open><summary>Candidate supplier/source evidence ('+candidates.length+')</summary>'+candidateMarkup(candidates)+'</details>'
        +(dups.length?'<details><summary>Compare duplicate-group evidence</summary><div class="small">'+duplicateText+'</div></details>':'')
        +(catalog.length?'<details><summary>Catalog-reference evidence</summary><div class="small">'+catalogText+'</div></details>':'')
        +'<div class="small" style="margin-top:10px"><strong>Known not applicable:</strong> only an explicit reviewed note marker counts. Use <code>[supplier-not-applicable]</code> or <code>[source-not-applicable]</code> in Reorder / Usage Notes. Blank fields remain unknown.</div>'
        +'<div class="inventory-identity-actions"><button class="btn" type="button" data-inventory-review-key="'+esc(target.external_key||target.item_name||'')+'" data-inventory-review-id="'+inventoryId+'" data-inventory-focus="siteInventorySupplierName">Open supplier field</button><button class="btn" type="button" data-inventory-review-key="'+esc(target.external_key||target.item_name||'')+'" data-inventory-review-id="'+inventoryId+'" data-inventory-focus="siteInventorySourceUrl">Open source field</button><button class="btn" type="button" data-inventory-review-key="'+esc(target.external_key||target.item_name||'')+'" data-inventory-review-id="'+inventoryId+'" data-inventory-focus="siteInventoryNotes">Open N/A notes field</button></div></div>';
      button.dataset.expectedUpdatedAt=String(e.current_updated_at||'');
      msg('One-record supplier/source recheck complete. Candidate evidence was shown only; no value was selected or saved.');
    }catch(error){
      if(evidenceEl)evidenceEl.innerHTML='';
      msg(error.message||'Inventory evidence recheck failed.',true);
    }finally{state.loading=false;button.disabled=false;}
  }
  function focusEditorField(id){const target=document.getElementById(id);if(!target)return false;target.focus();target.scrollIntoView({behavior:'smooth',block:'center'});return true;}
  function openInventoryEditor(key,inventoryId,focusId){
    const search=document.getElementById('siteInventorySearch');
    const mountTarget=document.getElementById('siteInventoryAdminMount');
    if(!search||!mountTarget){msg('Inventory editor is not ready yet. Try again in a moment.',true);return;}
    search.value=key||'';search.dispatchEvent(new Event('input',{bubbles:true}));
    const tryOpen=()=>{const fullEdit=document.querySelector('[data-load-form-id="'+inventoryId+'"]');if(!fullEdit)return false;fullEdit.click();focusEditorField(focusId||'siteInventorySupplierName');msg('Inventory full edit opened at the owning field. Review evidence before saving; nothing was copied automatically.');return true;};
    if(!tryOpen()){mountTarget.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>{if(!tryOpen())msg('Inventory table is filtered to this identity. Choose Full edit, then review the supplier/source field before saving.');},450);}
  }
  function openNextUnresolved(){
    if(!state.items.length)return;
    const item=state.items[state.cursor%state.items.length],repair=firstRepair(item);
    state.cursor=(state.cursor+1)%state.items.length;sessionStorage.setItem(state.queueKey,String(state.cursor));
    rememberItems(state.items);
    openInventoryEditor(item.external_key||item.item_name||'',n(item.site_item_inventory_id),repair.focus);
  }
  function openDuplicateQueue(){
    state.queue='duplicates';state.q=String(document.getElementById('inventoryIdentityCleanupSearch')?.value||'').trim();
    const select=document.getElementById('inventoryIdentityCleanupQueue');if(select)select.value='duplicates';
    syncQueueControls();loadIssues();
  }
  function openCountDueQueue(){
    const search=document.getElementById('inventoryIntegritySearch'),select=document.getElementById('inventoryIntegrityQueue'),load=document.getElementById('inventoryIntegrityLoad'),target=document.getElementById('inventoryIntegrityReviewMount');
    if(!search||!select||!load||!target){msg('Physical-count review is not ready yet. Try again in a moment.',true);return;}
    search.value='';select.value='count_due';select.dispatchEvent(new Event('change',{bubbles:true}));load.click();target.scrollIntoView({behavior:'smooth',block:'start'});msg('Physical-count due queue opened. Counts remain explicit audited saves; nothing is counted automatically.');
  }
  function openIntegrity(key,queue){
    const search=document.getElementById('inventoryIntegritySearch'),select=document.getElementById('inventoryIntegrityQueue'),load=document.getElementById('inventoryIntegrityLoad'),target=document.getElementById('inventoryIntegrityReviewMount');
    if(!search||!select||!load||!target){msg('Physical count / usage review is not ready yet. Try again in a moment.',true);return;}
    search.value=key||'';select.value=queue||'all';select.dispatchEvent(new Event('change',{bubbles:true}));load.click();target.scrollIntoView({behavior:'smooth',block:'start'});msg('Count / usage review opened for this identity. Any save remains an explicit audited Inventory action.');
  }
  function syncQueueControls(){const wrap=document.getElementById('inventorySupplierSourceFilterWrap'),next=document.getElementById('inventorySupplierSourceNext'),duplicate=document.getElementById('inventoryDuplicateNext'),supplierMode=state.queue==='supplier_source',duplicateMode=state.queue==='duplicates';if(wrap)wrap.hidden=!supplierMode;if(next)next.hidden=!supplierMode;if(duplicate)duplicate.hidden=!duplicateMode;}
  function render(){
    mount.innerHTML='<section class="card inventory-identity-cleanup" aria-labelledby="inventoryIdentityCleanupHeading">'
      +'<div class="section-heading-row"><div><p class="inventory-operations-eyebrow">Release 467 Build 201 · Cycle Count & Duplicate Identity Resolution</p><h3 id="inventoryIdentityCleanupHeading">Tool & Supply Identity Review</h3><p class="small">The Build 200 Supplier & Source Workbench remains available here; Build 201 also makes duplicate identities and count-due work explicit. Duplicate rows never merge automatically; physical counts never save automatically.</p></div><button class="btn primary" type="button" id="inventoryIdentityCleanupSummaryButton">Load identity health</button></div>'
      +'<div id="inventoryIdentityCleanupSummary" class="inventory-identity-summary"><div class="small">Identity summary is paused during page startup.</div></div>'
      +'<div class="inventory-identity-controls"><label class="small">Queue<select class="input" id="inventoryIdentityCleanupQueue"><option value="supplier_source" selected>Supplier / source facts</option><option value="all">All identity attention</option><option value="duplicates">Duplicate / missing identity</option><option value="usage">Usage setup</option><option value="count_reorder">Count / reorder context</option><option value="catalog">Catalog reference drift</option></select></label>'
      +'<label class="small" id="inventorySupplierSourceFilterWrap">Supplier/source filter<select class="input" id="inventorySupplierSourceFilter"><option value="all">All unresolved provenance</option><option value="both">Supplier + source both missing</option><option value="missing_supplier">Missing supplier</option><option value="missing_source">Missing source reference</option><option value="missing_sku">Source known, supplier SKU missing</option><option value="known_na">Reviewed not applicable</option></select></label>'
      +'<label class="small">Search<input class="input" id="inventoryIdentityCleanupSearch" type="search" placeholder="name, key, category, supplier"/></label><button class="btn" type="button" id="inventoryIdentityCleanupLoad">Load 40 issue rows</button><button class="btn" type="button" id="inventorySupplierSourceNext" disabled>Open next unresolved</button><button class="btn" type="button" id="inventoryDuplicateNext" hidden disabled>Open next duplicate</button><button class="btn" type="button" id="inventoryOpenDuplicates">Open duplicate identity queue</button><button class="btn" type="button" id="inventoryOpenCountDue">Open physical count due queue</button></div>'
      +'<div class="card small" style="margin-top:10px"><strong>Evidence rule:</strong> blank supplier/source fields remain unknown. If review proves a field genuinely does not apply, record <code>[supplier-not-applicable]</code> or <code>[source-not-applicable]</code> in Reorder / Usage Notes through Full edit. These markers are never generated automatically.</div>'
      +'<div id="inventoryIdentityCleanupMessage" class="small" hidden aria-live="polite"></div><div id="inventoryEvidenceRecheckResult" style="margin:12px 0"></div><div id="inventoryIdentityCleanupResults"><div class="small">Choose Load 40 issue rows when you are ready to review corrections.</div></div>'
      +'<details class="inventory-identity-policy"><summary>How duplicate classification cleanup works</summary><p class="small">Nothing merges automatically. If review shows the same source key represented as both Tool and Supply, use Full edit and deliberately correct the Tool/Supply classification. The established Build 244 Inventory authority can consolidate into an existing canonical target without double-counting legacy default stock, and updates linked Product-resource/catalog kind references as part of that explicit save.</p></details></section>';
    document.getElementById('inventoryIdentityCleanupSummaryButton')?.addEventListener('click',loadSummary);
    document.getElementById('inventoryIdentityCleanupLoad')?.addEventListener('click',()=>{state.q=String(document.getElementById('inventoryIdentityCleanupSearch')?.value||'').trim();loadIssues();});
    document.getElementById('inventoryIdentityCleanupQueue')?.addEventListener('change',(event)=>{state.queue=String(event.target.value||'supplier_source');syncQueueControls();});
    document.getElementById('inventorySupplierSourceFilter')?.addEventListener('change',(event)=>{state.supplierFilter=String(event.target.value||'all');});
    document.getElementById('inventorySupplierSourceNext')?.addEventListener('click',openNextUnresolved);
    document.getElementById('inventoryDuplicateNext')?.addEventListener('click',openNextUnresolved);
    document.getElementById('inventoryOpenDuplicates')?.addEventListener('click',openDuplicateQueue);
    document.getElementById('inventoryOpenCountDue')?.addEventListener('click',openCountDueQueue);
    document.getElementById('inventoryIdentityCleanupSearch')?.addEventListener('keydown',(event)=>{if(event.key!=='Enter')return;event.preventDefault();state.q=String(event.currentTarget.value||'').trim();loadIssues();});
    mount.addEventListener('click',(event)=>{const recheck=event.target.closest('[data-inventory-evidence-recheck]');if(recheck){recheckEvidence(recheck);return;}const inventory=event.target.closest('[data-inventory-review-key]');if(inventory){openInventoryEditor(inventory.getAttribute('data-inventory-review-key')||'',n(inventory.getAttribute('data-inventory-review-id')),inventory.getAttribute('data-inventory-focus')||'siteInventorySupplierName');return;}const integrity=event.target.closest('[data-integrity-review-key]');if(integrity)openIntegrity(integrity.getAttribute('data-integrity-review-key')||'',integrity.getAttribute('data-integrity-queue')||'all');});
    syncQueueControls();
  }
  render();
});
