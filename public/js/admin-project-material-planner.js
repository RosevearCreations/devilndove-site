// Build 380 — operator-confirmed project reservations and source-backed usage/cost reports.
document.addEventListener('DOMContentLoaded',()=>{
 const el=id=>document.getElementById(id),mount=el('matMount'),selector=el('matProject');
 if(!mount||!selector)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=v=>v===null||v===undefined?'Unknown':(Number(v)/100).toLocaleString('en-CA',{style:'currency',currency:'CAD'});
 const api=(url,opts={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opts):fetch(url,{credentials:'same-origin',...opts});
 let data=null,search='',requestKey=null;
 async function getProjects(){try{const r=await api('/api/admin/project-material-planner');const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'Project listing failed');selector.innerHTML='<option value="">Select existing project</option>'+j.projects.map(p=>'<option value="'+Number(p.creative_work_project_id)+'">'+esc(p.project_title)+'</option>').join('');if(j.projects_truncated)mount.textContent='The selector shows the first 100 projects; no others were inferred.';}catch(e){mount.textContent='Project listing unavailable: '+e.message;}}
 function paint(){
 if(!data)return;
 const s=data.summary||{},stock=data.inventory_search_results||[];
 const operations=data.operations||[],reservations=data.reservations||[],posted=data.inventory_posts||[];
 mount.innerHTML='<h2>'+esc(data.project.project_title)+'</h2>'+
 '<p>Reserved in this project: <strong>'+Number(s.reserved_stock_units||0)+' stock units (mixed item units; see rows)</strong>. Actual posted usage: '+Number(s.actual_posted_stock_units||0)+' stock units (mixed units). Posted material value estimate: <strong>'+fmt(s.actual_posted_cost_estimate_cents)+'</strong>. Unknown-priced postings: '+Number(s.unknown_cost_rows||0)+'.</p>'+
 '<p class="small">Different materials use different units; aggregated quantity is for monitoring only, not a convertible total. Cost estimate is not accounting-approved. '+esc(data.cost_note)+'</p>'+
 ((data.reservations_truncated||data.inventory_posts_truncated||data.operation_rows_truncated)?'<p>Some rows exceed this bounded view. Review source records before relying on totals.</p>':'')+
 '<section class="card"><h2>Reserve material</h2><label>Search real Inventory supplies <input type="search" id="matSearch" value="'+esc(search)+'" placeholder="Material name, SKU or supplier"></label><button type="button" id="matSearchButton" class="btn secondary">Search supplies</button>'+
 '<label>Supply item <select id="matItem"><option value="">Choose a result</option>'+
 stock.map(i=>'<option value="'+Number(i.site_item_inventory_id)+'">'+esc(i.item_name)+' · '+Math.max(0,Number(i.on_hand_quantity||0)-Number(i.reserved_quantity||0))+' '+esc(i.stock_unit_label||'stock units')+' free · '+esc(i.supplier_name||'Supplier unknown')+'</option>').join('')+
 '</select></label><p id="matItemDetails" class="small">Select a real material to review current unit cost and lot provenance.</p>'+
 '<label>Operation (optional) <select id="matOperation"><option value="">Project-wide</option>'+operations.map(o=>'<option value="'+Number(o.creative_project_operation_id)+'">'+esc(o.operation_order)+'. '+esc(o.operation_title)+'</option>').join('')+'</select></label>'+
 '<label>Stock units to reserve <input id="matQty" type="number" min="0.001" max="100000" step="0.001"></label>'+
 '<label>Operator reason <textarea id="matNote" rows="2" placeholder="Why do we need these materials? (12+ characters)"></textarea></label>'+
 '<button type="button" id="matReserve" class="btn">Reserve stock for project</button><p id="matResult" role="status"></p></section>'+
 '<h2>Project material reservations</h2><div class="admin-table-wrap"><table><thead><tr><th>Material / supplier</th><th>Held / original</th><th>Unit cost snapshot</th><th>Release stock units</th></tr></thead><tbody>'+
 (reservations.map(r=>'<tr><td>'+esc(r.item_name)+'<div class="small">'+esc(r.supplier_name_snapshot||'Supplier unknown')+'</div></td><td>'+Number(r.remaining_stock_quantity)+' / '+Number(r.original_stock_quantity)+' '+esc(r.stock_unit_label_snapshot)+'</td><td>'+fmt(r.unit_cost_cents_snapshot)+'</td><td>'+
 (Number(r.remaining_stock_quantity)>0?'<input aria-label="Stock units to release" type="number" min="0.001" step="0.001" max="'+Number(r.remaining_stock_quantity)+'" data-release-qty="'+Number(r.creative_project_material_reservation_id)+'"><input aria-label="Release reason" placeholder="Release reason (12+ characters)" data-release-note="'+Number(r.creative_project_material_reservation_id)+'"><button class="btn secondary" data-release="'+Number(r.creative_project_material_reservation_id)+'" type="button">Release</button>':'Fully released')+
 '</td></tr>').join('')||'<tr><td colspan="4">No project holds recorded.</td></tr>')+'</tbody></table></div>'+
 '<h2>Actual posted material use (Creative Process authority)</h2><div class="admin-table-wrap"><table><thead><tr><th>Supply</th><th>Actual usage</th><th>Estimated cost</th><th>Evidence</th></tr></thead><tbody>'+
 (posted.map(p=>'<tr><td>'+esc(p.item_name)+'</td><td>'+Number(p.usage_quantity_consumed)+' '+esc(p.usage_unit_label)+'</td><td>'+fmt(p.estimated_cost_cents)+'</td><td>Post #'+Number(p.creative_project_inventory_post_id)+' · '+esc(p.posting_status)+'</td></tr>').join('')||'<tr><td colspan="4">No actual posted material usage.</td></tr>')+'</tbody></table></div>'+
 '<p><a href="/admin/creative-process/?project_id='+Number(data.project.creative_work_project_id)+'">Record partial material consumption in Creative Process</a> · <a href="/admin/inventory-operations/">Update suppliers and costs in Inventory</a></p>';
 const item=el('matItem'),detail=el('matItemDetails');
 const showDetails=()=>{let v=stock.find(i=>Number(i.site_item_inventory_id)===Number(item.value));detail.textContent=v?'Available: '+Math.max(0,Number(v.on_hand_quantity||0)-Number(v.reserved_quantity||0))+' '+(v.stock_unit_label||'stock units')+'; '+Number(v.usage_units_per_stock_unit||1)+' '+(v.usage_unit_label||'usage units')+' per stock unit. Current stock-unit cost: '+fmt(v.unit_cost_cents)+'. Latest lot: '+(v.latest_lot_code||'unrecorded')+'; supplier: '+(v.supplier_name||'unknown'):'Choose an item.';};
 item.addEventListener('change',showDetails);
 el('matSearchButton').addEventListener('click',()=>{search=el('matSearch').value.trim();load();});
 el('matReserve').addEventListener('click',()=>act('reserve'));
 mount.querySelectorAll('[data-release]').forEach(b=>b.addEventListener('click',()=>act('release',Number(b.dataset.release))));
 }
 async function act(action,id){
 const reason=action==='reserve'?el('matNote')?.value.trim():mount.querySelector('[data-release-note="'+id+'"]')?.value.trim();
 const qty=action==='reserve'?Number(el('matQty')?.value):Number(mount.querySelector('[data-release-qty="'+id+'"]')?.value);
 const status=el('matResult'),input={project_id:Number(selector.value),action,stock_units:qty,note:reason};
 if(!reason||reason.length<12||!Number.isFinite(qty)||qty<=0){if(status)status.textContent='Enter a valid positive stock-unit quantity and a factual note (12+ characters).';return;}
 requestKey=requestKey||crypto.randomUUID();input.request_key=requestKey;
 if(action==='reserve'){input.site_item_inventory_id=Number(el('matItem').value);input.operation_id=Number(el('matOperation').value)||null;}
 else input.reservation_id=id;
 if(!confirm('Confirm '+(action==='reserve'?'reserve':'release')+' '+qty+' stock units against the shared Inventory balance?'))return;
 if(status)status.textContent='Updating canonical reservation…';
 try{const r=await api('/api/admin/project-material-planner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Reservation update failed');requestKey=null;search='';data=d;paint();el('matResult').textContent='OK — reservation action confirmed'+(d.receipt_id?' with receipt #'+d.receipt_id:'')+(d.replayed?' (previously completed; no repeat write).':'.');}
 catch(e){if(status)status.textContent='Not confirmed: '+e.message;}
 }
 async function load(){const id=selector.value;if(!id){mount.textContent='Choose a Creative Project.';return;}mount.textContent='Loading source records…';try{const r=await api('/api/admin/project-material-planner?project_id='+encodeURIComponent(id)+'&q='+encodeURIComponent(search),{cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Material records unavailable');data=d;paint();}catch(e){mount.textContent='Material planner unavailable: '+e.message;}}
 selector.addEventListener('change',()=>{search='';requestKey=null;load();});el('matRefresh').addEventListener('click',load);
 const initial=new URLSearchParams(location.search).get('project_id');
 getProjects().then(()=>{if(initial&&[...selector.options].some(o=>o.value===initial)){selector.value=initial;load();}});
});