// Release 467 Build 238 — Attention, Notifications & Operator Signal Cleanup
(() => {
  'use strict';
  const severityWeight=Object.freeze({critical:400,error:350,failed:350,warning:250,warn:250,queued:180,retrying:190,pending:160,info:80,sent:20,resolved:10,ignored:0,ok:0});
  const parseTime=(value)=>{const t=Date.parse(String(value||''));return Number.isFinite(t)?t:0;};
  const ageHours=(value)=>{const t=parseTime(value);return t?Math.max(0,Math.round((Date.now()-t)/3600000)):0;};
  function statusOf(row){return String(row?.attention?.level||row?.severity||row?.status||row?.review_status||'info').toLowerCase();}
  function ownerFor(row){
    const explicit=String(row?.owner||row?.owner_label||'').trim(); if(explicit)return explicit;
    const hay=`${row?.category||''} ${row?.job_type||''} ${row?.incident_scope||''} ${row?.incident_code||''} ${row?.endpoint_path||''}`.toLowerCase();
    if(/notification|email|sms/.test(hay))return 'I.T. / Notifications';
    if(/payment|stripe|paypal|provider|webhook/.test(hay))return 'Payments / Integrations';
    if(/media|upload|image|photo/.test(hay))return 'Media / Images';
    if(/product|catalog|storefront|shop/.test(hay))return 'Products / Storefront';
    if(/inventory|supply|tool|stock|reorder/.test(hay))return 'Inventory / Supplies / Tools';
    if(/order|fulfill|cart|checkout/.test(hay))return 'Orders / Fulfilment';
    if(/account|finance|ledger|reconcil/.test(hay))return 'Finance / Accounting';
    if(/auth|login|session|user|member|password/.test(hay))return 'Users / Access';
    return 'I.T. / Operations';
  }
  function score(row){
    const status=statusOf(row),base=severityWeight[status]??100;
    const age=Number(row?.attention?.age_hours??ageHours(row?.updated_at||row?.created_at||row?.last_seen_at));
    const attempts=Number(row?.attempt_count||0),count=Number(row?.count||row?.incident_count||0);
    return base+Math.min(age,168)+Math.min(attempts*12,60)+Math.min(count*4,40);
  }
  function quiet(row){
    const status=statusOf(row),age=Number(row?.attention?.age_hours??ageHours(row?.updated_at||row?.created_at||row?.last_seen_at));
    return ['sent','resolved','ignored','ok','info'].includes(status) && age>=24;
  }
  const rank=(rows)=>[...(Array.isArray(rows)?rows:[])].sort((a,b)=>score(b)-score(a));
  window.DDAttentionSignalsV238=Object.freeze({version:'467.238',ageHours,statusOf,ownerFor,score,quiet,rank});
  document.dispatchEvent(new CustomEvent('dd:attention-signal-authority-ready',{detail:{release:467,build:238}}));
})();