// Release 467 Build 250 — Startup & Provider Read-Budget Verification.
// Admin Home only. Browser-local/session-only; pathname counts only; no remote telemetry.
(() => {
  'use strict';
  const normalized=String(location.pathname||'/').replace(/\\+$/,'')||'/';
  if(normalized!=='/admin' && normalized!=='/admin/index.html') return;
  if(!window.DDAuth?.apiFetch || window.DDStartupReadBudgetV250) return;
  const BUILD=250;
  const VERSION='467b250-startup-read-budget-v1';
  const STARTUP_WINDOW_MS=15_000;
  const SAFE_GET_CEILING=4;
  const PROVIDER_BOUND_LIVE_READ_CEILING=2;
  const STORAGE_KEY='dd_startup_read_budget_v250';
  const started=performance.now();
  const state={build:BUILD,version:VERSION,startup_window_ms:STARTUP_WINDOW_MS,safe_get_ceiling:SAFE_GET_CEILING,provider_bound_live_read_ceiling:PROVIDER_BOUND_LIVE_READ_CEILING,safe_gets:0,endpoint_counts:{},completed:false};
  function pathOnly(input){try{const u=new URL(String(input||''),location.origin);if(u.origin!==location.origin||!u.pathname.startsWith('/api/'))return '';return u.pathname;}catch{return '';}}
  function bump(path){state.endpoint_counts[path]=Number(state.endpoint_counts[path]||0)+1;}
  function readBudget(){const b=window.DDAdminReadBudgetV240||{};return{live_reads:Number(b.live_reads||0),cache_hits:Number(b.cache_hits||0),coalesced_reads:Number(b.coalesced_reads||0),timed_out_reads:Number(b.timed_out_reads||0)};}
  function snapshot(){const b=readBudget();const endpoints=Object.entries(state.endpoint_counts).sort((a,b)=>b[1]-a[1]).map(([path,count])=>({path,count}));const repeated=endpoints.filter((row)=>row.count>1);return{build:BUILD,version:VERSION,startup_window_ms:STARTUP_WINDOW_MS,safe_gets:state.safe_gets,safe_get_ceiling:SAFE_GET_CEILING,provider_bound_live_reads:b.live_reads,provider_bound_live_read_ceiling:PROVIDER_BOUND_LIVE_READ_CEILING,cache_hits:b.cache_hits,duplicate_reads_suppressed:b.coalesced_reads,timed_out_reads:b.timed_out_reads,endpoint_counts:endpoints,repeated_read_hotspots:repeated,pass:state.safe_gets<=SAFE_GET_CEILING&&b.live_reads<=PROVIDER_BOUND_LIVE_READ_CEILING,completed:state.completed,storage:'sessionStorage',remote_recording:false,query_value_capture:false,request_payload_capture:false,response_payload_capture:false,header_capture:false,secret_capture:false};}
  function save(){try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot()));}catch{}}
  function set(id,value){const el=document.getElementById(id);if(el)el.textContent=String(value);}
  function render(){const s=snapshot();set('build250StartupSafeGets',String(s.safe_gets)+' / '+String(s.safe_get_ceiling));set('build250ProviderReads',String(s.provider_bound_live_reads)+' / '+String(s.provider_bound_live_read_ceiling));set('build250ReadBudgetState',s.completed?(s.pass?'PASS':'OVER BUDGET'):'Measuring first 15 seconds');set('build250ReadHotspot',s.repeated_read_hotspots.length?s.repeated_read_hotspots.map((r)=>r.path+' × '+r.count).join(', '):'No repeated API pathname yet');}
  const original=window.DDAuth.apiFetch.bind(window.DDAuth);
  const wrapped=async(input,options={})=>{if(performance.now()-started<=STARTUP_WINDOW_MS){const method=String(options?.method||'GET').toUpperCase();const path=pathOnly(input);if(method==='GET'&&path){state.safe_gets+=1;bump(path);save();render();}}return original(input,options);};
  wrapped.__ddStartupReadBudgetV250=true;wrapped.__ddOriginal=original;window.DDAuth.apiFetch=wrapped;
  const finish=()=>{state.completed=true;save();render();document.dispatchEvent(new CustomEvent('dd:startup-read-budget-v250',{detail:snapshot()}));};
  document.addEventListener('DOMContentLoaded',render,{once:true});
  setTimeout(finish,STARTUP_WINDOW_MS+150);
  window.DDStartupReadBudgetV250=Object.freeze({build:BUILD,version:VERSION,snapshot});
})();
