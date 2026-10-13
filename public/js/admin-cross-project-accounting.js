// Release 467 Build 383 — read-first, operator-attested project financial evidence.
document.addEventListener('DOMContentLoaded',()=>{
 const $=s=>document.getElementById(s),project=$('financeProject'),output=$('financeDetail'),status=$('financeStatus');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const api=(u,o={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(u,o):fetch(u,{credentials:'same-origin',...o});
 const currency=v=>v===null||v===undefined?'Unknown / unrecorded':(Number(v)/100).toLocaleString('en-CA',{style:'currency',currency:'CAD'});
 const num=v=>v===null||v===undefined?'Unknown':Number(v).toLocaleString('en-CA');
 const types=['revenue_source','material_consumption','labour_cost','production_cost','tax_source','payment_refund','variance_resolution','overall_readiness'];
 const results=['evidence_missing','needs_reconciliation','reviewed_with_caveat','source_verified'];
 const sources=['operator_review','creative_project_profitability','creative_work_events','creative_work_order_events','creative_project_inventory_posts','creative_project_production_cost_evidence','orders_payments_refunds'];
 let snapshot=null,key=null;
 function line(name,val,detail=''){return '<tr><th scope="row">'+esc(name)+'</th><td>'+esc(val)+'</td><td>'+esc(detail)+'</td></tr>';}
 function draw(){
 const d=snapshot;if(!d)return;const f=d.finance_intelligence||{},m=d.material_evidence||{},l=d.labour_evidence||{},p=d.production_cost_evidence||{},a=d.payment_refund_reconciliation||{};
 output.innerHTML='<h2>'+esc(d.project.project_title)+'</h2><p>Project '+esc(d.project.project_key)+' · '+esc(d.project.project_status)+' · Currency: '+esc(d.currency)+'</p>'+
 '<h3>Accounting sources — no automatic posting</h3><div class="admin-table-wrap"><table><thead><tr><th>Source</th><th>Observed amount</th><th>Interpretation</th></tr></thead><tbody>'+
 line('Creator reported project sales',currency(d.project.sales_revenue_cents),'Creator source only; no settlement inference')+
 line('Finance booked-source revenue',currency(d.finance_source?.revenue_cents),'Existing Finance profitability entry; not an order total')+
 line('Finance calculated project profit',currency(f.project_profit_cents),'Existing Finance intelligence, not a new profit formula')+
 line('Finance tracked material cost',currency(f.tracked_material_cost_cents),'Existing Finance/Creative Process source')+
 line('Posted inventory usage valuation',currency(m.inventory_current_cost_estimate_cents),m.posts_count+' posted item records; '+m.missing_price_posts+' without a current unit price; estimate only')+
 line('Creative Process material cost',currency(m.creative_process_material_cost_cents),'An alternate source view; NEVER add to inventory valuation without reconciliation')+
 line('Work-order elapsed time',num(l.actual_work_order_minutes)+' minutes',l.time_entries+' actual time entries; overlaps with Creative Process time')+
 line('Work-order labour estimate',currency(l.work_order_cost_estimate_cents),'Finance hourly rate if available; not a payroll booking')+
 line('Active manufacturing cost evidence',currency(p.known_direct_cost_cents),p.rows+' rows, '+p.reviewed_rows+' reviewed; overlapping components possible')+
 line('Finance packaging cost',currency(f.packaging_cost_cents),'Source-owned Finance assumptions')+
 line('Finance overhead cost',currency(f.overhead_cost_cents),'Source-owned Finance assumptions')+
 line('Linked order tax',currency(a.recorded_order_tax_cents),'Source order tax liability, not a remittance')+
 line('Linked order gross payments',currency(a.gross_paid_cents),'Recorded paid/refunded-status payment evidence; not booked revenue')+
 line('Linked order refunds',currency(a.refund_cents),'Recorded refund evidence')+
 line('Linked order net collection',currency(a.net_paid_cents),'Cash reconciliation only; mixed currency requires manual separation')+
 '</tbody></table></div>'+
 (d.source_gaps.length?'<h3>Evidence requiring follow-up</h3><ul>'+d.source_gaps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Source-gap checks passed for the bounded rows shown; this is not an accounting certification.</p>')+
 (d.linked_order_sources_truncated?'<p>More than 20 linked order sources exist; totals are incomplete.</p>':'')+
 '<h3>Append accountable source review (no financial postings)</h3><label>Review area <select id="reviewType">'+types.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
 '<label>Finding <select id="reviewResult">'+results.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
 '<label>Source authority <select id="reviewSource">'+sources.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
 '<label>Existing source record ID (optional; required for specific source verification) <input id="reviewSourceId" type="number" min="1" step="1"/></label>'+
 '<label>Factual review note (16+ characters) <textarea id="reviewNote" rows="3" maxlength="1200"></textarea></label>'+
 '<button class="btn" id="reviewSave" type="button">Record source review</button><p id="reviewFeedback" role="status"></p>'+
 '<h3>Immutable review history</h3><table><thead><tr><th>When</th><th>Review</th><th>Result</th><th>Source</th><th>Note</th></tr></thead><tbody>'+
 ((d.review_history||[]).map(x=>'<tr><td>'+esc(x.created_at)+'</td><td>'+esc(x.review_type)+'</td><td>'+esc(x.review_result)+'</td><td>'+esc(x.source_kind)+' '+esc(x.source_record_id||'')+'</td><td>'+esc(x.evidence_note)+'</td></tr>').join('')||'<tr><td colspan="5">No review decisions yet.</td></tr>')+'</tbody></table>'+
 (d.history_truncated?'<p>Older review decisions are not displayed in this bounded view.</p>':'')+
 '<p><a href="/admin/project-profitability-reconciliation/">Original Creator ↔ Finance reconciliation</a> · <a href="/admin/project-material-planner/">Material source</a> · <a href="/admin/project-work-orders/">Labour events</a> · <a href="/admin/accounting/">Accounting records</a></p>';
 $('reviewSave').addEventListener('click',save);
 }
 async function load(){
 if(!project.value){output.textContent='Select a Creative Project to inspect linked source evidence.';return;}
 status.textContent='Retrieving Finance, source inventory and order reconciliation…';
 try{const res=await api('/api/admin/cross-project-accounting?project_id='+encodeURIComponent(project.value),{cache:'no-store'});
 const data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'Read failed');snapshot=data;draw();status.textContent='Read-only source snapshot loaded. No accounting changes made.';}
 catch(e){output.textContent='Unable to verify source records: '+e.message;status.textContent='No unverified totals displayed.';}
 }
 async function save(){
 const body={creative_work_project_id:Number(project.value),review_type:$('reviewType').value,review_result:$('reviewResult').value,
  source_kind:$('reviewSource').value,source_record_id:Number($('reviewSourceId').value)||null,
  evidence_note:$('reviewNote').value.trim(),request_key:key||crypto.randomUUID()};
 if(body.evidence_note.length<16){$('reviewFeedback').textContent='Enter at least 16 characters of factual review evidence.';return;}
 if(!confirm('Append a permanent review note? No payment, stock, taxes or accounting records will be changed.'))return;
 key=body.request_key;const button=$('reviewSave');button.disabled=true;
 try{const res=await api('/api/admin/cross-project-accounting',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'Write not confirmed');key=null;status.textContent='Source review appended; no financial posting.';await load();}
 catch(e){$('reviewFeedback').textContent='Review not confirmed: '+e.message;}
 finally{if($('reviewSave'))$('reviewSave').disabled=false;}
 }
 project.addEventListener('change',()=>{key=null;load();});$('financeRefresh').addEventListener('click',load);
 (async()=>{try{const res=await api('/api/admin/cross-project-accounting');const data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'Project list unavailable');
 project.innerHTML='<option value="">Select a project</option>'+(data.projects||[]).map(x=>'<option value="'+Number(x.creative_work_project_id)+'">'+esc(x.project_title)+' #'+Number(x.creative_work_project_id)+'</option>').join('');
 status.textContent=data.projects_truncated?'Latest 100 projects displayed; full source history is preserved.':'Choose an existing Creative Project.';output.textContent='Select a project.';}
 catch(e){status.textContent='Project list unavailable: '+e.message;}})();
});
