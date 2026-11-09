/* Build 659: explicit one-Product source review; owner receipt is never sale authority. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),endpoint='/api/admin/product-finish-review-659';
 const button=$('dd659Inspect'),form=$('dd659Review');if(!button||!form)return;
 let current=null,lastKey=null,busy=false;
 const status=(id,message)=>{$(id).textContent=message;};
 function line(parent,label,value){const p=document.createElement('p');
  const b=document.createElement('strong');b.textContent=label+' ';
  p.append(b,document.createTextNode(String(value)));parent.append(p);}
 function section(parent,title,items,format){const details=document.createElement('details');
  const heading=document.createElement('summary');heading.textContent=title+' ('+items.length+' shown)';
  details.append(heading);const list=document.createElement('ul');
  items.slice(0,20).forEach(x=>{const li=document.createElement('li');li.textContent=format(x);list.append(li);});
  details.append(list);parent.append(details);}
 async function request(url,options){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
  const data=await r.json();if(!r.ok||data.ok===false)throw Error(data.error||'Server rejected the request ('+r.status+').');
  return data;}
 function show(data){current=data;const wrap=$('dd659Original');wrap.replaceChildren();form.hidden=false;
  const s=data.source,p=s.facts.product;const expected=$('dd659Dovlin');
  expected.checked=Boolean(s.dovlin);expected.disabled=Boolean(s.dovlin);
  line(wrap,'Original Product:',p.product_id+' · '+p.name+' · '+(p.sku||'no SKU'));
  line(wrap,'Saved catalogue state:',(p.status||'unknown')+' / review '+(p.review_status||'unset')+
   ' · '+(p.product_category||'no category')+' · '+p.price_cents+' cents · stock '+p.inventory_quantity);
  line(wrap,'Original source version:',s.source_revision);
  line(wrap,'Media / rights records:',s.facts.totals.images+' gallery images; '+s.facts.totals.annotations+
   ' annotation records. Featured URL: '+(p.featured_image_url?'present':'missing'));
  line(wrap,'Finished-product evidence:',s.facts.totals.runs+' production runs; '+s.facts.totals.lots+' finished lots.');
  line(wrap,'Source flags:',s.holds.length?s.holds.join(' · '):'No automated missing-source flags; original approvals still unverified.');
  line(wrap,'Source scope:',s.source_scope+(s.truncated?' — truncated; review held.':''));
  line(wrap,'Private journal:',data.version+' · '+data.review_state+
   ' · '+(data.source_current?'matching source':'OLDER SOURCE; DO NOT REUSE'));
  if(data.latest_receipt)line(wrap,'Last owner note:',data.latest_receipt.recorded_at+' · '+
    data.latest_receipt.review_state+' · '+data.latest_receipt.note);
  section(wrap,'Saved gallery rows',s.facts.images,x=>'#'+x.product_image_id+' · '+
    (x.image_url?'URL saved':'URL missing')+' · '+(x.alt_text?'alt provided':'ALT MISSING'));
  section(wrap,'Original media permission flags',s.facts.annotations,x=>'image '+x.product_image_id+
    ' · '+(x.public_use_status||'internal review')+' · consent record '+(x.consent_record_id||'none'));
  section(wrap,'Original production runs',s.facts.runs,x=>x.run_key+' · '+x.run_status+
    ' · output '+x.output_quantity+' · '+x.posted_at);
  section(wrap,'Original finished lots',s.facts.lots,x=>x.lot_key+' · '+x.lot_status+
    ' · '+x.source_kind+' · initial pieces '+x.quantity_created);
  const pEdit=document.createElement('a');pEdit.href='/admin/product-editor/?product_id='+p.product_id;
  pEdit.textContent='Open original Product Editor';wrap.append(pEdit);
  const media=document.createElement('a');media.href='/admin/catalog-media/';media.textContent='Open original Media Editor';
  wrap.append(document.createTextNode(' · '),media);
  status('dd659SaveStatus','Owner evidence is not externally verified. Choose HOLD when unsure.');}
 async function inspect(){if(busy)return;const id=String($('dd659ProductId').value).trim();
  if(!/^[1-9]\d{0,9}$/.test(id)){status('dd659Status','Enter an original positive Product ID.');return;}
  busy=true;button.disabled=true;current=null;form.hidden=true;$('dd659Original').replaceChildren();
  status('dd659Status','Reading the current original Product and bounded source evidence…');
  try{const data=await request(endpoint+'?product_id='+encodeURIComponent(id));show(data);
   status('dd659Status','Current original evidence loaded by explicit request. No canonical changes made.');}
  catch(e){status('dd659Status','HOLD: '+e.message);}finally{busy=false;button.disabled=false;}}
 button.addEventListener('click',inspect);
 form.addEventListener('submit',async event=>{event.preventDefault();if(busy||!current)return;
  if(!$('dd659Ack').checked){status('dd659SaveStatus','Confirm the owner receipt limitations first.');return;}
  const key=crypto.randomUUID(),p=current.source.facts.product;
  const body={product_id:p.product_id,expected_version:current.version,
   expected_source_revision:current.source.source_revision,request_key:key,
   sample_evidence:$('dd659Sample').value,rights_evidence:$('dd659Rights').value,
   safety_evidence:$('dd659Safety').value,dovlin_design_evidence:$('dd659Art').value,
   declares_dovlin:$('dd659Dovlin').checked,decision:$('dd659Decision').value,
   note:$('dd659Note').value.trim()};
  if(body.note.length<20){status('dd659SaveStatus','Provide an original factual note of at least 20 characters.');return;}
  busy=true;lastKey={id:p.product_id,key};$('dd659Save').disabled=true;$('dd659FindKey').disabled=false;
  status('dd659SaveStatus','Recording this single source-bound private receipt…');
  try{const data=await request(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   status('dd659SaveStatus',data.receipt.review_state+' · receipt '+data.receipt.receipt_id+
    ' · no Product/stock/publication changes.'+(data.warning?' '+data.warning:''));
   current=null;form.hidden=true;status('dd659Status','Receipt saved. Re-inspect original evidence to continue.');}
  catch(e){status('dd659SaveStatus','HOLD: '+e.message+' Do not retry; inspect the original request key first.');}
  finally{busy=false;$('dd659Save').disabled=false;}});
 $('dd659FindKey').addEventListener('click',async()=>{if(!lastKey||busy)return;
  try{const data=await request(endpoint+'?product_id='+lastKey.id+'&request_key='+lastKey.key);
   status('dd659SaveStatus',data.found?'Saved original receipt '+data.receipt.receipt_id+
    ' · '+data.receipt.review_state:'Original key not found. Reload and re-inspect before new action.');}
  catch(e){status('dd659SaveStatus','HOLD: Request-key lookup failed: '+e.message);}});
})();
