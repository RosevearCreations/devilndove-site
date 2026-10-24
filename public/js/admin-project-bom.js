/* Devil n Dove Build 445 — the BOM never owns or mutates physical Inventory. */
(()=>{'use strict';
 const el=id=>document.getElementById(id),state={project:0,lines:[],posts:[],inventory:[],lots:[],operations:[]};
 const txt=(v)=>String(v??''),format=v=>Number(v||0).toLocaleString('en-CA',{maximumFractionDigits:6}),esc=s=>txt(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const message=(s,error=false)=>{const m=el('bomMessage');m.textContent=s;m.className=error?'bom-error':'bom-good';};
 const fill=(selector,items,prompt,getValue,getLabel)=>{const box=el(selector),was=box.value;box.replaceChildren(new Option(prompt,''));for(const i of items)box.add(new Option(getLabel(i),getValue(i)));if([...box.options].some(o=>o.value===was))box.value=was;};
 const fetchJSON=async(url,options)=>{const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});const payload=await response.json().catch(()=>({error:'Invalid response'}));if(!response.ok||!payload.ok)throw Error(payload.error||'Request failed');return payload;};
 const key=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}-bom`;
 const units=(row)=>`${format(row.usage_units_per_stock_unit||1)} ${row.usage_unit_label||'usage units'} / ${row.stock_unit_label||'stock unit'}`;
 const renderItems=()=>{
  fill('bomItem',state.inventory,'Choose an Inventory supply',i=>i.site_item_inventory_id,i=>`#${i.site_item_inventory_id} ${i.item_name} — ${format(i.on_hand_quantity)} ${i.stock_unit_label||'units'} on hand`);
  const setLot=()=>{const selected=Number(el('bomItem').value),chosen=state.inventory.find(i=>Number(i.site_item_inventory_id)===selected);
   const available=state.lots.filter(l=>Number(l.site_item_inventory_id)===selected);
   fill('bomLot',available,'No verified lot selected',l=>l.inventory_purchase_lot_id,l=>`${l.lot_code} (${format(l.quantity_remaining)} reported; ${l.lot_status})`);
   el('bomUnitHint').textContent=chosen?`Inventory conversion: ${units(chosen)}. Mode: ${chosen.usage_tracking_mode}. Minimum increment: ${chosen.minimum_usage_increment}. Available stock: ${format(Number(chosen.on_hand_quantity||0)-Number(chosen.reserved_quantity||0))} ${chosen.stock_unit_label||'units'}. Unknown costs remain unknown.`:'Select an item to see its usage/stock conversion.';
  };el('bomItem').onchange=setLot;setLot();
 };
 const render=(data)=>{state.lines=data.lines||[];state.posts=data.actual_posts||[];state.operations=data.operations||[];
  fill('bomOperation',state.operations,'General project / unassigned',o=>o.creative_project_operation_id,o=>`#${o.operation_order}: ${o.operation_title||o.process_name}`);
  fill('bomActualLine',state.lines.filter(l=>l.line_status!=='retired'),'Select BOM line',l=>l.maker_project_bom_line_id,l=>`#${l.maker_project_bom_line_id} ${l.item_name}`);
  const updatePosts=()=>{const line=state.lines.find(l=>String(l.maker_project_bom_line_id)===el('bomActualLine').value);
   const candidates=state.posts.filter(p=>!p.maker_project_bom_actual_link_id&&!p.returned_at&&p.posting_status!=='reversed'&&(!line||Number(p.site_item_inventory_id)===Number(line.site_item_inventory_id)));
   fill('bomPost',candidates,'Select posted Inventory movement',p=>p.creative_project_inventory_post_id,p=>`Post #${p.creative_project_inventory_post_id} • ${format(p.usage_quantity_consumed)} ${p.usage_unit_label} • ${p.item_name}`);
  };el('bomActualLine').onchange=updatePosts;updatePosts();
  const mount=el('bomLines');if(!state.lines.length){mount.textContent='No BOM lines planned yet.';return;}
  mount.innerHTML=`<div class="bom-overflow"><table class="bom-table"><thead><tr><th>Supply / process</th><th>Plan</th><th>Actual / scrap / returned</th><th>Stock &amp; source</th><th>State</th></tr></thead><tbody>${state.lines.map(l=>{
   const p=l.progress||{},short=Number(l.available_stock_quantity||0)+1e-6<Number(p.planned_stock_quantity||0),
   links=state.posts.filter(x=>Number(x.maker_project_bom_line_id)===Number(l.maker_project_bom_line_id));
   return `<tr><td><strong>${esc(l.item_name)}</strong><p>${esc(l.operation_title||'General project')}${l.process_name?' · '+esc(l.process_name):''}</p><small>${esc(l.current_workstations||l.workstation_note||'No workstation identified')}</small></td>
   <td>${format(p.planned_usage_quantity)} ${esc(l.usage_unit_label_snapshot)}<small><p>${format(p.planned_stock_quantity)} ${esc(l.stock_unit_label_snapshot)} stock units</p></small></td>
   <td>${format(p.posted_usage_quantity||0)} used · ${format(p.scrap_usage_quantity||0)} scrap<p>${format(p.reversed_usage_quantity||0)} returned · ${format(p.remaining_usage_quantity||0)} remaining</p>
   <details><summary>Receipts (${links.length})</summary>${links.map(r=>`<p>Post #${Number(r.creative_project_inventory_post_id)} ${r.returned_at?'(reversed)':''} · ${format(r.usage_quantity_consumed)} ${esc(r.usage_unit_label)}; scrap ${format(r.scrap_usage_quantity||0)}</p>`).join('')||'No actual receipts linked.'}</details></td>
   <td>${format(l.available_stock_quantity)} ${esc(l.stock_unit_label||'units')} free${short?'<p class="bom-error">Plan exceeds currently available stock</p>':''}<p>Lot: ${esc(l.lot_code||'unassigned')} · Supplier: ${esc(l.supplier_name||'unknown')}</p><small>Estimated cost: ${l.cost_estimate_cents===null?'unknown':'$'+(Number(l.cost_estimate_cents)/100).toFixed(2)} CAD</small></td>
   <td><span class="bom-status">${esc(p.state)}</span><p><button type="button" data-retire="${Number(l.maker_project_bom_line_id)}" ${l.line_status==='retired'?'disabled':''}>Retire line</button></p></td></tr>`;
  }).join('')}</tbody></table></div>`;
  mount.querySelectorAll('[data-retire]').forEach(b=>b.addEventListener('click',()=>{
   if(confirm('Retire this BOM plan? Actual Inventory movements and all source receipts will remain.'))send('retire',{line_id:Number(b.dataset.retire),note:'Retired this BOM planning line; preserving actual receipt history.'});
  }));
  if(data.lines_truncated||data.actual_posts_truncated)message('Only the latest BOM lines/actual posts are shown. Check older receipts in Creative Process.',true);
 };
 const load=async(query='')=>{if(!state.project)return;const data=await fetchJSON(`/api/admin/project-bom?project_id=${state.project}&q=${encodeURIComponent(query)}`);render(data);state.inventory=data.inventory_search_results||[];state.lots=data.supplier_lots||[];renderItems();};
 const send=async(action,data)=>{if(!state.project){message('Select a Creative Project first.',true);return;}
  const button=action==='plan'?el('bomPlan'):action==='link_actual'?el('bomLink'):null;if(button)button.disabled=true;
  try{const response=await fetchJSON('/api/admin/project-bom',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,project_id:state.project,request_key:key(),...data})});
   message(response.message||'BOM source receipt confirmed.');render(response);if(action==='plan'){el('bomAmount').value='';el('bomPlanReason').value='';}
   if(action==='link_actual'){el('bomScrap').value='0';el('bomActualReason').value='';}
  }catch(e){message(`${e.message}. Refresh before retrying if a write outcome is uncertain.`,true);}finally{if(button)button.disabled=false;}
 };
 const init=async()=>{try{const data=await fetchJSON('/api/admin/project-bom');fill('bomProject',data.projects||[],'Select our project…',p=>p.creative_work_project_id,p=>`#${p.creative_work_project_id} ${p.project_title}`);message('Select the Creative Project whose material usage we want to review.');
  const fromUrl=new URLSearchParams(location.search).get('project_id');if(/^[1-9]\d{0,9}$/.test(fromUrl||'')&&(data.projects||[]).some(p=>String(p.creative_work_project_id)===fromUrl)){el('bomProject').value=fromUrl;state.project=Number(fromUrl);await load();message('Opened selected Creative Project BOM; no stock was changed.');}
 }catch(e){message('Sign in to Devil n Dove Admin first: '+e.message,true);}};
 el('bomProject').addEventListener('change',async()=>{state.project=Number(el('bomProject').value)||0;if(state.project){try{await load();message('BOM loaded; no stock changed.');}catch(e){message(e.message,true);}}});
 el('bomRefresh').addEventListener('click',async()=>{try{await load(el('bomSearch').value);message('Refreshed current Inventory and actual receipts.');}catch(e){message(e.message,true);}});
 let searchTimer;el('bomSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{if(state.project)load(el('bomSearch').value).catch(e=>message(e.message,true));},350);});
 el('bomPlan').addEventListener('click',()=>send('plan',{site_item_inventory_id:Number(el('bomItem').value),operation_id:el('bomOperation').value||null,
  inventory_purchase_lot_id:el('bomLot').value||null,planned_usage_quantity:Number(el('bomAmount').value),workstation_note:el('bomStation').value,note:el('bomPlanReason').value}));
 el('bomLink').addEventListener('click',()=>send('link_actual',{line_id:Number(el('bomActualLine').value),creative_project_inventory_post_id:Number(el('bomPost').value),scrap_usage_quantity:Number(el('bomScrap').value),note:el('bomActualReason').value}));
 init();
})();
