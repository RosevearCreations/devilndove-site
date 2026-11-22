/* Build 747: click-only local diagnostics + private, source-bound observations.
 * The private API is never contacted until a user explicitly clicks Load/Save.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/customer-journey-747';
if(!$('a747Local'))return;
let journal=null,local=null,busy=false,pendingKey=null,errorCount=0;
window.addEventListener('error',()=>errorCount++,{passive:true});
window.addEventListener('unhandledrejection',()=>errorCount++,{passive:true});
const set=(id,s)=>{$(id).textContent=String(s??'');};
const clean=e=>String(e?.message||'Private evidence unavailable').slice(0,220);
const out=(id,text)=>{const p=document.createElement('li');p.textContent=text;$(id).append(p);};
function capture(){
 const p=performance.getEntriesByType('navigation')[0],required=[
  '/public/js/auth.js','/public/js/admin-storefront-acceptance-660.js',
  '/public/js/admin-after-sale-746.js','/public/js/admin-customer-journey-747.js'];
 local={schema:'devilndove-local-customer-journey-diagnostics-747',
  build:747,observed_at:new Date().toISOString(),
  page:'/admin/storefront-acceptance/',ready_state:document.readyState,
  viewport_class:innerWidth<600?'mobile':innerWidth<1024?'tablet':'desktop',
  admin_h1_present:!!document.querySelector('h1'),
  buyer_inspection_control_present:!!$('a745Run'),
  after_sale_control_present:!!$('a746Load'),
  device_evidence_control_present:!!$('a747Load'),
  script_tags:required.map(path=>({path,tag_present:[...document.scripts].some(s=>s.src&&new URL(s.src).pathname===path),
   resource_seen:performance.getEntriesByType('resource').some(e=>{try{return new URL(e.name).pathname===path;}catch{return false;}})})),
  navigation_duration_ms:p?Math.round(p.duration):null,
  javascript_errors_observed_since_diagnostic_init:errorCount,
  cookies_or_session_exported:false,customer_data_exported:false,
  network_probe_executed:false,actual_browser_device_accepted:false,
  external_transaction_verified:false};
 const target=$('a747Diagnostics');target.replaceChildren();
 out('a747Diagnostics','Page ready state: '+local.ready_state+' · navigation duration '+(local.navigation_duration_ms??'unavailable')+' ms');
 out('a747Diagnostics','Admin heading, buyer inspection and after-sale controls: '+
  [local.admin_h1_present,local.buyer_inspection_control_present,local.after_sale_control_present].join(' / '));
 for(const a of local.script_tags)
  out('a747Diagnostics',a.path+': tag '+(a.tag_present?'present':'MISSING')+
   ', resource timing '+(a.resource_seen?'observed':'not observed (may be cached)'));
 out('a747Diagnostics','Observed JS errors since diagnostic initialization: '+errorCount+
  '. This is a local snapshot, not an HTTP/proof-of-payment test.');
 set('a747Status','Local diagnostic snapshot ready. Export JSON; no API, order, customer or provider read occurred.');
 $('a747Export').disabled=false;
}
function exportLocal(){
 if(!local)return;
 const blob=new Blob([JSON.stringify(local,null,2)+'\n'],{type:'application/json'});
 const href=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=href;a.download='devilndove-local-diagnostics-747.json';
 a.hidden=true;document.body.append(a);a.click();a.remove();
 URL.revokeObjectURL(href);
}
function setBusy(value){busy=value;for(const id of ['a747Load','a747DeviceSave','a747DeviceReviewSave','a747HandoffSave'])$(id).disabled=value;}
async function api(method,payload){
 const options={method,credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};
 if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify(payload);}
 if(typeof AbortSignal==='function'&&typeof AbortSignal.timeout==='function')
  options.signal=AbortSignal.timeout(9000);
 const response=await fetch(API,options),data=await response.json().catch(()=>({error:'Private source response unreadable.'}));
 if(!response.ok||!data.ok)throw Error((data.code?data.code+': ':'')+(data.error||'HTTP '+response.status));
 return data;
}
function render(){
 const list=$('a747Receipts');list.replaceChildren();
 const j=journal;
 if(!j)return;
 for(const r of j.receipts.slice(0,30)){
  out('a747Receipts',r.id+' · '+r.kind+' · '+r.decision+' · '+
   (r.route||('Order '+r.order_id))+' · device '+(r.device||'not applicable')+
   ' · actor '+r.actor_user_id+' · '+(r.recorded_at||'time unavailable'));
 }
 if(!j.receipts.length)out('a747Receipts','No original private observations yet. All independent acceptance remains HOLD.');
 const routes=$('a747Routes');routes.replaceChildren();
 for(const r of j.routes)
  out('a747Routes',r.route+' · '+r.device_classes.join(', ')+' · '+
   (r.cross_device_reviewed?'two device classes independently reviewed (not provider-verified)':'Cross-device HOLD'));
 set('a747Status','Private Build 747 journal loaded, revision '+j.version+
  '. Records reflect Admin-entered evidence and independent review only; external outcomes remain HOLD.');
}
async function load(){
 if(busy)return;setBusy(true);set('a747Status','Loading bounded private source evidence…');
 try{journal=(await api('GET')).journal;pendingKey=null;render();}
 catch(e){journal=null;$('a747Receipts').replaceChildren();$('a747Routes').replaceChildren();
  set('a747Status','HOLD: '+clean(e)+'. No new observation recorded.');}
 finally{setBusy(false);}
}
async function save(kind,fields){
 if(busy||!journal){set('a747Status','Load the original private journal before saving.');return;}
 const request_key=pendingKey||crypto.randomUUID();pendingKey=request_key;
 setBusy(true);set('a747Status','Saving a private evidence receipt. No customer, payment or provider action.');
 try{
  const saved=await api('POST',{kind,request_key,expected_version:journal.version,...fields});
  pendingKey=null;
  journal=(await api('GET')).journal;render();
  set('a747Status',saved.replayed?'Original receipt replay confirmed.':'Private evidence receipt saved. External acceptance remains HOLD.');
 }catch(e){set('a747Status','HOLD: '+clean(e)+'. Reload history before retrying to avoid duplicates.');}
 finally{setBusy(false);}
}
function common(noteId,refId,decisionId){
 return{note:$(noteId).value.trim(),source_reference:$(refId).value.trim(),decision:$(decisionId).value};
}
$('a747Local').addEventListener('click',capture);
$('a747Export').addEventListener('click',exportLocal);
$('a747Load').addEventListener('click',load);
$('a747DeviceForm').addEventListener('submit',e=>{e.preventDefault();
 const f={...common('a747Note','a747Ref','a747Decision'),route:$('a747Route').value,
 device:$('a747Device').value,browser:$('a747Browser').value};
 void save('device',f);
});
$('a747ReviewForm').addEventListener('submit',e=>{e.preventDefault();
 const f={...common('a747ReviewNote','a747ReviewRef','a747ReviewDecision'),
 subject_id:$('a747ReviewId').value.trim()};
 void save('review_device',f);
});
$('a747HandoffForm').addEventListener('submit',e=>{e.preventDefault();
 const f={...common('a747HandoffNote','a747HandoffRef','a747HandoffDecision'),
 subject_id:$('a747HandoffId').value.trim(),order_id:$('a660Id').value.trim()};
 void save('review_handover',f);
});
})();
