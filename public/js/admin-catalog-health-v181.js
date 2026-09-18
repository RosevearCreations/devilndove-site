// Release 467 Build 181 — staged read-only catalog authority health UI.
(()=>{
  'use strict';
  const id=(v)=>document.getElementById(v);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v)=>Number(v||0);
  const state={summary:null,mode:'products',q:'',kind:'',loading:false};
  const message=(text,type='info')=>{const el=id('catalogHealthMessage');el.textContent=text||'';el.className=`card small catalog-health-message ${type}`;el.hidden=!text;};

  async function api(mode,params={}){
    if(!window.DDAuth?.apiFetch)throw new Error('Admin session helper is unavailable.');
    const query=new URLSearchParams({mode,...params});
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
    try{
      const res=await window.DDAuth.apiFetch(`/api/admin/catalog-health?${query}`,{cache:'no-store',signal:controller.signal});
      const raw=await res.text().catch(()=>''),data=raw?JSON.parse(raw):null;
      if(!res.ok||!data?.ok)throw new Error(data?.error||data?.detail||`Catalog health request failed (${res.status}).`);
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw new Error('Live D1 catalog health took too long to answer. Try again.');
      throw error;
    }finally{clearTimeout(timer);}
  }

  function card(label,value,note='',tone=''){
    return `<div class="card catalog-health-stat ${tone}"><span class="small">${esc(label)}</span><strong>${n(value).toLocaleString()}</strong><span class="small">${esc(note)}</span></div>`;
  }
  function renderSummary(){
    const s=state.summary;if(!s)return;
    const p=s.products||{},i=s.inventory||{};
    id('catalogHealthProductStats').innerHTML=[
      card('Active Products',p.active_products,'live Product rows'),
      card('Missing featured image',p.missing_featured,'open Image Editor','attention'),
      card('No gallery images',p.no_gallery,'blocking buyer proof','attention'),
      card('Gallery under 3',p.shallow_gallery,'add useful views','warning'),
      card('Alt text attention',p.products_with_alt_attention,'minimum 12 characters','warning'),
      card('Resource-link gaps',p.products_with_resource_gaps,'linked Tool/Supply missing in Inventory','attention'),
      card('Tracked zero stock',p.tracked_zero_stock,'review finished stock','warning'),
    ].join('');
    id('catalogHealthInventoryStats').innerHTML=[
      card('Active Tool/Supply rows',i.active_inventory,'live Inventory rows'),
      card('Tools',i.active_tools,'reusable equipment'),
      card('Supplies',i.active_supplies,'consumable/material rows'),
      card('Blank images',i.blank_inventory_images,'repair image authority','attention'),
      card('Image authority drift',i.image_authority_mismatches,'Inventory vs catalog reference','warning'),
      card('Duplicate identities',i.rows_in_duplicate_identities,'same kind + external key','attention'),
      card('Zero-on-hand supplies',i.zero_on_hand_supplies,'review count/reorder','warning'),
    ].join('');
    id('catalogHealthAuthority').textContent='Live D1 authority connected • read-only health view • no automatic fixes';
  }

  function productIssues(row){
    const issues=[];
    if(!String(row.featured_image_url||'').trim())issues.push('featured image');
    if(n(row.image_count)===0)issues.push('no gallery');
    else if(n(row.image_count)<3)issues.push(`${n(row.image_count)} gallery image(s)`);
    if(n(row.alt_attention)>0)issues.push(`${n(row.alt_attention)} alt-text issue(s)`);
    if(n(row.missing_inventory_links)>0)issues.push(`${n(row.missing_inventory_links)} missing Inventory link(s)`);
    if(n(row.inventory_tracking)===1&&n(row.inventory_quantity)<=0)issues.push('tracked stock is zero');
    return issues;
  }
  function renderProducts(rows){
    const body=id('catalogHealthResults');
    if(!rows.length){body.innerHTML='<div class="card"><strong>No Product health issues match this search.</strong></div>';return;}
    body.innerHTML=`<div class="catalog-health-table-wrap"><table class="catalog-health-table"><thead><tr><th>Product</th><th>Health</th><th>Images</th><th>Resources / stock</th><th>Repair</th></tr></thead><tbody>${rows.map(row=>{
      const issues=productIssues(row);
      const pid=n(row.product_id);
      return `<tr>
        <td><strong>${esc(row.name||`Product #${pid}`)}</strong><div class="small">#${pid} · ${esc(row.sku||'no SKU')} · ${esc(row.status||'draft')}</div></td>
        <td><span class="catalog-health-weight">Priority ${n(row.issue_weight)}</span><div class="small">${issues.map(esc).join(' · ')}</div></td>
        <td><strong>${n(row.image_count)}</strong> gallery<div class="small">${n(row.alt_attention)} alt-text attention</div></td>
        <td><strong>${n(row.linked_resources)}</strong> linked<div class="small">${n(row.missing_inventory_links)} missing Inventory · stock ${n(row.inventory_quantity)}</div></td>
        <td><div class="catalog-health-actions"><a class="btn" href="/admin/product-editor/?product_id=${pid}&tab=basics">Product</a><a class="btn" href="/admin/catalog-media/?product_id=${pid}">Images</a><a class="btn" href="/admin/inventory-operations/?product_id=${pid}">Inventory</a>${row.slug?`<a class="btn" href="/shop/product/?slug=${encodeURIComponent(row.slug)}" target="_blank" rel="noopener">Public</a>`:''}</div></td>
      </tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function inventoryIssues(row){
    const issues=[];
    if(!String(row.image_url||'').trim())issues.push('blank image');
    if(String(row.image_url||'').trim()&&String(row.catalog_image_url||'').trim()&&String(row.image_url).trim()!==String(row.catalog_image_url).trim())issues.push('image authority drift');
    if(n(row.duplicate_count)>1)issues.push(`${n(row.duplicate_count)} duplicate identity rows`);
    if(row.item_kind==='supply'&&Number(row.on_hand_quantity||0)<=0)issues.push('zero on hand');
    return issues;
  }
  function renderInventory(rows){
    const body=id('catalogHealthResults');
    if(!rows.length){body.innerHTML='<div class="card"><strong>No Tool/Supply health issues match this search.</strong></div>';return;}
    body.innerHTML=`<div class="catalog-health-table-wrap"><table class="catalog-health-table"><thead><tr><th>Tool / Supply</th><th>Health</th><th>Image authority</th><th>Stock</th><th>Repair</th></tr></thead><tbody>${rows.map(row=>{
      const iid=n(row.site_item_inventory_id),issues=inventoryIssues(row);
      const image=String(row.image_url||'').trim();
      return `<tr>
        <td><div class="catalog-health-item-cell">${image?`<img src="${esc(image)}" alt="" loading="lazy">`:'<span class="catalog-health-placeholder">IMG</span>'}<div><strong>${esc(row.item_name||row.external_key||`Inventory #${iid}`)}</strong><div class="small">#${iid} · ${esc(row.item_kind)} · ${esc(row.external_key||'no key')}</div></div></div></td>
        <td><span class="catalog-health-weight">Priority ${n(row.issue_weight)}</span><div class="small">${issues.map(esc).join(' · ')}</div></td>
        <td><div class="small"><strong>Inventory:</strong> ${image?'set':'blank'}</div><div class="small"><strong>Catalog ref:</strong> ${String(row.catalog_image_url||'').trim()?'set':'blank'}</div></td>
        <td><strong>${Number(row.on_hand_quantity||0).toLocaleString()}</strong> on hand<div class="small">${Number(row.reserved_quantity||0).toLocaleString()} reserved</div></td>
        <td><div class="catalog-health-actions"><a class="btn" href="/admin/inventory-operations/#siteInventoryForm">Inventory Ops</a><a class="btn" href="/admin/catalog-media/">Product images</a></div></td>
      </tr>`;
    }).join('')}</tbody></table></div>`;
  }

  async function loadSummary(){
    message('Reading live D1 catalog authority…');
    try{const data=await api('summary');state.summary=data.summary||{};renderSummary();message('Live D1 catalog authority loaded. No data was changed.','success');}
    catch(error){message(error.message||'Catalog health summary failed.','error');}
  }
  async function loadIssues(){
    if(state.loading)return;state.loading=true;
    const result=id('catalogHealthResults');result.innerHTML='<div class="card small">Loading bounded live D1 issue rows…</div>';
    try{
      if(state.mode==='products'){
        const data=await api('products',{q:state.q,limit:'40'});renderProducts(data.products||[]);
      }else{
        const data=await api('inventory',{q:state.q,kind:state.kind,limit:'40'});renderInventory(data.inventory||[]);
      }
    }catch(error){result.innerHTML=`<div class="card catalog-health-error"><strong>Issue rows could not load.</strong><div class="small">${esc(error.message||'Unknown error')}</div></div>`;}
    finally{state.loading=false;}
  }
  function bind(){
    id('catalogHealthRefresh').addEventListener('click',loadSummary);
    id('catalogHealthProductIssues').addEventListener('click',()=>{state.mode='products';id('catalogHealthKind').hidden=true;loadIssues();});
    id('catalogHealthInventoryIssues').addEventListener('click',()=>{state.mode='inventory';id('catalogHealthKind').hidden=false;loadIssues();});
    id('catalogHealthSearchForm').addEventListener('submit',(event)=>{event.preventDefault();state.q=String(id('catalogHealthSearch').value||'').trim();state.kind=String(id('catalogHealthKind').value||'');loadIssues();});
    id('catalogHealthKind').addEventListener('change',()=>{state.kind=String(id('catalogHealthKind').value||'');if(state.mode==='inventory')loadIssues();});
  }
  function start(){bind();message('Live D1 summary is paused to protect the daily row-read budget. Use Refresh summary when you need current evidence.');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();