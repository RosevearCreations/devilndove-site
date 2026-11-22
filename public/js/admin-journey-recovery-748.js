/* Build 748: owner-click-only Firefox recovery and private internal closure.
 * No automatic fetch, customer identity export, payment/refund, shipment or pickup.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='/api/admin/customer-journey-closure-748';
if(!$('a748Probe'))return;
const ROUTES=['/shop/','/cart/','/checkout/','/pickup/','/contact/','/terms/','/help/'];
let probe=null,journal=null,orderEvidence=null,busy=false,pending=null,errorCount=0;
window.addEventListener('error',()=>errorCount++,{passive:true});
window.addEventListener('unhandledrejection',()=>errorCount++,{passive:true});
const set=(id,text)=>{if($(id))$(id).textContent=String(text??'');};
const fail=e=>String(e?.message||'Original evidence unavailable').slice(0,200);
const firefox=()=>/Firefox\/\d+/i.test(navigator.userAgent)&&!/Seamonkey/i.test(navigator.userAgent);
const device=()=>innerWidth<600?'mobile':innerWidth<1024?'tablet':'desktop';
const li=(list,text)=>{const n=document.createElement('li');n.textContent=String(text);list.append(n);};
const hold=text=>set('a748Status','HOLD: '+text+' No provider, customer or financial action executed.');
function changeBusy(value){
 busy=value;
 for(const id of ['a748Probe','a748EvidenceLoad','a748OrderLoad','a748FirefoxSave','a748FirefoxReviewSave',
  'a748ClosureSave','a748ClosureReviewSave','a748ReopenSave'])if($(id))$(id).disabled=value;
}
function originGet(path){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
 const start=performance.now();
 return fetch(path,{method:'GET',credentials:'omit',cache:'no-store',
  redirect:'manual',signal:controller.signal}).then(async res=>{
   if(res.status!==200||res.type==='opaqueredirect')throw Error('HTTP '+res.status+' or redirect');
   const ct=String(res.headers.get('content-type')||'').toLowerCase();
   if(ct&&!ct.includes('text/html'))throw Error('Unexpected content type');
   const length=Number(res.headers.get('content-length')||0);
   if(length>1250000)throw Error('Response exceeds bounded length');
   const html=await res.text();
   if(html.length<100||html.length>1250000)throw Error('Unexpected page length');
   const dom=new DOMParser().parseFromString(html,'text/html');
   if(!dom.querySelector('h1')||!dom.querySelector('title'))throw Error('Missing heading/title');
   return{status:'PASS_STATIC_HTML',elapsed_ms:Math.round(performance.now()-start)};
  }).catch(e=>({status:'HOLD',reason:e.name==='AbortError'?'6500ms timeout':fail(e),
    elapsed_ms:Math.round(performance.now()-start)}))
  .finally(()=>clearTimeout(timer));
}
async function runProbe(){
 if(busy)return;changeBusy(true);probe=null;
 const dest=$('a748ProbeRows');dest.replaceChildren();
 const reports=new Array(ROUTES.length);let index=0,done=0;
 set('a748ProbeStatus','Checking public routes, no cookies or customer data. 0/7');
 async function worker(){
  while(index<ROUTES.length){
   const i=index++,path=ROUTES[i],result=await originGet(path);
   reports[i]={path,...result};done++;
   set('a748ProbeStatus','Public route diagnostics '+done+'/7 checked; any failed steps remain HOLD.');
  }
 }
 try{
  await Promise.all([worker(),worker()]);
  const pass=reports.filter(r=>r.status==='PASS_STATIC_HTML').length;
  probe={schema:'devilndove-local-firefox-recovery-748',build:748,
   generated_at:new Date().toISOString(),page:location.pathname,
   client_reported_firefox:firefox(),device_class:device(),ready_state:document.readyState,
   h1_present:!!document.querySelector('h1'),javascript_errors_seen_since_load:errorCount,
   static_pass:pass,static_hold:7-pass,reports,
   customer_identity_exported:false,session_or_cookie_exported:false,
   actual_authenticated_owner_accepted:false,
   independent_second_admin_reviewed:false,provider_or_financial_action:false};
  for(const item of reports)li(dest,item.path+' — '+item.status+
   ' ('+item.elapsed_ms+'ms)'+(item.reason?' · '+item.reason:''));
  set('a748ProbeStatus',pass+'/7 public routes passed structural GET checks. '+
   (firefox()?'Firefox detected locally (client-reported).':'Browser is not Firefox.')+
   ' No purchase, customer reply or refund verified. Failures remain HOLD.');
  $('a748Export').disabled=false;
 }catch(e){set('a748ProbeStatus','HOLD: diagnostic interrupted: '+fail(e));}
 finally{changeBusy(false);}
}
function exportProbe(){
 if(!probe)return;
 const blob=new Blob([JSON.stringify(probe,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download='devilndove-firefox-diagnostics-748.json';
 link.hidden=true;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function fetchPrivate(method,data=null,order=null){
 const opts={method,credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};
 if(method==='POST'){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(data);}
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),9000);
 opts.signal=ctl.signal;
 try{
  const uri=API+(order?'?order_id='+encodeURIComponent(order):'');
  const res=await fetch(uri,opts);
  const body=await res.json().catch(()=>({error:'Private response could not be read.'}));
  if(!res.ok||!body.ok)throw Error((body.code?body.code+': ':'')+(body.error||'HTTP '+res.status));
  return body;
 }finally{clearTimeout(timeout);}
}
function renderJournal(){
 if(!journal)return;
 const out=$('a748Receipts');
 if(out){out.replaceChildren();for(const receipt of journal.receipts.slice(0,30))
   li(out,receipt.id+' · '+receipt.kind+' / '+receipt.decision+
    ' · actor '+receipt.actor_user_id+' · '+(receipt.order_id?'Order '+receipt.order_id:'device '+(receipt.device_class||'n/a')));
  if(!journal.receipts.length)li(out,'No original Build 748 evidence recorded.');}
 set('a748FirefoxStatus','Original Firefox: '+journal.firefox_review_state+
  '. CI browser tests alone do not establish the owner’s real Firefox acceptance.');
}
function renderOrder(){
 if(!orderEvidence)return;
 const src=$('a748Handoffs');if(src){src.replaceChildren();for(const h of orderEvidence.original.eligible_handoffs)
  li(src,h.case_id+' · '+h.case_type+' · reviewed '+(h.internal_handoff_verified?'YES':'HOLD'));
  if(!orderEvidence.original.eligible_handoffs.length)li(src,'No eligible source-bound handoff; keep closure HOLD.');}
 set('a748OrderStatus','Order '+orderEvidence.original.order.order_number+' · '+
  orderEvidence.closure.state+'. External customer/provider closure NOT confirmed.');
}
async function load(order=null){
 if(busy)return;changeBusy(true);
 try{
  const data=await fetchPrivate('GET',null,order);
  journal=data.journal;
  if(order){orderEvidence=data;renderOrder();}
  renderJournal();pending=null;
  set('a748Status','Original private evidence loaded (version '+journal.version+'). '+
   'Only explicit Admin actions may add receipts.');
 }catch(e){journal=null;orderEvidence=null;hold(fail(e));}
 finally{changeBusy(false);}
}
function currentOrder(){
 const value=String($('a660Id')?.value||'').trim();
 return /^[1-9]\d{0,9}$/.test(value)?value:null;
}
async function save(kind,fields){
 if(busy||!journal){hold('Load original private journal before recording a receipt.');return;}
 if(fields.order_id&&String(fields.order_id)!==String(orderEvidence?.original?.order?.order_id)){
  hold('Original Order changed. Reload the canonical Order before saving.');return;
 }
 const key=pending||crypto.randomUUID();pending=key;changeBusy(true);
 try{
  const result=await fetchPrivate('POST',{kind,request_key:key,expected_version:journal.version,...fields});
  pending=null;
  const selected=orderEvidence?.original?.order?.order_id;
  const current=await fetchPrivate('GET',null,selected);
  journal=current.journal;orderEvidence=selected?current:null;
  renderJournal();if(selected)renderOrder();
  set('a748Status',result.replayed?'Original matching receipt replay confirmed.':
   'Private '+kind+' receipt recorded. External outcomes remain unverified.');
 }catch(e){hold(fail(e)+' Check original receipt history before retrying.');}
 finally{changeBusy(false);}
}
function form(note,ref,decision){return{note:$(note).value.trim(),
 source_reference:$(ref).value.trim(),decision:$(decision).value};}
$('a748Probe').addEventListener('click',runProbe);
$('a748Export').addEventListener('click',exportProbe);
if($('a748EvidenceLoad')){
 $('a748EvidenceLoad').addEventListener('click',()=>void load());
 $('a748OrderLoad').addEventListener('click',()=>{
  const id=currentOrder();if(!id){hold('Enter the original numeric Order ID above.');return;}
  void load(id);
 });
 $('a748FirefoxForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(!probe||!firefox()||!$('a748Confirm').checked){
   hold('Run diagnostics in the owner’s actual Firefox browser and explicitly confirm the observation.');return;
  }
  const fields={...form('a748FirefoxNote','a748FirefoxRef','a748FirefoxDecision'),
   browser_family:'firefox',device_class:probe.device_class,static_pass:probe.static_pass,
   static_hold:probe.static_hold,owner_clicked_confirmation:true};
  void save('firefox_observation',fields);
 });
 $('a748FirefoxReviewForm').addEventListener('submit',e=>{e.preventDefault();
  void save('review_firefox',{...form('a748FirefoxReviewNote','a748FirefoxReviewRef','a748FirefoxReviewDecision'),
   subject_id:$('a748FirefoxId').value.trim()});});
 $('a748ClosureForm').addEventListener('submit',e=>{e.preventDefault();
  const order=currentOrder();if(!order){hold('Load an actual original Order first.');return;}
  void save('propose_closure',{...form('a748ClosureNote','a748ClosureRef','a748ClosureDecision'),
   order_id:order,case_id:$('a748CaseId').value.trim()});});
 $('a748ClosureReviewForm').addEventListener('submit',e=>{e.preventDefault();
  void save('review_closure',{...form('a748ClosureReviewNote','a748ClosureReviewRef','a748ClosureReviewDecision'),
   subject_id:$('a748ProposalId').value.trim()});});
 $('a748ReopenForm').addEventListener('submit',e=>{e.preventDefault();
  const order=currentOrder();if(!order){hold('Load an actual original Order first.');return;}
  void save('reopen_closure',{...form('a748ReopenNote','a748ReopenRef','a748ReopenDecision'),
   subject_id:$('a748ReopenId').value.trim(),order_id:order});});
}
})();
