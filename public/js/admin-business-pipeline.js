// Release 464 Update 3 — Creative Business Pipeline admin client.
(()=>{
'use strict';
const byId=(id)=>document.getElementById(id),esc=(v)=>String(v==null?'':v).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=(url,opt={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opt):fetch(url,{credentials:'same-origin',...opt});
const state={pipelines:[],selected:null};
async function read(r){const d=await r.json().catch(()=>null);if(!r.ok||d?.ok===false)throw new Error(d?.error||`HTTP ${r.status}`);return d}
function msg(v,error=false){const n=byId('pipelineMessage');if(n){n.textContent=v||'';n.classList.toggle('is-error',error);n.classList.toggle('is-success',Boolean(v&&!error))}}
function money(c){return new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(c||0)/100)}
function renderList(){
  byId('pipelineList').innerHTML=state.pipelines.map((p)=>`<div class="u3-row"><button class="btn" type="button" data-pipeline="${Number(p.creative_business_pipeline_id)}"><strong>${esc(p.product_name||p.project_title||p.pipeline_key)}</strong><span class="small" style="display:block">${esc(p.pipeline_status)} • social ${esc(p.social_handoff_status)}${p.accounting_period_month?` • ${esc(p.accounting_period_month)}`:''}</span></button></div>`).join('')||'<p class="small">No Update 3 pipeline rows yet. Enter a Product ID to create/sync one.</p>';
  document.querySelectorAll('[data-pipeline]').forEach((b)=>b.onclick=()=>loadDetail(Number(b.dataset.pipeline)));
}
function statusOptions(current,values){return values.map((v)=>`<option value="${v}" ${v===current?'selected':''}>${v}</option>`).join('')}
function renderDetail(d){
  state.selected=d;const p=d.pipeline||{},product=d.product||{},creative=d.creative_project||{},gene=d.genealogy||{},collections=d.storefront_collections||[],events=d.events||[];
  byId('pipelineDetail').innerHTML=`<h2 style="margin-top:0">${esc(product.name||creative.project_title||p.pipeline_key||'Pipeline')}</h2>
  <div class="u3-metrics"><div class="card"><span class="small">Product</span><strong>${product.product_id?`#${Number(product.product_id)}`:'Not linked'}</strong></div><div class="card"><span class="small">Creative Project</span><strong>${creative.creative_project_id?`#${Number(creative.creative_project_id)}`:'Not linked'}</strong></div><div class="card"><span class="small">Genealogy</span><strong>${gene.ready?'Proven':'Review'}</strong></div><div class="card"><span class="small">Collections</span><strong>${collections.length}</strong></div></div>
  ${d.next_actions?.length?`<div class="card" style="margin-top:12px"><strong>Next actions</strong><ol class="small">${d.next_actions.map((x)=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:'<div class="card" style="margin-top:12px"><strong>Next actions</strong><p class="small">No pipeline blockers detected.</p></div>'}
  <form id="pipelineSaveForm" style="display:grid;gap:10px;margin-top:12px"><input type="hidden" name="creative_business_pipeline_id" value="${Number(p.creative_business_pipeline_id||0)}"><input type="hidden" name="product_id" value="${Number(product.product_id||p.product_id||0)}">
  <div class="grid cols-2"><label><span class="small">Pipeline status</span><select name="pipeline_status">${statusOptions(p.pipeline_status||'in_progress',['draft','in_progress','review_ready','storefront_ready','complete','archived'])}</select></label>
  <label><span class="small">Social handoff</span><select name="social_handoff_status">${statusOptions(p.social_handoff_status||'not_ready',['not_ready','review_ready','approved','held'])}</select></label>
  <label><span class="small">Accounting period</span><input name="accounting_period_month" type="month" value="${esc(p.accounting_period_month||'')}"></label>
  <label><span class="small">Finished inventory reference</span><input name="finished_inventory_reference" value="${esc(p.finished_inventory_reference||'')}" placeholder="Production run / lot note"></label></div>
  <label><span class="small">Notes</span><textarea name="notes">${esc(p.notes||'')}</textarea></label><div class="dd-admin-responsive-actions"><button class="btn primary" type="submit">Save Pipeline</button>${product.slug?`<a class="btn" href="/shop/product/?slug=${encodeURIComponent(product.slug)}" target="_blank" rel="noopener">Open Product</a>`:''}<a class="btn" href="/admin/storefront-merchandising/">Merchandising</a><a class="btn" href="/admin/accounting/">Month End</a></div></form>
  <details style="margin-top:12px"><summary>Pipeline event history</summary><div class="u3-trace">${events.map((e)=>`<p class="small"><strong>${esc(e.event_type)}</strong> • ${esc(e.created_at)}<br>${esc(e.details_json||'')}</p>`).join('')||'<p class="small">No events yet.</p>'}</div></details>`;
  byId('pipelineSaveForm').onsubmit=savePipeline;
  if(product.product_id)loadGenealogy(product.product_id);else byId('genealogyDetail').innerHTML='<h2 style="margin-top:0">Material genealogy</h2><p class="small">Link a Product to trace genealogy.</p>';
}
function renderGenealogy(d){
  const s=d.summary||{},p=d.product||{};
  byId('genealogyDetail').innerHTML=`<h2 style="margin-top:0">Material genealogy — ${esc(p.name||'Product')}</h2><p class="small">${esc(d.authority||'')}</p>
  <div class="u3-metrics"><div class="card"><span class="small">Purchase lots</span><strong>${Number(s.purchase_lot_count||0)}</strong></div><div class="card"><span class="small">Production runs</span><strong>${Number(s.production_run_count||0)}</strong></div><div class="card"><span class="small">Finished lots</span><strong>${Number(s.finished_lot_count||0)}</strong></div><div class="card"><span class="small">Order lines</span><strong>${Number(s.order_line_count||0)}</strong></div></div>
  <details style="margin-top:12px" open><summary>Raw-material lot allocations</summary><div class="u3-trace">${(d.material_lot_allocations||[]).map((r)=>`<p class="small"><strong>${esc(r.lot_code_snapshot)}</strong> • consumed ${esc(r.quantity_consumed)} ${esc(r.stock_unit_label)} • ${money(r.extended_cost_cents)} • ${esc(r.supplier_name_snapshot||'supplier not recorded')}</p>`).join('')||'<p class="small">No posted lot-aware material allocations yet.</p>'}</div></details>
  <details style="margin-top:12px"><summary>Finished inventory lots</summary><div class="u3-trace">${(d.finished_inventory_lots||[]).map((r)=>`<p class="small"><strong>${esc(r.lot_key)}</strong> • ${esc(r.source_kind)} • qty ${esc(r.quantity_created)} • ${esc(r.lot_status)}</p>`).join('')||'<p class="small">No finished inventory lots.</p>'}</div></details>
  <details style="margin-top:12px"><summary>Sales / commitments</summary><div class="u3-trace">${(d.order_lines||[]).map((r)=>`<p class="small"><strong>Order #${Number(r.order_id)}</strong> • ${esc(r.order_status)} • qty ${esc(r.quantity)} • ${esc(r.created_at)}</p>`).join('')||'<p class="small">No order-line commitments or sales yet.</p>'}</div></details>
  <p class="small">${esc(d.historical_boundary||'')}</p>`;
}
async function load(){const d=await read(await api('/api/admin/business-growth-pipeline',{cache:'no-store'}));state.pipelines=d.pipelines||[];renderList();msg(`${state.pipelines.length} business pipeline(s).`)}
async function loadDetail(id){try{const d=await read(await api(`/api/admin/business-growth-pipeline?pipeline_id=${encodeURIComponent(id)}`,{cache:'no-store'}));renderDetail(d.detail);msg('Pipeline loaded.')}catch(e){msg(e.message,true)}}
async function loadGenealogy(productId){try{const d=await read(await api(`/api/admin/product-genealogy-trace?product_id=${encodeURIComponent(productId)}`,{cache:'no-store'}));renderGenealogy(d)}catch(e){byId('genealogyDetail').innerHTML=`<h2 style="margin-top:0">Material genealogy</h2><p class="small">${esc(e.message)}</p>`}}
async function syncProduct(e){e.preventDefault();const productId=Number(byId('pipelineProductId').value||0);if(!productId)return msg('Enter a Product ID.',true);try{const d=await read(await api('/api/admin/business-growth-pipeline',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sync_from_product',product_id:productId,pipeline_status:'in_progress'})}));await load();renderDetail(d.detail);msg('Product references synchronized into the business pipeline.')}catch(err){msg(err.message,true)}}
async function savePipeline(e){e.preventDefault();const f=Object.fromEntries(new FormData(e.target).entries());f.action='save_pipeline';f.creative_business_pipeline_id=Number(f.creative_business_pipeline_id||0);f.product_id=Number(f.product_id||0);try{const d=await read(await api('/api/admin/business-growth-pipeline',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)}));await load();renderDetail(d.detail);msg(d.message||'Pipeline saved.')}catch(err){msg(err.message,true)}}
function init(){byId('pipelineLookupForm')?.addEventListener('submit',syncProduct);load().catch((e)=>msg(e.message,true))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
