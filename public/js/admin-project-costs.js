/* Build 449 — review only: never posts accounting, stock, Products or sales. */
(()=>{'use strict';
 const el=id=>document.getElementById(id),money=n=>n===null||n===undefined?'unknown':(Number(n)/100).toLocaleString('en-CA',{style:'currency',currency:'CAD'}),
  esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),state={project:0};
 const fields={labour_rate_cents_per_hour:'costLabourRate',machine_rate_cents_per_hour:'costMachineRate',machine_minutes:'costMachineMinutes',
  packaging_cents:'costPackaging',consumables_cents:'costConsumables',rework_cents:'costRework',finishing_cents:'costFinishing',
  outside_service_cents:'costOutside',overhead_cents:'costOverhead',proposed_price_cents:'costPrice'};
 const status=(s,err=false)=>{const t=el('costMessage');t.textContent=s;t.className=err?'cost-bad':'cost-good';};
 const get=async(url,opts)=>{const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...opts});const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Request failed');return j;};
 const fingerprint=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}-449`;
 const show=(d)=>{
  const c=d.cost||{},s=d.source_summary||{},components=c.components||[];
  const label=c.complete?'<span class="cost-good">Complete reviewed estimate</span>':'<span class="cost-bad">Incomplete — missing values remain unknown</span>';
  el('costSummary').innerHTML=`<p>${label}</p><div class="cost-overflow"><table class="cost-table"><thead><tr><th>Cost category</th><th>Amount (CAD)</th><th>Authority / evidence</th></tr></thead><tbody>
   ${components.map(x=>`<tr><td>${esc(x.label)}</td><td><strong>${esc(money(x.amount_cents))}</strong></td><td>${esc(x.source)}${x.detail?`<p class="cost-small">${esc(x.detail)}</p>`:''}</td></tr>`).join('')}
   </tbody></table></div><p>Known subtotal: <strong>${money(c.known_subtotal_cents)}</strong> · Total actual estimated cost: <strong>${money(c.total_cost_cents)}</strong></p>
   <p>BOM plan (comparison only): <strong>${money(c.planned_bom_estimate_cents)}</strong> · Actual material posts: ${Number(c.actual_post_count||0)} · Scrap classified within materials: ${money(c.classified_scrap_cost_cents)}</p>
   <p>Failed/rejected/salvage attempts: <strong>${Number(c.failed_attempts||0)}</strong> · Prototype waste note (not double added): ${money(c.prototype_waste_evidence_cents)}</p>
   <p>Proposed price per piece: <strong>${money(c.proposed_unit_price_cents)}</strong> · Quantity: ${Number(c.pricing_quantity||1)} · Total suggested price: ${money(c.proposed_total_price_cents)}</p>
   <p>Estimated difference before tax/fees: <strong>${money(c.project_profit_estimate_cents)}</strong> · Illustrative gross margin: <strong>${c.gross_margin_percent===null||c.gross_margin_percent===undefined?'unknown':c.gross_margin_percent.toFixed(2)+'%'}</strong></p>
   <p class="cost-small">${esc(c.sale_eligibility||'Sale eligibility not assessed')}. No revenue, Product price, accounting or stock movement is created.</p>
   ${c.missing_categories?.length?`<p class="cost-warning"><strong>Unknown categories:</strong> ${esc(c.missing_categories.join(', '))}. Record evidence or an explicit verified zero; unknown is not $0.</p>`:''}
   ${(c.warnings||[]).map(w=>`<p class="cost-warning">${esc(w)}</p>`).join('')}`;
  const h=d.reviews||[];el('costHistory').innerHTML=h.length?`<div class="cost-overflow"><table class="cost-table"><thead><tr><th>Review</th><th>Scenario</th><th>Price per item</th><th>Recorded</th></tr></thead><tbody>${h.map(r=>
   `<tr><td>#${Number(r.maker_project_cost_review_id)} ${esc(r.review_label)}<p class="cost-small">${esc(r.review_note)}</p></td><td>${esc(r.scenario_kind)}</td><td>${money(r.proposed_price_cents)}</td><td>${esc(r.created_at)}</td></tr>`).join('')}</tbody></table></div>`:'No human costing reviews yet; category costs remain unknown where the canonical source has no evidence.';
  const r=d.current_review;if(r){el('costKind').value=r.scenario_kind;el('costLabel').value=r.review_label;el('costQty').value=r.pricing_quantity;
   el('costNoMaterial').checked=Boolean(r.no_material_use_confirmed);el('costNoLabour').checked=Boolean(r.no_labour_confirmed);
   for(const [key,id] of Object.entries(fields))el(id).value=r[key]===null?'':key==='machine_minutes'?r[key]:(Number(r[key])/100).toFixed(2);
   el('costNote').value=r.review_note;
  }else{el('costKind').value='one_off';el('costLabel').value='';el('costQty').value='1';el('costNoMaterial').checked=false;
   el('costNoLabour').checked=false;el('costNote').value='';for(const id of Object.values(fields))el(id).value='';}
  if(d.reviews_truncated)status('Only the latest 30 reviews shown. Earlier history remains stored.',true);
 };
 const load=async()=>{if(!state.project)return;show(await get(`/api/admin/project-costs?project_id=${state.project}`));};
 const dollars=id=>{const raw=el(id).value.trim();if(!raw)return null;
  if(!/^\d+(?:\.\d{1,2})?$/.test(raw))throw Error(id+' requires CAD dollars with up to two decimals.');
  const [w,f='']=raw.split('.');return Number(w)*100+Number(f.padEnd(2,'0'));};
 const save=async()=>{if(!state.project){status('Choose a project first.',true);return;}
  const button=el('costSave');button.disabled=true;
  try{const b={project_id:state.project,scenario_kind:el('costKind').value,review_label:el('costLabel').value.trim(),
   pricing_quantity:Number(el('costQty').value),review_note:el('costNote').value.trim(),
   no_material_use_confirmed:el('costNoMaterial').checked,no_labour_confirmed:el('costNoLabour').checked,request_key:fingerprint()};
   for(const [k,id] of Object.entries(fields))b[k]=k==='machine_minutes'?(el(id).value.trim()===''?null:Number(el(id).value)):dollars(id);
   const data=await get('/api/admin/project-costs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
   show(data);status(data.message||'Cost review saved.');
  }catch(e){status(e.message+' Refresh before retrying if the outcome is uncertain.',true);}finally{button.disabled=false;}
 };
 el('costProject').addEventListener('change',async()=>{state.project=Number(el('costProject').value)||0;if(state.project)try{await load();status('Project source costs loaded.');}catch(e){status(e.message,true);}});
 el('costRefresh').addEventListener('click',async()=>{try{await load();status('Current source receipts refreshed.');}catch(e){status(e.message,true);}});
 el('costSave').addEventListener('click',save);
 get('/api/admin/project-costs').then(async j=>{const s=el('costProject');for(const p of j.projects||[])s.add(new Option(`#${p.creative_work_project_id} ${p.project_title}`,p.creative_work_project_id));status('Choose our Creative Project to review costing.');
  const fromUrl=new URLSearchParams(location.search).get('project_id');if(/^[1-9]\d{0,9}$/.test(fromUrl||'')&&(j.projects||[]).some(p=>String(p.creative_work_project_id)===fromUrl)){s.value=fromUrl;state.project=Number(fromUrl);await load();status('Loaded our source-linked project costs; no accounting action occurred.');}
 }).catch(e=>status('Please sign in to Admin first: '+e.message,true));
})();
