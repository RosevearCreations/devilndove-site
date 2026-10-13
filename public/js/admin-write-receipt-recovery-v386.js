/* Release 467 Build 386: private admin cross-tab receipt verification.
   This never stores business payloads, silently retries mutations, or claims provider exactly-once. */
(() => {
 'use strict';
 if (!location.pathname.startsWith('/admin/') || window.DDReceiptRecovery?.installed) return;
 const prefix='dd386:receipt:', maxAge=30*60*1000;
 const tabId=crypto.randomUUID(), rawFetch=window.fetch.bind(window);
 const durable=new Map();
 let panel=null, selected=null;
 const scopeFor=(path,data)=>{
  if(path==='/api/admin/commission-workbench')return 'commission_decision';
  if(path==='/api/admin/cross-project-accounting')return 'finance_review';
  if(path==='/api/admin/project-material-planner')return ['reserve','release'].includes(data.action)?'material_'+data.action:null;
  if(path==='/api/admin/project-work-orders')return ['time','milestone','transition'].includes(data.action)?'work_order_event':null;
  if(path==='/api/admin/project-resource-calendar')return data.action==='schedule'?'calendar_schedule':null;
  return null;
 };
 const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'
  ?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return durable.get(k)||null}};
 const write=(k,record)=>{durable.set(k,record);try{localStorage.setItem(k,JSON.stringify(record))}catch{}render();};
 const erase=k=>{durable.delete(k);try{localStorage.removeItem(k)}catch{}render();};
 const entries=()=>{
  const keys=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(prefix))keys.push(k);}}catch{}
  for(const k of durable.keys())if(!keys.includes(k))keys.push(k);
  return keys.map(k=>({k,r:read(k)})).filter(x=>x.r&&Date.now()-x.r.at<maxAge)
   .sort((a,b)=>b.r.at-a.r.at);
 };
 async function fingerprint(scope,path,data){
  const payload={scope,path,data:{...data}};delete payload.data.request_key;
  const bytes=new TextEncoder().encode(JSON.stringify(canonical(payload)));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return prefix+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 }
 const response=(code,message,status=409)=>new Response(JSON.stringify({ok:false,build:386,code,error:message}),{
  status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 const messageFor=record=>record.state==='committed'
  ?'OK — the original write is committed. Start a deliberate new action only after reviewing the source.'
  :'A write outcome is unresolved. Check its receipt and original source before any new action.';
 function ensurePanel(){
  if(!document.body||panel)return;
  panel=document.createElement('section');panel.id='dd386-receipt-recovery';panel.setAttribute('role','status');
  panel.setAttribute('aria-live','polite');panel.style.cssText='position:fixed;left:12px;bottom:12px;z-index:2147482999;max-width:min(370px,calc(100vw - 24px));padding:12px;border:1px solid #a58c50;border-radius:9px;background:#222733;color:white;font:14px/1.4 system-ui,sans-serif;box-shadow:0 3px 22px #0008;display:none;';
  const heading=document.createElement('strong');heading.textContent='Write receipt recovery';panel.appendChild(heading);
  const info=document.createElement('p');info.id='dd386-recovery-info';panel.appendChild(info);
  const verify=document.createElement('button');verify.type='button';verify.textContent='Verify original receipt';verify.style.marginRight='8px';panel.appendChild(verify);
  const anew=document.createElement('button');anew.type='button';anew.textContent='Start new action';panel.appendChild(anew);
  verify.addEventListener('click',async()=>{
   if(!selected)return;verify.disabled=true;info.textContent='Checking committed source receipt…';
   try{
    const u='/api/admin/write-operation-receipt?scope='+encodeURIComponent(selected.r.scope)+'&request_key='+encodeURIComponent(selected.r.key);
    const reply=await rawFetch(u,{credentials:'same-origin',cache:'no-store'}),data=await reply.json();
    if(!reply.ok||!data.ok)throw Error(data.error||'Lookup unavailable');
    if(data.found){write(selected.k,{...selected.r,state:'committed',receipt_id:data.receipt_id,source_id:data.source_record_id,at:Date.now()});}
    else{write(selected.k,{...selected.r,state:'uncertain',at:Date.now()});info.textContent='Not found is NOT proof of failure. Inspect the source before repeating.';}
   }catch(error){info.textContent='Still uncertain: '+error.message+'. Do not blindly retry.';}
   finally{verify.disabled=false;}
  });
  anew.addEventListener('click',()=>{
   if(!selected)return;
   if(!confirm('We must inspect the original source record first. Have we verified that a new and separate action is intended?'))return;
   erase(selected.k);selected=null;
  });
  document.body.appendChild(panel);
 }
 function render(){
  if(!document.body)return;ensurePanel();
  const all=entries(),visible=all.find(x=>x.r.state!=='committed')||all[0];
  if(!visible){selected=null;panel.style.display='none';return;}
  selected=visible;panel.style.display='block';
  document.getElementById('dd386-recovery-info').textContent=visible.r.scope+' · reference '+visible.r.key.slice(-8)+' · '+messageFor(visible.r)
   +(visible.r.receipt_id?' Receipt #'+visible.r.receipt_id+'.':'');
 }
 window.addEventListener('storage',e=>{if(e.key?.startsWith(prefix))render();});
 document.addEventListener('DOMContentLoaded',render);
 window.fetch=async function(input,options){
  const method=String(options?.method||input?.method||'GET').toUpperCase();
  if(method!=='POST'||typeof options?.body!=='string')return rawFetch(input,options);
  let url,data,scope;
  try{
   url=new URL(typeof input==='string'?input:input.url,location.href);
   if(url.origin!==location.origin)return rawFetch(input,options);
   data=JSON.parse(options.body);if(!data||typeof data!=='object'||Array.isArray(data))return rawFetch(input,options);
   scope=scopeFor(url.pathname,data);if(!scope)return rawFetch(input,options);
  }catch{return rawFetch(input,options);}
  let storageKey;
  try{storageKey=await fingerprint(scope,url.pathname,data)}catch{
   return response('RECEIPT_IDENTITY_UNAVAILABLE','Cannot verify this protected action safely; no write was sent.',503);
  }
  let previous=read(storageKey);
  if(previous && Date.now()-previous.at>=maxAge){erase(storageKey);previous=null;}
  if(previous?.state==='committed'){render();return response('ALREADY_COMMITTED',messageFor(previous));}
  if(previous && (previous.state==='uncertain'||previous.owner!==tabId)){
   render();return response('RECEIPT_VERIFICATION_REQUIRED',messageFor(previous));
  }
  // For repeated sends in this tab use the original key; D1 rejects duplicate commits.
  const key=previous?.key||(/^[A-Za-z0-9_-]{16,80}$/.test(data.request_key||'')?data.request_key:crypto.randomUUID());
  data.request_key=key;
  const next={scope,key,state:'pending',owner:tabId,at:Date.now()};
  write(storageKey,next);
  try{
   const reply=await rawFetch(input,{...options,body:JSON.stringify(data)});
   let result=null;
   try{result=await reply.clone().json()}catch{}
   if(reply.ok&&result?.ok===true&&result?.receipt_id){
    write(storageKey,{...next,state:'committed',receipt_id:result.receipt_id,source_id:result.source_record_id,at:Date.now()});
   }else if(reply.status>=400&&reply.status<500&&reply.status!==409){
    // A validated rejection cannot have committed its business write.
    erase(storageKey);
   }else write(storageKey,{...next,state:'uncertain',at:Date.now()});
   return reply;
  }catch(error){write(storageKey,{...next,state:'uncertain',at:Date.now()});throw error;}
 };
 window.DDReceiptRecovery=Object.freeze({installed:true,pending:()=>entries().filter(x=>x.r.state!=='committed').length,verifyPage:render});
 render();
})();
