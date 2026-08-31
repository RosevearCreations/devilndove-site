// Release 464 Update 3 — read-only Month-End Cockpit over existing accounting close authority.
(() => {
  'use strict';
  const byId=(id)=>document.getElementById(id);
  const esc=(v)=>String(v==null?'':v).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=(cents)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format((Number(cents||0)||0)/100);
  const monthNow=()=>new Date().toISOString().slice(0,7);
  const apiFetch=(url,options={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,options):fetch(url,{credentials:'same-origin',...options});
  function message(value,error=false){const el=byId('monthEndMessage');if(!el)return;el.textContent=value||'';el.classList.toggle('is-error',error);el.classList.toggle('is-success',Boolean(value&&!error));}
  async function readJson(response){const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw new Error(data?.error||`HTTP ${response.status}`);return data;}
  function render(data){
    const mount=byId('monthEndCockpit');if(!mount)return;
    const payment=data.payment||{summary:{},pending_orders:[]},summary=payment.summary||{},hst=data.hst_review||{},closure=data.closure||{},ready=data.close_readiness||{ready:false,blockers:[]},evidence=data.evidence_bundle_summary||{},exports=Array.isArray(data.export_packages)?data.export_packages:[];
    const blockers=Array.isArray(ready.blockers)?ready.blockers:[];
    const period=encodeURIComponent(data.period_month||byId('monthEndPeriod')?.value||monthNow());
    mount.innerHTML=`
      <div class="month-metrics">
        <div class="card"><div class="small">Close readiness</div><strong>${ready.ready?'READY':'REVIEW'}</strong></div>
        <div class="card"><div class="small">Orders</div><strong>${Number(summary.order_count||0)}</strong></div>
        <div class="card"><div class="small">Paid</div><strong>${money(summary.paid_cents||0)}</strong></div>
        <div class="card"><div class="small">Outstanding</div><strong>${money(summary.outstanding_cents||0)}</strong></div>
        <div class="card"><div class="small">Tax collected</div><strong>${money(hst.sales_tax_collected_cents||summary.tax_cents||0)}</strong></div>
        <div class="card"><div class="small">Net tax payable</div><strong>${money(hst.net_tax_payable_cents||0)}</strong></div>
      </div>
      <div class="month-grid" style="margin-top:14px">
        <section class="card"><h2 style="margin-top:0">Close blockers</h2>${blockers.length?`<ul class="month-blockers small">${blockers.map((x)=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="small">No blockers detected by the existing close workflow.</p>'}</section>
        <section class="card"><h2 style="margin-top:0">Period authority</h2><p class="small"><strong>Lock state:</strong> ${esc(closure.lock_state||'open')}</p><p class="small"><strong>HST/GST review:</strong> ${esc(hst.review_status||'draft')}</p><p class="small"><strong>Remittance:</strong> ${esc(hst.remittance_status||'not_ready')}</p><p class="small"><strong>Due:</strong> ${esc(hst.filing_due_date||'not set')}</p></section>
        <section class="card"><h2 style="margin-top:0">Evidence</h2><p class="small"><strong>Attachments:</strong> ${Number(evidence.total_attachments||0)}</p><p class="small"><strong>Binary-safe:</strong> ${Number(evidence.binary_safe_count||0)}</p><p class="small"><strong>R2 fetch enabled:</strong> ${evidence.binary_fetch_enabled?'yes':'no'}</p><p class="small">This cockpit never fetches receipt bodies; use the accounting workspace for approved evidence/export operations.</p></section>
        <section class="card"><h2 style="margin-top:0">Accountant package</h2><p class="small"><strong>Export manifests:</strong> ${exports.length}</p><div class="month-actions"><a class="btn" href="/api/admin/accounting-close-workflow?period_month=${period}&format=csv" target="_blank" rel="noopener">Close CSV</a><a class="btn" href="/api/admin/accounting-close-workflow?period_month=${period}&format=zip" target="_blank" rel="noopener">Accountant ZIP</a><a class="btn primary" href="/admin/accounting/">Open Accounting</a></div></section>
      </div>`;
  }
  async function load(){const period=byId('monthEndPeriod')?.value||monthNow();message('Loading month-end authority…');try{const data=await readJson(await apiFetch(`/api/admin/accounting-close-workflow?period_month=${encodeURIComponent(period)}`,{cache:'no-store'}));render(data);message(`Month-end cockpit loaded for ${data.period_month||period}. Read-only summary; accounting mutation capability is not present here.`);}catch(error){message(error.message||String(error),true);byId('monthEndCockpit').innerHTML=`<div class="card"><h2>Month-End Cockpit</h2><p class="small">${esc(error.message||'Unable to load month-end authority.')}</p></div>`;}}
  function init(){byId('monthEndPeriod').value=monthNow();byId('monthEndRefresh')?.addEventListener('click',load);byId('monthEndPeriod')?.addEventListener('change',load);load();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
