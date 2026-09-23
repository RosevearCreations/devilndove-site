// Release 467 Build 240 — API Read Budget, Cache & Batch Streamlining.
// Admin-home only: coalesce identical safe GETs, keep a short read-only snapshot, and bound live waits.
(() => {
  'use strict';
  const normalized=String(location.pathname||'/').replace(/\/+$/,'')||'/';
  if(normalized!=='/admin' && normalized!=='/admin/index.html') return;
  if(!window.DDAuth?.apiFetch) return;

  const VERSION='467b240-admin-read-budget-v1';
  const TTL_MS=60_000;
  const TIMEOUT_MS=8_000;
  const TARGETS=new Set([
    '/api/admin/contracts/operations-today-tasks-read?min_count=1',
    '/api/admin/dashboard-summary?view=seller_daily'
  ]);
  const original=window.DDAuth.apiFetch.bind(window.DDAuth);
  const memory=new Map();
  const inflight=new Map();
  const health=window.DDAdminReadBudgetV240={
    version:VERSION,
    page:normalized,
    ttl_ms:TTL_MS,
    timeout_ms:TIMEOUT_MS,
    cache_hits:0,
    coalesced_reads:0,
    live_reads:0,
    timed_out_reads:0,
    targeted_routes:[...TARGETS],
  };

  const keyFor=(input)=>{
    try{
      const u=new URL(String(input||''),location.origin);
      if(u.origin!==location.origin) return '';
      return u.pathname+(u.search||'');
    }catch{return '';}
  };
  const snapshotToResponse=(snapshot)=>new Response(snapshot.body,{
    status:snapshot.status,
    statusText:snapshot.statusText,
    headers:snapshot.headers
  });
  const snapshotResponse=async(response)=>({
    body:await response.text(),
    status:response.status,
    statusText:response.statusText,
    headers:[...response.headers.entries()]
  });
  const fresh=(row)=>Boolean(row && Date.now()-row.saved_at<=TTL_MS);

  const boundedApiFetch=async(input,options={})=>{
    const method=String(options?.method||'GET').toUpperCase();
    if(method!=='GET') return original(input,options);
    const key=keyFor(input);
    if(!TARGETS.has(key)) return original(input,options);

    const cached=memory.get(key);
    if(fresh(cached)){
      health.cache_hits+=1;
      return snapshotToResponse(cached.snapshot);
    }
    if(inflight.has(key)){
      health.coalesced_reads+=1;
      return snapshotToResponse(await inflight.get(key));
    }

    const promise=(async()=>{
      const controller=typeof AbortController==='function'?new AbortController():null;
      const timer=controller?setTimeout(()=>controller.abort('build240-read-timeout'),TIMEOUT_MS):0;
      try{
        health.live_reads+=1;
        const response=await original(input,{...options,cache:'no-store',...(controller?{signal:controller.signal}:{})});
        const snapshot=await snapshotResponse(response);
        if(response.ok) memory.set(key,{saved_at:Date.now(),snapshot});
        return snapshot;
      }catch(error){
        if(String(error?.name||'')==='AbortError' || /timeout|aborted/i.test(String(error?.message||error||''))) health.timed_out_reads+=1;
        throw error;
      }finally{
        if(timer) clearTimeout(timer);
      }
    })();
    inflight.set(key,promise);
    try{return snapshotToResponse(await promise);}
    finally{inflight.delete(key);}
  };

  boundedApiFetch.__ddAdminReadBudgetV240=true;
  boundedApiFetch.__ddOriginal=original;
  window.DDAuth.apiFetch=boundedApiFetch;
  document.documentElement.dataset.ddBuild240ReadBudget='ready';
  document.dispatchEvent(new CustomEvent('dd:admin-read-budget-ready',{detail:{...health}}));
})();