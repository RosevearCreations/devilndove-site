// Build 382 — safe operator review and source-linked commission evidence.
document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id),select=$('commissionRequest'),mount=$('commissionState');if(!select||!mount)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const api=(url,opt={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opt):fetch(url,{credentials:'same-origin',...opt});
 const events=['intake_review','quote_review','revision_review','deposit_request_review','customer_proof_review','handoff_review','progress_approval'];
 const stages=['request_received','design_review','quote_in_review','production_planning','production_in_progress','quality_review','fulfillment_preparation'];
 let current=null,requestKey=null;
 const opts=(rows,id,label)=>'<option value="">Not linked</option>'+rows.map(r=>'<option value="'+Number(r[id])+'">'+esc(label(r))+'</option>').join('');
 function paint(){
  if(!current)return;
  const d=current,links=d.existing_customer_order_links||[],q=d.quote,proof=d.proof_versions||[];
  mount.innerHTML='<h2>'+esc(d.request.product_interest||d.request.request_type||'Custom work request')+'</h2><p>Customer: '+esc(d.request.name||'Not specified')+' · Intake status: '+esc(d.request.status)+'</p>'+
   '<p><strong>Quote source:</strong> '+(q?esc(q.quote_key)+' · '+esc(q.quote_status):'No quote draft')+
   ' · <strong>Job draft:</strong> '+(d.job_draft?esc(d.job_draft.job_key)+' · '+esc(d.job_draft.job_status):'None')+
   ' · <strong>Manufacturing project:</strong> '+esc(d.manufacturing?.project_title||'Not connected')+'</p>'+
   '<p>Proof approvals: '+proof.filter(x=>x.proof_status==='approved').length+
   ' · Payment-request drafts: '+(d.payment_request_drafts||[]).length+
   ' (payment status not inferred) · Active customer order-status links: '+links.length+
   ' · Recorded manufacturing evidence: '+Number(d.production_evidence_count||0)+'</p>'+
   (d.history_truncated?'<p>Older history exceeds this bounded view; source record is not fully shown.</p>':'')+
   '<h3>Record an operator decision</h3>'+
   '<label>Review event <select id="commissionKind">'+events.map(x=>'<option value="'+x+'">'+esc(x.replaceAll('_',' '))+'</option>').join('')+'</select></label>'+
   '<label>Source quote <select id="commissionQuote">'+opts(q?[q]:[],'custom_request_quote_draft_id',x=>x.quote_key+' ('+x.quote_status+')')+'</select></label>'+
   '<label>Quote revision <select id="commissionRevision">'+opts(d.revisions||[],'custom_request_quote_revision_id',x=>'#'+x.custom_request_quote_revision_id+' · '+x.revision_status)+'</select></label>'+
   '<label>Deposit/payment request draft <select id="commissionPayment">'+opts(d.payment_request_drafts||[],'custom_request_payment_request_draft_id',x=>'#'+x.custom_request_payment_request_draft_id+' · '+x.payment_request_status)+'</select></label>'+
   '<label>Customer proof version <select id="commissionProof">'+opts(proof,'custom_request_proof_version_id',x=>'v'+x.version_number+' · '+x.proof_status)+'</select></label>'+
   '<label>Manufacturing job draft <select id="commissionJob">'+opts(d.job_draft?[d.job_draft]:[],'custom_request_job_draft_id',x=>x.job_key)+'</select></label>'+
   '<label>Customer progress stage (for progress approval only) <select id="commissionStage">'+stages.map(x=>'<option value="'+x+'">'+esc(x.replaceAll('_',' '))+'</option>').join('')+'</select></label>'+
   '<label>Approved customer-visible wording (12–240 characters, progress approval only) <textarea id="commissionPublic" maxlength="240" rows="2"></textarea></label>'+
   '<label>Private operator explanation (12+ characters) <textarea id="commissionNote" rows="3"></textarea></label>'+
   '<button type="button" class="btn" id="commissionRecord">Record decision</button><p id="commissionFeedback" role="status"></p>'+
   '<h3>Commission decision history (private)</h3><div class="admin-table-wrap"><table><thead><tr><th>When</th><th>Decision</th><th>Source</th><th>Approval note</th></tr></thead><tbody>'+
   ((d.history||[]).map(x=>'<tr><td>'+esc(x.created_at)+'</td><td>'+esc(x.event_kind)+(x.customer_visible?' · Customer-visible':'')+'</td><td>Quote '+esc(x.source_quote_draft_id||'—')+' · Proof '+esc(x.source_proof_version_id||'—')+'</td><td>'+esc(x.internal_note)+'</td></tr>').join('')||'<tr><td colspan="4">No commission decisions recorded yet.</td></tr>')+'</tbody></table></div>'+
   '<p><a href="/admin/custom-requests/">Edit quotes, deposits and order drafts in Custom Requests</a> · <a href="/admin/custom-work-proof/">Review customer proofs</a> · <a href="/admin/manufacturing-lifecycle/">Manufacturing stage authority</a></p>';
  $('commissionRecord').addEventListener('click',save);
 }
 async function load(){
  if(!select.value){mount.textContent='Choose an existing Custom Request.';return;}
  mount.textContent='Loading canonical records…';
  try{const r=await api('/api/admin/commission-workbench?request_id='+encodeURIComponent(select.value),{cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Request unavailable');current=d;paint();}
  catch(e){mount.textContent='Source read failed: '+e.message;}
 }
 async function save(){
  const kind=$('commissionKind').value,note=$('commissionNote').value.trim(),publicText=$('commissionPublic').value.trim();
  if(note.length<12||kind==='progress_approval'&&publicText.length<12){$('commissionFeedback').textContent='Provide required reviewed notes before saving.';return;}
  if(!confirm('Append this operator review? This does not charge, send a message, approve a quote or change order status.'))return;
  const body={request_id:Number(select.value),event_kind:kind,internal_note:note,progress_stage:$('commissionStage').value,
   public_progress_message:publicText,source_quote_draft_id:Number($('commissionQuote').value)||null,
   source_quote_revision_id:Number($('commissionRevision').value)||null,
   source_payment_request_draft_id:Number($('commissionPayment').value)||null,
   source_proof_version_id:Number($('commissionProof').value)||null,source_job_draft_id:Number($('commissionJob').value)||null,
   source_creative_project_id:Number(current.manufacturing?.creative_work_project_id)||null,request_key:requestKey||crypto.randomUUID()};
  requestKey=body.request_key;$('commissionRecord').disabled=true;$('commissionFeedback').textContent='Saving reviewed decision…';
  try{const r=await api('/api/admin/commission-workbench',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Save failed');requestKey=null;current=d;paint();$('commissionFeedback').textContent='Append-only review saved. Source records were not changed.';}
  catch(e){$('commissionFeedback').textContent='Save not confirmed: '+e.message;}
  finally{if($('commissionRecord'))$('commissionRecord').disabled=false;}
 }
 select.addEventListener('change',()=>{requestKey=null;load();});$('commissionRefresh').addEventListener('click',load);
 (async()=>{try{const r=await api('/api/admin/commission-workbench');const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Request index unavailable');select.innerHTML='<option value="">Select request</option>'+(d.requests||[]).map(x=>'<option value="'+Number(x.custom_request_id)+'">'+esc(x.product_interest||x.request_type||'Custom request')+' #'+Number(x.custom_request_id)+'</option>').join('');mount.textContent=d.requests_truncated?'Showing latest 100 requests only. Older requests remain in Custom Requests.':'Choose an existing Custom Request.';}
 catch(e){mount.textContent=e.message;}})();
});
