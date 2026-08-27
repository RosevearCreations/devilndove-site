// Devil n Dove Build 440 — supplier/source provenance cleanup workspace.
// Metadata-only; no stock or purchase-lot quantity mutation.

(() => {
  const mount=document.getElementById('inventorySourceProvenanceReviewMount');
  if(!mount||!window.DDAuth)return;
  let queues=null; let busy=false;
  const esc=(v)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  function msg(text,error=false){const el=document.getElementById('inventorySourceReviewMessage');if(!el)return;el.textContent=text||'';el.hidden=!text;el.classList.toggle('is-error',Boolean(text&&error));}
  async function readJson(response,fallback){if(window.DDAuth?.readApiJson)return window.DDAuth.readApiJson(response,fallback);const t=await response.text();let d={};try{d=t?JSON.parse(t):{}}catch{}if(!response.ok)throw new Error(d?.error||fallback||`Request failed (${response.status}).`);return d;}

  function render(){
    const summary=queues?.summary||{};
    const unverified=Array.isArray(queues?.unverified_sources)?queues.unverified_sources:[];
    const drift=Array.isArray(queues?.preferred_drift)?queues.preferred_drift:[];
    const cardinality=Array.isArray(queues?.preferred_cardinality)?queues.preferred_cardinality:[];
    const dupes=Array.isArray(queues?.duplicate_supplier_identifiers)?queues.duplicate_supplier_identifiers:[];
    const identifiers=Array.isArray(queues?.identifier_review)?queues.identifier_review:[];
    mount.innerHTML=`
      <section class="card inventory-receiving-card">
        <div class="inventory-receiving-heading"><div><p class="inventory-operations-eyebrow">Source cleanup</p><h3 style="margin:0">Supplier & Identifier Provenance Review</h3><p class="small">Resolve source drift and identity ambiguity without touching stock. Preferred sources sync back to the legacy Inventory supplier fields so older screens remain consistent.</p></div><button class="btn" type="button" id="inventorySourceReviewRefresh">Refresh</button></div>
        <div id="inventorySourceReviewMessage" class="small inventory-receiving-message" hidden></div>
        <div class="inventory-receiving-stock-grid" style="margin-top:12px">
          <span><b>${Number(summary.unverified_sources||0)}</b><small>sources to review</small></span>
          <span><b>${Number(summary.preferred_drift||0)+Number(summary.preferred_cardinality||0)}</b><small>preferred-source drift</small></span>
          <span><b>${Number(summary.duplicate_supplier_identifiers||0)+Number(summary.identifier_review||0)}</b><small>identifier issues</small></span>
        </div>
        <details open class="inventory-receiving-recent"><summary>Sources needing review (${unverified.length})</summary><div>${unverified.length?unverified.map(row=>`<div class="inventory-receiving-recent-row"><span><strong>${esc(row.item_name)}</strong><small>${esc(row.source_name||row.source_kind)} ${row.supplier_sku?`· ${esc(row.supplier_sku)}`:''}</small></span><span><button class="btn" data-source-review="${Number(row.inventory_item_source_id||0)}" data-status="verified">Verify</button> <button class="btn" data-source-review="${Number(row.inventory_item_source_id||0)}" data-status="rejected">Reject</button> <button class="btn" data-source-preferred="${Number(row.inventory_item_source_id||0)}">Make preferred</button></span></div>`).join(''):'<div class="small">No unverified source records.</div>'}</div></details>
        <details class="inventory-receiving-recent"><summary>Preferred-source drift (${drift.length+cardinality.length})</summary><div>${drift.map(row=>`<div class="inventory-receiving-recent-row"><span><strong>${esc(row.item_name)}</strong><small>Preferred source differs from legacy Inventory fields.</small></span><span><button class="btn" data-source-preferred="${Number(row.inventory_item_source_id||0)}">Sync preferred source</button></span></div>`).join('')}${cardinality.map(row=>`<div class="inventory-receiving-recent-row"><span><strong>${esc(row.item_name)}</strong><small>${esc(row.source_count)} source(s), ${esc(row.preferred_count)} preferred. Open receiving/search this item to review its sources.</small></span><span>Inventory #${esc(row.site_item_inventory_id)}</span></div>`).join('')||(!drift.length?'<div class="small">Preferred source state is consistent.</div>':'')}</div></details>
        <details class="inventory-receiving-recent"><summary>Identifier review (${identifiers.length})</summary><div>${identifiers.length?identifiers.map(row=>`<div class="inventory-receiving-recent-row"><span><strong>${esc(row.item_name)}</strong><small>${esc(row.identifier_type)} · ${esc(row.identifier_value)}</small></span><span><button class="btn" data-identifier-review="${Number(row.inventory_item_identifier_id||0)}" data-status="verified">Verify</button> <button class="btn" data-identifier-review="${Number(row.inventory_item_identifier_id||0)}" data-status="rejected">Reject</button></span></div>`).join(''):'<div class="small">No unverified identifiers.</div>'}</div></details>
        <details class="inventory-receiving-recent"><summary>Duplicate supplier SKU identities (${dupes.length})</summary><div>${dupes.length?dupes.map(row=>`<div class="inventory-receiving-recent-row"><span><strong>${esc(row.normalized_value)}</strong><small>${esc(row.item_names||'')} · Inventory IDs ${esc(row.inventory_ids||'')}</small></span><span>${esc(row.item_count)} items</span></div>`).join(''):'<div class="small">No duplicate active supplier-SKU identities.</div>'}</div></details>
      </section>`;
    document.getElementById('inventorySourceReviewRefresh')?.addEventListener('click',load);
  }

  async function load(){try{const data=await window.DDAuth.apiJson('/api/admin/inventory-source-provenance-review',{method:'GET'},{fallbackMessage:'Source provenance review could not load.',cacheTtlMs:0,staleOnError:false});queues=data.queues||{};render();}catch(error){if(!mount.innerHTML)render();msg(error.message||'Source provenance review could not load.',true);}}
  async function mutate(payload){if(busy)return;busy=true;try{const response=await window.DDAuth.apiFetch('/api/admin/inventory-source-provenance-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await readJson(response,'Source provenance update failed safely.');queues=data.queues||queues;render();msg(data.message||'Source provenance updated.');}catch(error){msg(error.message||'Source provenance update failed safely.',true);}finally{busy=false;}}
  mount.addEventListener('click',(event)=>{
    const sourceReview=event.target.closest('[data-source-review]');
    const preferred=event.target.closest('[data-source-preferred]');
    const identifier=event.target.closest('[data-identifier-review]');
    if(!sourceReview&&!preferred&&!identifier)return;
    const note=window.prompt('Enter a review note (at least 8 characters):','BUILD440 source provenance review');
    if(note==null)return;
    if(String(note).trim().length<8){msg('Review note must be at least 8 characters.',true);return;}
    if(sourceReview)mutate({action:'review_source',inventory_item_source_id:Number(sourceReview.dataset.sourceReview||0),verification_status:sourceReview.dataset.status,review_note:String(note).trim()});
    else if(preferred)mutate({action:'set_preferred_source',inventory_item_source_id:Number(preferred.dataset.sourcePreferred||0),review_note:String(note).trim()});
    else mutate({action:'review_identifier',inventory_item_identifier_id:Number(identifier.dataset.identifierReview||0),verification_status:identifier.dataset.status,review_note:String(note).trim()});
  });
  load();
})();
