// Release 467 Build 123 — Admin Home Dashboard Refresh.
// Build 176 containment: reuse Seller Daily payload; no duplicate authenticated D1 reads.
(() => {
  'use strict';
  const BUILD = 123;
  const MANIFEST_URL = '/data/admin-navigation-modules.json';
  // Historical Build 123 authority tokens retained for regression provenance only.
  // Seller Daily now owns the single live read and publishes its payload locally.
  const TODAY_URL = '/api/admin/contracts/operations-today-tasks-read?min_count=1';
  const IT_URL = '/api/admin/it-operations-control-tower';
  if (!/^\/admin\/?(?:index\.html)?$/i.test(window.location.pathname)) return;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
  const mounts={
    summary:document.getElementById('adminHomeDashboardSummary'),
    today:document.getElementById('adminHomeDashboardToday'),
    workspaces:document.getElementById('adminHomeDashboardWorkspaces'),
    quick:document.getElementById('adminHomeDashboardQuickLinks'),
    health:document.getElementById('adminHomeDashboardHealth'),
    status:document.getElementById('adminHomeDashboardStatus'),
  };
  if(!mounts.summary||!mounts.today||!mounts.workspaces||!mounts.quick||!mounts.health)return;

  const MODULE_BY_CATEGORY=Object.freeze({
    catalog:{label:'Creator',href:'/admin/creator/'},
    customers:{label:'Storefront',href:'/admin/storefront/'},
    orders:{label:'Finance',href:'/admin/finance/'},
    inventory:{label:'Creator',href:'/admin/creator/'},
    accounting:{label:'Finance',href:'/admin/finance/'},
    health:{label:'I.T.',href:'/admin/it/'},
  });
  const QUICK_LABELS=['Products','Catalog & Inventory','Orders','Accounting','Business Health','Application Sanity Check','Today Tasks'];

  function injectStyles(){
    if(document.getElementById('ddAdminHomeDashboardStyles'))return;
    const style=document.createElement('style');style.id='ddAdminHomeDashboardStyles';
    style.textContent='.dd-admin-dashboard-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.dd-admin-dashboard-metric strong{display:block;font-size:1.55rem;margin-top:4px}.dd-admin-dashboard-section{margin-top:18px}.dd-admin-dashboard-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)}.dd-admin-dashboard-row:last-child{border-bottom:0}.dd-admin-dashboard-actions{display:flex;gap:8px;flex-wrap:wrap}.dd-admin-dashboard-workspace-links{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.dd-admin-dashboard-workspace-links a{font-size:.86rem}.dd-admin-dashboard-status{display:flex;gap:8px;align-items:center;flex-wrap:wrap}@media(max-width:680px){.dd-admin-dashboard-row{display:block}.dd-admin-dashboard-actions{margin-top:9px}.dd-admin-dashboard-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }
  async function getJson(url,{auth=true}={}){
    const response=auth&&window.DDAuth?.apiFetch
      ?await window.DDAuth.apiFetch(url,{method:'GET',cache:'no-store'})
      :await fetch(url,{method:'GET',cache:'no-store',credentials:'same-origin'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data)throw new Error(data?.error||`${url} unavailable (${response.status}).`);
    if(auth&&data?.ok===false)throw new Error(data?.error||`${url} returned an invalid payload.`);
    return data;
  }
  const valueOr=(value,fallback='—')=>value===null||value===undefined||value===''?fallback:value;
  function metric(label,value,detail=''){
    return `<article class="card dd-admin-dashboard-metric"><span class="small">${esc(label)}</span><strong>${esc(valueOr(value))}</strong>${detail?`<div class="small">${esc(detail)}</div>`:''}</article>`;
  }
  function renderSummary(today,summary){
    const seller=summary?.summary||{};
    mounts.summary.innerHTML=[
      metric('Actionable items',today?.summary?.total_count,'Shared Seller Daily snapshot'),
      metric('Orders',seller.orders_count,'Shared Seller Daily snapshot'),
      metric('Low stock',seller.low_stock_count,'Shared Seller Daily snapshot'),
      metric('Live visitors',seller.active_visitor_sessions_count,'Shared Seller Daily snapshot'),
    ].join('');
  }
  function renderToday(today,error=''){
    if(!today){
      mounts.today.innerHTML=`<section class="card"><h2>Today</h2><p class="small">${esc(error||'Waiting for the Seller Daily snapshot. No duplicate D1 read is started here.')}</p><a class="btn" href="/admin/today-tasks/">Open full Today Tasks</a></section>`;
      return;
    }
    const tasks=(Array.isArray(today.tasks)?today.tasks:[]).slice(0,5);
    const rows=tasks.map((task)=>{
      const owner=MODULE_BY_CATEGORY[String(task?.category||'').trim()]||{label:'Admin',href:'/admin/'};
      return `<div class="dd-admin-dashboard-row"><div><strong>${esc(task.label||task.key||'Task')}</strong><div class="small">${esc(task.count||0)} item(s) • ${esc(owner.label)}</div></div><div class="dd-admin-dashboard-actions"><a class="btn secondary" href="${esc(owner.href)}">${esc(owner.label)}</a><a class="btn" href="${esc(task.href||'/admin/today-tasks/')}">Open work</a></div></div>`;
    }).join('');
    mounts.today.innerHTML=`<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin:0">Start with today</h2><p class="small" style="margin:6px 0 0">Reused from the Seller Daily read; this section performs no second Today Tasks query.</p></div><a class="btn" href="/admin/today-tasks/">Open full Today Tasks</a></div>${rows||'<p class="small">No active task groups right now.</p>'}</section>`;
  }
  function manifestModules(manifest){return Array.isArray(manifest?.modules)?manifest.modules:[];}
  function moduleLinks(module){return(module?.sections||[]).flatMap((section)=>Array.isArray(section?.links)?section.links:[]);}
  function renderWorkspaces(manifest,error=''){
    const modules=manifestModules(manifest);
    if(!modules.length){
      mounts.workspaces.innerHTML=`<section class="card"><h2>Workspaces</h2><p class="small">${esc(error||'Navigation manifest unavailable.')}</p><div class="dd-admin-dashboard-actions"><a class="btn secondary" href="/admin/storefront/">Storefront</a><a class="btn secondary" href="/admin/creator/">Creator</a><a class="btn secondary" href="/admin/finance/">Finance</a><a class="btn secondary" href="/admin/it/">I.T.</a></div></section>`;
      return;
    }
    mounts.workspaces.innerHTML=`<div class="dd-admin-dashboard-grid">${modules.map((module)=>{
      const links=moduleLinks(module),featured=links.slice(0,3);
      return `<article class="card"><h2 style="margin-top:0">${esc(module.label||module.key||'Workspace')}</h2><p class="small">${esc(module.summary||'')}</p><div class="small"><strong>${links.length}</strong> current tool(s)</div><div class="dd-admin-dashboard-workspace-links">${featured.map((link)=>`<a href="${esc(link.href||'/admin/')}">${esc(link.label||'Open')}</a>`).join('')}</div><div style="margin-top:12px"><a class="btn" href="${esc(module.href||'/admin/')}">Open workspace</a></div></article>`;
    }).join('')}</div>`;
  }
  function renderQuickLinks(manifest){
    const all=manifestModules(manifest).flatMap(moduleLinks);
    const selected=QUICK_LABELS.map((label)=>all.find((link)=>String(link?.label||'')===label)).filter(Boolean);
    mounts.quick.innerHTML=`<section class="card"><h2 style="margin-top:0">Quick destinations</h2><p class="small">Shortcuts resolve from the static navigation manifest; no D1 read is required.</p><div class="dd-admin-dashboard-actions">${selected.length?selected.map((link)=>`<a class="btn secondary" href="${esc(link.href)}">${esc(link.label)}</a>`).join(''):'<a class="btn secondary" href="/admin/">Use Jump / Ctrl+K</a>'}</div></section>`;
  }
  function renderHealth(){
    mounts.health.innerHTML='<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin:0">System health</h2><p class="small" style="margin:6px 0 0">Live I.T. diagnostics are intentionally on-demand so the Admin home does not repeatedly scan D1. Open I.T. when you need a fresh health proof.</p></div><div class="dd-admin-dashboard-actions"><a class="btn secondary" href="/admin/reliability/">Reliability</a><a class="btn secondary" href="/admin/deployment-preflight/">Preflight</a><a class="btn" href="/admin/it/">Open I.T.</a></div></div></section>';
  }
  function applySellerPayload(detail){
    const payload=detail?.payload||detail||{};
    renderSummary(payload.today||null,payload.summary||null);
    renderToday(payload.today||null);
    if(mounts.status)mounts.status.innerHTML='<span class="small">Build 176 reused the Seller Daily payload; duplicate Today/I.T. reads: 0.</span>';
  }
  async function load(){
    injectStyles();
    renderToday(null);
    renderHealth();
    if(mounts.status)mounts.status.innerHTML='<span class="small">Loading static workspace navigation…</span>';
    const [manifestResult]=await Promise.allSettled([getJson(MANIFEST_URL,{auth:false})]);
    const manifest=manifestResult.status==='fulfilled'?manifestResult.value:null;
    renderWorkspaces(manifest,manifestResult.status==='rejected'?manifestResult.reason?.message:'');
    renderQuickLinks(manifest||{});
    if(manifestResult.status==='rejected'&&mounts.status)mounts.status.innerHTML='<span class="small">Dashboard navigation loaded with 1 partial read failure.</span>';
    if(window.DDSellerDailySnapshot?.payload)applySellerPayload(window.DDSellerDailySnapshot);
  }
  document.addEventListener('dd:seller-command-centre-data',(event)=>applySellerPayload(event.detail));
  const start=()=>void load();
  if(window.DDWhenAdminReady)window.DDWhenAdminReady(start,{delayMs:120});
  else if(window.DDAuth?.isLoggedIn?.())start();
  else document.addEventListener('dd:admin-ready',(event)=>{if(event?.detail?.ok)start();},{once:true});
})();
