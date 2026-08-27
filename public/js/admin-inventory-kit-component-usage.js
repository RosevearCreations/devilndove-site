// Devil n Dove Build 440 — purchased-kit component usage workspace.
(() => {
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number=(value)=>Number.isFinite(Number(value))?Number(value):0;
  let state={components:[],summary:{}};

  function mount(){
    let node=document.getElementById('inventoryKitComponentUsageMount');
    if(node)return node;
    const anchor=document.getElementById('inventoryKitsAdminMount')||document.getElementById('siteInventoryAdminMount');
    if(!anchor)return null;
    node=document.createElement('section');
    node.id='inventoryKitComponentUsageMount';
    node.className='card inventory-kit-component-usage';
    node.style.marginTop='16px';
    anchor.parentNode?.insertBefore(node,anchor.nextSibling);
    return node;
  }
  function message(text='',bad=false){
    const node=document.getElementById('inventoryKitComponentUsageMessage');
    if(!node)return;
    node.hidden=!text;
    node.textContent=text;
    node.className=`small ${bad?'is-error':'is-success'}`;
  }
  async function request(path,options){
    const response=await window.DDAuth.apiFetch(path,options);
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.ok){const error=new Error(data.error||'Kit component request failed.');error.code=data.code||'';throw error;}
    return data;
  }
  function modeLabel(row){
    const mode=String(row.usage_tracking_mode||row.template_usage_tracking_mode||'exact');
    if(mode==='reusable')return 'Reusable — usage log only';
    if(mode==='log_only')return 'Log only — stock unchanged';
    if(mode==='estimated')return 'Estimated depletion';
    return 'Exact depletion';
  }
  function rowHtml(row){
    const componentId=Number(row.inventory_kit_template_component_id||0);
    const ready=Number(row.ready||0)===1;
    const doNotReuse=Number(row.do_not_reuse||0)===1;
    const mode=String(row.usage_tracking_mode||row.template_usage_tracking_mode||'exact');
    const stockUnit=esc(row.stock_unit_label||row.template_stock_unit_label||'unit');
    const usageUnit=esc(row.usage_unit_label||row.template_usage_unit_label||'unit');
    const perStock=Math.max(0.001,number(row.usage_units_per_stock_unit||row.template_usage_units_per_stock_unit||1));
    const disabled=!ready||doNotReuse;
    let stateText=`Available ${number(row.available_quantity).toFixed(3)} ${stockUnit}`;
    if(!ready)stateText='Open the purchased kit once to create/link this Inventory component.';
    else if(doNotReuse)stateText='Tool is marked do not reuse; reactivate it in Tool lifecycle before recording use.';
    return `<tr data-kit-component-row="${componentId}">
      <td><strong>${esc(row.linked_item_name||row.component_name||'Component')}</strong><div class="small">${esc(row.template_name||'Kit')} · ${esc(row.source_type||'unlinked')}</div></td>
      <td><span class="small">${esc(modeLabel(row))}</span><div>${number(row.on_hand_quantity).toFixed(3)} ${stockUnit} on hand</div><div class="small">${esc(stateText)}</div></td>
      <td><span class="small">1 ${stockUnit} = ${perStock} ${usageUnit}</span><input data-kit-use-qty="${componentId}" type="number" min="${Math.max(0.0001,number(row.minimum_usage_increment||0.001))}" step="${Math.max(0.0001,number(row.minimum_usage_increment||0.001))}" placeholder="Usage in ${usageUnit}" ${disabled?'disabled':''}></td>
      <td><input data-kit-use-note="${componentId}" maxlength="800" placeholder="What used it / batch / task" ${disabled?'disabled':''}></td>
      <td><button class="btn primary" type="button" data-kit-use-submit="${componentId}" ${disabled?'disabled':''}>Record use</button>${mode==='reusable'||mode==='log_only'?'<div class="small">No stock deduction</div>':'<div class="small">Inventory + lot deduction</div>'}</td>
    </tr>`;
  }
  function render(){
    const node=mount();if(!node)return;
    const components=Array.isArray(state.components)?state.components:[];
    node.innerHTML=`<div class="section-heading-row"><div><p class="inventory-operations-eyebrow">Purchased-kit component usage</p><h2 style="margin:0">Use released kit components</h2><p class="small">Exact/estimated Supply use reduces both Inventory and its purchase lot. Reusable and log-only items record usage without pretending the stock disappeared.</p></div><button class="btn" id="refreshInventoryKitComponentUsage" type="button">Refresh</button></div>
      <div id="inventoryKitComponentUsageMessage" hidden></div>
      <div class="inventory-kit-component-summary small">${components.length} component${components.length===1?'':'s'} · ${Number(state.summary?.ready_count||0)} linked · ${Number(state.summary?.unlinked_count||0)} waiting for first kit opening</div>
      ${components.length?`<div class="admin-table-wrap"><table class="inventory-kit-component-table"><thead><tr><th>Component</th><th>Stock / tracking</th><th>Usage quantity</th><th>Evidence note</th><th>Action</th></tr></thead><tbody>${components.map(rowHtml).join('')}</tbody></table></div>`:'<p class="small">No active purchased-kit components are configured yet.</p>'}`;
    wire();
  }
  async function load({quiet=false}={}){
    try{
      const data=await request('/api/admin/inventory-kit-component-usage');
      state=data;
      render();
      if(!quiet)message('Kit component balances refreshed.');
    }catch(error){
      const node=mount();
      if(node&&!state.components?.length)node.innerHTML=`<h2>Purchased-kit component usage</h2><p class="small is-error">${esc(error.message)}</p>`;
      else message(error.message,true);
    }
  }
  async function consume(componentId,button){
    const quantity=Number(document.querySelector(`[data-kit-use-qty="${componentId}"]`)?.value||0);
    const note=document.querySelector(`[data-kit-use-note="${componentId}"]`)?.value||'';
    if(!(quantity>0)){message('Enter the quantity actually used.',true);return;}
    if(note.trim().length<8){message('Add a usage note of at least 8 characters.',true);return;}
    button.disabled=true;
    try{
      const data=await request('/api/admin/inventory-kit-component-usage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'consume_component',inventory_kit_template_component_id:componentId,usage_quantity:quantity,note})});
      state={...state,...data,summary:{...state.summary}};
      await load({quiet:true});
      message(data.message||'Component use recorded.');
      window.dispatchEvent(new CustomEvent('inventory:kit-component-used',{detail:{componentId}}));
    }catch(error){message(error.message,true);button.disabled=false;}
  }
  function wire(){
    document.getElementById('refreshInventoryKitComponentUsage')?.addEventListener('click',()=>load());
    document.querySelectorAll('[data-kit-use-submit]').forEach(button=>button.addEventListener('click',()=>consume(Number(button.dataset.kitUseSubmit||0),button)));
  }
  window.addEventListener('inventory:kit-changed',()=>load({quiet:true}));
  document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('siteInventoryAdminMount'))load({quiet:true});});
})();
