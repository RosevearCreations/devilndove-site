// Release 467 Build 115 — Business Health Review Packs & Owner Handoff client.
(()=>{'use strict';
const id=(x)=>document.getElementById(x);
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(c)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format((Number(c||0)||0)/100);
const api=(u)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(u,{method:'GET',cache:'no-store'}):fetch(u,{method:'GET',credentials:'same-origin',cache:'no-store'});
async function read(r){const d=await r.json().catch(()=>null);if(!r.ok||d?.ok===false)throw new Error(d?.error||`HTTP ${r.status}`);return d;}
function status(v,e=false){const n=id('b3Status');if(!n)return;n.textContent=v||'';n.classList.toggle('is-error',e);n.classList.toggle('is-success',Boolean(v&&!e));}
function renderProfitability(p={}){const list=p.rows||[];id('b3Profitability').innerHTML=list.length?list.slice(0,30).map(x=>`<div class="b3-row"><span><strong>${esc(x.project_title)}</strong><br><span class="small">${esc(x.status)} • ${Number(x.margin_percent||0).toFixed(1)}%</span></span><span>${money(x.revenue_cents)} revenue</span><span>${money(x.total_cost_cents)} cost</span><span>${money(x.project_profit_cents)} profit</span></div>`).join(''):'<p>No captured Creative profitability rows yet.</p>';}
function renderAnomalies(a={}){const list=a.findings||[];id('b3Anomalies').innerHTML=list.length?`<ul class="b3-list">${list.map(x=>`<li><strong>${esc(String(x.severity||'review').toUpperCase())}</strong> — ${esc(x.label)}</li>`).join('')}</ul>`:'<p>No financial anomalies detected for this period.</p>';}
function renderMonth(m={}){id('b3Month').innerHTML=`<p><strong>${Number(m.score||0)}/100 • ${esc(String(m.status||'review').toUpperCase())}</strong></p><ul class="b3-list">${(m.checks||[]).map(x=>`<li>${x.pass?'✓':'○'} ${esc(x.label)} (${Number(x.weight||0)} pts)</li>`).join('')}</ul>`;}
function renderIt(h={}){id('b3It').innerHTML=`<p><strong>${Number(h.score||0)}/100 • ${esc(String(h.status||'review').toUpperCase())}</strong><br>FK violations: ${Number(h.foreign_key_violations||0)}</p><ul class="b3-list">${(h.checks||[]).map(x=>`<li>${x.pass?'✓':'○'} ${esc(x.label)} (${Number(x.weight||0)} pts)</li>`).join('')}</ul>`;}
function renderQueue(q={}){
  const list=Array.isArray(q.actions)?q.actions:[],mount=id('b114ActionQueue');if(!mount)return;
  if(!list.length){mount.innerHTML='<p>No Business Health actions are currently queued. This READY state is review-only and does not authorize automatic business mutation.</p>';return;}
  const rows=list.map((x,i)=>`<article class="b114-action" data-state="${esc(x.state)}"><div><strong>${i+1}. ${esc(x.label)}</strong><div class="small">${esc(String(x.state||'review').toUpperCase())} • ${esc(x.owner_label||x.owner_module)}</div><p class="small">${esc(x.detail||'Review existing evidence.')}</p></div><a class="btn secondary" href="${esc(x.href||'/admin/')}">Open owner →</a></article>`).join('');
  mount.innerHTML=`<div class="b114-summary"><strong>${Number(q.summary?.blocking_count||0)} blocking</strong><span>${Number(q.summary?.attention_count||0)} attention</span><span>${Number(q.summary?.review_count||0)} review</span></div>${rows}`;
}
function evidenceRows(evidence={}){
  const entries=Object.entries(evidence||{});
  if(!entries.length)return'<li>No structured evidence keys were carried by this action; review the linked source workspace.</li>';
  return entries.map(([k,v])=>`<li><strong>${esc(k.replaceAll('_',' '))}:</strong> ${esc(typeof v==='object'?JSON.stringify(v):v)}</li>`).join('');
}
function renderReviewPacks(p={}) {
  const list=Array.isArray(p.packs)?p.packs:[],mount=id('b115ReviewPacks');if(!mount)return;
  if(!list.length){mount.innerHTML='<p>No owner review packs are required for this period. READY remains review-only and authorizes no automatic action.</p>';return;}
  mount.innerHTML=`<div class="b115-pack-summary"><strong>${Number(p.summary?.pack_count||0)} owner packs</strong><span>${Number(p.summary?.action_count||0)} actions</span><span>${Number(p.summary?.evidence_action_count||0)} with structured evidence</span></div>${list.map((pack)=>`<article class="b115-pack" data-state="${esc(pack.state)}"><header><div><strong>${esc(pack.owner_label)}</strong><div class="small">${Number(pack.blocking_count||0)} blocking • ${Number(pack.attention_count||0)} attention • ${Number(pack.review_count||0)} review</div></div><a class="btn secondary" href="${esc(pack.href||'/admin/')}">Open owner workspace →</a></header><div class="grid cols-2" style="gap:12px;margin-top:12px"><div><h3>Queued evidence</h3>${(pack.actions||[]).map((action)=>`<div class="b115-pack-action"><strong>${esc(action.label)}</strong><div class="small">${esc(String(action.state||'review').toUpperCase())} • human review required</div><p class="small">${esc(action.detail||'')}</p><details><summary>Evidence carried with this action</summary><ul class="small b3-list">${evidenceRows(action.evidence||{})}</ul></details></div>`).join('')}</div><div><h3>Human handoff steps</h3><ol class="small">${(pack.review_steps||[]).map(step=>`<li>${esc(step)}</li>`).join('')}</ol><p class="small"><strong>Boundary:</strong> review/handoff only; acknowledgement is not persisted and no business mutation is authorized.</p></div></div></article>`).join('')}`;
}
function render(d){
  const p=d.profitability||{},a=d.financial_anomalies||{},m=d.month_end_readiness||{},h=d.it_health||{},q=d.business_action_queue||{},packs=d.business_review_packs||{};
  id('b3Metrics').innerHTML=`<div class="card"><div class="small">Owner review packs</div><strong>${Number(packs.summary?.pack_count||0)}</strong><div class="small">${esc(String(packs.state||'ready').toUpperCase())}</div></div><div class="card"><div class="small">Action queue</div><strong>${Number(q.summary?.action_count||0)}</strong><div class="small">${esc(String(q.state||'ready').toUpperCase())}</div></div><div class="card"><div class="small">Month-end readiness</div><strong>${Number(m.score||0)}/100</strong></div><div class="card"><div class="small">I.T. health</div><strong>${Number(h.score||0)}/100</strong></div><div class="card"><div class="small">Financial anomalies</div><strong>${Number(a.summary?.total||0)}</strong><div class="small">high ${Number(a.summary?.high||0)}</div></div><div class="card"><div class="small">Profitability projects</div><strong>${Number(p.summary?.projects||0)}</strong><div class="small">high risk ${Number(p.summary?.high||0)}</div></div>`;
  renderReviewPacks(packs);renderQueue(q);renderProfitability(p);renderAnomalies(a);renderMonth(m);renderIt(h);
}
async function load(){
  const period=id('b3Period')?.value||new Date().toISOString().slice(0,7);
  status('Loading Release 467 Build 115 Business Health Review Packs…');
  try{
    const d=await read(await api(`/api/admin/business-health-review-packs?period_month=${encodeURIComponent(period)}`));
    render(d);
    status(`Build 115 Business Health loaded for ${d.period_month||period}. Human review/handoff only; no business mutation was executed.`);
  }catch(e){status(e.message,true);}
}
function init(){if(id('b3Period'))id('b3Period').value=new Date().toISOString().slice(0,7);id('b3Refresh')?.addEventListener('click',load);id('b3Period')?.addEventListener('change',load);load();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.Release467Build115BusinessHealthReviewPacks={renderReviewPacks,renderQueue,renderProfitability,renderAnomalies,renderMonth,renderIt};
})();