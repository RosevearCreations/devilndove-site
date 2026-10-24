/* Build 453 — lazy, private commission change/cost/finished-piece handoff panel. */
document.addEventListener('DOMContentLoaded',()=>{
 const byId=id=>document.getElementById(id),select=byId('commissionRequest'),button=byId('commissionCompletionLoad'),container=byId('commissionCompletionState');
 if(!select||!button||!container)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const api=(url,opt={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opt):fetch(url,{credentials:'same-origin',...opt});
 const options=(items,id,label)=>'<option value="">Select actual source…</option>'+items.map(x=>`<option value="${Number(x[id])}">${esc(label(x))}</option>`).join('');
 const label=(id,title,optionsHtml)=>`<label for="${id}">${esc(title)}<select id="${id}">${optionsHtml}</select></label>`;
 let current=null,pendingKey=null;
 async function request(url,opt={}){const r=await api(url,opt),d=await r.json().catch(()=>({error:'Invalid server response'}));if(!r.ok||!d.ok)throw Error(d.error||'Review not accepted');return d}
 const fmt=v=>v==null?'unknown':(Number(v)/100).toLocaleString('en-CA',{style:'currency',currency:'CAD'});
 function draw(d){current=d;const latest=d.proof_versions?.[0]||null,orders=d.linked_orders||[],costs=d.cost_reviews||[],runs=d.traveler_runs||[],pieces=d.finished_pieces||[];
  container.innerHTML=`<h3>Private completion review — Request #${Number(d.request.custom_request_id)}</h3>
   <p>Source manufacturing project: ${esc(d.manufacturing?.creative_work_project_id||'No verified project')} · Stage: ${esc(d.manufacturing?.current_stage||'Not connected')}</p>
   <p>Newest customer proof: ${latest?`version ${esc(latest.version_number)} · ${esc(latest.proof_status)}`:'No proof version'}.
    A real customer-approved proof must be the latest version; internal approval cannot stand in for it.</p>
   <div class="cc-grid">${label('ccDecision','Operator milestone',`<option value="approved_change_review">Customer-approved change and cost review</option><option value="maker_handoff_ready">Finished maker handoff (not delivery)</option><option value="delivery_followup_hold">Delivery/acceptance follow-up HOLD</option>`)}
   ${label('ccRevision','Original quote revision',options(d.quote_revisions||[],'custom_request_quote_revision_id',x=>`#${x.custom_request_quote_revision_id} · ${x.revision_type} · ${x.created_at}`))}
   ${label('ccProof','Customer proof response',options(d.proof_versions||[],'custom_request_proof_version_id',x=>`v${x.version_number} · ${x.proof_status} · ${x.approved_at||'no approval date'}`))}
   ${label('ccCost','Canonical commission cost review',options(costs,'maker_project_cost_review_id',x=>`#${x.maker_project_cost_review_id} · ${x.review_label}`))}
   ${label('ccTraveler','Manufacturing traveler',options(runs,'maker_traveler_run_id',x=>`#${x.maker_traveler_run_id} · ${x.completed_steps}/${x.total_steps} completed`))}
   ${label('ccPiece','Quality-approved finished piece',options(pieces,'maker_finished_piece_id',x=>`${x.serial_code} · ${x.latest_quality_decision||'quality HOLD'}`))}
   ${label('ccOrder','Linked order (optional, read-only)',options(orders,'custom_request_order_status_link_id',x=>`Order #${x.order_id} · ${x.payment_status} · ${x.order_status}`))}
   <label for="ccCostDelta">Human estimated change impact (signed CAD; not actual cost)<input id="ccCostDelta" type="number" min="-10000000" max="10000000" step="0.01" placeholder="e.g. 12.50"></label></div>
   <label for="ccNote">Private factual review note (16–1200 characters)<textarea id="ccNote" rows="3" maxlength="1200" minlength="16" placeholder="Explain the approved design change, incremental estimate, completed traveler or unresolved delivery evidence."></textarea></label>
   <button class="btn" type="button" id="ccRecord">Record private completion decision</button><p role="status" aria-live="polite" id="ccFeedback"></p>
   <p class="cc-disclaimer">Deposits: ${orders.length?orders.map(x=>`Order #${esc(x.order_id)} reports ${esc(x.payment_status)} (${esc(x.currency)})`).join(' · '):'Only payment-request drafts may exist. No settled order is linked.'}. A payment request is never proof of collection. Only canonical payment sources can verify settlement.</p>
   <h4>Append-only completion history</h4><div class="admin-table-wrap"><table><thead><tr><th>When</th><th>Decision</th><th>Real source IDs</th><th>Human note</th></tr></thead><tbody>${(d.completion_history||[]).map(x=>`<tr><td>${esc(x.created_at)}</td><td>${esc(x.decision)}</td><td>Revision ${esc(x.source_quote_revision_id||'—')} · Proof ${esc(x.source_proof_version_id||'—')} · Traveler ${esc(x.source_traveler_run_id||'—')} · Piece ${esc(x.source_finished_piece_id||'—')} · Estimated Δ ${fmt(x.estimated_change_cost_delta_cents)}</td><td>${esc(x.review_note)}</td></tr>`).join('')||'<tr><td colspan="4">No completion reviews recorded.</td></tr>'}</tbody></table></div>
   ${d.history_truncated?'<p>Older completion records are not included in this bounded view.</p>':''}`;
  byId('ccRecord').addEventListener('click',save);
 }
 async function load(){const id=Number(select.value);if(!id){container.textContent='Select an existing Custom Request first.';return}
  container.textContent='Reading actual private commission records…';button.disabled=true;
  try{draw(await request('/api/admin/commission-completion?request_id='+id,{cache:'no-store'}))}
  catch(e){container.textContent='Completion source HOLD: '+e.message}finally{button.disabled=false}
 }
 async function save(){if(!current)return;const id=x=>Number(byId(x)?.value)||null,decision=byId('ccDecision').value,note=byId('ccNote').value.trim(),raw=byId('ccCostDelta').value.trim(),delta=raw===''?null:Math.round(Number(raw)*100);
  if(note.length<16||raw!==''&&(!/^-?\d+(\.\d{1,2})?$/.test(raw)||Math.abs(delta)>1000000000)){byId('ccFeedback').textContent='Enter a factual review and signed CAD estimate to two decimals.';return}
  if(!confirm('Record this private, immutable completion review? It does NOT charge a deposit, contact the customer, publish a Product or mark delivery accepted.'))return;
  const body={request_id:Number(select.value),decision,source_quote_revision_id:id('ccRevision'),source_proof_version_id:id('ccProof'),source_cost_review_id:id('ccCost'),
   source_traveler_run_id:id('ccTraveler'),source_finished_piece_id:id('ccPiece'),source_order_status_link_id:id('ccOrder'),
   estimated_change_cost_delta_cents:delta,review_note:note,request_key:pendingKey||('commission453-'+crypto.randomUUID())};
  pendingKey=body.request_key;byId('ccRecord').disabled=true;byId('ccFeedback').textContent='Recording source-linked review…';
  try{const d=await request('/api/admin/commission-completion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});pendingKey=null;if(d.completion){draw(d.completion);byId('ccFeedback').textContent='Private completion receipt #'+d.receipt_id+' saved; no customer-facing actions taken.'}else await load()}
  catch(e){byId('ccFeedback').textContent='HOLD — '+e.message}finally{if(byId('ccRecord'))byId('ccRecord').disabled=false}
 }
 select.addEventListener('change',()=>{pendingKey=null;current=null;container.textContent='Open this request’s completion evidence when ready.'});
 button.addEventListener('click',load);
});
