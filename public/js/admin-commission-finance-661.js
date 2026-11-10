/* Build 661: deliberate private, source-only read; textContent, no writes. */
(()=>{'use strict';const $=id=>document.getElementById(id),api='/api/admin/commission-finance-661';
 if(!$('b661Inspect'))return;let busy=false;
 const add=(parent,tag,value)=>{const el=document.createElement(tag);if(value!==undefined)el.textContent=String(value??'');parent.append(el);return el;};
 const money=value=>value===null||value===undefined?'UNKNOWN / HOLD':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(value)/100);
 const status=s=>{$('b661Status').textContent=s;};
 async function get(query=''){const r=await fetch(api+query,{credentials:'same-origin',cache:'no-store'});
  const d=await r.json().catch(()=>({ok:false,error:'Original source response unreadable.'}));
  if(!r.ok||d.ok!==true)throw Error(d.error||'Source unavailable.');return d;}
 const clear=(id)=>{$(id).replaceChildren();return $(id);};
 const labeled=(parent,label,value)=>{const p=add(parent,'p');add(p,'strong',label+': ');add(p,'span',value);return p;};
 function table(parent,columns,records){const wrap=add(parent,'div');wrap.className='scroll';const table=add(wrap,'table'),thead=add(table,'thead'),tr=add(thead,'tr');
  for(const c of columns)add(tr,'th',c.label);const tbody=add(table,'tbody');
  for(const row of records){const tr=add(tbody,'tr');for(const c of columns)add(tr,'td',c.get(row));}
  if(!records.length)labeled(wrap,'Evidence','No saved source records in scope.');}
 function orders(facts){const place=clear('b661Orders'),orders=facts.original_orders||[];
  add(place,'h3','Linked original orders and invoice documents');if(!orders.length){labeled(place,'Status','No original active Order link. No invoice or payment inferred.');return;}
  for(const o of orders){const section=add(place,'section');add(section,'h4','Order '+(o.order.order_number||o.order.order_id));
   labeled(section,'Order source status',(o.order.order_status||'unknown')+' / '+(o.order.payment_status||'unknown'));
   labeled(section,'Saved order amount',money(o.order.total_cents));labeled(section,'Recorded paid amount (not provider attestation)',money(o.saved_paid_cents));
   labeled(section,'Completed refund amount (not provider attestation)',money(o.saved_completed_refund_cents));
   table(section,[{label:'Invoice or credit note',get:r=>r.document_number||r.customer_document_id},
    {label:'Type / state',get:r=>(r.document_type||'')+' / '+(r.document_status||'')},
    {label:'Document amount',get:r=>money(r.document_amount_cents)}],o.invoices||[]);
   if(o.holds?.length)labeled(section,'Outstanding invoice/payment issues',o.holds.join(' · '));}
 }
 function costs(facts){const place=clear('b661Costs'),v=facts.costs;
  if(!v){labeled(place,'Job cost evidence','No original creative project linked to this commission.');return;}
  labeled(place,'Latest reviewed cost record',v.latest_cost_review_id||'None');
  labeled(place,'Scenario',v.reviewed_price_scenario?.scenario_kind||'Not recorded');
  labeled(place,'Proposed unit price (not invoiced)',money(v.reviewed_price_scenario?.proposed_price_cents));
  labeled(place,'Known estimated cost subtotal',money(v.projection?.known_subtotal_cents));
  labeled(place,'Estimated complete job cost',money(v.projection?.total_cost_cents));
  labeled(place,'Hypothetical proposed profit (not booked)',money(v.projection?.project_profit_estimate_cents));
  labeled(place,'Finance revenue reference (not a verified ledger receipt)',money(v.finance_reference?.revenue_cents));
  labeled(place,'Realized/accountant-approved profit',money(v.ledger_profit_cents));
  const components=v.projection?.components||[];table(place,[{label:'Cost component',get:r=>r.label},
   {label:'Source',get:r=>r.source},{label:'Estimated CAD',get:r=>money(r.amount_cents)}],components);
  if(v.projection?.warnings?.length){add(place,'h4','Cost caveats');const list=add(place,'ul');for(const warning of v.projection.warnings)add(list,'li',warning);}
 }
 function owner(facts){const place=clear('b661Owner'),v=facts.owner;
  if(!v){labeled(place,'Owner evidence','Unavailable / HOLD');return;}
  labeled(place,'Private owner journal version',v.owner_version);
  table(place,[{label:'Checkpoint',get:r=>r.id},{label:'Owner decision',get:r=>r.decision},
   {label:'Observed (UTC)',get:r=>r.observed_at||'No original observation'},
   {label:'Evidence reference',get:r=>r.evidence_reference||'None'}],v.checkpoints||[]);
  labeled(place,'Independent certification','NOT VERIFIED');}
 function show(d){clear('b661RecentList');const f=d.facts,place=clear('b661Overview');
  const first=add(place,'div');add(first,'h3','Source customer request');
  labeled(first,'Request ID',f.request.custom_request_id);labeled(first,'Type / state',(f.request.request_type||'unknown')+' / '+(f.request.status||'unknown'));
  labeled(first,'Customer budget (not a sale)',money(f.request.budget_cents));
  const q=add(place,'div');add(q,'h3','Original quote');labeled(q,'Quote source ID',f.quote?.custom_request_quote_draft_id||'Missing');
  labeled(q,'Quote state',f.quote?.quote_status||'Unreviewed');labeled(q,'Quote total (not revenue)',money(f.quote?.quote_total_cents));
  const pay=add(place,'div');add(pay,'h3','Deposit request draft');
  labeled(pay,'Draft status',f.payment_request_draft?.payment_request_status||'Missing');
  labeled(pay,'Requested CAD (not paid)',money(f.payment_request_draft?.amount_cents));
  const job=add(place,'div');add(job,'h3','Workshop linkage');
  labeled(job,'Project ID',f.manufacturing?.creative_work_project_id||'Unlinked');labeled(job,'Stage',f.manufacturing?.current_stage||'Not found');
  orders(f);costs(f);owner(f);
  const holds=clear('b661Holds'),list=add(holds,'ul');list.className='hold';for(const h of d.holds||[])add(list,'li',h);
  labeled(holds,'Original source revision',d.source_revision||'Unknown');
  status('Loaded original Custom Request '+f.request.custom_request_id+'. '+(d.holds?.length||0)+' source/acceptance HOLD(s). No changes made.');}
 async function action(work){if(busy)return;busy=true;$('b661Inspect').disabled=true;$('b661Recent').disabled=true;
  try{await work();}catch(e){status('HOLD: '+e.message);}finally{busy=false;$('b661Inspect').disabled=false;$('b661Recent').disabled=false;}}
 $('b661Inspect').addEventListener('click',()=>action(async()=>{const id=$('b661Id').value.trim();
  if(!/^[1-9]\d{0,9}$/.test(id))throw Error('Enter an original positive Custom Request ID.');
  status('Reading private source evidence…');show(await get('?request_id='+encodeURIComponent(id)));}));
 $('b661Recent').addEventListener('click',()=>action(async()=>{status('Reading recent source identifiers…');
  const d=await get(),place=clear('b661RecentList');table(place,[{label:'Request ID',get:r=>r.custom_request_id},
   {label:'Type',get:r=>r.request_type||'—'},{label:'Status',get:r=>r.status||'—'}],d.requests||[]);
  status('Loaded up to 50 original request IDs. No personal customer details returned.');}));
})();
